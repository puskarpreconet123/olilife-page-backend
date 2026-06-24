const { buildFoodDatabase, getMetrics } = require("../../client/src/utils/dietEngine");
const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/New folder (2)/olilife/server/.env" });
const User = require("../models/User");
const Meal = require("../models/Meal");

// Copy getMealCandidates logic
function getHardAvoidTags(conditions) {
  const tags = new Set();
  const CONDITION_PREFERENCES = {
    liver: { support: ["detox-friendly", "low-fat"], avoid: ["high-fat", "fried"] },
    kidney: { support: ["controlled-protein", "low-sodium"], avoid: ["protein-heavy", "high-sodium"] },
    lung: { support: ["anti-inflammatory"], avoid: ["fried"] },
    heart: { support: ["low-fat", "low-sodium"], avoid: ["high-fat", "high-sodium", "fried"] },
    thyroid: { support: ["balanced-iodine"], avoid: [] },
    digestive: { support: ["easy-digest"], avoid: ["fried", "heavy"] }
  };
  (conditions || []).filter((c) => c !== "none").forEach((c) => {
    (CONDITION_PREFERENCES[c]?.avoid || []).forEach((t) => tags.add(t));
  });
  return tags;
}

function getCustomAllergyTokens(customAllergy) {
  return (customAllergy || "").toLowerCase().split(",").map((t) => t.trim()).filter(Boolean);
}

const ALLERGY_MAP = {
  dairy: ["dairy", "milk", "cheese", "paneer", "curd", "yogurt", "ghee", "butter"],
  nuts: ["nut", "peanut", "cashew", "almond", "walnut", "pistachio", "makhana"],
  seafood: ["seafood", "fish", "prawn", "shrimp", "crab", "rohu", "pomfret", "sardine", "hilsa"],
  eggs: ["egg"],
  gluten: ["gluten", "wheat", "flour", "maida", "sooji", "semolina", "rawa"]
};

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function allergyHits(food, alias) {
  const a = String(alias).toLowerCase().trim();
  if (!a) return false;
  if ((food.tags || []).includes(a)) return true;
  return new RegExp(`\\b${escapeRegex(a)}\\b`, "i").test(food.name || "");
}

function filterByAllergies(food, state) {
  if (!state.hasAllergies) return true;

  const selectedCommon = state.allergyList || [];
  for (const allergyKey of selectedCommon) {
    const aliases = ALLERGY_MAP[allergyKey];
    if (!aliases) continue;
    if (aliases.some(alias => allergyHits(food, alias))) return false;
  }

  const customTokens = getCustomAllergyTokens(state.customAllergy);
  if (customTokens.some(token => allergyHits(food, token))) return false;

  return true;
}

function getMealCandidates(mealType, state, metrics, foodDatabase) {
  const isDiabetic = state.diabeticStatus === "diabetic" || state.diabeticStatus === "pre-diabetic";
  const avoidTags = getHardAvoidTags(state.chronicConditions);
  const dietPref = state.dietPreference || 'non-veg';

  let candidates = foodDatabase.filter((f) =>
    f.mealType === mealType &&
    filterByAllergies(f, state)
  );

  if (state.preferredRegionalMeal) {
    candidates = candidates.filter(f => f.region === state.preferredRegionalMeal);
  }

  if (dietPref === 'veg') {
    candidates = candidates.filter(f => f.vegetarian);
  }

  if (isDiabetic) {
    candidates = candidates.filter(f => f.diabeticFriendly);
  }

  candidates = candidates.filter(f => !f.tags.some(t => avoidTags.has(t)));
  return candidates;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const rawMeals = await Meal.find({});
  const foodDatabase = buildFoodDatabase(rawMeals);
  
  const users = await User.find({});
  console.log(`Checking candidate counts for ${users.length} users:`);
  
  for (const u of users) {
    const state = u.profile;
    if (!state || !state.age) continue;
    const metrics = getMetrics(state);
    const breakfast = getMealCandidates("breakfast", state, metrics, foodDatabase);
    const lunch = getMealCandidates("lunch", state, metrics, foodDatabase);
    const dinner = getMealCandidates("dinner", state, metrics, foodDatabase);
    const snacks = getMealCandidates("snacks", state, metrics, foodDatabase);
    
    console.log(`User: ${u.email}`);
    console.log(`  Breakfast candidates: ${breakfast.length}`);
    console.log(`  Lunch candidates: ${lunch.length}`);
    console.log(`  Dinner candidates: ${dinner.length}`);
    console.log(`  Snacks candidates: ${snacks.length}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
