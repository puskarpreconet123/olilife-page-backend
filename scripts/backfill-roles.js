require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await mongoose.connection.db.collection("users").updateMany(
    { role: { $exists: false } },
    { $set: { role: "user" } }
  );
  console.log("Backfilled role for", result.modifiedCount, "users");

  const users = await mongoose.connection.db.collection("users")
    .find({}).project({ email: 1, role: 1 }).toArray();
  users.forEach(u => console.log(u.email, "->", u.role));
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
