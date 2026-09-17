const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const AnnouncementModel = require("../Models/FileUploadSchema");

// CREATE ANNOUNCEMENT
exports.createAnnouncement = AsyncErrorHandler(async (req, res, next) => {
    console.log("Middleware Called");
    console.log(req.body);

    const { title, description, category, googleLink } = req.body;

    // basic validation
    if (!title || !googleLink) {
        return res.status(400).json({
            success: false,
            message: "Title, description, and googleLink are required",
        });
    }

    const announcement = await AnnouncementModel.create({
        title,
        description,
        category,
        googleLink,
    });

    return res.status(201).json({
        status: "Success",
        message: "Announcement created successfully",
        data: announcement,
    });
});

// DISPLAY ALL ANNOUNCEMENTS (WITH PAGINATION + SEARCH)
exports.DisplayAnnouncement = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const { search } = req.query;

    const matchStage = {
        category: "citizens-charter"
    };

    if (search) {
        matchStage.title = {
            $regex: search.trim(),
            $options: "i",
        };
    }

    const result = await AnnouncementModel.aggregate([
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
                            description: 1,
                            googleLink: 1,
                            category: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const announcements = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: announcements.length,
        data: announcements,
    });
});

exports.DisplayMemorandum = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const { search } = req.query;

    const matchStage = {
        category: "memorandum"
    };

    if (search) {
        matchStage.title = {
            $regex: search.trim(),
            $options: "i",
        };
    }

    const result = await AnnouncementModel.aggregate([
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
                            description: 1,
                            googleLink: 1,
                            category: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const announcements = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: announcements.length,
        data: announcements,
    });
});


exports.Display5sCorner = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const { search } = req.query;

    const matchStage = {
        category: "5s-corner"
    };

    if (search) {
        matchStage.title = {
            $regex: search.trim(),
            $options: "i",
        };
    }

    const result = await AnnouncementModel.aggregate([
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
                            description: 1,
                            googleLink: 1,
                            category: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const scorner = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: scorner.length,
        data: scorner,
    });
});

exports.GadCorner = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const { search } = req.query;

    const matchStage = {
        category: "gadcorner"
    };

    if (search) {
        matchStage.title = {
            $regex: search.trim(),
            $options: "i",
        };
    }

    const result = await AnnouncementModel.aggregate([
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
                            description: 1,
                            googleLink: 1,
                            category: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const scorner = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: scorner.length,
        data: scorner,
    });
});

// GET SINGLE
exports.getSingleAnnouncement = AsyncErrorHandler(async (req, res) => {
    const announcement = await AnnouncementModel.findById(req.params.id);

    if (!announcement) {
        return res.status(404).json({
            status: "fail",
            message: "Announcement not found",
        });
    }

    res.status(200).json({
        status: "success",
        data: announcement,
    });
});

// UPDATE
exports.updateAnnouncement = AsyncErrorHandler(async (req, res) => {
    const announcement = await AnnouncementModel.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    );

    if (!announcement) {
        return res.status(404).json({
            status: "fail",
            message: "Announcement not found",
        });
    }

    res.status(200).json({
        status: "success",
        message: "Announcement updated successfully",
        data: announcement,
    });
});

// DELETE
exports.deleteAnnouncement = AsyncErrorHandler(async (req, res) => {
    const announcement = await AnnouncementModel.findById(req.params.id);

    if (!announcement) {
        return res.status(404).json({
            status: "fail",
            message: "Announcement not found",
        });
    }

    await AnnouncementModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        message: "Announcement deleted successfully",
    });
});