const mongoose = require("mongoose"); // ✅ FIXED: missing import
const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const DefenseAssignmentModel = require("../Models/Schedule");
const GroupModel = require("../Models/GroupName");
const UserModel = require("../Models/LogInSchema");
const ProposedTitle = require("../Models/ProposedTitle")

// ============================================================
// HELPERS
// ============================================================
const toMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
const isValidTime = (t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

const USER_POPULATE_FIELDS = "first_name middle_name last_name suffix email role";

// Shared populate config (used by CRUD + panelist endpoints)
const ASSIGNMENT_POPULATE = [
    { path: "groupIds", select: "name code course referralCode sectionId" },
    { path: "panelistIds", select: USER_POPULATE_FIELDS },
    { path: "panelists.panelistId", select: USER_POPULATE_FIELDS },
    { path: "createdBy", select: "first_name last_name email role" },
];

// Reusable conflict detector
const findConflict = async ({
    date,
    startTime,
    endTime,
    groupIds = [],
    panelistIds = [],
    excludeId = null,
}) => {
    const filter = { date, status: { $ne: "cancelled" } };
    if (excludeId) filter._id = { $ne: excludeId };

    const sameDay = await DefenseAssignmentModel.find(filter);

    const aStart = toMinutes(startTime);
    const aEnd = toMinutes(endTime);

    return sameDay.find((other) => {
        const bStart = toMinutes(other.startTime);
        const bEnd = toMinutes(other.endTime);
        const overlap = aStart < bEnd && aEnd > bStart;
        if (!overlap) return false;

        const otherGroups = (other.groupIds || []).map(String);
        const otherPanelists = (other.panelistIds || []).map(String);

        const sharedGroup = groupIds.some((g) => otherGroups.includes(String(g)));
        const sharedPanelist = panelistIds.some((p) =>
            otherPanelists.includes(String(p))
        );

        return sharedGroup || sharedPanelist;
    });
};

const conflictPayload = (conflict) => ({
    id: conflict._id,
    date: conflict.date,
    time: `${conflict.startTime} - ${conflict.endTime}`,
    location: conflict.location,
});

exports.createDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    const { date, location, startTime, endTime, groupIds, panelistIds } = req.body;

    // ---- Validate required fields ----
    if (!date) {
        return res.status(400).json({ success: false, message: "Date is required" });
    }
    if (!isValidDate(date)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
    }
    if (!location || location.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Location is required" });
    }
    if (!startTime || !endTime) {
        return res
            .status(400)
            .json({ success: false, message: "Start time and end time are required" });
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid time format. Use HH:mm (24-hour)" });
    }
    if (toMinutes(startTime) >= toMinutes(endTime)) {
        return res
            .status(400)
            .json({ success: false, message: "End time must be after start time" });
    }
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        return res
            .status(400)
            .json({ success: false, message: "At least one group is required" });
    }
    if (!Array.isArray(panelistIds) || panelistIds.length === 0) {
        return res
            .status(400)
            .json({ success: false, message: "At least one panelist is required" });
    }

    // ---- Auth check (createdBy is required in schema) ----
    if (!req.user?._id) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ---- Validate ObjectIds ----
    if (!groupIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid group ID format" });
    }
    if (!panelistIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid panelist ID format" });
    }

    // ---- Check existence ----
    const existingGroups = await GroupModel.find({ _id: { $in: groupIds } }).select("_id");
    if (existingGroups.length !== groupIds.length) {
        return res
            .status(404)
            .json({ success: false, message: "One or more groups not found" });
    }

    const existingPanelists = await UserModel.find({ _id: { $in: panelistIds } }).select(
        "_id role"
    );
    if (existingPanelists.length !== panelistIds.length) {
        return res
            .status(404)
            .json({ success: false, message: "One or more panelists not found" });
    }

    // ---- Conflict check ----
    const conflict = await findConflict({
        date,
        startTime,
        endTime,
        groupIds,
        panelistIds,
    });
    if (conflict) {
        return res.status(409).json({
            success: false,
            message: "Schedule conflict detected with an existing defense",
            conflictWith: conflictPayload(conflict),
        });
    }

    // ---- Create ----
    const assignment = await DefenseAssignmentModel.create({
        date,
        location: location.trim(),
        startTime,
        endTime,
        timeRange: { start: startTime, end: endTime },
        groupIds,
        panelistIds,
        createdBy: req.user._id,
    });

    await assignment.populate(ASSIGNMENT_POPULATE);

    return res.status(201).json({
        status: "Success",
        message: "Defense assignment created successfully",
        data: assignment,
    });
});


