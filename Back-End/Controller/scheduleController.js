const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const DefenseAssignmentModel = require("../Models/Schedule");
const GroupModel = require("../Models/GroupName");
const UserModel = require("../Models/LogInSchema");

// ==========================================
// CREATE DEFENSE ASSIGNMENT
// ==========================================
exports.createDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    const {
        date,
        location,
        startTime,
        endTime,
        groupIds,
        panelistIds,
    } = req.body;

    console.log("Body", req.body)

    // basic validation
    if (!date) {
        return res.status(400).json({
            success: false,
            message: "Date is required",
        });
    }
    if (!location || location.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: "Location is required",
        });
    }
    if (!startTime || !endTime) {
        return res.status(400).json({
            success: false,
            message: "Start time and end time are required",
        });
    }
    if (!groupIds || groupIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one group is required",
        });
    }
    if (!panelistIds || panelistIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one panelist is required",
        });
    }
    if (startTime >= endTime) {
        return res.status(400).json({
            success: false,
            message: "End time must be after start time",
        });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({
            success: false,
            message: "Invalid date format. Use YYYY-MM-DD",
        });
    }

    // Check if groups exist
    const existingGroups = await GroupModel.find({ _id: { $in: groupIds } });
    if (existingGroups.length !== groupIds.length) {
        return res.status(404).json({
            success: false,
            message: "One or more groups not found",
        });
    }

    // Check if panelists exist
    const existingPanelists = await UserModel.find({ _id: { $in: panelistIds } });
    if (existingPanelists.length !== panelistIds.length) {
        return res.status(404).json({
            success: false,
            message: "One or more panelists not found",
        });
    }

    // ✅ Check for schedule conflicts (same date, overlapping time, shared group or panelist)
    const sameDayAssignments = await DefenseAssignmentModel.find({
        date,
        status: { $ne: "cancelled" },
    });

    const conflict = sameDayAssignments.find((assignment) => {
        const overlap = startTime < assignment.endTime && endTime > assignment.startTime;
        if (!overlap) return false;

        const sharedGroup = groupIds.some((g) =>
            assignment.groupIds.map(String).includes(String(g))
        );
        const sharedPanelist = panelistIds.some((p) =>
            assignment.panelistIds.map(String).includes(String(p))
        );

        return sharedGroup || sharedPanelist;
    });

    if (conflict) {
        return res.status(409).json({
            success: false,
            message: "Schedule conflict detected with an existing defense",
            conflictWith: {
                id: conflict._id,
                date: conflict.date,
                time: `${conflict.startTime} - ${conflict.endTime}`,
                location: conflict.location,
            },
        });
    }

    // Create the assignment
    const assignment = await DefenseAssignmentModel.create({
        date,
        location: location.trim(),
        startTime,
        endTime,
        timeRange: {
            start: startTime,
            end: endTime,
        },
        groupIds,
        panelistIds,
        createdBy: req.user?._id || null,
    });

    return res.status(201).json({
        status: "Success",
        message: "Defense assignment created successfully",
        data: assignment,
    });
});

