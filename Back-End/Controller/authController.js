const UserLogin = require("../Models/LogInSchema");
const User = require("../Models/UserSchema");
const Student = require("../Models/Student");
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const axios = require("axios");
const CustomError = require("../Utils/CustomError");
const jwt = require("jsonwebtoken");
const util = require("util");
const fs = require("fs");
const path = require("path");
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
//  AVATAR STORAGE HELPERS (LOCAL)
// ==========================================
const AVATAR_UPLOAD_DIR = path.join(process.cwd(), "uploads", "avatars");

if (!fs.existsSync(AVATAR_UPLOAD_DIR)) {
  fs.mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

// Allowed image types
const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

//  Save buffer to local disk
const saveAvatarToDisk = (buffer, userId, originalname) => {
  const ext = path.extname(originalname).toLowerCase() || ".png";
  const filename = `user_${userId}_${Date.now()}${ext}`;
  const filepath = path.join(AVATAR_UPLOAD_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  return {
    filename,
    filepath,
    url: `/uploads/avatars/${filename}`,
  };
};

//  Delete old avatar from disk
const deleteAvatarFromDisk = (avatarUrl) => {
  try {
    if (!avatarUrl || !avatarUrl.startsWith("/uploads/avatars/")) {
      return;
    }
    const filename = path.basename(avatarUrl);
    const filepath = path.join(AVATAR_UPLOAD_DIR, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (err) {
    console.warn("⚠️ Failed to delete old avatar:", err.message);
  }
};

//  Validate avatar file
const validateAvatarFile = (file) => {
  if (!file) {
    return { valid: false, message: "No image file provided." };
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      message: "Invalid file type. Only JPG, PNG, WEBP, GIF allowed.",
    };
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return {
      valid: false,
      message: "File too large. Maximum size is 5MB.",
    };
  }
  return { valid: true };
};

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

const cloudinary = require("cloudinary").v2;

// ============================================================
// ⭐ CLOUDINARY CONFIG
// ============================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ============================================================
// ⭐ HELPER — Upload buffer to Cloudinary
// ============================================================
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "mentorhub/avatars",
        resource_type: "image",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto:good" },
          { fetch_format: "auto" },
        ],
        timeout: 120000,
        ...options,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ============================================================
// ⭐ HELPER — Delete from Cloudinary
// ============================================================
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    console.log("🗑️ Deleting old avatar from Cloudinary:", publicId);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
    console.log("✅ Deleted:", result);
  } catch (err) {
    console.warn("⚠️ Failed to delete from Cloudinary:", err.message);
  }
};

exports.updateAvatar = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user?._id || req.user?.id;

  console.log("weee", req.body)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. User ID not found.",
    });
  }

  // ⭐ Validate file
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided.",
    });
  }

  console.log("📸 Uploading new avatar to Cloudinary...");
  console.log("📁 File:", {
    originalname: req.file.originalname,
    size: `${(req.file.size / 1024).toFixed(2)} KB`,
    mimetype: req.file.mimetype,
    buffer: `Buffer(${req.file.buffer?.length || 0} bytes)`,
  });

  // ⭐ Validate type
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Invalid file type. Only JPG, PNG, WEBP, GIF allowed.",
    });
  }

  // ⭐ Validate size (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (req.file.size > MAX_SIZE) {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB.",
    });
  }

  // ⭐ Get existing user
  const user = await UserLogin.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  let avatar = user.avatar || { url: "", public_id: "" };

  try {

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: "mentorhub/avatars",
      public_id: `user_${userId}_${Date.now()}`,
      overwrite: true,
      invalidate: true,
    });

    console.log("📤 Cloudinary Upload Response:", {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
    });

    if (!uploadResult?.secure_url) {
      throw new Error("Cloudinary upload failed — no secure_url returned.");
    }

    // ============================================
    // ⭐ DELETE OLD IMAGE FROM CLOUDINARY
    // ============================================
    if (
      user.avatar?.public_id &&
      user.avatar?.url &&
      user.avatar.public_id !== uploadResult.public_id
    ) {
      console.log("🗑️ Deleting old avatar...");
      console.log("📁 Old Public ID:", user.avatar.public_id);
      console.log("🔗 Old URL:", user.avatar.url);

      await deleteFromCloudinary(user.avatar.public_id);
    }

    // ============================================
    // ⭐ UPDATE AVATAR OBJECT
    // ============================================
    avatar = {
      url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
    };

    console.log("✅ New avatar uploaded successfully:", avatar);
  } catch (err) {
    console.error("❌ Upload Error:", err.message);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to upload avatar.",
    });
  }

  // ============================================
  // ⭐ UPDATE USER DOCUMENT
  // ============================================
  user.avatar = avatar;
  user.updatedAt = Date.now();
  await user.save();

  console.log("📝 User avatar updated in DB:", user.avatar);

  return res.status(200).json({
    success: true,
    status: "Success",
    message: "Avatar updated successfully.",
    data: {
      avatar: user.avatar,
    },
  });
});

