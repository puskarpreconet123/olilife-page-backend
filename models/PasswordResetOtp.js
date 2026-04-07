const mongoose = require("mongoose");

const passwordResetOtpSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  otp:       { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL: auto-delete after 10 min
});

module.exports = mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
