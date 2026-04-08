const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getAllUsers,
  getUserDetails,
  getAnalytics,
  deleteUser,
  exportUserData,
  exportAllUsersData,
  searchUsers,
  sendDietChart
} = require("../controllers/adminController");

// All admin routes require authentication AND admin role
router.use(protect, adminOnly);

// User management
router.get("/users", getAllUsers);
router.get("/users/search", searchUsers);
router.get("/users/:userId", getUserDetails);
router.delete("/users/:userId", deleteUser);
router.post("/users/:userId/send-diet", sendDietChart);

// Data export
router.get("/export/user/:userId", exportUserData);
router.get("/export/all-users", exportAllUsersData);

// Analytics
router.get("/analytics", getAnalytics);



module.exports = router;
