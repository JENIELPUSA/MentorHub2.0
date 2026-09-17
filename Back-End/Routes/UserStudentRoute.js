const express = require("express");
const router = express.Router();
const studentUserController = require("../Controller/UserStudent");
const authController = require("../Controller/authController");

router.route("/")
    .get(authController.protect, studentUserController.DisplayAllData)


router.route("/userdropdown")
    .get(authController.protect, studentUserController.GetAdviserDropdownOptions)

router.route("/user")
    .get(authController.protect, studentUserController.DisplayUsersWithLogin)

module.exports = router;