const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const Comment = require("../Models/CommentSchema");
const ProposedTitle = require("../Models/ProposedTitle")

exports.createComment = AsyncErrorHandler(async (req, res) => {
    const { proposedTitleId, text } = req.body;
    const userId = req.user._id;

    // proposedTitleId dito ay titleUrlTracking._id
    const proposedTitle = await ProposedTitle.findOne({
        "titleUrlTracking._id": proposedTitleId
    });

    if (!proposedTitle) {
        return res.status(404).json({
            status: false,
            message: "Title tracking not found"
        });
    }

    // Create comment using the PARENT ProposedTitle _id
    const comment = await Comment.create({
        proposedTitleId: proposedTitle._id,
        userId,
        text
    });

    // Populate user data
    const populatedComment = await Comment.findById(comment._id)
        .populate(
            "userId",
            "first_name last_name id_number profilePicture"
        );

    res.status(201).json({
        status: 'success',
        message: "Comment created successfully",
        data: populatedComment
    });
});


exports.getCommentsByProposedTitle = AsyncErrorHandler(async (req, res) => {
    const { proposedTitleId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get comments with pagination
    const [comments, totalCount] = await Promise.all([
        Comment.find({ proposedTitleId })
            .populate("userId", "first_name last_name id_number profilePicture")
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit),
        Comment.countDocuments({ proposedTitleId })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages,
        totalCount,
        results: comments.length,
        data: comments,
    });
});


exports.updateComment = AsyncErrorHandler(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.linkId;

    // Find comment
    const comment = await Comment.findById(id);

    if (!comment) {
        return res.status(404).json({
            status: false,
            message: "Comment not found.",
        });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== userId.toString()) {
        return res.status(403).json({
            status: false,
            message: "You are not authorized to update this comment.",
        });
    }

    // Update comment
    comment.text = text;
    await comment.save();

    // Populate user data
    const updatedComment = await Comment.findById(comment._id)
        .populate("userId", "first_name last_name id_number profilePicture");

    res.status(200).json({
        status: "success",
        message: "Comment updated successfully",
        data: updatedComment,
    });
});


exports.deleteComment = AsyncErrorHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.linkId;
    const userRole = req.user.role;

    // Find comment
    const comment = await Comment.findById(id);

    if (!comment) {
        return res.status(404).json({
            status: false,
            message: "Comment not found.",
        });
    }

    // Check if user owns the comment or is admin
    const isOwner = comment.userId.toString() === userId.toString();
    const isAdmin = userRole === "admin" || userRole === "Admin";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({
            status: false,
            message: "You are not authorized to delete this comment.",
        });
    }

    // Delete comment
    await Comment.findByIdAndDelete(id);

    res.status(200).json({
        status: "success",
        message: "Comment deleted successfully",
    });
});