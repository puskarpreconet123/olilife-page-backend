const { buildFoodDatabase } = require("../../client/src/utils/dietEngine");
const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/New folder (2)/olilife/server/.env" });
const Meal = require("../models/Meal");

// Mock state and metrics similar to client-side
const MEAL_CONFIGS = [
  { key: "breakfast", label: "Breakfast", percentage: 0.30, macroShare: 0.30 },
  { key: "lunch", label: "Lunch", percentage: 0.30, macroShare: 0.30 },
  { key: "dinner", label: "Dinner", percentage: 0.30, macroShare: 0.30 },
  { key: "snacks", label: "Snacks", percentage: 0.10, macroShare: 0.10 },
  { key: "dessert", label: "Dessert", percentage: 0.05, macroShare: 0 }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const rawMeals = await Meal.find({});
  const foodDatabase = buildFoodDatabase(rawMeals);
  
  // Test profiles
  const profiles = [
    {
      name: "Diabetic Kolkata Bengali Veg",
      state: {
        age: "48", gender: "male", height: "170", heightUnit: "cm", weight: "74",
        activityLevel: "sedentary", goal: "weight-loss", diabeticStatus: "diabetic",
        hasAllergies: false, allergyList: [], customAllergy: "", chronicConditions: [],
        preferredRegionalMeal: "Kolkata_Bengali", dietPreference: "veg"
      }
    },
    {
      name: "Diabetic Kolkata Bengali Non-Veg",
      state: {
        age: "48", gender: "male", height: "170", heightUnit: "cm", weight: "74",
        activityLevel: "sedentary", goal: "weight-loss", diabeticStatus: "diabetic",
        hasAllergies: false, allergyList: [], customAllergy: "", chronicConditions: [],
        preferredRegionalMeal: "Kolkata_Bengali", dietPreference: "non-veg"
      }
    }
  ];

  for (const prof of profiles) {
    console.log(`\nTesting Profile: ${prof.name}`);
    const state = prof.state;
    
    // We need to count matching candidates for snacks
    const isDiabetic = state.diabeticStatus === "diabetic" || state.diabeticStatus === "pre-diabetic";
    const dietPref = state.dietPreference || 'non-veg';
    
    let candidates = foodDatabase.filter((f) => f.mealType === "snacks");
    console.log(`- Total snacks in DB: ${candidates.length}`);
    
    if (state.preferredRegionalMeal) {
      candidates = candidates.filter(f => f.region === state.preferredRegionalMeal);
      console.log(`- After region filter (${state.preferredRegionalMeal}): ${candidates.length}`);
    }
    
    if (dietPref === 'veg') {
      candidates = candidates.filter(f => f.vegetarian);
      console.log(`- After veg filter: ${candidates.length}`);
    }
    
    if (isDiabetic) {
      candidates = candidates.filter(f => f.diabeticFriendly);
      console.log(`- After diabetic friendly filter: ${candidates.length}`);
    }
    
    console.log(`Candidates for snacks:`, candidates.map(c => c.name));
  }

  await mongoose.disconnect();
}

run().catch(console.error);
