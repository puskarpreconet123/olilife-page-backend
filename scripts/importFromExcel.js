// Usage: node server/scripts/importFromExcel.js <path-to-excel-file.xlsx>
// Appends meals from all sheets WITHOUT deleting existing data.
// Sheet names are used as meal type (e.g. sheet "Breakfast" → type "breakfast").
// Handles the column names: Meal Name, Calories (kcal), Protein (g), etc.

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const XLSX     = require("xlsx");
const path     = require("path");
const Meal     = require("../models/Meal");

const VALID_TYPES = ["breakfast", "lunch", "dinner", "snacks", "dessert"];

// Map "Diabetic Friendly" values from the Excel to Yes/No
function normDiabetic(val) {
  const s = String(val || "").trim().toLowerCase();
  if (s === "yes" || s === "good" || s === "moderate") return "Yes";
  return "No";
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
    const type = sheetName.trim().toLowerCase()
      .replace(/s$/, "")   // "Desserts" → "dessert", "Snacks" → "snack"
      .replace(/snack$/, "snacks"); // fix snack → snacks

    // Normalise known sheet name variants
    const typeMap = { dessert: "dessert", deserts: "dessert", snack: "snacks", snacks: "snacks" };
    const resolvedType = typeMap[type] || type;

    if (!VALID_TYPES.includes(resolvedType)) {
      errors.push(`Sheet "${sheetName}": unrecognised type "${resolvedType}" — skipped`);
      return;
    }

    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

    rows.forEach((row, i) => {
      const lineNo = i + 2;
      // Support both our original column names and the Excel's column names
      const name = String(
        row["Meal Name"] || row["name"] || ""
      ).trim();

      if (!name) {
        errors.push(`Sheet "${sheetName}" Row ${lineNo}: missing meal name`);
        return;
      }

      const calories     = Number(row["Calories (kcal)"] || row["calories"])     || 0;
      const calorie_range= String(row["Calorie Range"]   || row["calorie_range"] || "").trim()
                           || autoRange(calories);

      meals.push({
        name,
        type: resolvedType,
        calorie_range,
        calories,
        protein:          Number(row["Protein (g)"]  || row["protein"])  || 0,
        carbs:            Number(row["Carbs (g)"]    || row["carbs"])    || 0,
        fats:             Number(row["Fat (g)"]      || row["fats"])     || 0,
        fiber:            Number(row["Fiber (g)"]    || row["fiber"])    || 0,
        vegetarian:       String(row["Vegetarian"]   || row["vegetarian"] || "Yes").trim(),
        diabetic_friendly:normDiabetic(row["Diabetic Friendly"] || row["diabetic_friendly"]),
        allergens:        [],  // not in this Excel; add a column if needed
      });
    });
  });

  return { meals, errors };
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node server/scripts/importFromExcel.js <path-to-excel-file.xlsx>");
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  console.log(`Reading: ${absPath}`);

  const { meals, errors } = parseFile(absPath);

  if (errors.length) {
    console.warn("\nWarnings:");
    errors.forEach(e => console.warn(" ", e));
  }

  if (!meals.length) {
    console.log("No meals found in file.");
    process.exit(0);
  }

  console.log(`Parsed ${meals.length} meals — connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const result = await Meal.insertMany(meals);
  console.log(`Inserted ${result.length} meals`);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch(err => { console.error(err); process.exit(1); });
