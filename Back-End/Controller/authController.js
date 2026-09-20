const UserLogin = require("../Models/LogInSchema");
const User = require("../Models/UserSchema");
const Student = require("../Models/Student");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const axios = require("axios");
const CustomError = require("../Utils/CustomError");
const jwt = require("jsonwebtoken");
const util = require("util");
const fs = require("fs");
const FormData = require("form-data");
const crypto = require("crypto");

const signToken = (id, role, linkId) => {
  return jwt.sign({ id, role, linkId }, process.env.SECRET_STR, {
    expiresIn: "12h",
  });
};

exports.signup = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            middle_name,
            suffix,
            username,
            role,
            selectedrole,
            departmentId,
            groupId,
            address,
            password,
            yearLevel,
            course,
            major,
            gender,
            birthDate,
            contactNumber,
            referralCode, // Optional: kung may nag-refer
        } = req.body;

        const userRoles = Array.isArray(selectedrole) && selectedrole.length > 0 
            ? selectedrole 
            : [role || "student"];

        const newUser = new UserLogin({
            avatar: {
                url: "",
                public_id: "",
            },
            first_name: first_name || "",
            last_name: last_name || "",
            middle_name: middle_name || "",
            suffix: suffix || "",
            username: username || "",
            password: password || "default123",
            role: role || "student",
            
            // Student fields
            departmentId: departmentId || null,
            groupId: groupId || null,
            yearLevel: yearLevel || null,
            course: course || null,
            major: major || null,
            address: address || null,
            gender: gender || null,
            birthDate: birthDate || null,
            contactNumber: contactNumber || null,
            
            // Status
            isActive: true,
            isVerified: false,
            status: "Active",
            theme: "light",
            
            // Referral fields
            referralCode: null, // Auto-generate sa pre-save
            referredBy: referralCode || null, // Kung may nag-refer
        });

        await newUser.save();

        // =========================================================
        // 3. REMOVE SENSITIVE DATA BAGO MAG-RESPOND
        // =========================================================
        const userResponse = newUser.toObject();
        delete userResponse.password;
        delete userResponse.confirmPassword;
        delete userResponse.passwordResetToken;
        delete userResponse.passwordResetTokenExpires;
        delete userResponse.__v;

        return res.status(201).json({
            success: true,
            status: "Success",
            message: "Account created successfully.",
            data: {
                user: userResponse,
                role: role || "student",
                selectedrole: userRoles,
                referralCode: newUser.referralCode, // Ipakita ang auto-generated referral code
            },
        });

    } catch (error) {
        console.error("❌ Signup failed:", error);

        // ✅ I-check kung may duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Duplicate ${field} error. Please use a different ${field}.`,
            });
        }

        return res.status(500).json({
            success: false,
            message: error.message || "Internal Server Error",
        });
    }
};

// ============ LOGIN FUNCTION ============
exports.login = AsyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Include 'status' field (if not selected by default, add '+status')
  const user = await UserLogin.findOne({ username: email }).select(
    "+password +status",
  );

  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    return next(new CustomError("Incorrect email or password", 400));
  }

  // 🔒 New check: Do not allow login if status is 'In-Active'
  if (user.status === "In-Active") {
    return next(
      new CustomError("Account is inactive. Please contact support.", 403),
    );
  }

  let linkId = user.linkedId || user._id;

  if (req.session.userId && req.session.userId !== user._id) {
    req.session.destroy((err) => {
      if (err) console.log("Failed to destroy old session:", err);
    });
  }

  const token = signToken(user._id, user.role, linkId);

  req.session.isLoggedIn = true;
  req.session.user = {
    _id: user._id,
    email: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    linkId,
    theme: user.theme,
    referredBy: user.referredBy || null,
    contact_number: user.contact_number || null,
    Designatedzone: user.Designatedzone || null,
  };

  return res.status(200).json({
    status: "Success",
    linkId,
    role: user.role,
    token,
    email: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
    theme: user.theme,
    referredBy: user.referredBy || null,
    userId: user._id,
    contact_number: user.contact_number || null,
    Designatedzone: user.Designatedzone || null,
  });
});

