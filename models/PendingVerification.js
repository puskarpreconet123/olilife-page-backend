const mongoose = require("mongoose");

const pendingVerificationSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  otp:          { type: String, required: true },
  createdAt:    { type: Date, default: Date.now, expires: 120 } // TTL: auto-delete after 2 min
});

module.exports = mongoose.model("PendingVerification", pendingVerificationSchema);
