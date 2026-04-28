// Usage: node server/scripts/exportMealsToExcel.js [output-path.xlsx]
// Exports all meals from MongoDB into an Excel file.
// One sheet per meal type (Breakfast, Lunch, Dinner, Snacks, Dessert).
// Column names match the format expected by importFromExcel.js so the
// resulting file can be re-imported without changes.

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const XLSX     = require("xlsx");
const path     = require("path");
const Meal     = require("../models/Meal");

const TYPE_ORDER = ["breakfast", "lunch", "dinner", "snacks", "dessert"];

function sheetName(type) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function toRow(meal) {
  return {
    "Meal Name":         meal.name || "",
    "Calorie Range":     meal.calorie_range || "",
    "Calories (kcal)":   meal.calories ?? 0,
    "Protein (g)":       meal.protein  ?? 0,
    "Carbs (g)":         meal.carbs    ?? 0,
    "Fat (g)":           meal.fats     ?? 0,
    "Fiber (g)":         meal.fiber    ?? 0,
    "Vegetarian":        meal.vegetarian || "",
    "Diabetic Friendly": meal.diabetic_friendly || "",
    "Allergens":         (meal.allergens || []).join(", "),
  };
}

async function run() {
  const outArg = process.argv[2];
  const outPath = path.resolve(
    outArg || path.join(__dirname, "..", `meals-export-${new Date().toISOString().slice(0,10)}.xlsx`)
  );

  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set in server/.env");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const meals = await Meal.find({}).lean();
  console.log(`Fetched ${meals.length} meals`);

  const grouped = {};
  for (const t of TYPE_ORDER) grouped[t] = [];
  for (const m of meals) {
    const t = String(m.type || "").toLowerCase();
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(m);
  }

  const wb = XLSX.utils.book_new();
  const knownTypes = new Set(TYPE_ORDER);

  for (const t of TYPE_ORDER) {
    const rows = grouped[t].map(toRow);
    const ws = XLSX.utils.json_to_sheet(rows, {
      header: ["Meal Name","Calorie Range","Calories (kcal)","Protein (g)","Carbs (g)","Fat (g)","Fiber (g)","Vegetarian","Diabetic Friendly","Allergens"],
    });
    XLSX.utils.book_append_sheet(wb, ws, sheetName(t));
  }

  for (const t of Object.keys(grouped)) {
    if (knownTypes.has(t)) continue;
    const rows = grouped[t].map(toRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName(t || "Other"));
  }

  XLSX.writeFile(wb, outPath);
  console.log(`Wrote ${outPath}`);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch(err => { console.error(err); process.exit(1); });
