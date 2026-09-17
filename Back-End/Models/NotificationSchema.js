const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
    {
        // ==========================================
        // GROUP
        // ==========================================
        groupId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            default: null,
            index: true,
        },

        // ==========================================
        // RECIPIENTS
        // Mga User na makakatanggap ng notification
        // ==========================================
        recipient: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],

        uploadedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        }],

        // ==========================================
        // NOTIFICATION TYPE
        // ==========================================
        type: {
            type: String,
            required: true,
            enum: [
                "Information",
                "Success",
                "Warning",
                "Error",

                // Proposed Title
                "ProposedTitleCreated",
                "ProposedTitleUpdated",
                "ProposedTitleApproved",
                "ProposedTitleRejected",

                // Maintenance
                "MaintenanceRequest",
                "AssignedTechnician",
                "ReassignedTechnician",
                "MaintenanceStarted",
                "MaintenanceCompleted",
                "MaintenanceCancelled",

                // Equipment
                "EquipmentAssigned",
                "EquipmentReturned",
                "EquipmentStatusChanged",

                // Approval
                "ForApproval",
                "Approved",
                "Rejected",

                // Leave
                "LeaveRequest",
                "LeaveApproved",
                "LeaveRejected",

                // Booking
                "BookingCreated",
                "BookingApproved",
                "BookingRejected",
                "BookingCancelled",

                // Account
                "AccountCreated",
                "AccountUpdated",

                // General
                "System",
                "Reminder",
            ],
            index: true,
        },

        // ==========================================
        // TITLE
        // ==========================================
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // ==========================================
        // MESSAGE
        // ==========================================
        message: {
            type: String,
            required: true,
            trim: true,
        },

        returnmessage: {
            type: String,
        },
        // ==========================================
        // RELATED MODULE / RECORD
        // ==========================================
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
            index: true,
        },

        referenceModel: {
            type: String,
            default: null,
            enum: [
                null,
                "User",
                "Group",
                "ProposedTitle",
                "RequestMaintenance",
                "MaintenanceRequest",
                "Equipment",
                "Leave",
                "Booking",
                "Order",
            ],
        },

        // ==========================================
        // OPTIONAL ACTION URL / ROUTE
        // ==========================================
        actionUrl: {
            type: String,
            default: null,
            trim: true,
        },

        // ==========================================
        // READ STATUS
        // ==========================================
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },

        readAt: {
            type: Date,
            default: null,
        },

        // ==========================================
        // PRIORITY
        // ==========================================
        priority: {
            type: String,
            enum: ["Low", "Normal", "High", "Urgent"],
            default: "Normal",
            index: true,
        },

        // ==========================================
        // EXTRA DATA
        // ==========================================
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // ==========================================
        // EXPIRATION
        // ==========================================
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// ==========================================
// INDEXES
// ==========================================

NotificationSchema.index({
    recipient: 1,
    isRead: 1,
    createdAt: -1,
});

NotificationSchema.index({
    recipient: 1,
    createdAt: -1,
});

NotificationSchema.index({
    groupId: 1,
    createdAt: -1,
});

NotificationSchema.index({
    uploadedBy: 1,
    createdAt: -1,
});

NotificationSchema.index({
    referenceId: 1,
    referenceModel: 1,
});

// ==========================================
// AUTO SET readAt
// ==========================================

NotificationSchema.pre("save", function (next) {
    if (this.isModified("isRead")) {
        if (this.isRead) {
            this.readAt = new Date();
        } else {
            this.readAt = null;
        }
    }

    next();
});

module.exports = mongoose.model("Notification", NotificationSchema);