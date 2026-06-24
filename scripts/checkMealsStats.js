const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/New folder (2)/olilife/server/.env" });
const Meal = require("../models/Meal");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const regions = await Meal.distinct("region");
  console.log("Meal breakdown by region and type:");
  for (const region of regions) {
    const stats = await Meal.aggregate([
      { $match: { region } },
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);
    console.log(`Region: ${region}`);
    console.log(stats);
  }
  await mongoose.disconnect();
}

run().catch(console.error);
