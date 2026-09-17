const express = require('express');
const router = express.Router();
const NotificationController = require('./../Controller/NotificationController'); // or ProposedTitleController depende sa actual filename
const authController = require('./../Controller/authController');

router.route('/')
    .get(authController.protect, NotificationController.displayNotifications)

module.exports = router;