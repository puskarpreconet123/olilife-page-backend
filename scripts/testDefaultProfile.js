const { buildFoodDatabase, getMetrics, generateDietPlan } = require("../../client/src/utils/dietEngine");
const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/New folder (2)/olilife/server/.env" });
const Meal = require("../models/Meal");

const DEFAULT_PROFILE = {
  age: "", gender: "", height: "", heightUnit: "cm", weight: "",
  activityLevel: "", goal: "", diabeticStatus: "", hasAllergies: false,
  allergyList: [], customAllergy: "", chronicConditions: [],
  preferredRegionalMeal: "", prioritizeBengaliClassics: true
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const rawMeals = await Meal.find({});
  
  global.fetch = async (url) => {
    return {
      ok: true,
      json: async () => rawMeals
    };
  };

  const dietEngine = require("../../client/src/utils/dietEngine");
  await dietEngine.loadFoodDatabase();

  console.log("Testing generateDietPlan with DEFAULT_PROFILE:");
  const plan = dietEngine.generateDietPlan(DEFAULT_PROFILE);
  const mealTypes = plan.map(m => m.mealType);
  console.log(`Generated meals:`, mealTypes);

  await mongoose.disconnect();
}

run().catch(console.error);
