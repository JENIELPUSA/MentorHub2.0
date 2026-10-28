const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const Comment = require("../Models/CommentSchema");
const ProposedTitle = require("../Models/ProposedTitle");
const mongoose = require("mongoose");

// ============================================================
// CONSTANTS
// ============================================================
const VALID_ANNOTATION_TYPES = [
    // ✅ Frontend types (PDF viewer)
    "highlight",
    "comment",
    "margin",
    "page",
    "region",
    "global",
    // ✅ Backend-specific types
    "text",
    "wrong_margin",
    "wrong_font",
    "wrong_spacing",
    "wrong_alignment",
    "wrong_image",
    "wrong_color",
    "wrong_size",
    "grammar",
    "other",
];

const VALID_SEVERITIES = ["info", "minor", "major", "critical"];

const VALID_ROLES = [
    "adviser",
    "co-adviser",
    "coadviser",
    "student",
    "admin",
    "organizer",
    "subject_instructor",
];

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;
const USER_POPULATE = "first_name last_name id_number profilePicture role";

// ============================================================
// HELPERS
// ============================================================
const getAuthUserId = (req) => {
    const uid = req.user?._id || req.user?.linkId || req.user?.id;
    if (!uid) throw new Error("Authenticated user ID not found on request");
    return uid;
};

const normalizePosition = (position) => {
    if (!position || typeof position !== "object") return null;

    const x = position.x;
    const y = position.y;
    const width = position.width ?? position.w;
    const height = position.height ?? position.h;

    if ([x, y, width, height].every((v) => v == null)) return null;

    if (x == null || y == null) {
        const err = new Error("Both position.x and position.y are required");
        err.statusCode = 400;
        throw err;
    }

    const clamp01 = (v) => (v == null ? null : Math.min(1, Math.max(0, Number(v))));

    const parsed = {
        x: clamp01(x),
        y: clamp01(y),
        width: clamp01(width),
        height: clamp01(height),
    };

    const hasSize = parsed.width != null && parsed.height != null;
    const noSize = parsed.width == null && parsed.height == null;

    if (!hasSize && !noSize) {
        const err = new Error(
            "Annotation must have BOTH width+height (highlight) OR NEITHER (pin comment)"
        );
        err.statusCode = 400;
        throw err;
    }

    return parsed;
};

const normalizeColor = (color) => {
    if (!color) return "#fbbf24";
    if (HEX_REGEX.test(color)) return color;
    const LEGACY_MAP = {
        yellow: "#fbbf24",
        green: "#34d399",
        blue: "#60a5fa",
        pink: "#f472b6",
        red: "#f87171",
        purple: "#a78bfa",
        orange: "#fb923c",
        cyan: "#22d3ee",
        slate: "#94a3b8",
    };
    return LEGACY_MAP[color?.toLowerCase()] || "#fbbf24";
};

// ============================================================
// Find ProposedTitle by EITHER _id OR titleUrlTracking._id
// ============================================================
const findProposedTitleByTrackingId = async (id) => {
    if (!id) return null;
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    return ProposedTitle.findOne({
        $or: [{ _id: id }, { "titleUrlTracking._id": id }],
    }).select(
        "_id title status adviser coAdviser groupInfo titleUrlTracking updatedAt"
    );
};

// ============================================================
// Get LATEST tracking entry (latest URL/version)
// ============================================================
const getLatestTracking = (proposedTitle) => {
    if (!proposedTitle?.titleUrlTracking?.length) return null;

    return [...proposedTitle.titleUrlTracking].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    )[0];
};

// ============================================================
// ✅ Standardized error response
// ============================================================
const errorResponse = (res, status, message, extra = {}) => {
    return res.status(status).json({
        status: false,
        message,
        ...extra,
    });
};

