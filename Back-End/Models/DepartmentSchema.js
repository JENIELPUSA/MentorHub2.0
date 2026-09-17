const mongoose = require("mongoose");

const DepartmentSchema = new mongoose.Schema(
  {
    // ==========================================
    // DEPARTMENT NAME
    // ==========================================
    departmentName: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      unique: true,
    },

    // ==========================================
    // DEPARTMENT CODE
    // ==========================================
    departmentCode: {
      type: String,
      required: [true, "Department code is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },

    // ==========================================
    // DESCRIPTION
    // ==========================================
    description: {
      type: String,
      trim: true,
      default: "",
    }

  },
  {
    timestamps: true,
  }
);

// ==========================================
// AUTO-GENERATE DEPARTMENT CODE BEFORE SAVE
// ==========================================
DepartmentSchema.pre("save", async function(next) {
  // Only generate if departmentCode is not provided
  if (!this.departmentCode) {
    // Generate code from department name (e.g., "Human Resources" -> "HR")
    const words = this.departmentName.trim().split(/\s+/);
    let code = "";
    
    if (words.length === 1) {
      // Single word: take first 3 characters
      code = words[0].substring(0, 3).toUpperCase();
    } else if (words.length === 2) {
      // Two words: take first letter of each
      code = words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
    } else {
      // Three or more words: take first letter of first three words
      code = words.slice(0, 3).map(word => word.charAt(0).toUpperCase()).join("");
    }
    
    // Check for duplicate codes and add suffix if needed
    const Department = mongoose.model("Department");
    let finalCode = code;
    let counter = 1;
    
    while (true) {
      const existing = await Department.findOne({ departmentCode: finalCode });
      if (!existing) break;
      
      // If code exists, add numeric suffix
      finalCode = code + counter;
      counter++;
    }
    
    this.departmentCode = finalCode;
  }
  
  next();
});

module.exports = mongoose.model("Department", DepartmentSchema);