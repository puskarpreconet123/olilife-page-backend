const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const profileSchema = new mongoose.Schema({
  age: { 
    type: String, 
    default: "",
    validate: {
      validator: function(v) {
        if (!v) return true;
        const n = parseInt(v);
        return n >= 1 && n <= 90;
      },
      message: "Age must be between 1 and 90."
    }
  },
  gender: { 
    type: String, 
    default: "",
    enum: {
      values: ["", "female", "male", "other"],
      message: "{VALUE} is not a valid gender"
    }
  },
  height: { 
    type: String, 
    default: "",
    validate: {
      validator: function(v) {
        if (!v) return true;
        const unit = this.heightUnit || "cm";
        if (unit === "cm") {
          const n = parseInt(v);
          return n >= 30 && n <= 300;
        }
        const n = parseFloat(v);
        return n > 0 && n <= 10;
      },
      message: "Height is out of valid range."
    }
  },
  heightUnit: { 
    type: String, 
    default: "cm",
    enum: ["cm", "ft"]
  },
  weight: { 
    type: String, 
    default: "",
    validate: {
      validator: function(v) {
        if (!v) return true;
        const n = parseInt(v);
        return n >= 10 && n <= 150;
      },
      message: "Weight must be between 10 and 150kg."
    }
  },
  activityLevel: { 
    type: String, 
    default: "",
    enum: ["", "sedentary", "light", "moderate", "very_active"]
  },
  goal: { 
    type: String, 
    default: "",
    enum: ["", "weight-loss", "weight-gain", "maintain", "detox", "energy"]
  },
  dietPreference: {
    type: String,
    default: "veg",
    enum: ["veg", "non-veg"]
  },
  diabeticStatus: { 
    type: String, 
    default: "",
    enum: ["", "non-diabetic", "pre-diabetic", "diabetic"]
  },
  hasAllergies: { type: Boolean, default: false },
  allergyList: { 
    type: [String], 
    default: [],
    enum: ["dairy", "nuts", "gluten", "seafood", "eggs"]
  },
  customAllergy: { type: String, default: "" },
  chronicConditions: { 
    type: [String], 
    default: [],
    enum: ["none", "liver", "kidney", "lung", "heart", "thyroid", "digestive"]
  }
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
