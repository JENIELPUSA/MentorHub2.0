const express = require("express");
const authController = require("../Controller/authController");
const router = express.Router();
const upload = require("../middleware/fileUploader");

// ============================================================
// AUTH ROUTES
// ============================================================
router.route("/signup").post(
    upload.single("avatar"),
    authController.signup,
);

router.route("/login").post(authController.login);

router.route("/forgotPassword").post(authController.forgotPassword);
router.route("/switch-role").post(authController.switchRole);
router.route("/resetPassword/:token").patch(authController.resetPassword);

router.route("/mail-verification").post(authController.verifyOtp);

router
    .route("/updatePassword")
    .patch(authController.protect, authController.updatePassword);

// UPDATE USER — PATCH /api/v1/authentication/User/:id
router.route("/User/:id").patch(
    authController.protect,
    upload.single("avatar"),
    authController.updateUser,
);


// UPLOAD / UPDATE AVATAR — PATCH /api/v1/authentication/avatar
router.route("/avatar").patch(
    authController.protect,
    upload.single("avatar"),
    authController.updateAvatar,
);

// REMOVE AVATAR — DELETE /api/v1/authentication/avatar
router.route("/avatar").delete(
    authController.protect,
    authController.removeAvatar,
);

module.exports = router;