const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const QmsCornerModel = require("../Models/QMScorner");

// CREATE
exports.createQmsCorner = AsyncErrorHandler(async (req, res) => {
    const { title, category, subtitle, description } = req.body;

    // Validation for title
    if (!title) {
        return res.status(400).json({
            success: false,
            message: "Title is required",
        });
    }

    // Validation for category
    if (!category) {
        return res.status(400).json({
            success: false,
            message: "Category is required",
        });
    }

    // Validate category enum
    const validCategories = ["Citizen Character", "5S", "QMS corner", "GAD Corner"];
    if (!validCategories.includes(category)) {
        return res.status(400).json({
            success: false,
            message: `Category must be one of: ${validCategories.join(", ")}`,
        });
    }

    // Validation for subtitle
    if (!subtitle || !Array.isArray(subtitle) || subtitle.length === 0) {
        return res.status(400).json({
            success: false,
            message: "At least one subtitle with googleLink is required",
        });
    }

    // Validate each subtitle object
    for (let i = 0; i < subtitle.length; i++) {
        if (!subtitle[i].subtitle || !subtitle[i].googleLink) {
            return res.status(400).json({
                success: false,
                message: `Each subtitle must have both 'subtitle' and 'googleLink' fields. Error at index ${i}`,
            });
        }
    }

    const qmsCorner = await QmsCornerModel.create({
        title,
        category,
        subtitle: subtitle
    });

    return res.status(201).json({
        status: "success",
        message: "QMS Corner created successfully",
        data: qmsCorner,
    });
});

// DISPLAY ALL (WITH PAGINATION + SEARCH + CATEGORY FILTER)
exports.DisplayQmsCorner = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const { search } = req.query;
    const { category } = req.params; // Get category from URL params

    const matchStage = {};

    // Search by title
    if (search) {
        matchStage.title = {
            $regex: search.trim(),
            $options: "i",
        };
    }

    // Filter by category (from params)
    if (category) {
        // Validate category
        const validCategories = ["Citizen Character", "5S", "QMS corner", "GAD Corner"];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                status: "fail",
                message: `Category must be one of: ${validCategories.join(", ")}`,
            });
        }
        matchStage.category = category;
    }

    const result = await QmsCornerModel.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            category: 1,
                            description: 1,
                            subtitle: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const qmsCorners = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: qmsCorners.length,
        category: category || "all",
        data: qmsCorners,
    });
});

// GET SINGLE QMS CORNER
exports.getQmsCornerById = AsyncErrorHandler(async (req, res) => {
    const qmsCorner = await QmsCornerModel.findById(req.params.id);

    if (!qmsCorner) {
        return res.status(404).json({
            status: "fail",
            message: "QMS Corner not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: qmsCorner,
    });
});

// UPDATE
exports.updateQmsCorner = AsyncErrorHandler(async (req, res) => {
    const { title, category, subtitle, description } = req.body;

    console.log("Body", req.body)

    // Validate category if provided
    if (category) {
        const validCategories = ["Citizen Character", "5S", "QMS corner", "GAD Corner"];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                status: "fail",
                message: `Category must be one of: ${validCategories.join(", ")}`,
            });
        }
    }

    // Optional: Validate subtitle array if provided
    if (subtitle && (!Array.isArray(subtitle) || subtitle.length === 0)) {
        return res.status(400).json({
            status: "fail",
            message: "Subtitle must be a non-empty array",
        });
    }

    if (subtitle && subtitle.length > 0) {
        for (let i = 0; i < subtitle.length; i++) {
            if (!subtitle[i].subtitle || !subtitle[i].googleLink) {
                return res.status(400).json({
                    status: "fail",
                    message: `Each subtitle must have both 'subtitle' and 'googleLink' fields. Error at index ${i}`,
                });
            }
        }
    }

    // Build update object
    const updateData = {};
    if (title) updateData.title = title;
    if (category) updateData.category = category;
    if (subtitle) updateData.subtitle = subtitle;
    if (description !== undefined) updateData.description = description; // Added description

    const qmsCorner = await QmsCornerModel.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!qmsCorner) {
        return res.status(404).json({
            status: "fail",
            message: "QMS Corner not found",
        });
    }

    res.status(200).json({
        status: "success",
        message: "QMS Corner updated successfully",
        data: qmsCorner,
    });
});

// DELETE
exports.deleteQmsCorner = AsyncErrorHandler(async (req, res) => {
    const qmsCorner = await QmsCornerModel.findById(req.params.id);

    if (!qmsCorner) {
        return res.status(404).json({
            status: "fail",
            message: "QMS Corner not found",
        });
    }

    await QmsCornerModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        message: "QMS Corner deleted successfully",
    });
});

// ADD SUBTITLE TO EXISTING QMS CORNER
exports.addSubtitle = AsyncErrorHandler(async (req, res) => {
    const { id } = req.params;
    const { subtitle, googleLink } = req.body;

    if (!subtitle || !googleLink) {
        return res.status(400).json({
            status: "fail",
            message: "Both subtitle and googleLink are required",
        });
    }

    const qmsCorner = await QmsCornerModel.findByIdAndUpdate(
        id,
        {
            $push: {
                subtitle: { subtitle, googleLink }
            }
        },
        { new: true, runValidators: true }
    );

    if (!qmsCorner) {
        return res.status(404).json({
            status: "fail",
            message: "QMS Corner not found",
        });
    }

    res.status(200).json({
        status: "success",
        message: "Subtitle added successfully",
        data: qmsCorner,
    });
});

// REMOVE SUBTITLE FROM QMS CORNER
exports.removeSubtitle = AsyncErrorHandler(async (req, res) => {
    const { id, subtitleIndex } = req.params;

    const qmsCorner = await QmsCornerModel.findById(id);

    if (!qmsCorner) {
        return res.status(404).json({
            status: "fail",
            message: "QMS Corner not found",
        });
    }

    if (subtitleIndex >= qmsCorner.subtitle.length) {
        return res.status(400).json({
            status: "fail",
            message: "Invalid subtitle index",
        });
    }

    qmsCorner.subtitle.splice(subtitleIndex, 1);
    await qmsCorner.save();

    res.status(200).json({
        status: "success",
        message: "Subtitle removed successfully",
        data: qmsCorner,
    });
});

// GET QMS CORNERS BY CATEGORY
exports.getQmsCornersByCategory = AsyncErrorHandler(async (req, res) => {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate category
    const validCategories = ["Citizen Character", "5S", "QMS corner", "GAD Corner"];
    if (!validCategories.includes(category)) {
        return res.status(400).json({
            status: "fail",
            message: `Category must be one of: ${validCategories.join(", ")}`,
        });
    }

    const qmsCorners = await QmsCornerModel.find({ category })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalCount = await QmsCornerModel.countDocuments({ category });

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: qmsCorners.length,
        data: qmsCorners,
    });
});

// GET ALL CATEGORIES WITH COUNT
exports.getCategoriesWithCount = AsyncErrorHandler(async (req, res) => {
    const categories = await QmsCornerModel.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                category: "$_id",
                count: 1,
                _id: 0
            }
        },
        { $sort: { category: 1 } }
    ]);

    res.status(200).json({
        status: "success",
        data: categories,
    });
});