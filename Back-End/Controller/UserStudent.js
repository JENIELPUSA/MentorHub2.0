const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const StudentModel = require("../Models/Student");
const UserModel = require("../Models/UserSchema");
const UserLogin = require("../Models/LogInSchema");
const mongoose = require("mongoose");

// ==========================================
// 1. GET ALL USERS (STUDENTS & INSTRUCTORS)
// ==========================================
exports.DisplayAllData = AsyncErrorHandler(async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
        search,
        yearLevel,
        departmentId,
        gender,
        course,
        role,
        status,
        isActive,
        sortBy = "createdAt",
        sortOrder = "desc"
    } = req.query;

    const matchStage = {};

    // ==========================================
    // SEARCH FILTER
    // ==========================================
    if (search) {
        matchStage.$or = [
            { first_name: { $regex: search.trim(), $options: "i" } },
            { last_name: { $regex: search.trim(), $options: "i" } },
            { course: { $regex: search.trim(), $options: "i" } },
            { major: { $regex: search.trim(), $options: "i" } },
            { address: { $regex: search.trim(), $options: "i" } },
            { username: { $regex: search.trim(), $options: "i" } },
        ];
    }

    // ==========================================
    // ROLE FILTER
    // ==========================================
    if (role) {
        const roles = role.split(",");
        matchStage.role = { $in: roles };
    }

    // ==========================================
    // YEAR LEVEL FILTER
    // ==========================================
    if (yearLevel) {
        const yearLevels = yearLevel.split(",");
        matchStage.yearLevel = { $in: yearLevels };
    }

    // ==========================================
    // DEPARTMENT FILTER
    // ==========================================
    if (departmentId) {
        matchStage.departmentId = new mongoose.Types.ObjectId(departmentId);
    }

    // ==========================================
    // GENDER FILTER
    // ==========================================
    if (gender) {
        matchStage.gender = gender;
    }

    // ==========================================
    // COURSE FILTER
    // ==========================================
    if (course) {
        matchStage.course = { $regex: course.trim(), $options: "i" };
    }

    // ==========================================
    // STATUS FILTER
    // ==========================================
    if (status) {
        matchStage.status = status;
    }

    // ==========================================
    // ISACTIVE FILTER
    // ==========================================
    if (isActive !== undefined) {
        matchStage.isActive = isActive === "true";
    }

    // ==========================================
    // SORTING
    // ==========================================
    const sortStage = {};
    sortStage[sortBy] = sortOrder === "desc" ? -1 : 1;

    // ==========================================
    // AGGREGATION PIPELINE - USERLOGIN LANG
    // ==========================================
    const result = await UserLogin.aggregate([
        // ==========================================
        // MATCH: Apply filters
        // ==========================================
        { $match: matchStage },

        // ==========================================
        // LOOKUP: Department details
        // ==========================================
        {
            $lookup: {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "departmentDetails",
            }
        },

        // ==========================================
        // LOOKUP: Group details
        // ==========================================
        {
            $lookup: {
                from: "groups",
                localField: "groupId",
                foreignField: "_id",
                as: "groupDetails",
            }
        },

        // ==========================================
        // UNWIND: Department at Group
        // ==========================================
        {
            $unwind: {
                path: "$departmentDetails",
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $unwind: {
                path: "$groupDetails",
                preserveNullAndEmptyArrays: true
            }
        },

        // ==========================================
        // COMPUTE FULL NAME AND AGE
        // ==========================================
        {
            $addFields: {
                fullName: {
                    $trim: {
                        input: {
                            $concat: [
                                "$first_name",
                                " ",
                                { $ifNull: ["$middle_name", ""] },
                                { $cond: [{ $ne: ["$middle_name", null] }, " ", ""] },
                                "$last_name",
                                { $cond: [{ $ne: ["$suffix", null] }, " ", ""] },
                                { $ifNull: ["$suffix", ""] },
                            ],
                        },
                    },
                },
                age: {
                    $cond: [
                        { $ne: ["$birthDate", null] },
                        {
                            $floor: {
                                $divide: [
                                    { $subtract: [new Date(), "$birthDate"] },
                                    31557600000
                                ]
                            }
                        },
                        null
                    ]
                }
            }
        },

        // ==========================================
        // SORTING
        // ==========================================
        { $sort: sortStage },

        // ==========================================
        // PROJECT: Select fields to display
        // ==========================================
        {
            $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                middle_name: 1,
                suffix: 1,
                username: 1,
                role: 1,
                departmentId: 1,
                groupId: 1,
                yearLevel: 1,
                course: 1,
                major: 1,
                address: 1,
                gender: 1,
                birthDate: 1,
                contactNumber: 1,
                referralCode: 1,
                referredBy: 1,
                isActive: 1,
                isVerified: 1,
                status: 1,
                theme: 1,
                avatar: 1,
                fullName: 1,
                age: 1,
                createdAt: 1,
                updatedAt: 1,
                laboratoryId: 1,

                // Department Details
                department: {
                    _id: "$departmentDetails._id",
                    departmentName: "$departmentDetails.departmentName",
                    departmentCode: "$departmentDetails.departmentCode",
                },

                // Group Details
                group: {
                    _id: "$groupDetails._id",
                    name: "$groupDetails.name",
                },
            },
        },

        // ==========================================
        // FACET: Pagination and Statistics
        // ==========================================
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                ],
                totalCount: [{ $count: "count" }],
                statistics: [
                    {
                        $group: {
                            _id: null,
                            totalUsers: { $sum: 1 },
                            maleCount: {
                                $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] }
                            },
                            femaleCount: {
                                $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] }
                            },
                            studentCount: {
                                $sum: { $cond: [{ $eq: ["$role", "student"] }, 1, 0] }
                            },
                            instructorCount: {
                                $sum: { $cond: [{ $eq: ["$role", "subject_instructor"] }, 1, 0] }
                            },
                            adminCount: {
                                $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] }
                            },
                            activeCount: {
                                $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] }
                            },
                            inactiveCount: {
                                $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] }
                            },
                            verifiedCount: {
                                $sum: { $cond: [{ $eq: ["$isVerified", true] }, 1, 0] }
                            },
                            unverifiedCount: {
                                $sum: { $cond: [{ $eq: ["$isVerified", false] }, 1, 0] }
                            },
                            yearLevelStats: {
                                $push: "$yearLevel"
                            },
                            roles: {
                                $addToSet: "$role"
                            },
                            statuses: {
                                $addToSet: "$status"
                            }
                        }
                    },
                    {
                        $project: {
                            totalUsers: 1,
                            maleCount: 1,
                            femaleCount: 1,
                            studentCount: 1,
                            instructorCount: 1,
                            adminCount: 1,
                            activeCount: 1,
                            inactiveCount: 1,
                            verifiedCount: 1,
                            unverifiedCount: 1,
                            roles: 1,
                            statuses: 1,
                            yearLevelStats: 1,
                        }
                    }
                ]
            },
        },
    ]);

    const users = result[0]?.data || [];
    const totalCount = result[0]?.totalCount[0]?.count || 0;
    const statistics = result[0]?.statistics[0] || {};

    // Compute year level distribution
    const yearLevelCounts = {};
    if (statistics.yearLevelStats) {
        statistics.yearLevelStats.forEach(level => {
            if (level) {
                yearLevelCounts[level] = (yearLevelCounts[level] || 0) + 1;
            }
        });
    }

    res.status(200).json({
        status: "success",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit) || 0,
            totalCount,
            results: users.length,
            limit,
        },
        filters: {
            search: search || null,
            role: role || null,
            yearLevel: yearLevel || null,
            departmentId: departmentId || null,
            gender: gender || null,
            course: course || null,
            status: status || null,
            isActive: isActive || null,
        },
        statistics: {
            totalUsers: statistics.totalUsers || 0,
            maleCount: statistics.maleCount || 0,
            femaleCount: statistics.femaleCount || 0,
            studentCount: statistics.studentCount || 0,
            instructorCount: statistics.instructorCount || 0,
            adminCount: statistics.adminCount || 0,
            activeCount: statistics.activeCount || 0,
            inactiveCount: statistics.inactiveCount || 0,
            verifiedCount: statistics.verifiedCount || 0,
            unverifiedCount: statistics.unverifiedCount || 0,
            roles: statistics.roles || [],
            statuses: statistics.statuses || [],
            yearLevelDistribution: yearLevelCounts,
        },
        data: users,
    });
});
// ==========================================
// 2. GET USERS WITH LOGIN DETAILS
// ==========================================
exports.DisplayUsersWithLogin = AsyncErrorHandler(async (req, res) => {
    console.log("DisplayUsersWithLogin Triggered");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
        search,
        departmentId,
        gender,
        isActive,
        role,
        statusAccount,
        isVerified,
        sortBy = "createdAt",
        sortOrder = "desc"
    } = req.query;

    const matchStage = {};

    // ==========================================
    // SEARCH FILTER
    // ==========================================
    if (search) {
        matchStage.$or = [
            { first_name: { $regex: search.trim(), $options: "i" } },
            { last_name: { $regex: search.trim(), $options: "i" } },
            { email: { $regex: search.trim(), $options: "i" } },
        ];
    }

    // ==========================================
    // DEPARTMENT FILTER
    // ==========================================
    if (departmentId) {
        const deptIds = departmentId.split(",").map(id =>
            new mongoose.Types.ObjectId(id)
        );
        matchStage.departmentId = { $in: deptIds };
    }

    // ==========================================
    // GENDER FILTER
    // ==========================================
    if (gender) {
        matchStage.gender = gender;
    }

    // ==========================================
    // SORTING
    // ==========================================
    const sortStage = {};
    sortStage[sortBy] = sortOrder === "desc" ? -1 : 1;

    // ==========================================
    // AGGREGATION PIPELINE
    // ==========================================
    const result = await UserModel.aggregate([
        { $match: matchStage },

        {
            $lookup: {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "departmentDetails",
            },
        },

        {
            $lookup: {
                from: "logins",
                localField: "_id",
                foreignField: "linkedId",
                as: "loginDetails",
            },
        },

        {
            $addFields: {
                departmentDetails: { $arrayElemAt: ["$departmentDetails", 0] },
                loginDetails: { $arrayElemAt: ["$loginDetails", 0] },
            },
        },

        {
            $match: isActive !== undefined ? {
                "loginDetails.isActive": isActive === "true"
            } : {},
        },

        {
            $match: role ? {
                "loginDetails.role": role
            } : {},
        },

        {
            $match: statusAccount ? {
                "loginDetails.statusAccount": statusAccount
            } : {},
        },

        {
            $match: isVerified !== undefined ? {
                "loginDetails.isVerified": isVerified === "true"
            } : {},
        },

        {
            $addFields: {
                fullName: {
                    $trim: {
                        input: {
                            $concat: [
                                "$first_name",
                                " ",
                                { $ifNull: ["$middle_name", ""] },
                                { $cond: [{ $ne: ["$middle_name", null] }, " ", ""] },
                                "$last_name",
                                { $cond: [{ $ne: ["$suffix", null] }, " ", ""] },
                                { $ifNull: ["$suffix", ""] },
                            ],
                        },
                    },
                },
                age: {
                    $cond: [
                        { $ne: ["$birthDate", null] },
                        {
                            $floor: {
                                $divide: [
                                    { $subtract: [new Date(), "$birthDate"] },
                                    31557600000
                                ]
                            }
                        },
                        null
                    ]
                }
            },
        },

        { $sort: sortStage },

        {
            $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                middle_name: 1,
                suffix: 1,
                gender: 1,
                birthDate: 1,
                age: 1,
                contactNumber: 1,
                email: 1,
                isActive: 1,
                avatar: 1,
                departmentId: 1,
                referralCode: 1,
                referredBy: 1,
                createdAt: 1,
                updatedAt: 1,
                fullName: 1,

                department: {
                    _id: "$departmentDetails._id",
                    departmentName: "$departmentDetails.departmentName",
                    departmentCode: "$departmentDetails.departmentCode",
                },

                login: {
                    _id: "$loginDetails._id",
                    username: "$loginDetails.username",
                    email: "$loginDetails.email",
                    role: "$loginDetails.role",
                    selectedrole: "$loginDetails.selectedrole",
                    statusAccount: "$loginDetails.statusAccount",
                    isVerified: "$loginDetails.isVerified",
                    isActive: "$loginDetails.isActive",
                    lastLogin: "$loginDetails.lastLogin",
                    theme: "$loginDetails.theme",
                    linkedId: "$loginDetails.linkedId",
                    createdAt: "$loginDetails.createdAt",
                    updatedAt: "$loginDetails.updatedAt",
                },
            },
        },

        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                ],
                totalCount: [{ $count: "count" }],
                statistics: [
                    {
                        $group: {
                            _id: null,
                            totalUsers: { $sum: 1 },
                            maleCount: {
                                $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] }
                            },
                            femaleCount: {
                                $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] }
                            },
                            activeUsers: {
                                $sum: { $cond: ["$isActive", 1, 0] }
                            },
                            activeLogin: {
                                $sum: { $cond: ["$loginDetails.isActive", 1, 0] }
                            },
                            verifiedLogin: {
                                $sum: { $cond: ["$loginDetails.isVerified", 1, 0] }
                            },
                            hasLogin: {
                                $sum: { $cond: [{ $ne: ["$loginDetails._id", null] }, 1, 0] }
                            },
                            roles: {
                                $addToSet: "$loginDetails.role"
                            },
                            statusAccounts: {
                                $addToSet: "$loginDetails.statusAccount"
                            }
                        }
                    },
                    {
                        $project: {
                            totalUsers: 1,
                            maleCount: 1,
                            femaleCount: 1,
                            activeUsers: 1,
                            inactiveUsers: {
                                $subtract: ["$totalUsers", "$activeUsers"]
                            },
                            activeLogin: 1,
                            inactiveLogin: {
                                $subtract: ["$totalUsers", "$activeLogin"]
                            },
                            verifiedLogin: 1,
                            unverifiedLogin: {
                                $subtract: ["$totalUsers", "$verifiedLogin"]
                            },
                            hasLogin: 1,
                            noLogin: {
                                $subtract: ["$totalUsers", "$hasLogin"]
                            },
                            roles: 1,
                            statusAccounts: 1,
                        }
                    }
                ]
            },
        },
    ]);

    const users = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;
    const statistics = result[0].statistics[0] || {};

    res.status(200).json({
        status: "success",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            results: users.length,
            limit,
        },
        filters: {
            search: search || null,
            departmentId: departmentId || null,
            gender: gender || null,
            isActive: isActive || null,
            role: role || null,
            statusAccount: statusAccount || null,
            isVerified: isVerified || null,
        },
        statistics: {
            totalUsers: statistics.totalUsers || 0,
            maleCount: statistics.maleCount || 0,
            femaleCount: statistics.femaleCount || 0,
            activeUsers: statistics.activeUsers || 0,
            inactiveUsers: statistics.inactiveUsers || 0,
            activeLogin: statistics.activeLogin || 0,
            inactiveLogin: statistics.inactiveLogin || 0,
            verifiedLogin: statistics.verifiedLogin || 0,
            unverifiedLogin: statistics.unverifiedLogin || 0,
            hasLogin: statistics.hasLogin || 0,
            noLogin: statistics.noLogin || 0,
            roles: statistics.roles || [],
            statusAccounts: statistics.statusAccounts || [],
        },
        data: users,
    });
});

// ==========================================
// GET ADVISER DROPDOWN OPTIONS
// ==========================================
exports.GetAdviserDropdownOptions = AsyncErrorHandler(async (req, res) => {
    console.log("GetAdviserDropdownOptions Triggered");

    const advisers = await UserLogin.find({
        status: "Active",
        role: { $in: ["adviser", "panelist"] }  // ← TAMA!
    })
        .select("_id first_name last_name email username role")
        .lean();
    res.status(200).json({
        success: true,
        data: advisers,
        total: advisers.length,
    });
});