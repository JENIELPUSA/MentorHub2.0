const express = require("express");
const router = express.Router();
const scheduleController = require("../Controller/scheduleController");
const authController = require("../Controller/authController");

// ============================================================
// SPECIAL ROUTES (must come BEFORE /:id)
// ============================================================

// Conflict preview
router.post(
    "/check-conflict",
    authController.protect,
    scheduleController.checkConflict
);

// Upcoming defenses
router.get(
    "/upcoming",
    authController.protect,
    scheduleController.getUpcomingDefenses
);

// Assignments by date
router.get(
    "/by-date/:date",
    authController.protect,
    scheduleController.getAssignmentsByDate
);

// ============================================================
// CRUD
// ============================================================
router
    .route("/")
    .get(authController.protect, scheduleController.getAllDefenseAssignments)
    .post(authController.protect, scheduleController.createDefenseAssignment);

// ============================================================
// STATUS & PANELIST ACTIONS
// ============================================================
router.put(
    "/:id/status",
    authController.protect,
    scheduleController.changeDefenseStatus
);

router.get(
    "/:id/panelists/status",
    authController.protect,
    scheduleController.getPanelistStatus
);

router.post(
    "/:id/panelists",
    authController.protect,
    scheduleController.addPanelist
);

router.patch(
    "/:id/panelists/:panelistId/confirm",
    authController.protect,
    scheduleController.confirmPanelist
);

router.patch(
    "/:id/panelists/:panelistId/reject",
    authController.protect,
    scheduleController.rejectPanelist
);

router.patch(
    "/:id/panelists/:panelistId/reset",
    authController.protect,
    scheduleController.resetPanelistResponse
);

// Cancel
router.patch(
    "/:id/cancel",
    authController.protect,
    scheduleController.cancelDefenseAssignment
);

// ============================================================
// BY ID (LAST!)
// ============================================================
router
    .route("/:id")
    .get(authController.protect, scheduleController.getDefenseAssignmentById)
    .put(authController.protect, scheduleController.updateDefenseAssignment)
    .delete(authController.protect, scheduleController.deleteDefenseAssignment);

module.exports = router;