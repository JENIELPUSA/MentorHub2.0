const express = require("express");
const router = express.Router();
const subject = require("../Controller/SubjectController");
const authController = require("../Controller/authController");
// ==========================================
// SUBJECT ROUTES
// ==========================================

// GET all subjects (with pagination + search) & CREATE subject
router.route("/")
    .get(authController.protect, subject.DisplaySubjects)
    .post(authController.protect, subject.createSubject);

// GET all subjects (with pagination + search) & CREATE subject
router.route("/:id")
    .patch(authController.protect, subject.updateSubject);

// GET all subjects (simple list for dropdowns)
router.route("/all-simple")
    .get(authController.protect, subject.getAllSubjectsSimple);

// GET subject by code
router.route("/by-code/:code")
    .get(authController.protect, subject.getSubjectByCode);

// GET, UPDATE, DELETE subject by ID
router.route("/:id")
    .get(authController.protect, subject.getSingleSubject)
    .patch(authController.protect, subject.updateSubject)
    .delete(authController.protect, subject.deleteSubject);

module.exports = router;