const express = require("express");
const router = express.Router(); //express router
const section = require("../Controller/SectionController");
const authController = require("../Controller/authController")

// GET all departments (with pagination + search) & CREATE department
router.route("/")
    .get(authController.protect, section.DisplaySections)
    .post(authController.protect, section.createSection);

router.route("/:subjectId")
    .get(authController.protect, section.DisplaySections)

router.route("/:id")
    .patch(authController.protect, section.updateSection)
    .delete(authController.protect, section.deleteSection);

module.exports = router;