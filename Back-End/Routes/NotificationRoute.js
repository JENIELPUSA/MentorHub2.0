const express = require('express');
const router = express.Router();
const NotificationController = require('./../Controller/NotificationController'); // or ProposedTitleController depende sa actual filename
const authController = require('./../Controller/authController');

router.route('/')
    .get(authController.protect, NotificationController.displayNotifications);

// ⚠️ IMPORTANT: specific routes must come BEFORE the /:id route
router.route('/mark-all-read')
    .patch(authController.protect, NotificationController.markAllAsRead);

router.route('/:id/mark-read')
    .patch(authController.protect, NotificationController.markOneAsRead);

module.exports = router;