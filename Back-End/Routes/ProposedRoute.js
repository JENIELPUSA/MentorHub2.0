const express = require('express');
const router = express.Router();
const Proposal = require('./../Controller/ProposedTitleController');
const authController = require('./../Controller/authController');
const upload = require("../middleware/fileUploader");

// ============================================================
// 📋 ROOT ROUTES
// ============================================================
router.route('/')
    .post(authController.protect, upload.single("file"), Proposal.createProposedTitle)
    .get(authController.protect, Proposal.DisplayProposedTitles);

// ============================================================
// 📊 STATISTICS
// ============================================================
router.route('/statistics')
    .get(authController.protect, Proposal.GetProposedTitleStatistics);

// ============================================================
// 📄 TRACKING / PDF
// ============================================================
router.route('/tracking/:trackingId')
    .get(authController.protect, Proposal.GetByTrackingID);

router.route('/pdf/:trackingId')
    .get(authController.protect, Proposal.GetByTrackingID);

// ============================================================
// 📌 FILTERED LISTS
// ============================================================
router.route('/forreadystatus')
    .get(authController.protect, Proposal.DisplayReadytitle);

router.route('/Archived')
    .get(authController.protect, Proposal.DisplayArcivedtitle);

// ============================================================
// ⭐ CHAPTER PROGRESSION ROUTES (Subject Instructor / Admin)
// ⚠️ IMPORTANT: MUST be BEFORE /:id/chapters route
// ============================================================
router.route('/:id/chapters/progression')
    .get(authController.protect, Proposal.getChapterProgression);

router.route('/:id/chapters/:chapter/proceed')
    .patch(authController.protect, Proposal.proceedChapter);

router.route('/:id/chapters/:chapter/reject')
    .patch(authController.protect, Proposal.rejectChapter);

// ============================================================
// 📋 CHAPTER COMPLETION ROUTES
// ⚠️ ORDER: 'complete-all' BEFORE generic ':id/chapters'
// ============================================================
router.route('/:id/chapters/complete-all')
    .patch(authController.protect, Proposal.MarkAllChaptersComplete);

router.route('/:id/chapters')
    .get(authController.protect, Proposal.GetChapterCompletion);

router.route('/:id/tracking/:trackingId/complete')
    .patch(authController.protect, Proposal.MarkChapterComplete);

// ============================================================
// 🔧 GENERIC DYNAMIC ROUTE — MUST BE LAST
// ============================================================
router.route('/:id')
    .patch(authController.protect, Proposal.UpdateProposedTitle)
    .delete(authController.protect, Proposal.deleteProposedTitle);

module.exports = router;