// ============================================================
// ✅ Centralized error handler for controllers
// ============================================================
const handleControllerError = (error, res, controllerName = "controller") => {
    console.error(`❌ ${controllerName} error:`, error);
    if (error.stack) console.error("   Stack:", error.stack);

    // Mongoose ValidationError
    if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((e) => e.message);
        return errorResponse(
            res,
            400,
            `Validation failed: ${messages.join(", ")}`,
            { errors: messages }
        );
    }

    // Mongoose CastError (invalid ObjectId)
    if (error.name === "CastError") {
        return errorResponse(
            res,
            400,
            `Invalid ${error.path}: ${error.value}`
        );
    }

    // Mongoose BulkWriteError
    if (error.name === "BulkWriteError" || error.name === "MongoBulkWriteError") {
        return errorResponse(res, 400, "Bulk write failed", {
            writeErrors: error.writeErrors?.map((e) => e.errmsg),
        });
    }

    // Duplicate key
    if (error.code === 11000) {
        return errorResponse(res, 409, "Duplicate entry", {
            keyValue: error.keyValue,
        });
    }

    // Generic
    return errorResponse(
        res,
        error.statusCode || 500,
        error.message || `${controllerName} failed`
    );
};



exports.createComment = AsyncErrorHandler(async (req, res) => {
    try {
        const {
            proposedTitleId,      // Parent ProposedTitle._id or any tracking ID
            text,
            pageNumber,
            position,
            selectedText,
            color,
            annotationType,
            annotationLabel,
            severity,
            authorRole,
            parentCommentId,
        } = req.body;

        console.log("📥 req.body", req.body);

        const userId = getAuthUserId(req);

        if (!proposedTitleId) {
            return errorResponse(res, 400, "proposedTitleId is required");
        }
        if (!text || !String(text).trim()) {
            return errorResponse(res, 400, "text is required");
        }

        // ✅ Find the parent ProposedTitle (accepts both parent _id and tracking _id)
        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        // ✅ Get LATEST tracking entry from titleUrlTracking
        const latestTracking = getLatestTracking(proposedTitle);

        if (!latestTracking) {
            return errorResponse(
                res,
                400,
                "No titleUrlTracking entries found — cannot save comment"
            );
        }

        if (annotationType && !VALID_ANNOTATION_TYPES.includes(annotationType)) {
            return errorResponse(
                res,
                400,
                `Invalid annotationType "${annotationType}". Valid: ${VALID_ANNOTATION_TYPES.join(", ")}`
            );
        }

        if (severity && !VALID_SEVERITIES.includes(severity)) {
            return errorResponse(
                res,
                400,
                `Invalid severity "${severity}". Valid: ${VALID_SEVERITIES.join(", ")}`
            );
        }

        if (authorRole && !VALID_ROLES.includes(authorRole)) {
            return errorResponse(
                res,
                400,
                `Invalid authorRole "${authorRole}". Valid: ${VALID_ROLES.join(", ")}`
            );
        }

        let sanitizedPageNumber = null;
        if (pageNumber != null) {
            const p = Number(pageNumber);
            if (!Number.isFinite(p) || p < 1) {
                return errorResponse(res, 400, "pageNumber must be a positive integer");
            }
            sanitizedPageNumber = p;
        }

        let sanitizedPosition = null;
        try {
            sanitizedPosition = normalizePosition(position);
        } catch (err) {
            console.error("❌ normalizePosition error:", err.message);
            return errorResponse(res, err.statusCode || 400, err.message);
        }

        let sanitizedParentId = null;
        if (parentCommentId) {
            if (!mongoose.Types.ObjectId.isValid(parentCommentId)) {
                return errorResponse(res, 400, "Invalid parentCommentId");
            }
            const parent = await Comment.findById(parentCommentId)
                .select("proposedTitleId")
                .lean();
            if (!parent) {
                return errorResponse(res, 404, "Parent comment not found");
            }
            sanitizedParentId = parentCommentId;
        }

        // ============================================================
        // 1️⃣ CREATE THE COMMENT
        // ============================================================
        const comment = await Comment.create({
            proposedTitleId: latestTracking._id,         // tracking entry ID (para sa PDF annotations)
            parentProposedTitleId: proposedTitle._id,    // parent doc ID
            userId,
            text: String(text).trim(),
            pageNumber: sanitizedPageNumber,
            position: sanitizedPosition,
            selectedText: selectedText ? String(selectedText).slice(0, 500) : null,
            color: normalizeColor(color),
            annotationType: annotationType || "text",
            annotationLabel: annotationLabel
                ? String(annotationLabel).slice(0, 100)
                : null,
            severity: severity || "minor",
            authorRole: authorRole || null,
            parentCommentId: sanitizedParentId,          // ⚠️ dapat sanitizedParentId, hindi req.user._id
            documentTrackingId: latestTracking._id,
            documentUrl: latestTracking.url,
        });

        // ============================================================
        // 2️⃣ ⭐ MATCH LOGIC — Compare latestTracking._id vs proposedTitleId
        //     Kung may nag-match na tracking entry at may comment,
        //     i-set ang ProposedTitle.status = "Revision"
        // ============================================================
        let statusUpdated = false;
        try {
            const commentTrackingId = String(latestTracking._id);
            const incomingProposedTitleId = String(proposedTitleId);

            // I-match sa lahat ng tracking entries kung may match
            const matchedTracking = (proposedTitle.titleUrlTracking || []).find(
                (t) => String(t._id) === commentTrackingId
            );

            // ⭐ Kung may match na tracking entry (meaning may comment sa chapter)
            //    AT hindi pa "Revision" ang status — i-update
            const currentStatus = (proposedTitle.status || '').toLowerCase();
            const isAlreadyRevision = currentStatus === 'revision';

            const shouldBecomeRevision = matchedTracking && !isAlreadyRevision;

            if (shouldBecomeRevision) {
                // Preserve terminal states — huwag galawin kung Done/Ready for Defense
                const isTerminal = ['done', 'ready for defense', 'rejected'].includes(currentStatus);

                if (!isTerminal) {
                    proposedTitle.status = 'Revision';
                    proposedTitle.isRevesion = true;

                    // Reset mentor approval flags para kailangan nilang i-review ulit
                    proposedTitle.adviser = false;
                    proposedTitle.coAdviser = false;
                    proposedTitle.adviserReady = false;
                    proposedTitle.coAdviserReady = false;

                    // Timestamp ng revision request
                    proposedTitle.revisionRequestedAt = new Date();

                    await proposedTitle.save();
                    statusUpdated = true;

                    console.log(
                        `✅ Comment on tracking ${commentTrackingId} → ProposedTitle ${proposedTitle._id} status set to "Revision"`
                    );

                    // Optional: emit socket event kung may io sa app
                    const io = req.app.get("io");
                    if (io) {
                        io.emit("ProposedTitleStatusChanged", {
                            proposedTitleId: proposedTitle._id,
                            status: "Revision",
                            reason: "New mentor comment requires student rework",
                            triggeredByCommentId: comment._id,
                            trackingId: latestTracking._id,
                        });
                    }
                } else {
                    console.log(
                        `ℹ️ ProposedTitle ${proposedTitle._id} in terminal state "${currentStatus}" — status NOT changed`
                    );
                }
            } else if (isAlreadyRevision) {
                console.log(
                    `ℹ️ ProposedTitle ${proposedTitle._id} already in "Revision" status — no change needed`
                );
            }
        } catch (statusErr) {
            // Huwag i-fail ang buong request kung status update lang ang nag-error
            console.error("⚠️ Failed to update ProposedTitle status:", statusErr.message);
        }

        // ============================================================
        // 3️⃣ POPULATE AND RETURN
        // ============================================================
        const populatedComment = await Comment.findById(comment._id)
            .populate("userId", USER_POPULATE)
            .lean();

        return res.status(201).json({
            status: "success",
            message: statusUpdated
                ? "Comment created — proposal moved to Revision status"
                : "Comment created successfully",
            data: populatedComment,
            proposedTitleStatus: proposedTitle.status,
            statusUpdated,
        });
    } catch (error) {
        return handleControllerError(error, res, "createComment");
    }
});

