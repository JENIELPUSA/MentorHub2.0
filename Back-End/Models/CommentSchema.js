const mongoose = require("mongoose");
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        // ============================================================
        // CORE
        // ============================================================
        proposedTitleId: {
            type: Schema.Types.ObjectId,
            ref: "ProposedTitle",
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "UserLoginSchema",
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },

        // ============================================================
        // PDF ANNOTATION FIELDS
        // ============================================================
        pageNumber: {
            type: Number,
            default: null,
            min: 1
        },

        // Relative coords (0–1). Unscaled PDF coords.
        // Both-or-neither rule: highlight = x,y,w,h | pin = x,y only
        position: {
            x: { type: Number, default: null, min: 0, max: 1 },
            y: { type: Number, default: null, min: 0, max: 1 },
            width: { type: Number, default: null, min: 0, max: 1 },
            height: { type: Number, default: null, min: 0, max: 1 }
        },

        selectedText: {
            type: String,
            default: null,
            maxlength: 500
        },

        //Hex only — matches frontend ANNOTATION_COLORS
        color: {
            type: String,
            default: "#fbbf24",
            match: /^#[0-9A-Fa-f]{6}$/
        },

        annotationType: {
            type: String,
            enum: [
                "text",
                "margin",
                "grammar",
                "other",
                "highlight", "page", "global", "comment"
            ],
            default: "text"
        },

        annotationLabel: {
            type: String,
            default: null,
            maxlength: 100
        },

        // ============================================================
        // MENTORING METADATA
        // ============================================================
        severity: {
            type: String,
            enum: ["info", "minor", "major", "critical"],
            default: "minor"
        },

        authorRole: {
            type: String,
            enum: [
                "adviser",
                "co-adviser",
                "coadviser",
                "student",
                "admin",
                "organizer",
                "subject_instructor"
            ],
            default: null
        },

        // ============================================================
        // RESOLUTION
        // ============================================================
        isResolved: {
            type: Boolean,
            default: false,
            index: true
        },
        resolvedBy: {
            type: Schema.Types.ObjectId,
            ref: "UserLoginSchema",
            default: null
        },
        resolvedAt: {
            type: Date,
            default: null
        },

        // ============================================================
        // THREADING
        // ============================================================
        parentCommentId: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: null,
            index: true
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ============================================================
// INDEXES
// ============================================================
CommentSchema.index({ proposedTitleId: 1, pageNumber: 1 });
CommentSchema.index({ proposedTitleId: 1, isResolved: 1 });
CommentSchema.index({ proposedTitleId: 1, parentCommentId: 1 });
CommentSchema.index({ proposedTitleId: 1, createdAt: -1 });

// ============================================================
// VIRTUALS
// ============================================================
CommentSchema.virtual("isReply").get(function () {
    return this.parentCommentId !== null;
});

// ============================================================
// VALIDATION HOOK
// ============================================================
CommentSchema.pre("validate", function (next) {
    if (this.position?.x != null && this.position?.y == null) {
        return next(
            new Error("position.y is required when position.x is set")
        );
    }

    if (this.position?.x != null && this.position?.y != null) {
        const hasSize =
            this.position.width != null && this.position.height != null;
        const noSize =
            this.position.width == null && this.position.height == null;

        if (!hasSize && !noSize) {
            return next(
                new Error(
                    "Annotation must have BOTH width+height (highlight) OR NEITHER (pin comment)"
                )
            );
        }
    }
    next();
});

module.exports = mongoose.model("Comment", CommentSchema);