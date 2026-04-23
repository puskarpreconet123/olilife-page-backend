const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  type:             { type: String, required: true, enum: ["breakfast", "lunch", "dinner", "snacks", "dessert"] },
  calorie_range:    { type: String },
  calories:         { type: Number },
  protein:          { type: Number },
  carbs:            { type: Number },
  fats:             { type: Number },
  fiber:            { type: Number },
  vegetarian:       { type: String },
  diabetic_friendly:{ type: String },
  allergens:        { type: [String], default: [] }
}, { versionKey: false });

module.exports = mongoose.model("Meal", mealSchema);