// ============================================================
// BULK CREATE
// ============================================================
exports.bulkCreateComments = AsyncErrorHandler(async (req, res) => {
    try {
        const { proposedTitleId, comments } = req.body;
        const userId = getAuthUserId(req);

        if (!Array.isArray(comments) || comments.length === 0) {
            return errorResponse(res, 400, "comments array is required");
        }

        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        const latestTracking = getLatestTracking(proposedTitle);

        const docs = [];
        for (let i = 0; i < comments.length; i++) {
            const c = comments[i];
            try {
                docs.push({
                    proposedTitleId: proposedTitle._id,
                    userId,
                    text: String(c.text || "").trim() || "Annotation",
                    pageNumber: c.pageNumber != null ? Number(c.pageNumber) : null,
                    position: normalizePosition(c.position),
                    selectedText: c.selectedText
                        ? String(c.selectedText).slice(0, 500)
                        : null,
                    color: normalizeColor(c.color),
                    annotationType: VALID_ANNOTATION_TYPES.includes(c.annotationType)
                        ? c.annotationType
                        : "text",
                    annotationLabel: c.annotationLabel
                        ? String(c.annotationLabel).slice(0, 100)
                        : null,
                    severity: VALID_SEVERITIES.includes(c.severity)
                        ? c.severity
                        : "minor",
                    authorRole: VALID_ROLES.includes(c.authorRole)
                        ? c.authorRole
                        : null,
                    documentTrackingId: latestTracking?._id || null,
                    documentUrl: latestTracking?.url || null,
                });
            } catch (err) {
                console.error(`❌ Bulk item [${i}] error:`, err.message);
                return errorResponse(
                    res,
                    err.statusCode || 400,
                    `Bulk item [${i}] error: ${err.message}`
                );
            }
        }

        const inserted = await Comment.insertMany(docs);

        return res.status(201).json({
            status: "success",
            message: `${inserted.length} annotations saved`,
            data: inserted,
        });
    } catch (error) {
        return handleControllerError(error, res, "bulkCreateComments");
    }
});

