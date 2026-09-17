const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const SectionModel = require("../Models/SectionSchema");
const mongoose = require("mongoose");
const group = require("../Models/GroupName");


// ==========================================
// CREATE SECTION
// ==========================================
exports.createSection = AsyncErrorHandler(async (req, res, next) => {
    console.log("Create Section Called");
    console.log(req.body);

    const { name, subjectId } = req.body;

    // Basic validation
    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Section name is required",
        });
    }

    if (!subjectId) {
        return res.status(400).json({
            success: false,
            message: "Subject ID is required",
        });
    }

    // Check if section name already exists for this subject
    const existingSection = await SectionModel.findOne({
        name,
        subjectId
    });

    if (existingSection) {
        return res.status(400).json({
            success: false,
            message: "A section with this name already exists in this subject",
        });
    }

    const section = await SectionModel.create({
        name,
        subjectId
    });

    // Use lookup to get subject details
    const populatedSection = await SectionModel.aggregate([
        { $match: { _id: section._id } },
        {
            $lookup: {
                from: "subjects",
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectId: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },
        {
            $project: {
                subjectDetails: 0,
                "subjectId.__v": 0
            }
        }
    ]);

    return res.status(201).json({
        status: "Success",
        message: "Section created successfully",
        data: populatedSection[0] || section
    });
});


// ==========================================
// DISPLAY SECTIONS BY SUBJECT ID (WITH PAGINATION + SEARCH + ADVISER FILTER)
// ==========================================
exports.DisplaySections = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = req.user._id;
    const role = req.user.role;

    console.log("🔍 role:", role);
    console.log("🔍 userId:", userId);

    // Kunin ang subjectId mula sa route parameter
    const { subjectId } = req.params;
    const { search } = req.query;

    if (!subjectId) {
        return res.status(400).json({
            status: "fail",
            message: "Subject ID is required"
        });
    }

    const matchStage = {};

    // 🔴 KUNG ADVISER - i-filter ang sections na may groups kung saan adviser/co-adviser si user
    if (role === "adviser") {
        // STEP 1: Hanapin ang groups kung saan adviser/co-adviser si user
        const groups = await group.find({
            $or: [
                { adviserId: userId },
                { coadviserId: userId }
            ]
        }).select('sectionId');

        const sectionIds = groups.map(g => g.sectionId);

        console.log("📚 Groups found:", groups.length);
        console.log("📚 Section IDs:", sectionIds);

        // Kung walang groups, return empty
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

        // I-filter ang sections na may _id na nasa sectionIds
        matchStage._id = { $in: sectionIds };

        // I-add ang subjectId filter
        matchStage.subjectId = new mongoose.Types.ObjectId(subjectId);

    } else {
        // Para sa admin at ibang roles
        matchStage.subjectId = new mongoose.Types.ObjectId(subjectId);
    }

    // 🔴 SEARCH FILTER
    if (search) {
        matchStage.name = { $regex: search.trim(), $options: "i" };
    }

    console.log("🔍 matchStage:", JSON.stringify(matchStage, null, 2));

    // 🔴 AGGREGATION PIPELINE
    const result = await SectionModel.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },

        // 🔗 JOIN SUBJECT
        {
            $lookup: {
                from: "subjects",
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectId: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },
        {
            $project: {
                subjectDetails: 0,
                "subjectId.__v": 0,
                "subjectId.password": 0,
                "subjectId.confirmPassword": 0,
                "subjectId.passwordResetToken": 0,
                "subjectId.passwordResetTokenExpires": 0,
                "subjectId.passwordChangedAt": 0
            }
        },

        // 🔗 JOIN GROUP (para makuha ang adviser/co-adviser details)
        {
            $lookup: {
                from: "groups",
                localField: "_id",
                foreignField: "sectionId",
                as: "groupDetails"
            }
        },
        {
            $addFields: {
                groupDetails: { $arrayElemAt: ["$groupDetails", 0] }
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
                "coadviserDetails.passwordChangedAt": 0
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
                            name: 1,
                            subjectId: 1,
                            createdAt: 1,
                            updatedAt: 1,
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

    const sections = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    console.log("📚 Sections found:", sections.length);

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: sections.length,
        data: sections
    });
});

// ==========================================
// GET SECTIONS BY SUBJECT
// ==========================================
exports.getSectionsBySubject = AsyncErrorHandler(async (req, res) => {
    const { subjectId } = req.params;

    const sections = await SectionModel.aggregate([
        {
            $match: {
                subjectId: new mongoose.Types.ObjectId(subjectId)
            }
        },
        { $sort: { name: 1 } },
        {
            $lookup: {
                from: "subjects",
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectId: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },
        {
            $project: {
                subjectDetails: 0,
                "subjectId.__v": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: sections.length,
        data: sections
    });
});

// ==========================================
// GET SINGLE SECTION
// ==========================================
exports.getSingleSection = AsyncErrorHandler(async (req, res) => {
    const sectionId = req.params.id;

    const result = await SectionModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(sectionId)
            }
        },
        {
            $lookup: {
                from: "subjects",
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectId: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },
        {
            $project: {
                subjectDetails: 0,
                "subjectId.__v": 0
            }
        }
    ]);

    // Check if section exists
    if (!result || result.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "Section not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: result[0],
    });
});

