const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const SubjectModel = require("../Models/SubjectSchema");
const mongoose = require("mongoose");

// ==========================================
// CREATE SUBJECT
// ==========================================
exports.createSubject = AsyncErrorHandler(async (req, res, next) => {
    console.log("Create Subject Called");
    console.log(req.body);

    const { title } = req.body;
    const userId = req.user._id;

    // Basic validation
    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Subject title is required",
        });
    }

    // Check if title already exists for this user
    const existingTitle = await SubjectModel.findOne({
        title,
        createdBy: userId
    });

    if (existingTitle) {
        return res.status(400).json({
            success: false,
            message: "You already have a subject with this title",
        });
    }

    const subject = await SubjectModel.create({
        title,
        createdBy: userId
    });

    // Use lookup to get creator details
    const populatedSubject = await SubjectModel.aggregate([
        { $match: { _id: subject._id } },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdByDetails"
            }
        },
        {
            $addFields: {
                createdBy: { $arrayElemAt: ["$createdByDetails", 0] }
            }
        },
        {
            $project: {
                createdByDetails: 0,
                "createdBy.password": 0,
                "createdBy.confirmPassword": 0,
                "createdBy.passwordResetToken": 0,
                "createdBy.passwordResetTokenExpires": 0,
                "createdBy.__v": 0,
                "createdBy.passwordChangedAt": 0
            }
        }
    ]);

    return res.status(201).json({
        status: "Success",
        message: "Subject created successfully",
        data: populatedSubject[0] || subject
    });
});

