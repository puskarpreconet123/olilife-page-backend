/**
 * Run this script to seed appropriate allergens for all Kolkata_Bengali_New meals in the database.
 * Usage: node server/scripts/seedBengaliAllergens.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Meal     = require("../models/Meal");

const ALLERGEN_MAPS = {
  // Lunch
  "3/4 cup rice, moong dal, vegetables, salad, curd": ["dairy", "milk"],
  "Moong dal khichuri, salad, curd, peanuts": ["dairy", "milk", "peanut"],
  "1/2 cup rice, chicken curry, moong dal, vegetables, salad": [],
  "1 cup rice, fish curry, vegetable torkari, cucumber salad": ["fish"],
  "2 rotis, cholar dal, vegetables, curd": ["gluten", "wheat", "dairy", "milk"],
  "3/4 cup rice, moong dal, grilled fish/chicken, vegetables": ["fish"],
  "1 cup rice, egg curry, masoor dal, vegetable bhaja": ["egg"],
  "1 cup rice, musur dal, rohu fish jhol, shukto": ["fish"],

  // Dinner
  "2 small atta rotis, soy chunk curry, salad": ["gluten", "wheat", "soy"],
  "Vegetable moong dal khichuri, cucumber salad": [],
  "2 rotis, dal, salad, vegetable curry": ["gluten", "wheat"],
  "100g chicken salad": [],
  "2 rotis, mixed vegetable stir fry": ["gluten", "wheat"],
  "2 small atta rotis, mixed vegetable curry": ["gluten", "wheat"],

  // Breakfast
  "3 egg vegetable omelette": ["egg"],
  "2 besan chilla with curd": ["dairy", "milk"],
  "Sprout chaat (1 bowl)": [],
  "2 atta roti, vegetable sabji, 1 boiled egg": ["gluten", "wheat", "egg"],
  "Vegetable upma (1 bowl), 1 boiled egg": ["gluten", "wheat", "egg"],
  "1 atta roti, paneer bhurji": ["gluten", "wheat", "dairy", "milk"],
  "2 multigrain bread, peanut butter, 2 egg whites": ["gluten", "wheat", "peanut", "egg"],
  "Milk, oats, banana, chia seed smoothie": ["dairy", "milk"],

  // Snacks
  "Apple or guava": [],
  "Boiled soy chunks snack": ["soy"],
  "Sprouts chaat, green tea": [],
  "Tea without sugar, roasted chana": [],
  "Muri makha (2 cups)": [],
  "Cucumber tomato chaat": [],
  "Boiled corn (1/2 cup)": [],
  "25g roasted chana": []
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  const meals = await Meal.find({ region: "Kolkata_Bengali_New" });
  console.log(`Found ${meals.length} meals in Kolkata_Bengali_New.`);

  let updatedCount = 0;
  for (const meal of meals) {
    const name = meal.name.trim();
    if (ALLERGEN_MAPS.hasOwnProperty(name)) {
      const targetAllergens = ALLERGEN_MAPS[name];
      meal.allergens = targetAllergens;
      await meal.save();
      console.log(`Updated "${name}" -> allergens:`, targetAllergens);
      updatedCount++;
    }
  }

  console.log(`Successfully seeded ${updatedCount} meals with allergens.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("Error seeding allergens:", err);
  process.exit(1);
});
