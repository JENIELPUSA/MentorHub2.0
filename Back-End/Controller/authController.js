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
const sendEmail = require("./../Utils/email");

const signToken = (id, role, linkId) => {
  return jwt.sign({ id, role, linkId }, process.env.SECRET_STR, {
    expiresIn: "12h",
  });
};

const SWITCHABLE_ROLES = ["panelist", "adviser"];

// ==========================================
// HELPER — normalize switchable roles array
// ==========================================
const normalizeSelectedRoles = (rawSelected, currentRole) => {
  const arr = Array.isArray(rawSelected)
    ? rawSelected
    : rawSelected
    ? [rawSelected]
    : [];

  const clean = [
    ...new Set(
      arr
        .map((r) => String(r).trim().toLowerCase())
        .filter((r) => SWITCHABLE_ROLES.includes(r))
    ),
  ];

  const role = String(currentRole || "").toLowerCase();
  if (SWITCHABLE_ROLES.includes(role) && !clean.includes(role)) {
    clean.push(role);
  }

  return clean;
};

// ==========================================
// SIGNUP — Create new user
// ==========================================
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
      confirmPassword,
      yearLevel,
      course,
      major,
      gender,
      birthDate,
      contactNumber,
      referralCode,
    } = req.body;

    // =========================================================
    // ✅ VALIDATE PASSWORDS (manual — before hitting the model)
    // =========================================================
    const defaultPassword = password || "default123";

    if (confirmPassword !== undefined && confirmPassword !== "") {
      if (confirmPassword !== defaultPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
      }
    }

    // =========================================================
    // ✅ NORMALIZE multiplerole (switchable roles)
    // =========================================================
    const rawSelected = Array.isArray(selectedrole)
      ? selectedrole
      : selectedrole
        ? [selectedrole]
        : [];

    const cleanSelected = [
      ...new Set(
        rawSelected
          .map((r) => String(r).trim().toLowerCase())
          .filter((r) => SWITCHABLE_ROLES.includes(r)),
      ),
    ];

    const currentRole = (role || "student").toLowerCase();

    // Only allow multiplerole for switchable roles
    let multiplerole = [];
    if (SWITCHABLE_ROLES.includes(currentRole)) {
      if (!cleanSelected.includes(currentRole)) {
        cleanSelected.push(currentRole);
      }
      multiplerole = cleanSelected;
    }

    // =========================================================
    // ✅ CREATE USER
    // =========================================================
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
      password: defaultPassword,
      confirmPassword: confirmPassword || defaultPassword,
      role: currentRole,
      multiplerole,

      departmentId: departmentId || null,
      groupId: groupId || null,
      yearLevel: yearLevel || null,
      course: course || null,
      major: major || null,
      address: address || null,
      gender: gender || null,
      birthDate: birthDate || null,
      contactNumber: contactNumber || null,

      isActive: true,
      isVerified: false,
      status: "Active",
      theme: "light",

      referralCode: null,
      referredBy: referralCode || null,
    });

    await newUser.save();

    // =========================================================
    // ✅ SEND EMAIL — PLAIN TEXT
    // =========================================================
    const text = `
Welcome, ${first_name || username}!

Your account has been created successfully.

🔐 Your Login Credentials:
Username: ${username}
Your Default Password is: ${defaultPassword}

⚠️ Please Change your preferred Password after logging in.

Your Referral Code: ${newUser.referralCode}
        `;

    try {
      await sendEmail({
        email: username,
        subject: "Your Account Credentials",
        text,
      });
    } catch (emailErr) {
      console.error("❌ Email sending failed:", emailErr);
    }

    const userResponse = newUser.toObject();
    delete userResponse.password;
    delete userResponse.confirmPassword;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetTokenExpires;
    delete userResponse.__v;

    return res.status(201).json({
      success: true,
      status: "Success",
      message: "Account created successfully. Credentials sent to your email.",
      data: {
        user: userResponse,
        role: currentRole,
        multiplerole: newUser.multiplerole,
        referralCode: newUser.referralCode,
      },
    });
  } catch (error) {
    console.error("❌ Signup failed:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field} error. Please use a different ${field}.`,
      });
    }

    if (error.name === "ValidationError") {
      const fields = Object.keys(error.errors);
      return res.status(400).json({
        success: false,
        message: error.message,
        fields,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

exports.updateUser = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new CustomError("User ID is required.", 400));
  }

  const user = await UserLogin.findById(id);

  if (!user) {
    return next(new CustomError("User not found.", 404));
  }

  // ─────────────────────────────────────────────
  // Pull incoming fields (multipart or JSON)
  // ─────────────────────────────────────────────
  const {
    first_name,
    middle_name,
    last_name,
    suffix,
    email,        // NOTE: email is immutable after creation
    role,
    departmentId,
    laboratoryId,
    statusAccount,
    status,
    password,
    confirmPassword,
    selectedrole,
  } = req.body;

  // ── Basic name fields ──
  if (first_name !== undefined) user.first_name = first_name;
  if (middle_name !== undefined) user.middle_name = middle_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (suffix !== undefined) user.suffix = suffix;

  // ── Email is immutable — reject kung magkaiba ──
  if (email !== undefined && email !== "" && email !== user.username) {
    // Optional: kung email ang ginagamit na username, huwag hayaang baguhin
    // Kung gusto mong payagan, alisin ang block na ito.
    return next(
      new CustomError(
        "Email/username cannot be changed once the account is created.",
        400
      )
    );
  }

  // ── Role + switchable roles ──
  const currentRole = (role || user.role || "student").toLowerCase();

  let multiplerole = Array.isArray(user.multiplerole) ? [...user.multiplerole] : [];

  if (role !== undefined) {
    if (SWITCHABLE_ROLES.includes(currentRole)) {
      const cleanSelected = normalizeSelectedRoles(selectedrole, currentRole);
      multiplerole = cleanSelected;
    } else {
      // Non-switchable role → clear multiplerole
      multiplerole = [];
    }
    user.role = currentRole;
  } else if (selectedrole !== undefined) {
    // Role unchanged pero may selectedrole update
    if (SWITCHABLE_ROLES.includes(user.role)) {
      multiplerole = normalizeSelectedRoles(selectedrole, user.role);
    }
  }

  user.multiplerole = multiplerole;

  // ── Department / lab ──
  if (departmentId !== undefined && departmentId !== "") {
    user.departmentId = departmentId;
  }
  if (laboratoryId !== undefined) {
    user.laboratoryId = laboratoryId;
  }

  // ── Status ──
  if (statusAccount !== undefined && statusAccount !== "") {
    user.statusAccount = statusAccount;
    // Sync isActive flag
    user.isActive = statusAccount === "approved";
  }
  if (status !== undefined && status !== "") {
    user.status = status;
  }

  // ── Avatar (file upload) ──
  if (req.file) {
    user.avatar = {
      url: req.file.path || req.file.secure_url || "",
      public_id: req.file.filename || req.file.public_id || "",
    };
  }

  // ── Optional password change ──
  if (password && password !== "") {
    if (password.length < 8) {
      return next(
        new CustomError("Password must be at least 8 characters long.", 400)
      );
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      return next(new CustomError("Passwords do not match.", 400));
    }
    user.password = password;
    user.confirmPassword = password;
    user.passwordChangedAt = Date.now();
  }

  user.updatedAt = Date.now();

  await user.save();

  // ─────────────────────────────────────────────
  // Strip sensitive fields before responding
  // ─────────────────────────────────────────────
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.confirmPassword;
  delete userResponse.passwordResetToken;
  delete userResponse.passwordResetTokenExpires;
  delete userResponse.__v;

  return res.status(200).json({
    success: true,
    status: "success",
    message: "User updated successfully.",
    data: userResponse,
  });
});

