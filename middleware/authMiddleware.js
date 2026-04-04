const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ message: "Not authenticated. Please log in." });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }
    req.user = user;
    req.userId = user._id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

module.exports = { protect };
