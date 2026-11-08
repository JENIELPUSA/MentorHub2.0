const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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

  // ── confirmPassword: client-side only, optional, never stored ──
  confirmPassword: {
    type: String,
    required: false,
    select: false,
    validate: {
      validator: function (val) {
        // Only validate if a value was actually provided
        if (val === undefined || val === null || val === "") return true;
        return val === this.password;
      },
      message: "Password & confirm Password does not match",
    },
  },

  theme: {
    type: String,
    enum: ["light", "dark"],
    default: "light",
  },

  // ── ARRAY of switchable roles ──
  multiplerole: {
    type: [String],
    enum: ["panelist", "adviser"],
    default: [],
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
});
UserLoginSchema.pre("validate", function (next) {
  if (!Array.isArray(this.multiplerole)) {
    this.multiplerole = [];
  }

  if (
    (this.role === "adviser" || this.role === "panelist") &&
    !this.multiplerole.includes(this.role)
  ) {
    this.multiplerole.push(this.role);
  }

  this.multiplerole = [...new Set(this.multiplerole)];
  next();
});

UserLoginSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
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
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

UserLoginSchema.methods.switchRole = function (targetRole) {
  if (!targetRole) throw new Error("Target role is required.");
  const target = String(targetRole).toLowerCase();

  if (!this.multiplerole.includes(target)) {
    throw new Error(
      `You are not allowed to switch to "${target}". Allowed: ${this.multiplerole.join(", ") || "none"}`,
    );
  }
  if (this.role === target) {
    throw new Error(`You are already acting as "${target}".`);
  }
  this.role = target;
  return this.role;
};

UserLoginSchema.methods.availableSwitchRoles = function () {
  return this.multiplerole.filter((r) => r !== this.role);
};

// ==========================================
// STATICS
// ==========================================
UserLoginSchema.statics.findActive = function () {
  return this.find({ status: "Active" });
};

// ==========================================
// INDEXES
// ==========================================
UserLoginSchema.index({ username: 1 });
UserLoginSchema.index({ role: 1 });
UserLoginSchema.index({ status: 1 });
UserLoginSchema.index({ multiplerole: 1 });

module.exports = mongoose.model("UserLoginSchema", UserLoginSchema);