// ============================================================
// GET COMMENTS BY PROPOSED TITLE (paginated)
// Returns only comments for the LATEST titleUrlTracking version
// ============================================================
exports.getCommentsByProposedTitle = AsyncErrorHandler(async (req, res) => {
    try {
        const { proposedTitleId } = req.params;

        console.log("🔍 Fetching comments for:", proposedTitleId);

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(proposedTitleId)) {
            return errorResponse(res, 400, "Invalid proposedTitleId format");
        }

        // ✅ Find parent ProposedTitle (accepts parent _id OR tracking _id)
        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        // ✅ Get the LATEST tracking entry
        const latestTracking = getLatestTracking(proposedTitle);
        if (!latestTracking) {
            return errorResponse(
                res,
                400,
                "No titleUrlTracking entries found for this proposed title"
            );
        }

        console.log("═══════════════════════════════════════");
        console.log("📄 Parent ProposedTitle._id:", proposedTitle._id);
        console.log("🎯 Latest tracking._id:", latestTracking._id);
        console.log("📅 Latest tracking.date:", latestTracking.date);
        console.log("📎 Latest tracking.url:", latestTracking.url);
        console.log("═══════════════════════════════════════");

        // ✅ Direct match — comments where proposedTitleId = latest tracking._id
        const filter = { proposedTitleId: latestTracking._id };

        if (req.query.pageNumber) {
            const p = parseInt(req.query.pageNumber);
            if (Number.isFinite(p) && p >= 1) filter.pageNumber = p;
        }
        if (req.query.annotationType) {
            filter.annotationType = req.query.annotationType;
        }
        if (req.query.onlyUnresolved === "true") {
            filter.isResolved = false;
        }
        if (req.query.includeReplies === "false") {
            filter.parentCommentId = null;
        }

        console.log("📋 Query filter:", JSON.stringify(filter));

        const [comments, totalCount] = await Promise.all([
            Comment.find(filter)
                .populate("userId", USER_POPULATE)
                .sort({ pageNumber: 1, createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Comment.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        console.log(`✅ Found ${comments.length} comments (${totalCount} total)`);

        return res.status(200).json({
            status: "success",
            currentPage: page,
            totalPages,
            totalCount,
            results: comments.length,
            data: comments,
        });
    } catch (error) {
        return handleControllerError(error, res, "getCommentsByProposedTitle");
    }
});

// ============================================================
// GET ALL ANNOTATIONS FOR THESIS (grouped + stats)
// ============================================================
exports.getAllAnnotationsByThesis = AsyncErrorHandler(async (req, res) => {
    try {
        const { proposedTitleId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(proposedTitleId)) {
            return errorResponse(res, 400, "Invalid proposedTitleId format");
        }

        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        const comments = await Comment.find({ proposedTitleId: proposedTitle._id })
            .populate("userId", USER_POPULATE)
            .populate("resolvedBy", "first_name last_name role")
            .sort({ pageNumber: 1, createdAt: 1 })
            .lean();

        const grouped = comments.reduce((acc, c) => {
            const key = `page_${c.pageNumber || "none"}`;
            (acc[key] ||= []).push(c);
            return acc;
        }, {});

        const stats = {
            total: comments.length,
            unresolved: comments.filter((c) => !c.isResolved).length,
            byType: comments.reduce((acc, c) => {
                acc[c.annotationType] = (acc[c.annotationType] || 0) + 1;
                return acc;
            }, {}),
            bySeverity: comments.reduce((acc, c) => {
                acc[c.severity] = (acc[c.severity] || 0) + 1;
                return acc;
            }, {}),
            byPage: Object.keys(grouped).reduce((acc, k) => {
                acc[k] = grouped[k].length;
                return acc;
            }, {}),
        };

        return res.status(200).json({
            status: "success",
            data: comments,
            grouped,
            stats,
        });
    } catch (error) {
        return handleControllerError(error, res, "getAllAnnotationsByThesis");
    }
});

// ============================================================
// GET ANNOTATIONS BY PAGE
// ============================================================
exports.getAnnotationsByPage = AsyncErrorHandler(async (req, res) => {
    try {
        const { proposedTitleId } = req.params;
        const { pageNumber } = req.query;

        if (!pageNumber) {
            return errorResponse(res, 400, "pageNumber query param is required");
        }

        const p = Number(pageNumber);
        if (!Number.isFinite(p) || p < 1) {
            return errorResponse(res, 400, "pageNumber must be a positive integer");
        }

        if (!mongoose.Types.ObjectId.isValid(proposedTitleId)) {
            return errorResponse(res, 400, "Invalid proposedTitleId format");
        }

        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        const annotations = await Comment.find({
            proposedTitleId: proposedTitle._id,
            pageNumber: p,
            position: { $ne: null },
        })
            .populate("userId", USER_POPULATE)
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            status: "success",
            pageNumber: p,
            count: annotations.length,
            data: annotations,
        });
    } catch (error) {
        return handleControllerError(error, res, "getAnnotationsByPage");
    }
});

// ============================================================
// GET STATS (lightweight)
// ============================================================
exports.getAnnotationStats = AsyncErrorHandler(async (req, res) => {
    try {
        const { proposedTitleId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(proposedTitleId)) {
            return errorResponse(res, 400, "Invalid proposedTitleId format");
        }

        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        const [total, unresolved] = await Promise.all([
            Comment.countDocuments({ proposedTitleId: proposedTitle._id }),
            Comment.countDocuments({
                proposedTitleId: proposedTitle._id,
                isResolved: false,
            }),
        ]);

        return res.status(200).json({
            status: "success",
            data: { total, unresolved },
        });
    } catch (error) {
        return handleControllerError(error, res, "getAnnotationStats");
    }
});

// ============================================================
// GET SINGLE COMMENT
// ============================================================
exports.getCommentById = AsyncErrorHandler(async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid comment id");
        }

        const comment = await Comment.findById(id)
            .populate("userId", USER_POPULATE)
            .populate("resolvedBy", "first_name last_name role")
            .lean();

        if (!comment) {
            return errorResponse(res, 404, "Comment not found.");
        }

        const replies = await Comment.find({ parentCommentId: id })
            .populate("userId", USER_POPULATE)
            .sort({ createdAt: 1 })
            .lean();

        return res.status(200).json({
            status: "success",
            data: { ...comment, replies },
        });
    } catch (error) {
        return handleControllerError(error, res, "getCommentById");
    }
});

