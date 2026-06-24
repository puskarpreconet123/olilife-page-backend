const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const User = require("../models/User");
const Meal = require("../models/Meal");

// Copy of getMetrics and generateDietPlan logic to run locally in Node
const { getMetrics, generateDietPlan } = require("../../client/src/utils/dietEngine.js");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find the first user in the database (since there's usually only one or a few)
  const user = await User.findOne({ email: { $ne: "admin@olilife.com" } });
  if (!user) {
    console.log("No user found.");
    await mongoose.disconnect();
    return;
  }
  
  console.log("User Profile:", JSON.stringify(user.profile, null, 2));
  
  // Load the food database so the engine works
  const mealsDb = await Meal.find({});
  // Mock the loadFoodDatabase behavior by building the foodDatabase
  const { buildFoodDatabase } = require("../../client/src/utils/dietEngine.js");
  // We need to set the foodDatabase inside dietEngine or just use the API.
  // Wait, since we are in node, let's see how loadFoodDatabase works. It does a fetch.
  // Instead of fetch, let's mock it by overriding the database variable or checking if we can query it.
  
  await mongoose.disconnect();
}

run().catch(console.error);
