require("dotenv").config();
const http = require("http");
const User = require("./models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "localhost", port: 5000, path, method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }, (res) => {
      let raw = "";
      res.on("data", c => raw += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const admin = await User.findOne({ role: "admin" });
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  console.log("Admin:", admin.email, "| Token: OK");

  console.log("\n--- GET /api/admin/users ---");
  const r1 = await get("/api/admin/users", token);
  console.log("Status:", r1.status);
  if (r1.status === 200) {
    console.log("Users found:", r1.body.users?.length);
    console.log("Stats:", JSON.stringify(r1.body.stats));
  } else {
    console.log("Response:", JSON.stringify(r1.body));
  }

  console.log("\n--- GET /api/admin/analytics ---");
  const r2 = await get("/api/admin/analytics", token);
  console.log("Status:", r2.status);
  if (r2.status === 200) {
    const a = r2.body.analytics;
    console.log("totalUsers:", a?.totalUsers, "| onboarded:", a?.onboardingCompleted);
  } else {
    console.log("Response:", JSON.stringify(r2.body));
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
