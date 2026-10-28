const express = require("express");
const router = express.Router();
const CommentController = require("../Controller/CommentController");
const authController = require("./../Controller/authController");

// ==========================================
// CommentController ROUTES
// ==========================================

// ==========================================
// ROOT: GET (paginated) & CREATE
// ==========================================
router.route("/")
    .get(authController.protect, CommentController.getCommentsByProposedTitle)
    .post(authController.protect, CommentController.createComment);

// ==========================================
// BULK CREATE
// POST /api/v1/comments/bulk
// body: { proposedTitleId, comments: [...] }
// ==========================================
router.post(
    "/bulk",
    authController.protect,
    CommentController.bulkCreateComments
);

// ==========================================
// GET ALL ANNOTATIONS FOR THESIS (grouped + stats)
// GET /api/v1/comments/all/:proposedTitleId
// ==========================================
router.get(
    "/all/:proposedTitleId",
    authController.protect,
    CommentController.getAllAnnotationsByThesis
);

// ==========================================
// GET ANNOTATIONS BY PAGE
// GET /api/v1/comments/by-page/:proposedTitleId?pageNumber=1
// ==========================================
router.get(
    "/by-page/:proposedTitleId",
    authController.protect,
    CommentController.getAnnotationsByPage
);

// ==========================================
// GET STATS (lightweight)
// GET /api/v1/comments/stats/:proposedTitleId
// ==========================================
router.get(
    "/stats/:proposedTitleId",
    authController.protect,
    CommentController.getAnnotationStats
);

// ==========================================
// GET COMMENT COUNT (badge)
// GET /api/v1/comments/count/:proposedTitleId
// ==========================================
router.get(
    "/count/:proposedTitleId",
    authController.protect,
    CommentController.getCommentCount
);

// ==========================================
// CLEAR PAGE (bulk delete by page)
// DELETE /api/v1/comments/clear-page/:proposedTitleId/:pageNumber
// ==========================================
router.delete(
    "/clear-page/:proposedTitleId/:pageNumber",
    authController.protect,
    CommentController.clearPage
);

// ==========================================
// GET COMMENTS BY PROPOSED TITLE (explicit)
// GET /api/v1/comments/proposed-title/:proposedTitleId
// ==========================================
// Same handler as "/" but different URL para mas explicit
router.get(
    "/proposed-title/:proposedTitleId",
    authController.protect,
    CommentController.getCommentsByProposedTitle
);

// ==========================================
// GET SINGLE COMMENT
// GET /api/v1/comments/:id
// ==========================================
router.get(
    "/:id",
    authController.protect,
    CommentController.getCommentById
);

// ==========================================
// UPDATE / DELETE Comment by ID
// PATCH /api/v1/comments/:id
// DELETE /api/v1/comments/:id
// ==========================================
router.route("/:id")
    .patch(authController.protect, CommentController.updateComment)
    .delete(authController.protect, CommentController.deleteComment);

// ==========================================
// TOGGLE RESOLVE
// PATCH /api/v1/comments/:id/resolve
// body: { isResolved: true|false }
// ==========================================
router.patch(
    "/:id/resolve",
    authController.protect,
    CommentController.toggleResolve
);

module.exports = router;