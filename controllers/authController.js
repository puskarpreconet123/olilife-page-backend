const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PendingVerification = require("../models/PendingVerification");
const PasswordResetOtp = require("../models/PasswordResetOtp");
const { sendOtpEmail, sendPasswordResetEmail } = require("../utils/emailService");

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function setCookie(res, token) {
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge
  });
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Step 1: validate email + password, hash password, send OTP
const sendOtp = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: "An account with that email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOtp();

    // Upsert: replace any existing pending record for this email
    await PendingVerification.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { passwordHash, otp, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(email,otp);
    await sendOtpEmail(email, otp);
    res.json({ message: "OTP sent. Check your email." });
  } catch (err) {
    console.error("sendOtp error:", err);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// Step 2: verify OTP and create the account
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const pending = await PendingVerification.findOne({ email: email.toLowerCase().trim() });
    if (!pending) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    }
    if (pending.otp !== otp.trim()) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    // Insert directly to bypass the pre-save bcrypt hook (password already hashed)
    await User.collection.insertOne({
      email: pending.email,
      password: pending.passwordHash,
      role: "user",
      isVerified: true,
      profile: {},
      savedDietPlan: {},
      onboardingComplete: false,
      createdAt: new Date()
    });

    // Clean up pending record
    await PendingVerification.deleteOne({ email: pending.email });

    // Log the user in immediately
    const savedUser = await User.findOne({ email: pending.email });
    const token = signToken(savedUser._id);
    setCookie(res, token);
    res.status(201).json({ user: savedUser.toSafeObject(), token });
  } catch (err) {
    console.error("verifyOtp error:", err.message);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.error("[auth] login failed: missing email or password");
      return res.status(400).json({ message: "Email and password are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log(`[auth] login attempt: ${normalizedEmail}`);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.error(`[auth] login failed: user not found for ${normalizedEmail}`);
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    const passwordMatches = await user.comparePassword(password);
    const trimmedPassword = password.trim();
    console.log(`[auth] login password debug: len=${password.length} trimmedLen=${trimmedPassword.length} hasWhitespace=${password !== trimmedPassword}`);

    if (!passwordMatches) {
      console.error(`[auth] login failed: invalid password for ${normalizedEmail} (len=${password.length} trimmedLen=${trimmedPassword.length})`);
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    console.log(`[auth] login successful: ${normalizedEmail} (role=${user.role})`);
    const token = signToken(user._id);
    setCookie(res, token);
    res.json({ user: user.toSafeObject(), token });
  } catch (err) {
    console.error(`[auth] login error: ${err.message}`);
    res.status(500).json({ message: "Server error during login.", error: err.message });
  }
};

const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
    secure: isProd,
    sameSite: isProd ? "none" : "lax"
  });
  res.json({ message: "Logged out successfully." });
};

const getMe = async (req, res) => {
  res.json({ user: req.user.toSafeObject ? req.user.toSafeObject() : req.user });
};

// Step 1: send password reset OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always respond with success to avoid revealing whether email exists
    if (!user) return res.json({ message: "If that email is registered, a reset code has been sent." });

    const otp = generateOtp();
    await PasswordResetOtp.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { otp, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendPasswordResetEmail(email, otp);
    res.json({ message: "If that email is registered, a reset code has been sent." });
  } catch (err) {
    console.error("forgotPassword error:", err.message);
    res.status(500).json({ message: "Failed to send reset code. Please try again." });
  }
};

// Step 2: verify OTP and set new password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const record = await PasswordResetOtp.findOne({ email: email.toLowerCase().trim() });
    if (!record) return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    if (record.otp !== otp.trim()) return res.status(400).json({ message: "Incorrect OTP. Please try again." });

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ email: email.toLowerCase().trim() }, { password: hashed });
    await PasswordResetOtp.deleteOne({ email: email.toLowerCase().trim() });

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("resetPassword error:", err.message);
    res.status(500).json({ message: "Reset failed. Please try again." });
  }
};

module.exports = { sendOtp, verifyOtp, login, logout, getMe, forgotPassword, resetPassword };