exports.DisplaySubjects = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = req.user._id;
    const role = req.user.role;
    const { search } = req.query;

    console.log("🔍 role:", role);
    console.log("🔍 userId:", userId);

    let matchStage = {};

    // 🔴 KUNG ADVISER
    if (role === "adviser") {
        const groups = await mongoose.model('Group').find({
            $or: [
                { adviserId: userId },
                { coadviserId: userId }
            ]
        }).select('sectionId');

        const sectionIds = groups.map(g => g.sectionId);
        console.log("📚 Groups found:", groups.length);
        console.log("📚 Section IDs:", sectionIds);

        if (sectionIds.length === 0) {
            return res.status(200).json({
                status: "success",
                currentPage: page,
                totalPages: 0,
                totalCount: 0,
                results: 0,
                data: []
            });
        }

        const sections = await mongoose.model('Section').find({
            _id: { $in: sectionIds }
        }).select('subjectId');

        const subjectIds = sections.map(s => s.subjectId);
        console.log("📚 Sections found:", sections.length);
        console.log("📚 Subject IDs:", subjectIds);

        if (subjectIds.length === 0) {
            return res.status(200).json({
                status: "success",
                currentPage: page,
                totalPages: 0,
                totalCount: 0,
                results: 0,
                data: []
            });
        }

        matchStage._id = { $in: subjectIds };

    } else if (role !== "admin") {
        matchStage.createdBy = new mongoose.Types.ObjectId(userId);
    }

    // 🔴 SEARCH FILTER
    if (search) {
        matchStage.title = { $regex: search.trim(), $options: "i" };
    }

    console.log("🔍 matchStage:", JSON.stringify(matchStage, null, 2));

    // 🔴 AGGREGATION PIPELINE
    const result = await SubjectModel.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },

        // ==========================================
        // 🔗 JOIN FORMAT (formatID → Format)
        // ==========================================
        {
            $lookup: {
                from: "formats",
                localField: "formatID",
                foreignField: "_id",
                as: "formatDetails"
            }
        },
        {
            $addFields: {
                formatDetails: { $arrayElemAt: ["$formatDetails", 0] }
            }
        },

        // ==========================================
        // 🔗 JOIN FORMAT UPLOADER (formatDetails.uploadedBy → UserLogin)
        // ==========================================
        {
            $lookup: {
                from: "userlogins",
                localField: "formatDetails.uploadedBy",
                foreignField: "_id",
                as: "formatUploaderDetails"
            }
        },
        {
            $addFields: {
                "formatDetails.uploadedBy": { $arrayElemAt: ["$formatUploaderDetails", 0] }
            }
        },

        // 🔗 JOIN SECTION (subjectId → Section)
        {
            $lookup: {
                from: "sections",
                localField: "_id",
                foreignField: "subjectId",
                as: "sectionDetails"
            }
        },
        {
            $addFields: {
                sectionDetails: { $arrayElemAt: ["$sectionDetails", 0] }
            }
        },

        // 🔗 JOIN DEPARTMENT (through section)
        {
            $lookup: {
                from: "departments",
                localField: "sectionDetails.departmentId",
                foreignField: "_id",
                as: "departmentDetails"
            }
        },
        {
            $addFields: {
                departmentDetails: { $arrayElemAt: ["$departmentDetails", 0] }
            }
        },

        // 🔗 JOIN GROUP (through section)
        {
            $lookup: {
                from: "groups",
                localField: "sectionDetails._id",
                foreignField: "sectionId",
                as: "groupDetails"
            }
        },
        {
            $addFields: {
                groupDetails: { $arrayElemAt: ["$groupDetails", 0] }
            }
        },

        // 👤 JOIN CREATED BY USER
        {
            $lookup: {
                from: "userloginschemas",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdByDetails"
            }
        },
        {
            $addFields: {
                createdBy: { $arrayElemAt: ["$createdByDetails", 0] }
            }
        },

        // 🔗 JOIN ADVISER DETAILS
        {
            $lookup: {
                from: "userloginschemas",
                localField: "groupDetails.adviserId",
                foreignField: "_id",
                as: "adviserDetails"
            }
        },
        {
            $addFields: {
                adviserDetails: { $arrayElemAt: ["$adviserDetails", 0] }
            }
        },

        // 🔗 JOIN CO-ADVISER DETAILS
        {
            $lookup: {
                from: "userloginschemas",
                localField: "groupDetails.coadviserId",
                foreignField: "_id",
                as: "coadviserDetails"
            }
        },
        {
            $addFields: {
                coadviserDetails: { $arrayElemAt: ["$coadviserDetails", 0] }
            }
        },

        // 📝 PROJECT - Remove sensitive data
        {
            $project: {
                createdByDetails: 0,
                formatUploaderDetails: 0,
                "createdBy.password": 0,
                "createdBy.confirmPassword": 0,
                "createdBy.passwordResetToken": 0,
                "createdBy.passwordResetTokenExpires": 0,
                "createdBy.__v": 0,
                "createdBy.passwordChangedAt": 0,
                "adviserDetails.password": 0,
                "adviserDetails.confirmPassword": 0,
                "adviserDetails.passwordResetToken": 0,
                "adviserDetails.passwordResetTokenExpires": 0,
                "adviserDetails.__v": 0,
                "adviserDetails.passwordChangedAt": 0,
                "coadviserDetails.password": 0,
                "coadviserDetails.confirmPassword": 0,
                "coadviserDetails.passwordResetToken": 0,
                "coadviserDetails.passwordResetTokenExpires": 0,
                "coadviserDetails.__v": 0,
                "coadviserDetails.passwordChangedAt": 0,
                // 🔒 Remove sensitive data from format uploader
                "formatDetails.uploadedBy.password": 0,
                "formatDetails.uploadedBy.confirmPassword": 0,
                "formatDetails.uploadedBy.passwordResetToken": 0,
                "formatDetails.uploadedBy.passwordResetTokenExpires": 0,
                "formatDetails.uploadedBy.__v": 0,
                "formatDetails.uploadedBy.passwordChangedAt": 0
            }
        },

        // 📄 PAGINATION
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            description: 1,
                            createdBy: 1,
                            formatID: 1,
                            formatDetails: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            sectionDetails: 1,
                            departmentDetails: 1,
                            groupDetails: 1,
                            adviserDetails: 1,
                            coadviserDetails: 1
                        }
                    }
                ],
                totalCount: [{ $count: "count" }]
            }
        }
    ]);

    const subjects = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    console.log("📚 Subjects found:", subjects.length);

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: subjects.length,
        data: subjects
    });
});

// ==========================================
// GET SINGLE SUBJECT
// ==========================================
exports.getSingleSubject = AsyncErrorHandler(async (req, res) => {
    const userId = req.user._id;

    const result = await SubjectModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.params.id),
                createdBy: userId
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdByDetails"
            }
        },
        {
            $addFields: {
                createdBy: { $arrayElemAt: ["$createdByDetails", 0] }
            }
        },
        {
            $project: {
                createdByDetails: 0,
                "createdBy.password": 0,
                "createdBy.confirmPassword": 0,
                "createdBy.passwordResetToken": 0,
                "createdBy.passwordResetTokenExpires": 0,
                "createdBy.__v": 0,
                "createdBy.passwordChangedAt": 0
            }
        }
    ]);

    if (!result || result.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "Subject not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: result[0],
    });
});