exports.getAllDefenseAssignments = AsyncErrorHandler(async (req, res, next) => {
    const userId = req.user._id;
    const role = req.user.role;
    const {
        date,
        scheduledAt,
        groupId,
        panelistId,
        status,
        page = 1,
        limit = 10,
        sortBy = 'date',
        sortOrder = 'asc',
    } = req.query;

    // ===== PAGINATION SANITIZE =====
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // ===== SORT =====
    const allowedSortFields = ['date', 'startTime', 'createdAt', 'updatedAt', 'status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const sortDir = sortOrder === 'desc' ? -1 : 1;
    const sortStage = { [sortField]: sortDir };
    if (sortField !== 'startTime') sortStage.startTime = sortDir;

    // ===== BUILD $MATCH FILTER =====
    const matchStage = {};

    if (status) matchStage.status = status;

    if (groupId) {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ success: false, message: "Invalid groupId format" });
        }
        matchStage.groupIds = new mongoose.Types.ObjectId(groupId);
    }

    if (role === "panelist") {
        matchStage.panelistIds = new mongoose.Types.ObjectId(userId);
    } else if (panelistId) {
        if (!mongoose.Types.ObjectId.isValid(panelistId)) {
            return res.status(400).json({ success: false, message: "Invalid panelistId format" });
        }
        matchStage.panelistIds = new mongoose.Types.ObjectId(panelistId);
    }

    if (date) {
        const d = new Date(`${date}T00:00:00.000Z`);
        if (isNaN(d.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD." });
        }
        const next = new Date(d);
        next.setUTCDate(next.getUTCDate() + 1);
        matchStage.date = { $gte: d, $lt: next };
    }

    if (scheduledAt) {
        const d = new Date(scheduledAt);
        if (isNaN(d.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid scheduledAt format." });
        }
        const next = new Date(d);
        next.setUTCDate(next.getUTCDate() + 1);
        matchStage.scheduledAt = { $gte: d, $lt: next };
    }

    const assignments = await DefenseAssignmentModel.aggregate([
        { $match: matchStage },
        { $sort: sortStage },

        // ===== GROUPS =====
        {
            $lookup: {
                from: "groups",
                localField: "groupIds",
                foreignField: "_id",
                as: "groupIds",
                pipeline: [
                    { $project: { _id: 1, name: 1, referralCode: 1, sectionId: 1 } },
                ],
            },
        },

        // ===== PROPOSED TITLE LOOKUP =====
        {
            $lookup: {
                from: ProposedTitle.collection.name,
                let: { assignmentGroupIds: "$groupIds._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ["$groupId", "$$assignmentGroupIds"] },
                        },
                    },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            description: 1,
                            status: 1,
                            topicCode: 1,
                            track: 1,
                            groupId: 1,
                            adviserId: 1,
                            coAdviserId: 1,
                            defenseSchedule: 1,
                            scopeStatus: 1,
                            panelDecision: 1,
                            createdAt: 1,

                            titleUrlTracking: 1,

                            completedChapters: 1,
                            nextAllowedChapter: 1,
                            lockedChapters: 1,
                            isAllChaptersCompleted: 1,
                            chapterProgressionApprovals: 1,
                            chapterProgressionApprovedBy: 1,
                            chapterProgressionApprovedAt: 1,
                        },
                    },
                ],
                as: "proposedTitle",
            },
        },
        {
            $addFields: {
                proposedTitle: { $arrayElemAt: ["$proposedTitle", 0] },
            },
        },

        // ⭐ Latest tracking per chapter
        {
            $addFields: {
                "proposedTitle.latestTracking": {
                    $map: {
                        input: {
                            $setUnion: [
                                {
                                    $map: {
                                        input: { $ifNull: ["$proposedTitle.titleUrlTracking", []] },
                                        as: "t",
                                        in: "$$t.chapter",
                                    },
                                },
                                [],
                            ],
                        },
                        as: "chapter",
                        in: {
                            $arrayElemAt: [
                                {
                                    $slice: [
                                        {
                                            $sortArray: {
                                                input: {
                                                    $filter: {
                                                        input: { $ifNull: ["$proposedTitle.titleUrlTracking", []] },
                                                        as: "t",
                                                        cond: { $eq: ["$$t.chapter", "$$chapter"] },
                                                    },
                                                },
                                                sortBy: { date: -1 },
                                            },
                                        },
                                        1,
                                    ],
                                },
                                0,
                            ],
                        },
                    },
                },
            },
        },

        // ===== ADVISER LOOKUP =====
        {
            $lookup: {
                from: "userloginschemas",
                localField: "proposedTitle.adviserId",
                foreignField: "_id",
                as: "adviserDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1, first_name: 1, last_name: 1,
                            middle_name: 1, suffix: 1, username: 1, role: 1,
                        },
                    },
                ],
            },
        },
        // ===== CO-ADVISER LOOKUP =====
        {
            $lookup: {
                from: "userloginschemas",
                localField: "proposedTitle.coAdviserId",
                foreignField: "_id",
                as: "coAdviserDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1, first_name: 1, last_name: 1,
                            middle_name: 1, suffix: 1, username: 1, role: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                "proposedTitle.adviser": { $arrayElemAt: ["$adviserDetails", 0] },
                "proposedTitle.coAdviser": { $arrayElemAt: ["$coAdviserDetails", 0] },
            },
        },
        {
            $addFields: {
                "proposedTitle.adviser.fullName": {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ["$proposedTitle.adviser.first_name", ""] },
                                " ",
                                { $ifNull: ["$proposedTitle.adviser.last_name", ""] },
                            ],
                        },
                    },
                },
                "proposedTitle.coAdviser.fullName": {
                    $trim: {
                        input: {
                            $concat: [
                                { $ifNull: ["$proposedTitle.coAdviser.first_name", ""] },
                                " ",
                                { $ifNull: ["$proposedTitle.coAdviser.last_name", ""] },
                            ],
                        },
                    },
                },
            },
        },

        // ===== DEFENSE SCHEDULE =====
        {
            $addFields: {
                defenseSchedule: "$proposedTitle.defenseSchedule",
            },
        },

        // ===== MEMBERS via referralCode → UserLogin.referredBy =====
        {
            $lookup: {
                from: "userloginschemas",
                let: {
                    referralCodes: {
                        $ifNull: [
                            {
                                $map: {
                                    input: { $ifNull: ["$groupIds", []] },
                                    as: "g",
                                    in: "$$g.referralCode",
                                },
                            },
                            [],
                        ],
                    },
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $in: ["$referredBy", "$$referralCodes"] },
                                    { $gt: [{ $size: "$$referralCodes" }, 0] },
                                ],
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            first_name: 1,
                            last_name: 1,
                            middle_name: 1,
                            suffix: 1,
                            username: 1,
                            role: 1,
                            referredBy: 1,
                            fullName: {
                                $trim: {
                                    input: {
                                        $concat: [
                                            { $ifNull: ["$first_name", ""] },
                                            " ",
                                            { $ifNull: ["$last_name", ""] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                ],
                as: "members",
            },
        },

        // ===== PANELISTS (UserLogin) =====
        {
            $lookup: {
                from: "userloginschemas",
                localField: "panelistIds",
                foreignField: "_id",
                as: "panelistIds",
                pipeline: [
                    {
                        $project: {
                            _id: 1, first_name: 1, last_name: 1,
                            middle_name: 1, suffix: 1, username: 1, role: 1,
                        },
                    },
                ],
            },
        },

        // ===== PANELIST SUB-ARRAY DETAILS =====
        {
            $lookup: {
                from: "userloginschemas",
                localField: "panelists.panelistId",
                foreignField: "_id",
                as: "panelistDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1, first_name: 1, last_name: 1,
                            middle_name: 1, suffix: 1, username: 1, role: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                panelists: {
                    $map: {
                        input: { $ifNull: ["$panelists", []] },
                        as: "p",
                        in: {
                            panelistId: "$$p.panelistId",
                            status: "$$p.status",
                            notes: "$$p.notes",
                            respondedAt: "$$p.respondedAt",
                            details: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$panelistDetails",
                                            cond: { $eq: ["$$this._id", "$$p.panelistId"] },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                },
            },
        },

        // ===== CREATED BY =====
        {
            $lookup: {
                from: "userloginschemas",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [
                    { $project: { _id: 1, first_name: 1, last_name: 1, username: 1, role: 1 } },
                ],
            },
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

        // ===== VIRTUAL FIELDS + isYouPanelist =====
        {
            $addFields: {
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

                // ⭐ isYouPanelist — TRUE lang kapag may panelist entry na confirmed si userId
                isYouPanelist: {
                    $cond: [
                        { $eq: [role, 'panelist'] },
                        {
                            $anyElementTrue: {
                                $map: {
                                    input: { $ifNull: ["$panelists", []] },
                                    as: "p",
                                    in: {
                                        $and: [
                                            { $eq: ["$$p.panelistId", new mongoose.Types.ObjectId(userId)] },
                                            { $eq: ["$$p.status", "confirmed"] },
                                        ],
                                    },
                                },
                            },
                        },
                        false,
                    ],
                },

                // ⭐ timeRangeLabel
                timeRangeLabel: {
                    $concat: [
                        { $ifNull: ["$startTime", ""] },
                        " – ",
                        { $ifNull: ["$endTime", ""] },
                    ],
                },
            },
        },

        // ===== CLEANUP intermediate fields =====
        {
            $project: {
                adviserDetails: 0,
                coAdviserDetails: 0,
                panelistDetails: 0,
            },
        },

        // ===== PAGINATION + COUNT via $facet =====
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limitNum },
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
                            panelists: 1,
                            members: 1,
                            createdBy: 1,
                            status: 1,
                            remarks: 1,
                            createdAt: 1,
                            updatedAt: 1,

                            proposedTitle: 1,
                            defenseSchedule: 1,

                            // ⭐ isYouPanelist — included in API response
                            isYouPanelist: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
        {
            $addFields: {
                totalCount: {
                    $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
                },
            },
        },
    ]);

    // ===== EXTRACT =====
    const payload = assignments[0] || { data: [], totalCount: 0 };
    const data = payload.data || [];
    const totalCount = payload.totalCount || 0;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    console.log("assignments", JSON.stringify(data, null, 2));

    return res.status(200).json({
        status: "Success",
        results: data.length,
        pagination: {
            page: pageNum,
            limit: limitNum,
            totalCount,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
        },
        filters: {
            date: date || null,
            scheduledAt: scheduledAt || null,
            status: status || null,
            groupId: groupId || null,
            panelistId: panelistId || null,
        },
        sort: {
            by: sortField,
            order: sortOrder === 'desc' ? 'desc' : 'asc',
        },
        data,
    });
});


exports.getDefenseAssignmentById = AsyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid assignment ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id).populate(
        ASSIGNMENT_POPULATE
    );

    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    return res.status(200).json({ status: "Success", data: assignment });
});

