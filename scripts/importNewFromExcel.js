// Usage: node server/scripts/importNewFromExcel.js <path-to-excel-file.xlsx>
// Inserts ONLY meals that don't already exist in MongoDB.
// A meal is considered a duplicate if (name, type) matches an existing record (case-insensitive).

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

function autoRange(cal) {
  const n = Number(cal);
  if (!n) return "";
  const low = Math.floor(n / 100) * 100;
  return `${low}-${low + 100}`;
}

function key(name, type) {
  return `${String(name).trim().toLowerCase()}|${String(type).trim().toLowerCase()}`;
}

function parseFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const meals = [];
  const errors = [];

  wb.SheetNames.forEach(sheetName => {
    const type = sheetName.trim().toLowerCase()
      .replace(/s$/, "")
      .replace(/snack$/, "snacks");

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
      const name = String(row["Meal Name"] || row["name"] || "").trim();

      if (!name) {
        errors.push(`Sheet "${sheetName}" Row ${lineNo}: missing meal name`);
        return;
      }

      const calories     = Number(row["Calories (kcal)"] || row["calories"]) || 0;
      const calorie_range= String(row["Calorie Range"] || row["calorie_range"] || "").trim()
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
        allergens:        [],
      });
    });
  });

  return { meals, errors };
}

async function run() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node server/scripts/importNewFromExcel.js <path-to-excel-file.xlsx>");
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

  console.log(`Parsed ${meals.length} meals from Excel — connecting to MongoDB...`);
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const existing = await Meal.find({}, { name: 1, type: 1, _id: 0 }).lean();
  const existingKeys = new Set(existing.map(m => key(m.name, m.type)));
  console.log(`Found ${existing.length} existing meals in DB`);

  // Dedupe within Excel itself, then drop ones already in DB
  const seenInBatch = new Set();
  const toInsert = [];
  let dupInExcel = 0;
  let dupInDb    = 0;

  for (const m of meals) {
    const k = key(m.name, m.type);
    if (seenInBatch.has(k)) { dupInExcel++; continue; }
    seenInBatch.add(k);
    if (existingKeys.has(k)) { dupInDb++; continue; }
    toInsert.push(m);
  }

  console.log(`\nSummary:`);
  console.log(`  In Excel:           ${meals.length}`);
  console.log(`  Duplicates in file: ${dupInExcel}`);
  console.log(`  Already in DB:      ${dupInDb}`);
  console.log(`  New to insert:      ${toInsert.length}`);

  if (!toInsert.length) {
    console.log("\nNothing new to insert.");
    await mongoose.disconnect();
    return;
  }

  const result = await Meal.insertMany(toInsert);
  console.log(`\nInserted ${result.length} new meals`);

  await mongoose.disconnect();
  console.log("Done");
}

run().catch(err => { console.error(err); process.exit(1); });