// ==========================================
// GET ALL DEFENSE ASSIGNMENTS (with $lookup)
// ==========================================
exports.getAllDefenseAssignments = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - getAllDefenseAssignments");

    const { date, groupId, panelistId, status } = req.query;

    // Build $match filter
    const matchStage = {};
    if (date) matchStage.date = date;
    if (status) matchStage.status = status;
    if (groupId) {
        matchStage.groupIds = new mongoose.Types.ObjectId(groupId);
    }
    if (panelistId) {
        matchStage.panelistIds = new mongoose.Types.ObjectId(panelistId);
    }

    const assignments = await DefenseAssignmentModel.aggregate([
        // ===== 1. FILTER =====
        { $match: matchStage },

        // ===== 2. SORT =====
        { $sort: { date: 1, startTime: 1 } },

        // ===== 3. LOOKUP GROUPS =====
        {
            $lookup: {
                from: "groups",              // ✅ collection name (plural, lowercase)
                localField: "groupIds",
                foreignField: "_id",
                as: "groupIds",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            referralCode: 1,
                            sectionId: 1,
                        },
                    },
                ],
            },
        },

        // ===== 4. LOOKUP PANELISTS (UserLogin) =====
        {
            $lookup: {
                from: "userloginschemas",    // ⚠️ VERIFY: exact collection name
                localField: "panelistIds",
                foreignField: "_id",
                as: "panelistIds",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            first_name: 1,
                            last_name: 1,
                            middle_name: 1,
                            suffix: 1,
                            email: 1,
                            role: 1,
                        },
                    },
                ],
            },
        },

        // ===== 5. LOOKUP CREATED BY =====
        {
            $lookup: {
                from: "userloginschemas",    // ⚠️ VERIFY: exact collection name
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            first_name: 1,
                            last_name: 1,
                            email: 1,
                            role: 1,
                        },
                    },
                ],
            },
        },

        // ===== 6. UNWIND createdBy (single object, hindi array) =====
        {
            $unwind: {
                path: "$createdBy",
                preserveNullAndEmptyArrays: true,
            },
        },

        // ===== 7. ADD VIRTUAL FIELDS =====
        {
            $addFields: {
                // Full name para sa createdBy
                "createdBy.fullName": {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ["$createdBy.first_name", ""] },
                                " ",
                                { $ifNull: ["$createdBy.last_name", ""] },
                            ],
                        },
                    },
                },
                // Time range label (12-hour)
                timeRangeLabel: {
                    $concat: [
                        {
                            $let: {
                                vars: {
                                    h: { $toInt: { $substr: ["$startTime", 0, 2] } },
                                    m: { $substr: ["$startTime", 3, 2] },
                                },
                                in: {
                                    $concat: [
                                        {
                                            $cond: [
                                                { $eq: ["$$h", 0] },
                                                "12",
                                                {
                                                    $cond: [
                                                        { $gt: ["$$h", 12] },
                                                        { $toString: { $subtract: ["$$h", 12] } },
                                                        { $toString: "$$h" },
                                                    ],
                                                },
                                            ],
                                        },
                                        ":",
                                        "$$m",
                                        " ",
                                        { $cond: [{ $gte: ["$$h", 12] }, "PM", "AM"] },
                                    ],
                                },
                            },
                        },
                        " - ",
                        {
                            $let: {
                                vars: {
                                    h: { $toInt: { $substr: ["$endTime", 0, 2] } },
                                    m: { $substr: ["$endTime", 3, 2] },
                                },
                                in: {
                                    $concat: [
                                        {
                                            $cond: [
                                                { $eq: ["$$h", 0] },
                                                "12",
                                                {
                                                    $cond: [
                                                        { $gt: ["$$h", 12] },
                                                        { $toString: { $subtract: ["$$h", 12] } },
                                                        { $toString: "$$h" },
                                                    ],
                                                },
                                            ],
                                        },
                                        ":",
                                        "$$m",
                                        " ",
                                        { $cond: [{ $gte: ["$$h", 12] }, "PM", "AM"] },
                                    ],
                                },
                            },
                        },
                    ],
                },
            },
        },

        // ===== 8. FINAL PROJECT =====
        {
            $project: {
                _id: 1,
                date: 1,
                location: 1,
                startTime: 1,
                endTime: 1,
                timeRange: 1,
                timeRangeLabel: 1,
                groupIds: 1,
                panelistIds: 1,
                createdBy: 1,
                status: 1,
                remarks: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);

    return res.status(200).json({
        status: "Success",
        results: assignments.length,
        data: assignments,
    });
});
// ==========================================
// GET DEFENSE ASSIGNMENT BY ID
// ==========================================
exports.getDefenseAssignmentById = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - getDefenseAssignmentById");
    console.log(req.params);

    const { id } = req.params;

    const assignment = await DefenseAssignmentModel.findById(id)
        .populate("groupIds", "name code course")
        .populate("panelistIds", "name email department")
        .populate("createdBy", "name email");

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: "Defense assignment not found",
        });
    }

    return res.status(200).json({
        status: "Success",
        data: assignment,
    });
});

