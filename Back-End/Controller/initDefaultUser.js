const Login = require("../Models/LogInSchema");
const mongoose = require('mongoose');

const initDefaultUser = async () => {
  try {
    // Check if Login model is properly loaded
    if (!Login) {
      console.error("❌ Login model is not defined!");
      return;
    }

    // Check if countDocuments function exists
    if (typeof Login.countDocuments !== 'function') {
      console.error("❌ Login.countDocuments is not a function. Model may not be properly initialized.");
      console.log("Login object:", Login);
      return;
    }

    const userCount = await Login.countDocuments();
    console.log(`📊 Current user count: ${userCount}`);

    if (userCount === 0) {
      console.log("🛠 Creating default admin account...");

      // Validate required environment variables
      if (!process.env.DEFAULT_ADMIN_EMAIL || !process.env.DEFAULT_ADMIN_PASSWORD) {
        console.error("❌ Missing required environment variables for default admin!");
        console.log("Required: DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD");
        return;
      }

      // =========================================================
      // CREATE DEFAULT ADMIN USER
      // =========================================================
      const defaultAdmin = new Login({
        username: process.env.DEFAULT_ADMIN_EMAIL,
        email: process.env.DEFAULT_ADMIN_EMAIL,
        password: process.env.DEFAULT_ADMIN_PASSWORD,
        confirmPassword: process.env.DEFAULT_ADMIN_PASSWORD,
        selectedrole: ["admin"],  // Array of roles
        role: "admin",            // Active role (string)
        linkedId: null,           // No linked profile yet
        theme: process.env.DEFAULT_ADMIN_THEME || "light",
        statusAccount: "approved",
        isVerified: true,
        isActive: true,
      });

      const savedAdmin = await defaultAdmin.save();
      console.log("✅ Default admin account created with ID:", savedAdmin._id);

      // Update linkedId to self (optional)
      savedAdmin.linkedId = savedAdmin._id;
      await savedAdmin.save();
      console.log("✅ linkedId updated to self:", savedAdmin._id);

      // =========================================================
      // RETURN ADMIN INFO (for logging)
      // =========================================================
      const adminResponse = savedAdmin.toObject();
      delete adminResponse.password;
      delete adminResponse.confirmPassword;
      delete adminResponse.passwordResetToken;
      delete adminResponse.passwordResetTokenExpires;
      delete adminResponse.__v;

      console.log("✅ Default admin account created successfully!");
      console.log("📧 Admin Email:", process.env.DEFAULT_ADMIN_EMAIL);
      console.log("🔑 Admin Password:", process.env.DEFAULT_ADMIN_PASSWORD);
      console.log("🎯 Admin Role:", "admin");
      console.log("🆔 Admin ID:", savedAdmin._id);

      return adminResponse;

    } else {
      console.log("🔍 Admin account already exists.");
      const existingAdmin = await Login.findOne({ role: "admin" });
      if (existingAdmin) {
        console.log("📧 Existing Admin Email:", existingAdmin.email);
        console.log("🎯 Existing Admin Role:", existingAdmin.role);
        console.log("📋 Existing Admin Roles:", existingAdmin.selectedrole);
        console.log("🆔 Admin ID:", existingAdmin._id);
      }
    }
  } catch (error) {
    console.error("❌ Error in initDefaultUser:", error.message);
    console.error("Stack trace:", error.stack);
  }
};

module.exports = initDefaultUser;