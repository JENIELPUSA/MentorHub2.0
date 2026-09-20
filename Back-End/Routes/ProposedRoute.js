const express = require('express');
const router = express.Router();
const Proposal = require('./../Controller/ProposedTitleController'); // or ProposedTitleController depende sa actual filename
const authController = require('./../Controller/authController');
const upload = require("../middleware/fileUploader");

router.route('/')
    .post(authController.protect, upload.single("file"), Proposal.createProposedTitle)
    .get(authController.protect, Proposal.DisplayProposedTitles)


router.route('/forreadystatus')
    .get(authController.protect, Proposal.DisplayReadytitle)

router.route('/Archived')
    .get(authController.protect, Proposal.DisplayArcivedtitle)

router.route('/:id')
    .patch(authController.protect, Proposal.UpdateProposedTitle)
    .delete(authController.protect, Proposal.deleteProposedTitle)

module.exports = router;