// ==========================================
// GET ASSIGNMENTS BY DATE
// ==========================================
exports.getAssignmentsByDate = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - getAssignmentsByDate");
    console.log(req.params);

    const { date } = req.params;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return res.status(400).json({
            success: false,
            message: "Invalid date format. Use YYYY-MM-DD",
        });
    }

    const assignments = await DefenseAssignmentModel.find({ date })
        .sort({ startTime: 1 })
        .populate("groupIds", "name code course")
        .populate("panelistIds", "name email department");

    return res.status(200).json({
        status: "Success",
        results: assignments.length,
        data: assignments,
    });
});

// ==========================================
// GET UPCOMING DEFENSES
// ==========================================
exports.getUpcomingDefenses = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - getUpcomingDefenses");

    const limit = parseInt(req.query.limit, 10) || 10;
    const today = new Date().toISOString().slice(0, 10);

    const assignments = await DefenseAssignmentModel.find({
        date: { $gte: today },
        status: { $ne: "cancelled" },
    })
        .sort({ date: 1, startTime: 1 })
        .limit(limit)
        .populate("groupIds", "name code course")
        .populate("panelistIds", "name email department");

    return res.status(200).json({
        status: "Success",
        results: assignments.length,
        data: assignments,
    });
});

// ==========================================
// UPDATE DEFENSE ASSIGNMENT
// ==========================================
exports.updateDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - updateDefenseAssignment");
    console.log(req.params);
    console.log(req.body);

    const { id } = req.params;
    const {
        date,
        location,
        startTime,
        endTime,
        groupIds,
        panelistIds,
        status,
        remarks,
    } = req.body;

    // Find existing assignment
    const existingAssignment = await DefenseAssignmentModel.findById(id);
    if (!existingAssignment) {
        return res.status(404).json({
            success: false,
            message: "Defense assignment not found",
        });
    }

    // Build update object
    const updateData = {};

    if (date !== undefined) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Use YYYY-MM-DD",
            });
        }
        updateData.date = date;
    }

    if (location !== undefined) {
        if (!location || location.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Location cannot be empty",
            });
        }
        updateData.location = location.trim();
    }

    if (startTime !== undefined) updateData.startTime = startTime;
    if (endTime !== undefined) updateData.endTime = endTime;

    // Validate time range
    const finalStart = updateData.startTime ?? existingAssignment.startTime;
    const finalEnd = updateData.endTime ?? existingAssignment.endTime;
    if (finalStart >= finalEnd) {
        return res.status(400).json({
            success: false,
            message: "End time must be after start time",
        });
    }

    // Update timeRange if time changed
    if (startTime !== undefined || endTime !== undefined) {
        updateData.timeRange = {
            start: finalStart,
            end: finalEnd,
        };
    }

    if (groupIds !== undefined) {
        if (groupIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one group is required",
            });
        }
        const existingGroups = await GroupModel.find({ _id: { $in: groupIds } });
        if (existingGroups.length !== groupIds.length) {
            return res.status(404).json({
                success: false,
                message: "One or more groups not found",
            });
        }
        updateData.groupIds = groupIds;
    }

    if (panelistIds !== undefined) {
        if (panelistIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one panelist is required",
            });
        }
        const existingPanelists = await UserModel.find({ _id: { $in: panelistIds } });
        if (existingPanelists.length !== panelistIds.length) {
            return res.status(404).json({
                success: false,
                message: "One or more panelists not found",
            });
        }
        updateData.panelistIds = panelistIds;
    }

    if (status !== undefined) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;

    // ✅ Conflict check (exclude self)
    if (startTime !== undefined || endTime !== undefined || date !== undefined || groupIds !== undefined || panelistIds !== undefined) {
        const finalDate = updateData.date ?? existingAssignment.date;
        const finalGroupIds = updateData.groupIds ?? existingAssignment.groupIds;
        const finalPanelistIds = updateData.panelistIds ?? existingAssignment.panelistIds;

        const sameDayAssignments = await DefenseAssignmentModel.find({
            _id: { $ne: id },
            date: finalDate,
            status: { $ne: "cancelled" },
        });

        const conflict = sameDayAssignments.find((assignment) => {
            const overlap = finalStart < assignment.endTime && finalEnd > assignment.startTime;
            if (!overlap) return false;

            const sharedGroup = finalGroupIds.some((g) =>
                assignment.groupIds.map(String).includes(String(g))
            );
            const sharedPanelist = finalPanelistIds.some((p) =>
                assignment.panelistIds.map(String).includes(String(p))
            );

            return sharedGroup || sharedPanelist;
        });

        if (conflict) {
            return res.status(409).json({
                success: false,
                message: "Schedule conflict detected with another defense",
                conflictWith: {
                    id: conflict._id,
                    date: conflict.date,
                    time: `${conflict.startTime} - ${conflict.endTime}`,
                    location: conflict.location,
                },
            });
        }
    }

    const updatedAssignment = await DefenseAssignmentModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    )
        .populate("groupIds", "name code course")
        .populate("panelistIds", "name email department");

    return res.status(200).json({
        status: "Success",
        message: "Defense assignment updated successfully",
        data: updatedAssignment,
    });
});