// ============================================================
// GET BY DATE
// ============================================================
exports.getAssignmentsByDate = AsyncErrorHandler(async (req, res, next) => {
    const { date } = req.params;

    if (!isValidDate(date)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
    }

    const assignments = await DefenseAssignmentModel.find({ date })
        .sort({ startTime: 1 })
        .populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        results: assignments.length,
        data: assignments,
    });
});

// ============================================================
// GET UPCOMING (with role-based restriction)
// ============================================================
exports.getUpcomingDefenses = AsyncErrorHandler(async (req, res, next) => {
    const limit = parseInt(req.query.limit, 10) || 10;
    const today = new Date().toISOString().slice(0, 10);

    const filter = {
        date: { $gte: today },
        status: { $ne: "cancelled" },
    };

    // ✅ FIXED: panelist should only see their own assignments
    if (req.user.role === "panelist") {
        filter.panelistIds = req.user._id;
    }

    const assignments = await DefenseAssignmentModel.find(filter)
        .sort({ date: 1, startTime: 1 })
        .limit(limit)
        .populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        results: assignments.length,
        data: assignments,
    });
});

// ============================================================
// UPDATE
// ============================================================
exports.updateDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { date, location, startTime, endTime, groupIds, panelistIds, status, remarks } =
        req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid assignment ID format" });
    }

    const existingAssignment = await DefenseAssignmentModel.findById(id);
    if (!existingAssignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    const updateData = {};

    if (date !== undefined) {
        if (!isValidDate(date)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid date format. Use YYYY-MM-DD" });
        }
        updateData.date = date;
    }

    if (location !== undefined) {
        if (!location || location.trim().length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Location cannot be empty" });
        }
        updateData.location = location.trim();
    }

    if (startTime !== undefined) {
        if (!isValidTime(startTime)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid startTime format" });
        }
        updateData.startTime = startTime;
    }
    if (endTime !== undefined) {
        if (!isValidTime(endTime)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid endTime format" });
        }
        updateData.endTime = endTime;
    }

    // Validate final time range
    const finalStart = updateData.startTime ?? existingAssignment.startTime;
    const finalEnd = updateData.endTime ?? existingAssignment.endTime;
    if (toMinutes(finalStart) >= toMinutes(finalEnd)) {
        return res
            .status(400)
            .json({ success: false, message: "End time must be after start time" });
    }

    if (startTime !== undefined || endTime !== undefined) {
        updateData.timeRange = { start: finalStart, end: finalEnd };
    }

    if (groupIds !== undefined) {
        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "At least one group is required" });
        }
        const existingGroups = await GroupModel.find({ _id: { $in: groupIds } }).select(
            "_id"
        );
        if (existingGroups.length !== groupIds.length) {
            return res
                .status(404)
                .json({ success: false, message: "One or more groups not found" });
        }
        updateData.groupIds = groupIds;
    }

    if (panelistIds !== undefined) {
        if (!Array.isArray(panelistIds) || panelistIds.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "At least one panelist is required" });
        }
        const existingPanelists = await UserModel.find({
            _id: { $in: panelistIds },
        }).select("_id");
        if (existingPanelists.length !== panelistIds.length) {
            return res
                .status(404)
                .json({ success: false, message: "One or more panelists not found" });
        }
        updateData.panelistIds = panelistIds;
    }

    if (status !== undefined) updateData.status = status;
    if (remarks !== undefined) updateData.remarks = remarks;

    // ---- Conflict check ----
    const finalDate = updateData.date ?? existingAssignment.date;
    const finalGroupIds = updateData.groupIds ?? existingAssignment.groupIds;
    const finalPanelistIds = updateData.panelistIds ?? existingAssignment.panelistIds;

    const conflict = await findConflict({
        date: finalDate,
        startTime: finalStart,
        endTime: finalEnd,
        groupIds: finalGroupIds,
        panelistIds: finalPanelistIds,
        excludeId: id,
    });

    if (conflict) {
        return res.status(409).json({
            success: false,
            message: "Schedule conflict detected with another defense",
            conflictWith: conflictPayload(conflict),
        });
    }

    const updatedAssignment = await DefenseAssignmentModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
    ).populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        message: "Defense assignment updated successfully",
        data: updatedAssignment,
    });
});

