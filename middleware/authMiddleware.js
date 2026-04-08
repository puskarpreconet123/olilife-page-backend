const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    console.error("[auth] protect failed: no token", {
      authorization: Boolean(req.headers.authorization),
      cookieJwt: Boolean(req.cookies?.jwt)
    });
    return res.status(401).json({ message: "Not authenticated. Please log in." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.error(`[auth] protect failed: user not found for id=${decoded.id}`);
      return res.status(401).json({ message: "User no longer exists." });
    }
    console.log(`[auth] protect success: user=${user.email} role=${user.role}`);
    req.user = user;
    req.userId = user._id;
    next();
  } catch(err) {
    console.error(`[auth] protect failed: ${err.message}`, err);
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Check if user is admin
const adminOnly = async (req, res, next) => {
  if (!req.user) {
    console.error("[auth] adminOnly failed: no req.user");
    return res.status(401).json({ message: "Not authenticated." });
  }

  if (req.user.role !== "admin") {
    console.error(`[auth] adminOnly failed: user=${req.user.email} role=${req.user.role}`);
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }

  console.log(`[auth] adminOnly success: admin=${req.user.email}`);
  next();
};

module.exports = { protect, adminOnly };
