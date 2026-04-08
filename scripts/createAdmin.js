const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("../models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminEmail = (process.argv[2] || "admin@olilife.com").toLowerCase().trim();
    const adminPassword = process.argv[3] || "admin";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.password = adminPassword;
      existingAdmin.role = "admin";
      existingAdmin.onboardingComplete = true;
      await existingAdmin.save();
      console.log(`✅ Admin account updated: ${adminEmail}`);
      await mongoose.disconnect();
      return;
    }

    // Create admin account with plain password so the User model hashes it once
    const admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      onboardingComplete: true,
      profile: {}
    });

    console.log("✅ Admin account created successfully!");
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`👤 Role: ${admin.role}`);
    console.log("\n⚠️  IMPORTANT: Change the default password immediately!");

    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