// ============================================================
// GET COUNT (lightweight badge)
// ============================================================
exports.getCommentCount = AsyncErrorHandler(async (req, res) => {
    try {
        const { proposedTitleId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(proposedTitleId)) {
            return errorResponse(res, 400, "Invalid proposedTitleId format");
        }

        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        const count = await Comment.countDocuments({
            proposedTitleId: proposedTitle._id,
        });

        return res.status(200).json({ status: "success", count });
    } catch (error) {
        return handleControllerError(error, res, "getCommentCount");
    }
});

// ============================================================
// UPDATE COMMENT
// ============================================================
exports.updateComment = AsyncErrorHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getAuthUserId(req);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid comment id");
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return errorResponse(res, 404, "Comment not found.");
        }

        if (comment.userId.toString() !== userId.toString()) {
            return errorResponse(
                res,
                403,
                "You are not authorized to update this comment."
            );
        }

        const allowed = [
            "text",
            "color",
            "severity",
            "annotationType",
            "annotationLabel",
            "selectedText",
        ];

        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                if (key === "text") {
                    const trimmed = String(req.body.text).trim();
                    if (!trimmed) {
                        return errorResponse(res, 400, "text cannot be empty");
                    }
                    comment.text = trimmed.slice(0, 2000);
                } else if (key === "color") {
                    comment.color = normalizeColor(req.body.color);
                } else if (key === "annotationType") {
                    if (!VALID_ANNOTATION_TYPES.includes(req.body.annotationType)) {
                        return errorResponse(res, 400, "Invalid annotationType");
                    }
                    comment.annotationType = req.body.annotationType;
                } else if (key === "severity") {
                    if (!VALID_SEVERITIES.includes(req.body.severity)) {
                        return errorResponse(res, 400, "Invalid severity");
                    }
                    comment.severity = req.body.severity;
                } else if (key === "selectedText") {
                    comment.selectedText = req.body.selectedText
                        ? String(req.body.selectedText).slice(0, 500)
                        : null;
                } else if (key === "annotationLabel") {
                    comment.annotationLabel = req.body.annotationLabel
                        ? String(req.body.annotationLabel).slice(0, 100)
                        : null;
                }
            }
        }

        await comment.save();

        const updatedComment = await Comment.findById(comment._id)
            .populate("userId", USER_POPULATE)
            .lean();

        return res.status(200).json({
            status: "success",
            message: "Comment updated successfully",
            data: updatedComment,
        });
    } catch (error) {
        return handleControllerError(error, res, "updateComment");
    }
});