// ==========================================
// UPDATE SUBJECT
// ==========================================
exports.updateSubject = AsyncErrorHandler(async (req, res) => {
    const { title, formatID } = req.body;

    const existingSubject = await SubjectModel.findById(req.params.id);
    if (!existingSubject) {
        return res.status(404).json({
            status: "fail",
            message: "Subject not found",
        });
    }

    // Check if title already exists (if changing)
    if (title && title !== existingSubject.title) {
        const titleExists = await SubjectModel.findOne({
            title,
            _id: { $ne: req.params.id }
        });
        if (titleExists) {
            return res.status(400).json({
                status: "fail",
                message: "A subject with this title already exists",
            });
        }
    }

    const subject = await SubjectModel.findByIdAndUpdate(
        req.params.id,
        {
            title,
            formatID,
        },
        {
            new: true,
            runValidators: true,
        }
    );

    // Populate the updated subject
    const populatedResult = await SubjectModel.aggregate([
        { $match: { _id: subject._id } },
        {
            $lookup: {
                from: "formats",
                localField: "formatID",
                foreignField: "_id",
                as: "formatDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdByDetails"
            }
        },
        {
            $addFields: {
                formatID: { $arrayElemAt: ["$formatDetails", 0] },
                createdBy: { $arrayElemAt: ["$createdByDetails", 0] }
            }
        },
        {
            $project: {
                formatDetails: 0,
                createdByDetails: 0,
                "createdBy.password": 0,
                "createdBy.confirmPassword": 0,
                "createdBy.passwordResetToken": 0,
                "createdBy.passwordResetTokenExpires": 0,
                "createdBy.__v": 0,
                "createdBy.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        message: "Subject updated successfully",
        data: populatedResult[0] || subject,
    });
});

// ==========================================
// DELETE SUBJECT
// ==========================================
exports.deleteSubject = AsyncErrorHandler(async (req, res) => {
    const userId = req.user._id;

    const subject = await SubjectModel.findOne({
        _id: req.params.id,
        createdBy: userId
    });

    if (!subject) {
        return res.status(404).json({
            status: "fail",
            message: "Subject not found or you don't have permission",
        });
    }

    await SubjectModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        message: "Subject deleted successfully",
    });
});

// ==========================================
// GET SUBJECT BY CODE (ADDITIONAL UTILITY)
// ==========================================
exports.getSubjectByCode = AsyncErrorHandler(async (req, res) => {
    const userId = req.user._id;

    const result = await SubjectModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.params.code),
                createdBy: userId
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdByDetails"
            }
        },
        {
            $addFields: {
                createdBy: { $arrayElemAt: ["$createdByDetails", 0] }
            }
        },
        {
            $project: {
                createdByDetails: 0,
                "createdBy.password": 0,
                "createdBy.confirmPassword": 0,
                "createdBy.passwordResetToken": 0,
                "createdBy.passwordResetTokenExpires": 0,
                "createdBy.__v": 0,
                "createdBy.passwordChangedAt": 0
            }
        }
    ]);

    if (!result || result.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "Subject not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: result[0],
    });
});

// ==========================================
// GET ALL SUBJECTS (NO PAGINATION - FOR DROPDOWNS)
// ==========================================
exports.getAllSubjectsSimple = AsyncErrorHandler(async (req, res) => {
    const userId = req.user._id;

    const subjects = await SubjectModel.aggregate([
        { $match: { createdBy: userId } },
        { $sort: { title: 1 } },
        {
            $project: {
                _id: 1,
                title: 1
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: subjects.length,
        data: subjects
    });
});

// ==========================================
// GET SUBJECTS BY USER (FOR ADMIN/SUPER ADMIN)
// ==========================================
exports.getSubjectsByUser = AsyncErrorHandler(async (req, res) => {
    const { userId } = req.params;

    const subjects = await SubjectModel.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdByDetails"
            }
        },
        {
            $addFields: {
                createdBy: { $arrayElemAt: ["$createdByDetails", 0] }
            }
        },
        {
            $project: {
                createdByDetails: 0,
                "createdBy.password": 0,
                "createdBy.confirmPassword": 0,
                "createdBy.passwordResetToken": 0,
                "createdBy.passwordResetTokenExpires": 0,
                "createdBy.__v": 0,
                "createdBy.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: subjects.length,
        data: subjects
    });
});