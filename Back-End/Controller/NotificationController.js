const Notification = require("../Models/NotificationSchema");
const mongoose = require("mongoose");

// ==========================================
// ✅ SHARED ROLE-BASED FILTER
// recipient & uploadedBy are ARRAYS in the schema —
// mongoose handles array membership automatically,
// so `{ recipient: userId }` matches if userId is in the array.
// ==========================================
const buildRoleFilter = (role, userId) => {
    const ROLE_FILTERS = {
        student: {
            $or: [{ uploadedBy: userId }, { recipient: userId }],
        },
        adviser: { recipient: userId },
        panelist: { recipient: userId },
        subject_instructor: { recipient: userId },
        admin: {}, // admin intentionally sees all
    };
    return ROLE_FILTERS[role] ?? { recipient: userId };
};

// ==========================================
// ✅ DISPLAY NOTIFICATIONS
// ==========================================
exports.displayNotifications = async (req, res) => {
    try {
        const userId = req.user?._id;
        const role = req.user?.role;

        console.log("userId", userId);
        console.log("role", role);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated.",
            });
        }

        const { showAll, hideAll, page = 1, limit = 15 } = req.query;

        // Parse pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 15));
        const skip = (pageNum - 1) * limitNum;

        // ✅ SAFE DEFAULT — kung hindi kilala ang role, recipient lang
        const filter = buildRoleFilter(role, userId);

        console.log("Filter:", filter);

        // ==========================================
        // HIDE ALL - Mark all as read
        // ==========================================
        if (hideAll === "true") {
            const result = await Notification.updateMany(
                { ...filter, isRead: false },
                { $set: { isRead: true, readAt: new Date() } }
            );

            const unreadCount = await Notification.countDocuments({
                ...filter,
                isRead: false,
            });

            return res.status(200).json({
                success: true,
                message: "All notifications hidden (marked as read)",
                data: {
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                    unreadCount,
                },
            });
        }

        // ==========================================
        // PROCESS NOTIFICATIONS BY ROLE
        // ==========================================
        const processNotifications = (notifications) => {
            return notifications.map((notification) => {
                const notif = notification.toObject
                    ? notification.toObject()
                    : notification;

                switch (role) {
                    case "student":
                        if (notif.returnmessage) {
                            notif.message = notif.returnmessage;
                        }
                        break;
                    case "admin":
                    case "adviser":
                    case "panelist":
                    case "subject_instructor":
                    default:
                        delete notif.returnmessage;
                        break;
                }
                return notif;
            });
        };

        // ==========================================
        // SHOW ALL
        // ==========================================
        if (showAll === "true") {
            const total = await Notification.countDocuments(filter);

            let notifications = await Notification.find(filter)
                .populate("uploadedBy", "firstName lastName email profileImage")
                .populate("groupId", "name")
                .populate("recipient", "firstName lastName email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum);

            notifications = processNotifications(notifications);

            const unreadCount = await Notification.countDocuments({
                ...filter,
                isRead: false,
            });

            return res.status(200).json({
                success: true,
                message: "All notifications retrieved successfully",
                data: {
                    notifications,
                    unreadCount,
                    pagination: {
                        total,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(total / limitNum),
                    },
                },
            });
        }

        // ==========================================
        // DEFAULT — unread only
        // ==========================================
        const total = await Notification.countDocuments({
            ...filter,
            isRead: false,
        });

        let notifications = await Notification.find({
            ...filter,
            isRead: false,
        })
            .populate("uploadedBy", "firstName lastName email profileImage")
            .populate("groupId", "name")
            .populate("recipient", "firstName lastName email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        notifications = processNotifications(notifications);

        return res.status(200).json({
            success: true,
            message: "Unread notifications retrieved",
            data: {
                notifications,
                unreadCount: total,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    } catch (error) {
        console.error("Error in display notifications:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to process notification display",
            error: error.message,
        });
    }
};

// ==========================================
// ✅ MARK ALL AS READ (bulk)
// ==========================================
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?._id;
        const role = req.user?.role;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated.",
            });
        }

        const filter = buildRoleFilter(role, userId);

        // updateMany bypasses the pre("save") hook → set readAt manually
        const now = new Date();
        const result = await Notification.updateMany(
            { ...filter, isRead: false },
            { $set: { isRead: true, readAt: now } }
        );

        const unreadCount = await Notification.countDocuments({
            ...filter,
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                unreadCount,
            },
        });
    } catch (error) {
        console.error("Error in markAllAsRead:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark all notifications as read",
            error: error.message,
        });
    }
};

// ==========================================
// ✅ MARK ONE AS READ (by id)
// ==========================================
exports.markOneAsRead = async (req, res) => {
    try {
        const userId = req.user?._id;
        const role = req.user?.role;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated.",
            });
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification id.",
            });
        }

        const notification = await Notification.findById(id);

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found.",
            });
        }

        // ==========================================
        // ✅ AUTHORIZATION (recipient & uploadedBy are ARRAYS)
        // ==========================================
        const uid = String(userId);

        const isRecipient = (notification.recipient || []).some(
            (r) => String(r) === uid
        );
        const isUploader = (notification.uploadedBy || []).some(
            (u) => String(u) === uid
        );
        const isAdmin = role === "admin";

        if (!isRecipient && !isUploader && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not allowed to modify this notification.",
            });
        }

        // Already read → idempotent success
        if (notification.isRead) {
            return res.status(200).json({
                success: true,
                message: "Notification was already marked as read.",
                data: { notification },
            });
        }

        // Use .save() so the pre("save") hook sets readAt automatically
        notification.isRead = true;
        await notification.save();

        // Recompute unread count for this user
        const filter = buildRoleFilter(role, userId);
        const unreadCount = await Notification.countDocuments({
            ...filter,
            isRead: false,
        });

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: {
                notification,
                unreadCount,
            },
        });
    } catch (error) {
        console.error("Error in markOneAsRead:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark notification as read",
            error: error.message,
        });
    }
};

module.exports = exports;