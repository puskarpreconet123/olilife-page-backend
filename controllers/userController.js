const User = require("../models/User");
const { sendDietChartEmail } = require("../utils/emailService");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({
      profile: user.profile,
      savedDietPlan: user.savedDietPlan || null,
      onboardingComplete: user.onboardingComplete
    });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { profile, onboardingComplete } = req.body;
    const update = {};
    if (profile !== undefined) {
      const allowed = ["age","gender","height","heightUnit","weight","activityLevel","goal",
        "diabeticStatus","hasAllergies","allergyList","customAllergy","chronicConditions"];
      allowed.forEach((key) => {
        if (profile[key] !== undefined) update[`profile.${key}`] = profile[key];
      });
    }
    if (onboardingComplete !== undefined) update.onboardingComplete = onboardingComplete;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: update },
      { new: true, runValidators: true }
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ profile: user.profile, onboardingComplete: user.onboardingComplete });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

const saveDietPlan = async (req, res) => {
  try {
    const { meals, inputSignature } = req.body;
    if (!meals || !Array.isArray(meals)) {
      return res.status(400).json({ message: "meals array is required." });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { savedDietPlan: { meals, inputSignature: inputSignature || "", generatedAt: new Date() } } },
      { new: true }
    ).select("savedDietPlan");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ savedDietPlan: user.savedDietPlan });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

const clearDietPlan = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $set: { savedDietPlan: { meals: null, inputSignature: "", generatedAt: null } }
    });
    res.json({ message: "Diet plan cleared." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

const sendDietChart = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.savedDietPlan?.meals?.length) {
      return res.status(400).json({ message: "You have no generated diet chart to send." });
    }

    await sendDietChartEmail(user.email, user.profile, user.savedDietPlan);

    res.json({ success: true, message: `Diet chart sent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to send diet chart email", error: err.message });
  }
};

module.exports = { getProfile, updateProfile, saveDietPlan, clearDietPlan, sendDietChart };