// ============================================================
// TOGGLE RESOLVE
// ============================================================
exports.toggleResolve = AsyncErrorHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { isResolved } = req.body;
        const userId = getAuthUserId(req);

        if (typeof isResolved !== "boolean") {
            return errorResponse(res, 400, "isResolved must be a boolean");
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid comment id");
        }

        const updates = isResolved
            ? { isResolved: true, resolvedBy: userId, resolvedAt: new Date() }
            : { isResolved: false, resolvedBy: null, resolvedAt: null };

        const updated = await Comment.findByIdAndUpdate(id, updates, {
            new: true,
        })
            .populate("userId", USER_POPULATE)
            .populate("resolvedBy", "first_name last_name role")
            .lean();

        if (!updated) {
            return errorResponse(res, 404, "Comment not found.");
        }

        return res.status(200).json({
            status: "success",
            message: isResolved ? "Marked as resolved" : "Marked as unresolved",
            data: updated,
        });
    } catch (error) {
        return handleControllerError(error, res, "toggleResolve");
    }
});

// ============================================================
// DELETE COMMENT (cascades replies)
// ============================================================
exports.deleteComment = AsyncErrorHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getAuthUserId(req);
        const userRole = (req.user?.role || "").toLowerCase();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid comment id");
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return errorResponse(res, 404, "Comment not found.");
        }

        const isOwner = comment.userId.toString() === userId.toString();
        const isAdmin = ["admin", "organizer"].includes(userRole);

        if (!isOwner && !isAdmin) {
            return errorResponse(
                res,
                403,
                "You are not authorized to delete this comment."
            );
        }

        const replyResult = await Comment.deleteMany({
            parentCommentId: comment._id,
        });
        await Comment.findByIdAndDelete(id);

        return res.status(200).json({
            status: "success",
            message: "Comment deleted successfully",
            deletedReplies: replyResult.deletedCount || 0,
        });
    } catch (error) {
        return handleControllerError(error, res, "deleteComment");
    }
});

// ============================================================
// CLEAR PAGE (bulk delete by page)
// ============================================================
exports.clearPage = AsyncErrorHandler(async (req, res) => {
    try {
        const { proposedTitleId, pageNumber } = req.params;

        const p = Number(pageNumber);
        if (!Number.isFinite(p) || p < 1) {
            return errorResponse(res, 400, "pageNumber must be a positive integer");
        }

        if (!mongoose.Types.ObjectId.isValid(proposedTitleId)) {
            return errorResponse(res, 400, "Invalid proposedTitleId format");
        }

        const proposedTitle = await findProposedTitleByTrackingId(proposedTitleId);
        if (!proposedTitle) {
            return errorResponse(
                res,
                404,
                `Proposed title not found for ID: ${proposedTitleId}`
            );
        }

        const result = await Comment.deleteMany({
            proposedTitleId: proposedTitle._id,
            pageNumber: p,
        });

        return res.status(200).json({
            status: "success",
            message: `Cleared ${result.deletedCount} annotation(s) from page ${p}`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        return handleControllerError(error, res, "clearPage");
    }
});