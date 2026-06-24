const mongoose = require("mongoose");
require("dotenv").config({ path: "c:/New folder (2)/olilife/server/.env" });
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const users = await User.find({}).select("-password");
  console.log("Users in database:", JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
