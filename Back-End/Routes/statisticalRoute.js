const express = require("express");
const router = express.Router();
const statisticalController = require("../Controller/StatisticalController");
const authController = require("../Controller/authController");
// ==========================================
// SUBJECT ROUTES
// ==========================================

// GET all subjects (with pagination + search) & CREATE subject
router.route("/")
    .get(authController.protect, statisticalController.getDashboardStatistics)

// GET all subjects (with pagination + search) & CREATE subject
router.route("/subject_instructor")
    .get(authController.protect, statisticalController.getAdviserStatistics)


// GET all subjects (with pagination + search) & CREATE subject
router.route("/Admin_Statistical")
    .get(authController.protect, statisticalController.getAdminStatistics)



module.exports = router;