// ============================================================
// DELETE
// ============================================================
exports.deleteDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid assignment ID format" });
    }

    const assignment = await DefenseAssignmentModel.findByIdAndDelete(id);

    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    return res.status(200).json({
        status: "Success",
        message: "Defense assignment deleted successfully",
        data: assignment,
    });
});

// ============================================================
// CANCEL
// ============================================================
exports.cancelDefenseAssignment = AsyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid assignment ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id);
    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    if (assignment.status === "completed") {
        return res
            .status(409)
            .json({ success: false, message: "Cannot cancel a completed defense" });
    }
    if (assignment.status === "cancelled") {
        return res
            .status(400)
            .json({ success: false, message: "Defense is already cancelled" });
    }

    assignment.status = "cancelled";
    await assignment.save();
    await assignment.populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        message: "Defense assignment cancelled",
        data: assignment,
    });
});

// ============================================================
// CHECK CONFLICT (preview endpoint)
// ============================================================
exports.checkConflict = AsyncErrorHandler(async (req, res, next) => {
    const { date, startTime, endTime, groupIds, panelistIds, excludeId } = req.body;

    if (!date || !startTime || !endTime) {
        return res.status(400).json({
            success: false,
            message: "Date, start time, and end time are required",
        });
    }

    const conflicts = await DefenseAssignmentModel.find({
        date,
        status: { $ne: "cancelled" },
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });

    const aStart = toMinutes(startTime);
    const aEnd = toMinutes(endTime);

    const matches = conflicts.filter((other) => {
        const bStart = toMinutes(other.startTime);
        const bEnd = toMinutes(other.endTime);
        const overlap = aStart < bEnd && aEnd > bStart;
        if (!overlap) return false;

        const sharedGroup = (groupIds || []).some((g) =>
            (other.groupIds || []).map(String).includes(String(g))
        );
        const sharedPanelist = (panelistIds || []).some((p) =>
            (other.panelistIds || []).map(String).includes(String(p))
        );

        return sharedGroup || sharedPanelist;
    });

    return res.status(200).json({
        status: "Success",
        hasConflict: matches.length > 0,
        conflicts: matches,
    });
});

