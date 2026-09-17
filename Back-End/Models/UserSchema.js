const mongoose = require("mongoose");

// ==========================================
// CONSTANTS
// ==========================================
const GENDER = ["male", "female"];

// ==========================================
// SCHEMA DEFINITION
// ==========================================
const UserSchema = new mongoose.Schema(
    {
        // ==========================================
        // PERSONAL INFORMATION
        // ==========================================
        avatar: {
            url: {
                type: String,
                trim: true,
                default: null,
            },
            public_id: {
                type: String,
                trim: true,
                default: null,
            },
        },
        first_name: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
        },
        last_name: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
        },
        middle_name: {
            type: String,
            trim: true,
            default: null,
        },
        suffix: {
            type: String,
            trim: true,
            enum: ["Jr.", "Sr.", "II", "III", "IV", "V", null],
            default: null,
        },
        gender: {
            type: String,
            enum: GENDER,
            default: null,
        },
        birthDate: {
            type: Date,
            default: null,
        },

        // ==========================================
        // CONTACT INFORMATION
        // ==========================================
        contactNumber: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || /^(\+63|0)?[0-9]{10,11}$/.test(v);
                },
                message: "Please provide a valid Philippine contact number",
            },
            default: null,
        },
        referralCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: null,
        },

        // ==========================================
        // EMPLOYMENT INFORMATION
        // ==========================================
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        // ==========================================
        // STATUS
        // ==========================================
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ==========================================
// AUTO-GENERATE REFERRAL CODE
// ==========================================
UserSchema.pre("save", function (next) {
    if (!this.referralCode) {
        const prefix = "REF";
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        this.referralCode = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

// ==========================================
// VIRTUAL PROPERTIES
// ==========================================

// Full name without suffix
UserSchema.virtual("fullName").get(function () {
    const nameParts = [this.first_name, this.middle_name, this.last_name]
        .filter(Boolean);
    return nameParts.join(" ");
});

// Full name with suffix
UserSchema.virtual("fullNameWithSuffix").get(function () {
    const name = this.fullName;
    return this.suffix ? `${name} ${this.suffix}` : name;
});

// Formatted contact number
UserSchema.virtual("formattedContactNumber").get(function () {
    if (!this.contactNumber) return null;
    const cleaned = this.contactNumber.replace(/\D/g, "");
    if (cleaned.startsWith("63")) {
        return `+${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5, 9)}-${cleaned.slice(9)}`;
    }
    return `0${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
});

// Age based on birthDate
UserSchema.virtual("age").get(function () {
    if (!this.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

// ==========================================
// STATIC METHODS
// ==========================================

// Find active users
UserSchema.statics.findActive = function () {
    return this.find({ isActive: true });
};

// Find by department
UserSchema.statics.findByDepartment = function (departmentId) {
    return this.find({
        departmentId: departmentId,
        isActive: true
    });
};

// Find user by referral code
UserSchema.statics.findByReferralCode = function (referralCode) {
    return this.findOne({ referralCode: referralCode.toUpperCase().trim() });
};

// Find users referred by a specific referral code
UserSchema.statics.findByReferredBy = function (referredBy) {
    return this.find({ referredBy: referredBy.toUpperCase().trim() });
};

// ==========================================
// QUERY HELPERS
// ==========================================

// Only active records
UserSchema.query.active = function () {
    return this.where({ isActive: true });
};

// ==========================================
// INDEXES FOR PERFORMANCE
// ==========================================
UserSchema.index({ first_name: 1, last_name: 1 });
UserSchema.index({ departmentId: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ contactNumber: 1 });
UserSchema.index({ referralCode: 1 });
UserSchema.index({ referredBy: 1 });

// ==========================================
// EXPORT
// ==========================================
module.exports = mongoose.model("User", UserSchema);