// ============ SWITCH ROLE ============
exports.switchRole = AsyncErrorHandler(async (req, res, next) => {
  try {
    const { userId: bodyUserId, targetRole } = req.body || {};
    const userId = bodyUserId || req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "userId is required (body or token).",
      });
    }

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: "targetRole is required.",
      });
    }

    const target = String(targetRole).toLowerCase().trim();
    if (!["adviser", "panelist"].includes(target)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target role. Allowed: adviser, panelist.",
      });
    }

    const user = await UserLogin.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === target) {
      return res.status(400).json({
        success: false,
        message: `You are already acting as "${target}".`,
      });
    }

    if (
      !Array.isArray(user.multiplerole) ||
      !user.multiplerole.includes(target)
    ) {
      return res.status(403).json({
        success: false,
        message: `You are not allowed to switch to "${target}".`,
        allowed: user.multiplerole || [],
      });
    }

    const previousRole = user.role;
    user.role = target;
    user.updatedAt = Date.now();
    await user.save();

    const linkId = user.linkedId || user._id;
    const token = signToken(user._id, user.role, linkId);

    if (req.session?.isLoggedIn && req.session?.user) {
      req.session.user.role = user.role;
      req.session.user._id = user._id;
    }

    return res.status(200).json({
      success: true,
      status: "Success",
      message: `Switched to "${user.role}".`,
      token,
      role: user.role,
      previousRole,
      multiplerole: user.multiplerole || [],
      userId: user._id,
      linkId,
    });
  } catch (err) {
    console.error("❌ switchRole error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: err.message,
        fields: Object.keys(err.errors || {}),
      });
    }
    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token error. Please log in again.",
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate entry error.",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error while switching roles.",
    });
  }
});

