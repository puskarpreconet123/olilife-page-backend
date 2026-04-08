const User = require("../models/User");
const { sendDietChartEmail } = require("../utils/emailService");

// Get all users with basic info and stats
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("email profile onboardingComplete savedDietPlan createdAt")
      .sort({ createdAt: -1 });



    const stats = {
      totalUsers: users.length,
      onboardingCompleted: users.filter(u => u.onboardingComplete).length,
      onboardingPending: users.filter(u => !u.onboardingComplete).length,
      dietPlansCreated: users.filter(u => u.savedDietPlan?.meals).length
    };

    res.status(200).json({ success: true, stats, users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

// Get single user details with diet info
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }



    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user details", error: err.message });
  }
};

// Get analytics dashboard
exports.getAnalytics = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } });

    // Count various stats
    const totalUsers = users.length;
    const onboardingCompleted = users.filter(u => u.onboardingComplete).length;
    const dietPlansCreated = users.filter(u => u.savedDietPlan?.meals).length;

    // Goal distribution
    const goalsCount = {};
    users.forEach(u => {
      if (u.profile?.goal) {
        goalsCount[u.profile.goal] = (goalsCount[u.profile.goal] || 0) + 1;
      }
    });

    // Activity level distribution
    const activityCount = {};
    users.forEach(u => {
      if (u.profile?.activityLevel) {
        activityCount[u.profile.activityLevel] = (activityCount[u.profile.activityLevel] || 0) + 1;
      }
    });

    // Allergies distribution
    const allergiesCount = {};
    users.forEach(u => {
      if (u.profile?.allergyList?.length > 0) {
        u.profile.allergyList.forEach(allergy => {
          allergiesCount[allergy] = (allergiesCount[allergy] || 0) + 1;
        });
      }
    });



    const analytics = {
      totalUsers,
      onboardingCompleted,
      dietPlansCreated,
      goalsDistribution: goalsCount,
      activityDistribution: activityCount,
      allergiesDistribution: allergiesCount
    };

    res.status(200).json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ message: "Error fetching analytics", error: err.message });
  }
};

// Delete user (with confirmation)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting admin accounts
    if (userToDelete.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    }

    const deletedUserEmail = userToDelete.email;

    // Delete the user
    await User.findByIdAndDelete(userId);



    res.status(200).json({ success: true, message: `User ${deletedUserEmail} has been deleted` });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
  }
};

// Export user data (for single user)
exports.exportUserData = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }



    // Return user data (password excluded)
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({ success: true, data: userData });
  } catch (err) {
    res.status(500).json({ message: "Error exporting user data", error: err.message });
  }
};

// Export all users data to CSV
exports.exportAllUsersData = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");

    // Create CSV format
    const headers = ["ID", "Email", "Onboarding Complete", "Goal", "Activity Level", "Diet Plan Created", "Created At"];
    const csvRows = [];

    csvRows.push(headers.join(","));

    users.forEach(user => {
      const row = [
        user._id,
        user.email,
        user.onboardingComplete,
        user.profile?.goal || "N/A",
        user.profile?.activityLevel || "N/A",
        user.savedDietPlan?.meals ? "Yes" : "No",
        user.createdAt
      ];
      csvRows.push(row.join(","));
    });



    const csvContent = csvRows.join("\n");

    res.status(200).json({ success: true, csv: csvContent, count: users.length });
  } catch (err) {
    res.status(500).json({ message: "Error exporting users data", error: err.message });
  }
};



// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      role: { $ne: "admin" },
      email: { $regex: query, $options: "i" }
    }).select("email profile onboardingComplete createdAt");



    res.status(200).json({ success: true, results: users });
  } catch (err) {
    res.status(500).json({ message: "Error searching users", error: err.message });
  }
};

// Send user's diet chart to their email
exports.sendDietChart = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.savedDietPlan?.meals?.length) {
      return res.status(400).json({ message: "This user has no generated diet chart to send." });
    }

    await sendDietChartEmail(user.email, user.profile, user.savedDietPlan);

    res.status(200).json({ success: true, message: `Diet chart sent to ${user.email}` });
  } catch (err) {
    res.status(500).json({ message: "Failed to send diet chart email", error: err.message });
  }
};
