const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

// Load env
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB...");

    const usersToCreate = [];
    const goals = ["Weight Loss", "Muscle Gain", "Healthy Living", "Endurance"];
    const activities = ["Sedentary", "Moderate", "Active", "Very Active"];

    for (let i = 1; i <= 10; i++) {
      const email = `user${Date.now()}${i}@test.com`;
      usersToCreate.push({
        email,
        password: "password123",
        profile: {
          age: (20 + i).toString(),
          gender: i % 2 === 0 ? "Male" : "Female",
          height: "175",
          weight: (60 + i * 2).toString(),
          goal: goals[i % goals.length],
          activityLevel: activities[i % activities.length],
          onboardingComplete: true
        },
        onboardingComplete: true,
        role: "user"
      });
    }

    await User.insertMany(usersToCreate);
    console.log(`Successfully seeded ${usersToCreate.length} users!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error seeding users:", err);
    process.exit(1);
  }
};

seedUsers();
