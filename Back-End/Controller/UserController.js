const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const StudentModel = require("../Models/Student");
const UserModel = require("../Models/UserSchema"); // ✅ Kailangan!
const LoginModel = require("../Models/LogInSchema");
const mongoose = require("mongoose");

exports.DisplayStudentsWithUsers = AsyncErrorHandler(async (req, res) => {
    console.log("DisplayStudentsWithUsers Triggered");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const {
        search,
        yearLevel,
        departmentId,
        gender,
        course,
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
            { course: { $regex: search.trim(), $options: "i" } },
            { major: { $regex: search.trim(), $options: "i" } },
            { address: { $regex: search.trim(), $options: "i" } },
        ];
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
    // COURSE FILTER
    // ==========================================
    if (course) {
        matchStage.course = { $regex: course.trim(), $options: "i" };
    }

    // ==========================================
    // SORTING
    // ==========================================
    const sortStage = {};
    sortStage[sortBy] = sortOrder === "desc" ? -1 : 1;

    // ==========================================
    // AGGREGATION PIPELINE
    // ==========================================
    const result = await StudentModel.aggregate([
        // 1. Match/Filter students
        { $match: matchStage },

        // 2. Lookup User details using userId
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userDetails",
            },
        },

        // 3. Lookup Department details
        {
            $lookup: {
                from: "departments",
                localField: "departmentId",
                foreignField: "_id",
                as: "departmentDetails",
            },
        },

        // 4. Lookup Group details
        {
            $lookup: {
                from: "groups",
                localField: "groupId",
                foreignField: "_id",
                as: "groupDetails",
            },
        },

        // 5. Extract user, department, group
        {
            $addFields: {
                userDetails: { $arrayElemAt: ["$userDetails", 0] },
                departmentDetails: { $arrayElemAt: ["$departmentDetails", 0] },
                groupDetails: { $arrayElemAt: ["$groupDetails", 0] },
            },
        },

        // 6. Lookup Login details using userDetails._id → linkedId
        {
            $lookup: {
                from: "logins",
                let: { userId: "$userDetails._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ["$linkedId", "$$userId"]
                            }
                        }
                    },
                    { $limit: 1 }
                ],
                as: "loginDetails",
            },
        },

        // 7. Extract login details
        {
            $addFields: {
                loginDetails: { $arrayElemAt: ["$loginDetails", 0] },
            },
        },

        // 8. Filter by login isActive if provided
        {
            $match: isActive !== undefined ? {
                "loginDetails.isActive": isActive === "true"
            } : {},
        },

        // 9. Filter by login role if provided
        {
            $match: role ? {
                "loginDetails.role": role
            } : {},
        },

        // 10. Filter by login statusAccount if provided
        {
            $match: statusAccount ? {
                "loginDetails.statusAccount": statusAccount
            } : {},
        },

        // 11. Filter by login isVerified if provided
        {
            $match: isVerified !== undefined ? {
                "loginDetails.isVerified": isVerified === "true"
            } : {},
        },

        // 12. Add computed fields
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

        // 13. Sort
        { $sort: sortStage },

        // 14. Project/Select fields - COMBINED Student + User + Login
        {
            $project: {
                // ==========================================
                // STUDENT FIELDS
                // ==========================================
                _id: 1,
                first_name: 1,
                last_name: 1,
                middle_name: 1,
                suffix: 1,
                gender: 1,
                birthDate: 1,
                age: 1,
                contactNumber: 1,
                address: 1,
                yearLevel: 1,
                course: 1,
                major: 1,
                referralCode: 1,
                referredBy: 1,
                createdAt: 1,
                updatedAt: 1,
                fullName: 1,

                // ==========================================
                // USER FIELDS (from User model)
                // ==========================================
                user: {
                    _id: "$userDetails._id",
                    email: "$userDetails.email",
                    isActive: "$userDetails.isActive",
                    avatar: "$userDetails.avatar",
                    contactNumber: "$userDetails.contactNumber",
                    fullName: "$userDetails.fullName",
                    departmentId: "$userDetails.departmentId",
                },

                // ==========================================
                // LOGIN FIELDS (from Login model via linkedId)
                // ==========================================
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

                // ==========================================
                // DEPARTMENT FIELDS
                // ==========================================
                department: {
                    _id: "$departmentDetails._id",
                    departmentName: "$departmentDetails.departmentName",
                    departmentCode: "$departmentDetails.departmentCode",
                },

                // ==========================================
                // GROUP FIELDS
                // ==========================================
                group: {
                    _id: "$groupDetails._id",
                    name: "$groupDetails.name",
                },
            },
        },

        // 15. Pagination using facet
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
                            totalStudents: { $sum: 1 },
                            maleCount: {
                                $sum: { $cond: [{ $eq: ["$gender", "male"] }, 1, 0] }
                            },
                            femaleCount: {
                                $sum: { $cond: [{ $eq: ["$gender", "female"] }, 1, 0] }
                            },
                            yearLevelStats: {
                                $push: "$yearLevel"
                            },
                            activeUsers: {
                                $sum: { $cond: ["$userDetails.isActive", 1, 0] }
                            },
                            activeLogin: {
                                $sum: { $cond: ["$loginDetails.isActive", 1, 0] }
                            },
                            verifiedLogin: {
                                $sum: { $cond: ["$loginDetails.isVerified", 1, 0] }
                            },
                            hasUser: {
                                $sum: { $cond: [{ $ne: ["$userDetails._id", null] }, 1, 0] }
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
                            totalStudents: 1,
                            maleCount: 1,
                            femaleCount: 1,
                            activeUsers: 1,
                            inactiveUsers: {
                                $subtract: ["$totalStudents", "$activeUsers"]
                            },
                            activeLogin: 1,
                            inactiveLogin: {
                                $subtract: ["$totalStudents", "$activeLogin"]
                            },
                            verifiedLogin: 1,
                            unverifiedLogin: {
                                $subtract: ["$totalStudents", "$verifiedLogin"]
                            },
                            hasUser: 1,
                            noUser: {
                                $subtract: ["$totalStudents", "$hasUser"]
                            },
                            hasLogin: 1,
                            noLogin: {
                                $subtract: ["$totalStudents", "$hasLogin"]
                            },
                            roles: 1,
                            statusAccounts: 1,
                            yearLevelStats: 1,
                        }
                    }
                ]
            },
        },
    ]);

    // ==========================================
    // EXTRACT DATA
    // ==========================================
    const students = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;
    const statistics = result[0].statistics[0] || {};

    // Count per year level
    const yearLevelCounts = {};
    if (statistics.yearLevelStats) {
        statistics.yearLevelStats.forEach(level => {
            if (level) {
                yearLevelCounts[level] = (yearLevelCounts[level] || 0) + 1;
            }
        });
    }

    // ==========================================
    // RESPONSE
    // ==========================================
    res.status(200).json({
        status: "success",
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            results: students.length,
            limit,
        },
        filters: {
            search: search || null,
            yearLevel: yearLevel || null,
            departmentId: departmentId || null,
            gender: gender || null,
            course: course || null,
            isActive: isActive || null,
            role: role || null,
            statusAccount: statusAccount || null,
            isVerified: isVerified || null,
        },
        statistics: {
            totalStudents: statistics.totalStudents || 0,
            maleCount: statistics.maleCount || 0,
            femaleCount: statistics.femaleCount || 0,
            activeUsers: statistics.activeUsers || 0,
            inactiveUsers: statistics.inactiveUsers || 0,
            activeLogin: statistics.activeLogin || 0,
            inactiveLogin: statistics.inactiveLogin || 0,
            verifiedLogin: statistics.verifiedLogin || 0,
            unverifiedLogin: statistics.unverifiedLogin || 0,
            hasUser: statistics.hasUser || 0,
            noUser: statistics.noUser || 0,
            hasLogin: statistics.hasLogin || 0,
            noLogin: statistics.noLogin || 0,
            roles: statistics.roles || [],
            statusAccounts: statistics.statusAccounts || [],
            yearLevelDistribution: yearLevelCounts,
        },
        data: students,
    });
});