// ============ PROTECT MIDDLEWARE ============
exports.protect = AsyncErrorHandler(async (req, res, next) => {
  // Check if user is logged in via session
  if (req.session && req.session.isLoggedIn && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Check for Bearer token in Authorization header
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return next(new CustomError("You are not logged in!", 401));
  }

  // Verify JWT token
  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR,
  );

  // Find user by ID from token
  const user = await UserLogin.findById(decoded.id);

  if (!user) {
    return next(new CustomError("User no longer exists", 401));
  }

  // Check if password was changed after token was issued
  const isPasswordChanged = await user.isPasswordChanged(decoded.iat);

  if (isPasswordChanged) {
    return next(new CustomError("Password changed. Login again.", 401));
  }

  const linkId = user.linkedId || user._id;

  // Attach user to request object
  req.user = {
    _id: user._id,
    username: user.username,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    linkId,
    referredBy: user.referredBy || null,
    contact_number: user.contact_number || null,
    Designatedzone: user.Designatedzone || null,
    theme: user.theme || "light",
  };

  next();
});

exports.logout = AsyncErrorHandler((req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed.");
    res.clearCookie("connect.sid");
    res.send("Logged out successfully!");
  });
});

exports.logout = AsyncErrorHandler((req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed.");
    res.clearCookie("connect.sid");
    res.send("Logged out successfully!");
  });
});

exports.verifyOtp = AsyncErrorHandler(async (req, res) => {
  const { otp, userId } = req.body;

  if (!otp || !userId) {
    return res.status(400).json({
      message: "Both OTP and userId are required.",
    });
  }

  const user = await UserLogin.findById(userId);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "User is already verified" });
  }

  if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;

  await user.save();

  return res.status(200).json({
    message: "username Verified Successfully",
    data: {
      _id: user._id,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});


exports.restrict = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Allowed roles: ${roles.join(", ")}`,
      });
    }
    next();
  };
};

exports.forgotPassword = AsyncErrorHandler(async (req, res, next) => {
  const { username } = req.body;

  const user = await UserLogin.findOne({ username: username });

  if (!user) {
    return next(
      new CustomError("We could not find the user with given username", 404),
    );
  }

  const resetToken = user.createResetTokenPassword();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `We have received a password reset request. Please use the below link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.`;
});

exports.resetPassword = AsyncErrorHandler(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await UserLogin.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new CustomError("Invalid or expired token.", 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  user.passwordChangedAt = Date.now();

  await user.save();

  return res.status(200).json({
    status: "Success",
  });
});

exports.updatePassword = AsyncErrorHandler(async (req, res, next) => {
  const user = await UserLogin.findById(req.user._id).select("+password");

  if (!user) {
    return next(new CustomError("User not found.", 404));
  }

  const isMatch = await user.comparePasswordInDb(
    req.body.currentPassword,
    user.password,
  );

  if (!isMatch) {
    return next(
      new CustomError("The current password you provided is wrong", 401),
    );
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;

  await user.save();

  const token = signToken(user._id, user.role, user.linkedId);

  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

exports.selectActiveRole = AsyncErrorHandler(async (req, res, next) => {
  const { activeRole } = req.body;
  const userId = req.user._id;

  if (!activeRole) {
    return res.status(400).json({
      success: false,
      message: "Active role is required.",
    });
  }

  const user = await UserLogin.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Check if role is valid for this user
  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  if (!userRoles.includes(activeRole)) {
    return res.status(400).json({
      success: false,
      message: `Role "${activeRole}" is not assigned to this user.`,
      availableRoles: userRoles,
    });
  }

  // Update active role
  user.activeRole = activeRole;
  await user.save();

  // Update session
  if (req.session) {
    req.session.user.activeRole = activeRole;
    req.session.user.requiresRoleSelection = false;
  }

  return res.status(200).json({
    success: true,
    status: "Success",
    message: `Active role set to "${activeRole}"`,
    activeRole: activeRole,
    roles: userRoles,
  });
});
