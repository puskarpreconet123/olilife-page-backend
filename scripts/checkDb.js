const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/New folder (2)/olilife/server/.env" });
const Meal = require("../models/Meal");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Meal.countDocuments({});
  const byRegion = await Meal.aggregate([
    { $group: { _id: "$region", count: { $sum: 1 } } }
  ]);
  const byType = await Meal.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);
  console.log("Total meals in database:", total);
  console.log("By region:", byRegion);
  console.log("By type:", byType);
  await mongoose.disconnect();
}

run().catch(console.error);