// ============ LOGIN ============
exports.login = AsyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await UserLogin.findOne({ username: email }).select(
    "+password +status",
  );

  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    return next(new CustomError("Incorrect email or password", 400));
  }

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

// ============ PROTECT ============
exports.protect = AsyncErrorHandler(async (req, res, next) => {
  if (req.session && req.session.isLoggedIn && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return next(new CustomError("You are not logged in!", 401));
  }

  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR,
  );

  const user = await UserLogin.findById(decoded.id);

  if (!user) {
    return next(new CustomError("User no longer exists", 401));
  }

  const isPasswordChanged = await user.isPasswordChanged(decoded.iat);

  if (isPasswordChanged) {
    return next(new CustomError("Password changed. Login again.", 401));
  }

  const linkId = user.linkedId || user._id;

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

// ============ LOGOUT ============
exports.logout = AsyncErrorHandler((req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send("Logout failed.");
    res.clearCookie("connect.sid");
    res.send("Logged out successfully!");
  });
});

// ============ VERIFY OTP ============
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

// ============ RESTRICT ============
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

// ============ FORGOT PASSWORD ============
exports.forgotPassword = AsyncErrorHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await UserLogin.findOne({ username: email });

  if (!user) {
    return next(
      new CustomError("We could  not find the user with given email", 404),
    );
  }

  const resetToken = user.createResetTokenPassword();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `We have received a password reset request. Please use the below link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 10 minutes.`;

  try {
    await sendEmail({
      email: user.username,
      subject: "Password change request received",
      text: message,
    });

    res.status(200).json({
      status: "Success",
      message: "Password reset link sent to the user email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new CustomError(
        "There was an error sending password reset email. Please try again later",
        500,
      ),
    );
  }
});

// ============ RESET PASSWORD ============
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

// ============ UPDATE PASSWORD (logged-in) ============
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

// ============ SELECT ACTIVE ROLE ============
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

  const userRoles = Array.isArray(user.role) ? user.role : [user.role];
  if (!userRoles.includes(activeRole)) {
    return res.status(400).json({
      success: false,
      message: `Role "${activeRole}" is not assigned to this user.`,
      availableRoles: userRoles,
    });
  }

  user.activeRole = activeRole;
  await user.save();

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