// ============================================================
// 🆕 CHANGE STATUS
// ============================================================
exports.changeDefenseStatus = AsyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const VALID_STATUSES = ["scheduled", "ongoing", "completed", "cancelled"];
    if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
        });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid assignment ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id);
    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    if (assignment.status === status) {
        return res
            .status(400)
            .json({ success: false, message: `Defense is already "${status}".` });
    }

    const TRANSITIONS = {
        scheduled: ["ongoing", "cancelled"],
        ongoing: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
    };

    const allowed = TRANSITIONS[assignment.status] || [];
    if (!allowed.includes(status)) {
        return res.status(409).json({
            success: false,
            message: `Invalid status transition: "${assignment.status}" → "${status}".`,
            allowedTransitions: allowed,
        });
    }

    // Business rule: cannot start if may pending panelists
    if (status === "ongoing") {
        const pending = (assignment.panelists || []).filter(
            (p) => p.status === "pending"
        );
        if (pending.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Cannot start defense. ${pending.length} panelist(s) still pending.`,
                pendingPanelistIds: pending.map((p) => p.panelistId),
            });
        }
    }

    assignment.status = status;
    if (remarks !== undefined) assignment.remarks = remarks;

    await assignment.save();
    await assignment.populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        message: `Defense status changed to "${status}".`,
        data: assignment,
    });
});

// ============================================================
// 🆕 CONFIRM PANELIST
// ============================================================
exports.confirmPanelist = AsyncErrorHandler(async (req, res, next) => {
    const { id, panelistId } = req.params;
    const { notes = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(panelistId)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id);
    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    if (["completed", "cancelled"].includes(assignment.status)) {
        return res.status(409).json({
            success: false,
            message: `Cannot confirm panelist. Defense is already "${assignment.status}".`,
        });
    }

    try {
        await assignment.confirmPanelist(panelistId, notes);
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }

    await assignment.populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        message: "Panelist confirmed successfully.",
        data: assignment,
    });
});

// ============================================================
// 🆕 REJECT PANELIST (soft delete)
// ============================================================
exports.rejectPanelist = AsyncErrorHandler(async (req, res, next) => {
    const { id, panelistId } = req.params;
    const { notes = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(panelistId)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id);
    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    if (["completed", "cancelled"].includes(assignment.status)) {
        return res.status(409).json({
            success: false,
            message: `Cannot reject panelist. Defense is already "${assignment.status}".`,
        });
    }

    let result;
    try {
        result = await assignment.rejectPanelist(panelistId, notes);
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }

    await assignment.populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        message: "Panelist rejected successfully. Assign a replacement.",
        rejectedPanelist: result,
        data: assignment,
    });
});

// ============================================================
// 🆕 RESET PANELIST RESPONSE
// ============================================================
exports.resetPanelistResponse = AsyncErrorHandler(async (req, res, next) => {
    const { id, panelistId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(panelistId)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id);
    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    if (["completed", "cancelled"].includes(assignment.status)) {
        return res.status(409).json({
            success: false,
            message: `Cannot reset panelist. Defense is already "${assignment.status}".`,
        });
    }

    try {
        await assignment.resetPanelistResponse(panelistId);
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }

    await assignment.populate(ASSIGNMENT_POPULATE);

    return res.status(200).json({
        status: "Success",
        message: "Panelist response reset to pending.",
        data: assignment,
    });
});

// ============================================================
// 🆕 ADD REPLACEMENT PANELIST
// ============================================================
exports.addPanelist = AsyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;
    const { panelistId } = req.body;

    if (!panelistId) {
        return res
            .status(400)
            .json({ success: false, message: "panelistId is required." });
    }

    if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(panelistId)
    ) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id);
    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    if (["completed", "cancelled"].includes(assignment.status)) {
        return res.status(409).json({
            success: false,
            message: `Cannot add panelist. Defense is already "${assignment.status}".`,
        });
    }

    const panelist = await UserModel.findById(panelistId).select("first_name last_name role");
    if (!panelist) {
        return res
            .status(404)
            .json({ success: false, message: "Panelist not found." });
    }
    if (!["panelist", "faculty"].includes(panelist.role)) {
        return res.status(400).json({
            success: false,
            message: `User "${panelist.first_name} ${panelist.last_name}" is not a panelist/faculty.`,
        });
    }

    // Conflict check for new panelist (same date/time)
    const conflicting = await DefenseAssignmentModel.findOne({
        _id: { $ne: assignment._id },
        date: assignment.date,
        status: { $ne: "cancelled" },
        panelistIds: panelistId,
    });

    if (conflicting) {
        const aStart = toMinutes(assignment.startTime);
        const aEnd = toMinutes(assignment.endTime);
        const bStart = toMinutes(conflicting.startTime);
        const bEnd = toMinutes(conflicting.endTime);
        if (aStart < bEnd && aEnd > bStart) {
            return res.status(409).json({
                success: false,
                message: "Panelist has a conflicting defense on the same time slot.",
                conflictWith: conflictPayload(conflicting),
            });
        }
    }

    try {
        await assignment.addPanelist(panelistId);
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }

    await assignment.populate(ASSIGNMENT_POPULATE);

    return res.status(201).json({
        status: "Success",
        message: "Replacement panelist added successfully.",
        data: assignment,
    });
});

// ============================================================
// 🆕 GET PANELIST STATUS SUMMARY
// ============================================================
exports.getPanelistStatus = AsyncErrorHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res
            .status(400)
            .json({ success: false, message: "Invalid assignment ID format" });
    }

    const assignment = await DefenseAssignmentModel.findById(id).populate(
        ASSIGNMENT_POPULATE
    );
    if (!assignment) {
        return res
            .status(404)
            .json({ success: false, message: "Defense assignment not found" });
    }

    return res.status(200).json({
        status: "Success",
        defenseStatus: assignment.status,
        summary: assignment.panelistSummary,
        panelists: assignment.panelists,
    });
});