// ==========================================
// UPDATE SECTION
// ==========================================
exports.updateSection = AsyncErrorHandler(async (req, res) => {
    const { name, subjectId } = req.body;
    const sectionId = req.params.id;

    console.log("Update Section Called:", req.body);

    // Find the section first
    const existingSection = await SectionModel.findById(sectionId);

    if (!existingSection) {
        return res.status(404).json({
            status: "fail",
            message: "Section not found",
        });
    }

    // Check if section name already exists (excluding current section)
    if (name && name !== existingSection.name) {
        const targetSubjectId = subjectId || existingSection.subjectId;
        const nameExists = await SectionModel.findOne({
            name,
            subjectId: targetSubjectId,
            _id: { $ne: sectionId }
        });

        if (nameExists) {
            return res.status(400).json({
                status: "fail",
                message: "A section with this name already exists in this subject",
            });
        }
    }

    // Update section
    const updateData = {};
    if (name) updateData.name = name;
    if (subjectId) updateData.subjectId = subjectId;

    const section = await SectionModel.findByIdAndUpdate(
        sectionId,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    // Populate the updated section
    const populatedResult = await SectionModel.aggregate([
        { $match: { _id: section._id } },
        {
            $lookup: {
                from: "subjects",
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectId: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },
        {
            $project: {
                subjectDetails: 0,
                "subjectId.__v": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        message: "Section updated successfully",
        data: populatedResult[0] || section,
    });
});

// ==========================================
// DELETE SECTION
// ==========================================
exports.deleteSection = AsyncErrorHandler(async (req, res) => {
    const sectionId = req.params.id;

    // Find the section first
    const section = await SectionModel.findById(sectionId);

    if (!section) {
        return res.status(404).json({
            status: "fail",
            message: "Section not found",
        });
    }

    await SectionModel.findByIdAndDelete(sectionId);

    res.status(200).json({
        status: "success",
        message: "Section deleted successfully",
    });
});

// ==========================================
// GET ALL SECTIONS SIMPLE (FOR DROPDOWNS)
// ==========================================
exports.getAllSectionsSimple = AsyncErrorHandler(async (req, res) => {
    const { subjectId } = req.query;

    const matchStage = {};

    // If subjectId is provided, filter sections by subject
    if (subjectId) {
        matchStage.subjectId = new mongoose.Types.ObjectId(subjectId);
    }

    const sections = await SectionModel.aggregate([
        { $match: matchStage },
        { $sort: { name: 1 } },
        {
            $project: {
                _id: 1,
                name: 1,
                subjectId: 1
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: sections.length,
        data: sections
    });
});

// ==========================================
// GET SECTIONS BY USER (FOR ADMIN/SUPER ADMIN)
// ==========================================
exports.getSectionsByUser = AsyncErrorHandler(async (req, res) => {
    const { userId } = req.params;

    // Since wala tayong SubjectModel, we cannot filter by user
    // Instead, get all sections
    const sections = await SectionModel.aggregate([
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "subjects",
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectId: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },
        {
            $project: {
                subjectDetails: 0,
                "subjectId.__v": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: sections.length,
        data: sections
    });
});

// ==========================================
// BULK CREATE SECTIONS
// ==========================================
exports.bulkCreateSections = AsyncErrorHandler(async (req, res) => {
    const { sections, subjectId } = req.body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Please provide an array of section names",
        });
    }

    if (!subjectId) {
        return res.status(400).json({
            success: false,
            message: "Subject ID is required",
        });
    }

    // Prepare bulk operations
    const sectionsToCreate = sections.map(name => ({
        name: name.trim(),
        subjectId
    }));

    // Check for duplicates
    const existingNames = await SectionModel.find({
        subjectId,
        name: { $in: sections.map(s => s.trim()) }
    }).select('name');

    const existingNameSet = new Set(existingNames.map(s => s.name));

    const filteredSections = sectionsToCreate.filter(
        s => !existingNameSet.has(s.name)
    );

    if (filteredSections.length === 0) {
        return res.status(400).json({
            success: false,
            message: "All section names already exist in this subject",
        });
    }

    const createdSections = await SectionModel.insertMany(filteredSections);

    // Populate subject details
    const populatedSections = await SectionModel.aggregate([
        { $match: { _id: { $in: createdSections.map(s => s._id) } } },
        {
            $lookup: {
                from: "subjects",
                localField: "subjectId",
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectId: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },
        {
            $project: {
                subjectDetails: 0,
                "subjectId.__v": 0
            }
        }
    ]);

    res.status(201).json({
        status: "success",
        message: `${createdSections.length} sections created successfully`,
        data: populatedSections,
        skipped: sections.length - createdSections.length,
        skippedNames: existingNames.map(s => s.name)
    });
});