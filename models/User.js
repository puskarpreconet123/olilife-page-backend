const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const profileSchema = new mongoose.Schema({
  age: { type: String, default: "" },
  gender: { type: String, default: "" },
  height: { type: String, default: "" },
  heightUnit: { type: String, default: "cm" },
  weight: { type: String, default: "" },
  activityLevel: { type: String, default: "" },
  goal: { type: String, default: "" },
  diabeticStatus: { type: String, default: "" },
  hasAllergies: { type: Boolean, default: false },
  allergyList: { type: [String], default: [] },
  customAllergy: { type: String, default: "" },
  chronicConditions: { type: [String], default: [] }
}, { _id: false });

const savedDietPlanSchema = new mongoose.Schema({
  meals:          { type: mongoose.Schema.Types.Mixed, default: null },
  inputSignature: { type: String, default: "" },
  generatedAt:    { type: Date, default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profile: { type: profileSchema, default: () => ({}) },
  savedDietPlan: { type: savedDietPlanSchema, default: () => ({}) },
  onboardingComplete: { type: Boolean, default: false },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
