const express = require("express");
const router = express.Router(); //express router
const CommentController = require("../Controller/CommentController");
const authController = require('./../Controller/authController');
// ==========================================
// CommentController ROUTES
// ==========================================

// GET all CommentControllers (with pagination + search) & CREATE CommentController
router.route("/")
    .get(authController.protect, CommentController.getCommentsByProposedTitle)
    .post(authController.protect, CommentController.createComment);


// GET, UPDATE, DELETE CommentController by ID
router.route("/:id")
    .patch(authController.protect, CommentController.updateComment)
    .delete(authController.protect, CommentController.deleteComment);

module.exports = router;