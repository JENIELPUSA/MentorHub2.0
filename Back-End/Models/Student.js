const mongoose = require("mongoose");

const YEAR_LEVEL = ["1st", "2nd", "3rd", "4th", "5th"];

const StudentSchema = new mongoose.Schema(
    {
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
            enum: ["male", "female"],
            default: null,
        },
        birthDate: {
            type: Date,
            default: null,
        },
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
        address: {
            type: String,
            trim: true,
            default: null,
        },
        departmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: [true, "Department ID is required"],
        },
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            default: null,
        },
        yearLevel: {
            type: String,
            enum: YEAR_LEVEL,
            default: "1st",
        },
        course: {
            type: String,
            trim: true,
        },
        major: {
            type: String,
            trim: true,
            default: null,
        },
        // =========================================================
        // REFERRAL SYSTEM - WALANG MIDDLEWARE
        // =========================================================
        referralCode: {
            type: String,
            trim: true,
            uppercase: true,
            default: null,
        },
        referredBy: {
            type: String,
            trim: true,
            uppercase: true,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// TANGGAL NA ANG PRE-SAVE MIDDLEWARE PARA SA REFERRAL CODE

// Full name without suffix
StudentSchema.virtual("fullName").get(function () {
    const nameParts = [this.first_name, this.middle_name, this.last_name]
        .filter(Boolean);
    return nameParts.join(" ");
});

// Full name with suffix
StudentSchema.virtual("fullNameWithSuffix").get(function () {
    const name = this.fullName;
    return this.suffix ? `${name} ${this.suffix}` : name;
});

// Get department details (populated)
StudentSchema.virtual("departmentDetails", {
    ref: "Department",
    localField: "departmentId",
    foreignField: "_id",
    justOne: true,
});

// Get group details (populated)
StudentSchema.virtual("groupDetails", {
    ref: "Group",
    localField: "groupId",
    foreignField: "_id",
    justOne: true,
});

// Get user details (populated)
StudentSchema.virtual("userDetails", {
    ref: "User",
    localField: "userId",
    foreignField: "_id",
    justOne: true,
});

// Get age
StudentSchema.virtual("age").get(function () {
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

// Assign to group
StudentSchema.methods.assignGroup = function (groupId) {
    this.groupId = groupId;
    return this.save();
};

// Remove from group
StudentSchema.methods.removeFromGroup = function () {
    this.groupId = null;
    return this.save();
};

// Find students by department
StudentSchema.statics.findByDepartment = function (departmentId) {
    return this.find({ departmentId: departmentId });
};

// Find students by group
StudentSchema.statics.findByGroup = function (groupId) {
    return this.find({ groupId: groupId });
};

// Find students by year level
StudentSchema.statics.findByYearLevel = function (yearLevel) {
    return this.find({ yearLevel: yearLevel });
};

// Find student by referral code
StudentSchema.statics.findByReferralCode = function (referralCode) {
    return this.findOne({ referralCode: referralCode.toUpperCase().trim() });
};

// Find students referred by a specific referral code
StudentSchema.statics.findByReferredBy = function (referredBy) {
    return this.find({ referredBy: referredBy.toUpperCase().trim() });
};

// Search students by name
StudentSchema.statics.search = function (query) {
    return this.find({
        $or: [
            { first_name: { $regex: query, $options: "i" } },
            { last_name: { $regex: query, $options: "i" } },
        ]
    });
};

// Indexes
StudentSchema.index({ departmentId: 1 });
StudentSchema.index({ groupId: 1 });
StudentSchema.index({ yearLevel: 1 });
StudentSchema.index({ first_name: 1, last_name: 1 });
StudentSchema.index({ referralCode: 1 });
StudentSchema.index({ referredBy: 1 });
StudentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Student", StudentSchema);