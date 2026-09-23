const express = require('express');
const router = express.Router();
const FormatController = require('./../Controller/FormatController');
const authController = require('./../Controller/authController');
const upload = require("../middleware/fileUploader");

router.route('/')
    .post(authController.protect, upload.single("file"), FormatController.createFormat)
    .get(authController.protect, FormatController.DisplayFormats)

router.route('/:id')
    .patch(authController.protect, FormatController.updateFormat)
    .delete(authController.protect, FormatController.deleteFormat)

module.exports = router;