// ==========================================
// DELETE DEFENSE ASSIGNMENT
// ==========================================
exports.deleteDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - deleteDefenseAssignment");
    console.log(req.params);

    const { id } = req.params;

    const assignment = await DefenseAssignmentModel.findByIdAndDelete(id);

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: "Defense assignment not found",
        });
    }

    return res.status(200).json({
        status: "Success",
        message: "Defense assignment deleted successfully",
        data: assignment,
    });
});

// ==========================================
// CANCEL DEFENSE ASSIGNMENT (soft delete)
// ==========================================
exports.cancelDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - cancelDefenseAssignment");
    console.log(req.params);

    const { id } = req.params;

    const assignment = await DefenseAssignmentModel.findByIdAndUpdate(
        id,
        { status: "cancelled" },
        { new: true }
    );

    if (!assignment) {
        return res.status(404).json({
            success: false,
            message: "Defense assignment not found",
        });
    }

    return res.status(200).json({
        status: "Success",
        message: "Defense assignment cancelled",
        data: assignment,
    });
});

// ==========================================
// CHECK CONFLICT (standalone helper endpoint)
// ==========================================
exports.checkConflict = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called - checkConflict");
    console.log(req.body);

    const { date, startTime, endTime, groupIds, panelistIds, excludeId } = req.body;

    if (!date || !startTime || !endTime) {
        return res.status(400).json({
            success: false,
            message: "Date, start time, and end time are required",
        });
    }

    const filter = {
        date,
        status: { $ne: "cancelled" },
    };
    if (excludeId) filter._id = { $ne: excludeId };

    const sameDayAssignments = await DefenseAssignmentModel.find(filter);

    const conflicts = sameDayAssignments.filter((assignment) => {
        const overlap = startTime < assignment.endTime && endTime > assignment.startTime;
        if (!overlap) return false;

        const sharedGroup = (groupIds || []).some((g) =>
            assignment.groupIds.map(String).includes(String(g))
        );
        const sharedPanelist = (panelistIds || []).some((p) =>
            assignment.panelistIds.map(String).includes(String(p))
        );

        return sharedGroup || sharedPanelist;
    });

    return res.status(200).json({
        status: "Success",
        hasConflict: conflicts.length > 0,
        conflicts,
    });
});