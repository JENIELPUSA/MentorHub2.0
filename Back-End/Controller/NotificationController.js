const Notification = require("../Models/NotificationSchema");
const mongoose = require("mongoose");

exports.displayNotifications = async (req, res) => {
    try {

        const userId = req.user._id;
        const role = req.user.role;
        const { showAll, hideAll, page = 1, limit = 15 } = req.query;

        console.log("userId", userId)
        console.log("role", role)

        // Parse pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // ==========================================
        // BUILD FILTER BASED ON ROLE
        // ==========================================
        let filter = {};

        if (role === 'student') {
            // Student: match ang userId sa uploadedBy
            filter = { uploadedBy: userId };
        } else if (role === 'adviser') {
            // Adviser: match ang userId sa recipient
            filter = { recipient: userId };
        } else if (role === 'admin') {
            // Admin: walang filter, makita lahat
            filter = {};
        } else {
            // Default: walang filter
            filter = {};
        }

        console.log("Filter:", filter);

        // ==========================================
        // HIDE ALL - Mark all as read
        // ==========================================
        if (hideAll === "true") {
            const result = await Notification.updateMany(
                {
                    ...filter,
                    isRead: false,
                },
                {
                    isRead: true,
                    readAt: new Date(),
                }
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

        // Helper function to process notification messages based on role
        const processNotifications = (notifications) => {
            return notifications.map(notification => {
                // Convert to plain object para ma-modify
                const notif = notification.toObject ? notification.toObject() : notification;
                
                // Iba't ibang processing based sa role
                switch(role) {
                    case 'student':
                        // Student: gamitin ang returnmessage kung meron
                        if (notif.returnmessage) {
                            notif.message = notif.returnmessage;
                        }
                        // Optional: tanggalin ang returnmessage para hindi makita
                        // delete notif.returnmessage;
                        break;
                        
                    case 'admin':
                    case 'adviser':
                        // Admin at Adviser: tanggalin ang returnmessage field
                        delete notif.returnmessage;
                        // I-keep ang original message
                        break;
                        
                    default:
                        // Iba pang roles: tanggalin ang returnmessage
                        delete notif.returnmessage;
                        break;
                }
                
                return notif;
            });
        };

        // ==========================================
        // SHOW ALL - Get all notifications with pagination
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

            // Process notifications based on role
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
        // DEFAULT - Return unread notifications only with pagination
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

        // Process notifications based on role
        notifications = processNotifications(notifications);

        const unreadCount = total;

        res.status(200).json({
            success: true,
            message: "Unread notifications retrieved",
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
    } catch (error) {
        console.error("Error in display notifications:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process notification display",
            error: error.message,
        });
    }
};


module.exports = exports;