// ============================================================
// ⭐ REMOVE AVATAR — SAME STYLE
// ============================================================
exports.removeAvatar = AsyncErrorHandler(async (req, res, next) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. User ID not found.",
    });
  }

  const user = await UserLogin.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  try {
    // ⭐ Delete old image from Cloudinary
    if (user.avatar?.public_id) {
      console.log("🗑️ Deleting avatar from Cloudinary...");
      console.log("📁 Public ID:", user.avatar.public_id);

      await deleteFromCloudinary(user.avatar.public_id);
    }

    // ⭐ Reset avatar
    user.avatar = { url: "", public_id: "" };
    user.updatedAt = Date.now();
    await user.save();

    console.log("✅ Avatar removed successfully");

    return res.status(200).json({
      success: true,
      status: "Success",
      message: "Avatar removed successfully.",
      data: { avatar: user.avatar },
    });
  } catch (err) {
    console.error("❌ Avatar removal error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to remove avatar.",
    });
  }
});

exports.signup = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      middle_name,
      suffix,
      email,
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

    const defaultPassword = password || "default123";

    console.log("Req.body", req.body);

    // ✅ Validate email — ito ang magiging username at recipient
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "A valid email address is required.",
      });
    }

    // ✅ Ito ang value na ise-save sa `username` field
    const usernameValue = String(email).trim().toLowerCase();

    if (confirmPassword !== undefined && confirmPassword !== "") {
      if (confirmPassword !== defaultPassword) {
        return res.status(400).json({
          success: false,
          message: "Passwords do not match.",
        });
      }
    }

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

    let multiplerole = [];
    if (SWITCHABLE_ROLES.includes(currentRole)) {
      if (!cleanSelected.includes(currentRole)) {
        cleanSelected.push(currentRole);
      }
      multiplerole = cleanSelected;
    }

    // ⭐ Default avatar
    let avatarData = { url: "", public_id: "" };

    if (req.file) {
      const validation = validateAvatarFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }

      try {
        const saved = saveAvatarToDisk(
          req.file.buffer,
          usernameValue || "new",   // ✅ gamitin ang email-based username
          req.file.originalname,
        );
        avatarData = {
          url: saved.url,
          public_id: saved.filename,
        };
      } catch (err) {
        console.error("⚠️ Avatar save failed:", err.message);
      }
    }

    // ⭐ CREATE USER — username = email address
    //    ⚠️ IMPORTANT: `actualpassword` is set here EXPLICITLY
    //    before validation runs, so `required: true` in schema won't fail.
    //    The pre("save") hook will also copy it (plaintext) before hashing.
    const newUser = new UserLogin({
      avatar: avatarData,
      first_name: first_name || "",
      last_name: last_name || "",
      middle_name: middle_name || "",
      suffix: suffix || "",
      username: usernameValue,     // ✅ "xxxx@gmail.com"

      // ── Password fields ──
      password: defaultPassword,          // 🔑 plaintext for now — hook will hash it
      actualpassword: defaultPassword,    // 🔑 plaintext copy for admin view
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

    // ============================================================
    // ⭐ FIRE-AND-FORGET EMAIL
    // ============================================================
    const emailText = `
Welcome, ${first_name || usernameValue}!

Your account has been created successfully.

🔐 Your Login Credentials:
Username: ${usernameValue}
Your Default Password is: ${defaultPassword}

⚠️ Please Change your preferred Password after logging in.`;

    setImmediate(() => {
      sendEmail({
        email: usernameValue,   // ✅ "xxxx@gmail.com" — same value, recipient
        subject: "Your Account Credentials",
        text: emailText,
      }).catch((emailErr) => {
        console.error("❌ Email sending failed (background):", emailErr);
      });
    });

    // ⭐ RESPONSE AGAD — sanitize bago i-return
    const userResponse = newUser.toObject();

    // 🔒 Never leak these in API responses
    delete userResponse.password;
    delete userResponse.actualpassword;       // ⬅️ added
    delete userResponse.confirmPassword;
    delete userResponse.passwordResetToken;
    delete userResponse.passwordResetTokenExpires;
    delete userResponse.__v;

    return res.status(201).json({
      success: true,
      status: "Success",
      message:
        "Account created successfully. Credentials will be sent to your email shortly.",
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
      const field = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message:
          field === "username"
            ? "This email is already registered. Please use a different email."
            : `This ${field} is already taken. Please choose another.`,
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

// ==========================================
// UPDATE USER — admin update
// ==========================================
exports.updateUser = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new CustomError("User ID is required.", 400));
  }

  const user = await UserLogin.findById(id);

  if (!user) {
    return next(new CustomError("User not found.", 404));
  }

  const {
    first_name,
    middle_name,
    last_name,
    suffix,
    email,
    role,
    departmentId,
    laboratoryId,
    statusAccount,
    status,
    password,
    confirmPassword,
    selectedrole,
  } = req.body;

  if (first_name !== undefined) user.first_name = first_name;
  if (middle_name !== undefined) user.middle_name = middle_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (suffix !== undefined) user.suffix = suffix;

  if (email !== undefined && email !== "" && email !== user.username) {
    return next(
      new CustomError(
        "Email/username cannot be changed once the account is created.",
        400
      )
    );
  }

  const currentRole = (role || user.role || "student").toLowerCase();

  let multiplerole = Array.isArray(user.multiplerole) ? [...user.multiplerole] : [];

  if (role !== undefined) {
    if (SWITCHABLE_ROLES.includes(currentRole)) {
      const cleanSelected = normalizeSelectedRoles(selectedrole, currentRole);
      multiplerole = cleanSelected;
    } else {
      multiplerole = [];
    }
    user.role = currentRole;
  } else if (selectedrole !== undefined) {
    if (SWITCHABLE_ROLES.includes(user.role)) {
      multiplerole = normalizeSelectedRoles(selectedrole, user.role);
    }
  }

  user.multiplerole = multiplerole;

  if (departmentId !== undefined && departmentId !== "") {
    user.departmentId = departmentId;
  }
  if (laboratoryId !== undefined) {
    user.laboratoryId = laboratoryId;
  }

  if (statusAccount !== undefined && statusAccount !== "") {
    user.statusAccount = statusAccount;
    user.isActive = statusAccount === "approved";
  }
  if (status !== undefined && status !== "") {
    user.status = status;
  }

  //  Avatar (file upload) — LOCAL STORAGE
  if (req.file) {
    const validation = validateAvatarFile(req.file);
    if (!validation.valid) {
      return next(new CustomError(validation.message, 400));
    }

    if (user.avatar?.url) {
      deleteAvatarFromDisk(user.avatar.url);
    }

    const saved = saveAvatarToDisk(req.file.buffer, id, req.file.originalname);

    user.avatar = {
      url: saved.url,
      public_id: saved.filename,
    };
  }

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
    "+password +status"
  );

  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    return next(new CustomError("Incorrect email or password", 400));
  }

  if (user.status === "In-Active") {
    return next(
      new CustomError("Account is inactive. Please contact support.", 403)
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
    avatar: user.avatar || { url: "", public_id: "" },
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
    avatar: user.avatar || { url: "", public_id: "" },
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
    process.env.SECRET_STR
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
    avatar: user.avatar || { url: "", public_id: "" },
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
      new CustomError("We could  not find the user with given email", 404)
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
        500
      )
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

exports.updatePassword = AsyncErrorHandler(async (req, res, next) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;

    // 🔍 DEBUG — ipapakita sa server terminal at sa response
    const debugInfo = {
      hasCurrentPassword: !!currentPassword,
      hasPassword: !!password,
      hasConfirmPassword: !!confirmPassword,
      passwordLength: password?.length,
      currentPasswordLength: currentPassword?.length,
      confirmPasswordLength: confirmPassword?.length,
      currentEqualsNew: currentPassword === password,
      newEqualsConfirm: password === confirmPassword,
      userId: req.user?._id,
    };
    console.log("📥 updatePassword DEBUG:", debugInfo);

    // ── 1) Validate inputs ──
    if (!currentPassword) {
      console.log("❌ FAILED: !currentPassword");
      return res.status(400).json({
        status: "fail",
        message: "❌ FAILED: currentPassword is empty",
        debug: debugInfo,
      });
    }
    if (!password) {
      console.log("❌ FAILED: !password");
      return res.status(400).json({
        status: "fail",
        message: "❌ FAILED: password is empty",
        debug: debugInfo,
      });
    }
    if (password.length < 8) {
      console.log(`❌ FAILED: password.length < 8 (${password.length})`);
      return res.status(400).json({
        status: "fail",
        message: `❌ FAILED: password too short (${password.length} < 8)`,
        debug: debugInfo,
      });
    }
    if (confirmPassword !== undefined && confirmPassword !== password) {
      console.log("❌ FAILED: confirmPassword !== password");
      return res.status(400).json({
        status: "fail",
        message: "❌ FAILED: confirmPassword !== password",
        debug: debugInfo,
      });
    }
    if (currentPassword === password) {
      console.log("❌ FAILED: currentPassword === password");
      return res.status(400).json({
        status: "fail",
        message: "❌ FAILED: currentPassword === password (new must be different)",
        debug: debugInfo,
      });
    }

    console.log("✅ All validations passed");

    // ── 2) Get user ──
    const user = await UserLogin.findById(req.user._id).select("+password");
    if (!user) {
      console.log("❌ FAILED: user not found");
      return res.status(404).json({
        status: "fail",
        message: "❌ FAILED: user not found",
        debug: debugInfo,
      });
    }

    // ── 3) Verify current password ──
    const isMatch = await user.comparePasswordInDb(
      currentPassword,
      user.password
    );
    if (!isMatch) {
      console.log("❌ FAILED: current password incorrect");
      return res.status(401).json({
        status: "fail",
        message: "❌ FAILED: current password is incorrect",
        debug: debugInfo,
      });
    }

    console.log("✅ Current password verified");

    // ── 4) Set new password ──
    user.password = password;
    user.actualpassword = password;   // explicit backup
    user.confirmPassword = confirmPassword || password;
    user.passwordChangedAt = Date.now();

    // ── 5) Save ──
    await user.save();
    console.log("✅ Password saved");

    // ── 6) Token ──
    const token = signToken(user._id, user.role, user.linkedId);

    // ── 7) Response ──
    return res.status(200).json({
      status: "success",
      message: "Password updated successfully.",
      token,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          middle_name: user.middle_name,
          suffix: user.suffix,
          role: user.role,
          multiplerole: user.multiplerole || [],
          avatar: user.avatar || { url: "", public_id: "" },
          theme: user.theme || "light",
        },
      },
    });
  } catch (error) {
    console.error("❌ updatePassword CATCH error:", error);
    return res.status(500).json({
      status: "error",
      message: error.message || "Internal server error",
    });
  }
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