/**
 * Usage: node server/scripts/importBengaliMeals.js <path-to-excel-file.xlsx>
 * 
 * Accepts an Excel file path, parses all sheets, deletes existing meals 
 * belonging to the "Kolkata_Bengali" region in MongoDB, and inserts the new ones.
 * Automatically forces the region field to "Kolkata_Bengali" for all imported items.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const XLSX     = require("xlsx");
const path     = require("path");
const Meal     = require("../models/Meal");

const VALID_TYPES = ["breakfast", "lunch", "dinner", "snacks", "dessert"];

function normDiabetic(val) {
  const s = String(val || "").trim().toLowerCase();
  if (s === "yes" || s === "good" || s === "moderate") return "Yes";
  return "No";
}

function parseAllergens(val) {
  const s = String(val || "").trim();
  if (!s) return [];
  const lower = s.toLowerCase();
  if (lower === "none" || lower === "n/a" || lower === "na") return [];
  return s.split(/[,;/;\n\r\t]+/).map(x => x.trim().toLowerCase()).filter(Boolean);
}

function autoRange(cal) {
  const n = Number(cal);
  if (!n) return "";
  const low = Math.floor(n / 100) * 100;
  return `${low}-${low + 100}`;
}

function parseFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const meals = [];
  const errors = [];

  wb.SheetNames.forEach(sheetName => {
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    rows.forEach((row, i) => {
      const lineNo = i + 2;
      const name = String(
        row["Professional_Dish_Name"] || row["Professional Dish Name"] || row["Meal Name"] || row["name"] || ""
      ).trim();

      if (!name) {
        errors.push(`Sheet "${sheetName}" Row ${lineNo}: missing dish/meal name`);
        return;
      }

      const rawCategory = String(row["Meal_Category"] || row["Meal Category"] || row["type"] || "").trim().toLowerCase();
      const typeMap = {
        breakfast: "breakfast",
        lunch: "lunch",
        dinner: "dinner",
        snacks: "snacks",
        snack: "snacks",
        dessert: "dessert",
        desserts: "dessert",
        deserts: "dessert"
      };
      const resolvedType = typeMap[rawCategory];

      if (!resolvedType || !VALID_TYPES.includes(resolvedType)) {
        errors.push(`Sheet "${sheetName}" Row ${lineNo}: unrecognised category/type "${rawCategory}" — skipped`);
        return;
      }

      const calories = Number(row["Exact_Target_Calorie"] || row["Estimated_Calorie"] || row["calories"] || row["Calories (kcal)"]) || 0;
      const calorie_range = String(row["Calorie_Bracket"] || row["Calorie Bracket"] || row["calorie_range"] || "").trim() || autoRange(calories);
      
      const vegVal = String(row["Veg_NonVeg"] || row["Veg/NonVeg"] || row["vegetarian"] || "Veg").trim().toLowerCase();
      const vegetarian = (vegVal === "veg" || vegVal === "yes") ? "Yes" : "No";
      const topPriority = String(row["Top_Priority_Food"] || row["Top Priority Food"] || "").trim().toLowerCase() === "yes";

      meals.push({
        name,
        type: resolvedType,
        calorie_range,
        calories,
        protein:          Number(row["Protein_g"] || row["Protein (g)"] || row["protein"]) || 0,
        carbs:            Number(row["Carbs_g"] || row["Carbs (g)"] || row["carbs"]) || 0,
        fats:             Number(row["Fat_g"] || row["Fat (g)"] || row["fats"]) || 0,
        fiber:            Number(row["Fiber_g"] || row["Fiber (g)"] || row["fiber"]) || 0,
        vegetarian,
        diabetic_friendly:normDiabetic(row["Diabetic_Friendly_Status"] || row["Diabetic Friendly"] || row["diabetic_friendly"]),
        allergens:        parseAllergens(row["Allergy_Details"] || row["Allergens"] || row["allergens"]),
        region:           "Kolkata_Bengali", // Force region to Kolkata_Bengali
        top_priority:     topPriority
      });
    });
  });

  return { meals, errors };
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node server/scripts/importBengaliMeals.js <path-to-excel-file.xlsx>");
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  console.log(`Reading Excel file: ${absPath}`);

  const { meals, errors } = parseFile(absPath);

  if (errors.length) {
    console.warn(`\nWarnings during parsing (${errors.length}):`);
    errors.slice(0, 20).forEach(e => console.warn(" ", e));
    if (errors.length > 20) console.warn(` ... and ${errors.length - 20} more warnings.`);
  }

  if (!meals.length) {
    console.error("Error: No valid meals parsed from file.");
    process.exit(1);
  }

  console.log(`Parsed ${meals.length} meals. Connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // Delete existing meals for Kolkata_Bengali only
  console.log("Deleting existing Kolkata_Bengali meals from the database...");
  const deleteResult = await Meal.deleteMany({ region: "Kolkata_Bengali" });
  console.log(`Deleted ${deleteResult.deletedCount} existing Kolkata_Bengali meals.`);

  // Insert new meals
  console.log("Inserting new meals...");
  const insertResult = await Meal.insertMany(meals);
  console.log(`Successfully seeded ${insertResult.length} Kolkata_Bengali meals into MongoDB.`);

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch(err => {
  console.error("Error running seed script:", err);
  process.exit(1);
});
