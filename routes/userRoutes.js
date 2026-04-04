const express = require("express");
const router = express.Router();
const { getProfile, updateProfile, saveDietPlan, clearDietPlan } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/diet", protect, saveDietPlan);
router.delete("/diet", protect, clearDietPlan);

module.exports = router;
