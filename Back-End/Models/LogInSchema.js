const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { type } = require("os");

const UserLoginSchema = new mongoose.Schema({
  avatar: {
    url: String,
    public_id: String,
  },
  first_name: { type: String },
  last_name: { type: String },
  middle_name: { type: String },
  suffix: { type: String },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
  referralCode: {
    type: String,
    trim: true,
    sparse: true,
    default: "",
  },
  referredBy: {
    type: String,
    trim: true,
    uppercase: true,
    default: null,
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "subject_instructor", "student", "panelist", "adviser"],
    required: true,
    lowercase: true,
  },
  passwordisplay: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["Active", "In-Active"], default: "Active" },
  confirmPassword: {
    type: String,
    require: [true, "Please confirm your password"],
    validate: {
      validator: function (val) {
        return (val = this.password);
      },
      message: "Password & confirm Pasword does not match",
    },
  },
  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "light",
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
});

// ==========================================
// PRE-SAVE: Hash password and remove confirmPassword
// ==========================================
UserLoginSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;

  next();
});

// ==========================================
// PRE-SAVE: Handle Guest role
// ==========================================
UserLoginSchema.pre("save", function (next) {
  if (this.role === "Guest") {
    this.password = undefined;
  }
  next();
});

// ==========================================
// INSTANCE METHODS
// ==========================================

UserLoginSchema.methods.comparePasswordInDb = async function (pswd, pswdDB) {
  return await bcrypt.compare(pswd, pswdDB);
};

UserLoginSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pswdChangedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < pswdChangedTimestamp;
  }
  return false;
};

UserLoginSchema.methods.createResetTokenPassword = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes

  return resetToken;
};


// Find active users
UserLoginSchema.statics.findActive = function () {
  return this.find({ status: "Active" });
};


UserLoginSchema.index({ username: 1 });
UserLoginSchema.index({ role: 1 });
UserLoginSchema.index({ status: 1 });

module.exports = mongoose.model("UserLoginSchema", UserLoginSchema);