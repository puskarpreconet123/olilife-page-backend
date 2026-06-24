const { buildFoodDatabase, getMetrics, generateDietPlan } = require("../../client/src/utils/dietEngine");
const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/New folder (2)/olilife/server/.env" });
const User = require("../models/User");
const Meal = require("../models/Meal");

// Mock global foodDatabase for the engine
const fs = require("fs");
const path = require("path");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const rawMeals = await Meal.find({});
  
  // We need to inject the loaded foodDatabase into the dietEngine module since it loads via API fetch in browser.
  // Wait! In the client, loadFoodDatabase() fetches from /api/meals and sets a local let foodDatabase.
  // In node, we can mock or inject it, or just use the exported functions if they rely on it.
  // Wait, let's see how foodDatabase is imported in dietEngine.js.
  // Let's read how dietEngine.js populates it:
  // let foodDatabase = [];
  // export function buildFoodDatabase(rawMeals) { ... }
  // Wait! If the engine has a local let foodDatabase, how can we populate it in node?
  // Ah! loadFoodDatabase() does fetch, which fails in node. But we can mock global.fetch!
  global.fetch = async (url) => {
    return {
      ok: true,
      json: async () => rawMeals
    };
  };

  const dietEngine = require("../../client/src/utils/dietEngine");
  await dietEngine.loadFoodDatabase();

  const users = await User.find({});
  console.log(`Testing generateDietPlan for ${users.length} users:`);
  for (const u of users) {
    const state = u.profile;
    if (!state || !state.age) continue;
    
    const plan = dietEngine.generateDietPlan(state);
    const mealTypes = plan.map(m => m.mealType);
    console.log(`User: ${u.email}`);
    console.log(`  Profile: weight=${state.weight}, goal=${state.goal}, diabetic=${state.diabeticStatus}, region=${state.preferredRegionalMeal}`);
    console.log(`  Generated meals:`, mealTypes);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
