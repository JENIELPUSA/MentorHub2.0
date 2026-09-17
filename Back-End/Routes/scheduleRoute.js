const express = require("express");
const router = express.Router(); //express router
const scheduleController = require("../Controller/scheduleController");
const authController = require('../Controller/authController');


// GET all departments (with pagination + search) & CREATE department
router.route("/")
    .get(authController.protect, scheduleController.getAllDefenseAssignments)
    .post(authController.protect, scheduleController.createDefenseAssignment);


module.exports = router;