const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const ProposedTitleModel = require("./../Models/ProposedTitle");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const Group = require("./../Models/GroupName");
const NotificationSchema = require("../Models/NotificationSchema");
const UserLoginSchema = require("../Models/LogInSchema")

const Comment = require("./../Models/CommentSchema")

exports.createProposedTitle = AsyncErrorHandler(async (req, res, next) => {
    try {
        const {
            title,
            description,
            remarks,
            status = "Pending",
            groupId,
            action,
            titleId          // 👈 IDAGDAG para sa revision
        } = req.body;

        console.log("req.body:", req.body);
        console.log("🎯 Action:", action);

        // ============================================
        // 🎯 BRANCH: REVISION vs NEW TITLE
        // ============================================
        const isRevision = action === 'revision';

        // ============================================
        // FILE UPLOAD SA UPLOADAGTA
        // ============================================
        let fileData = {};

        if (req.file) {
            console.log("📸 Uploading file to UPLOADAGTA...");
            console.log("📁 File:", {
                originalname: req.file.originalname,
                size: `${(req.file.size / 1024).toFixed(2)} KB`,
                mimetype: req.file.mimetype,
                path: req.file.path,
            });

            const form = new FormData();
            form.append(
                "file",
                fs.createReadStream(req.file.path),
                req.file.originalname
            );

            try {
                const response = await axios.post(
                    process.env.UPLOADAGTA_URL,
                    form,
                    {
                        maxBodyLength: Infinity,
                        headers: { ...form.getHeaders() },
                    }
                );

                console.log("📤 Upload Response:", response.data);

                let fileUrl = "";
                let publicId = "";

                if (response.data && response.data.url) {
                    fileUrl = response.data.url;
                    publicId = response.data.public_id || response.data.filename || req.file.filename;
                } else if (response.data && response.data.success && response.data.data) {
                    fileUrl = response.data.data.url;
                    publicId = response.data.data.public_id || req.file.filename;
                } else if (response.data && response.data.file) {
                    fileUrl = response.data.file;
                    publicId = req.file.filename;
                } else {
                    console.log("⚠️ Unexpected response format:", response.data);
                    fileUrl = `/temp-uploads/${req.file.filename}`;
                    publicId = req.file.filename;
                }

                fileData = {
                    fileUrl: fileUrl,
                    fileName: req.file.originalname,
                    publicId: publicId,
                    fileType: req.file.mimetype,
                    isPdf: req.file.mimetype === "application/pdf",
                };

                console.log("✅ File uploaded successfully:", fileData);

                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log("🗑️ Temporary file deleted:", req.file.path);
                }
            } catch (err) {
                console.error("❌ Upload Error:", err.message);
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log("🗑️ Temporary file deleted (error):", req.file.path);
                }
            }
        } else {
            console.log("ℹ️ No file provided.");
        }

        // ============================================
        // 🎯 REVISION PATH — I-UPDATE ANG EXISTING TITLE
        // ============================================
        if (isRevision) {
            console.log("🔁 REVISION MODE — Updating existing title:", titleId);

            if (!titleId) {
                return res.status(400).json({
                    status: false,
                    message: "titleId is required for revision",
                });
            }

            if (!fileData.fileUrl) {
                return res.status(400).json({
                    status: false,
                    message: "Revision file is required",
                });
            }

            const existing = await ProposedTitleModel.findById(titleId);

            if (!existing) {
                return res.status(404).json({
                    status: false,
                    message: "Proposed title not found",
                });
            }

            console.log("📄 Existing title found:", existing._id);

            // ✅ I-push ang bagong URL sa titleUrlTracking
            if (!existing.titleUrlTracking) {
                existing.titleUrlTracking = [];
            }

            existing.titleUrlTracking.push({
                url: fileData.fileUrl,
                date: new Date(),
                remarks: remarks?.trim() || "Revision submitted.",
                action: "revision",
                fileName: fileData.fileName,
                publicId: fileData.publicId,
                fileType: fileData.fileType,
            });

            // ✅ I-update ang current fileUrl
            existing.fileUrl = fileData.fileUrl;

            // ✅ I-update ang remarks kung may valid value
            if (remarks && remarks.trim()) {
                existing.remarks = remarks.trim();
            }

            // ✅ I-update ang description kung may valid value
            if (description && description.trim()) {
                existing.description = description.trim();
            }

            // ✅ I-update ang title KUNG may valid value (skip 'undefined')
            if (title && title !== "undefined" && title.trim() !== "") {
                existing.title = title.trim();
            }

            // ✅ I-set pabalik sa Pending (naghihintay ng review)
            existing.status = "Pending";

            await existing.save();

            console.log("✅ Revision saved:", existing._id);

            // ============================================
            // NOTIFICATION PARA SA REVISION
            // ============================================
            try {
                const group = await Group.findById(existing.groupId)
                    .select("adviserId coadviserId referralCode");

                const recipients = [];
                if (group?.adviserId) recipients.push(group.adviserId);
                if (group?.coadviserId) recipients.push(group.coadviserId);

                if (recipients.length > 0) {
                    await NotificationSchema.create({
                        groupId: group._id,
                        recipient: recipients,
                        uploadedBy: [req.user.linkId],
                        type: "ProposedTitleRevision",
                        title: "Revision Submitted",
                        message: `A revision has been uploaded for title "${existing.title}".`,
                        returnmessage: `Your revision for "${existing.title}" has been submitted. Please wait for review.`,
                        referenceId: existing._id,
                        referenceModel: "ProposedTitle",
                        isRead: false,
                        priority: "Normal",
                        actionUrl: "/dashboard/propose-title",
                        metadata: {
                            groupId: group._id,
                            proposedTitleId: existing._id,
                            action: "revision",
                            remarks: remarks || "",
                        },
                    });
                    console.log("🔔 Revision notification created.");
                }
            } catch (notifErr) {
                console.error("⚠️ Revision notification failed:", notifErr.message);
            }

            return res.status(200).json({
                status: true,
                message: "Revision uploaded successfully",
                data: existing,
            });
        }

        // ============================================
        // 🎯 NORMAL CREATE PATH (existing logic)
        // ============================================
        const group = await Group.findById(groupId)
            .select("adviserId coadviserId referralCode");

        if (!group) {
            return res.status(404).json({
                status: false,
                message: "Group not found.",
            });
        }

        console.log("👥 Group found:", group._id);
        console.log("🔑 Referral Code:", group.referralCode);
        console.log("👨‍🏫 Adviser ID:", group.adviserId);
        console.log("👨‍🏫 Co-Adviser ID:", group.coadviserId);

        const recipients = [];
        if (group.adviserId) recipients.push(group.adviserId);
        if (group.coadviserId) recipients.push(group.coadviserId);

        console.log("🔔 Notification Recipients:", recipients);

        let students = [];
        if (group.referralCode) {
            students = await UserLoginSchema.find({
                referredBy: group.referralCode,
                role: "student"
            }).select("_id");

            console.log("👨‍🎓 Students found with matching referredBy:", students.length);
        }

        const uploadedBy = [];
        if (students && students.length > 0) {
            students.forEach(student => uploadedBy.push(student._id));
        }
        if (group.adviserId) uploadedBy.push(group.adviserId);
        if (group.coadviserId) uploadedBy.push(group.coadviserId);

        const uniqueUploadedBy = [...new Set(uploadedBy.map(id => id.toString()))];

        console.log("👤 Uploaded By (Students with matching referredBy):", uniqueUploadedBy);

        // ✅ I-validate ang title bago i-save
        const cleanTitle = (title && title !== "undefined") ? title.trim() : "";

        if (!cleanTitle) {
            return res.status(400).json({
                status: false,
                message: "Title is required",
            });
        }

        if (!fileData.fileUrl) {
            return res.status(400).json({
                status: false,
                message: "File is required",
            });
        }

        // ============================================
        // ⭐ BAGO: I-DELETE ANG LAHAT NG LUMANG TITLES SA PAREHONG GROUP
        // ============================================
        console.log("🗑️ Checking for existing titles in group:", groupId);

        const existingTitles = await ProposedTitleModel.find({ groupId });

        if (existingTitles.length > 0) {
            console.log(`🗑️ Found ${existingTitles.length} existing title(s) in group ${groupId}. Deleting...`);

            // ✅ I-delete lahat ng lumang titles sa parehong groupId
            const deleteResult = await ProposedTitleModel.deleteMany({ groupId });

            console.log(`✅ Deleted ${deleteResult.deletedCount} old title(s) from group ${groupId}`);

            // ✅ (Optional) I-delete din ang mga notification na related sa lumang titles
            try {
                const oldTitleIds = existingTitles.map(t => t._id);
                const notifDeleteResult = await NotificationSchema.deleteMany({
                    referenceId: { $in: oldTitleIds },
                    referenceModel: "ProposedTitle"
                });
                console.log(`🔔 Deleted ${notifDeleteResult.deletedCount} old notification(s) related to deleted titles`);
            } catch (notifDeleteErr) {
                console.error("⚠️ Failed to delete old notifications:", notifDeleteErr.message);
            }
        } else {
            console.log("ℹ️ No existing titles found in group. Proceeding with create.");
        }

        // ============================================
        // ✅ CREATE NEW TITLE
        // ============================================
        const proposedTitle = await ProposedTitleModel.create({
            title: cleanTitle,
            description,
            remarks,
            status,
            groupId,
            uploadedBy: req.user.linkId,

            // ✅ I-initialize ang titleUrlTracking sa unang upload
            titleUrlTracking: [
                {
                    url: fileData.fileUrl,
                    date: new Date(),
                    remarks: remarks?.trim() || "Initial submission.",
                    action: "create",
                    fileName: fileData.fileName,
                    publicId: fileData.publicId,
                    fileType: fileData.fileType,
                }
            ],

            ...fileData,
        });

        console.log("✅ Proposed Title successfully created:", proposedTitle._id);

        if (recipients.length > 0) {
            try {
                await NotificationSchema.create({
                    groupId: group._id,
                    recipient: recipients,
                    uploadedBy: uniqueUploadedBy,
                    type: "ProposedTitleCreated",
                    title: "New Proposed Title",
                    message: `A new proposed title "${cleanTitle}" has been submitted by the group members.`,
                    returnmessage: `The new proposed title "${cleanTitle}" has been submitted today. Please wait for the next announcement. Thank you!`,
                    referenceId: proposedTitle._id,
                    referenceModel: "ProposedTitle",
                    isRead: false,
                    priority: "Normal",
                    actionUrl: "/dashboard/propose-title",
                    metadata: {
                        groupId: group._id,
                        proposedTitleId: proposedTitle._id,
                        status: status,
                        title: cleanTitle,
                        referralCode: group.referralCode,
                        adviserId: group.adviserId || null,
                        coadviserId: group.coadviserId || null,
                        uploadedBy: uniqueUploadedBy,
                        studentCount: students ? students.length : 0,
                        uploaderCount: uniqueUploadedBy.length,
                    },
                });
                console.log("🔔 Notification successfully created.");
            } catch (notificationError) {
                console.error("⚠️ Notification creation failed:", notificationError.message);
            }
        } else {
            console.log("ℹ️ No Adviser or Co-Adviser found. Notification was not created.");
        }

        return res.status(201).json({
            status: true,
            message: "Proposed title created successfully",
            data: proposedTitle,
        });

    } catch (error) {
        console.error("Create Proposed Title Error:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to create proposed title",
            error: error.message,
        });
    }
});

exports.DisplayProposedTitles = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { search, status, dateFrom, dateTo, groupId } = req.query;

    const role = req.user.role;
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const matchStage = {};

    // ==================== ROLE FILTER (STAGE 1) ====================
    if (role === "student") {
        matchStage.uploadedBy = userObjectId;
    }

    // ==================== GROUP FILTER ====================
    if (groupId) {
        matchStage.groupId = new mongoose.Types.ObjectId(groupId);
    }

    // ==================== SEARCH (title) ====================
    if (search) {
        matchStage.title = { $regex: search.trim(), $options: "i" };
    }

    // ==================== STATUS FILTER ====================
    if (status) {
        matchStage.status = status;
    }

    // ==================== DATE FILTER ====================
    if (dateFrom || dateTo) {
        matchStage.createdAt = {};

        if (dateFrom) {
            matchStage.createdAt.$gte = new Date(dateFrom);
        }

        if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            matchStage.createdAt.$lte = endOfDay;
        }
    }

    // ==================== ROLE-BASED MATCH (STAGE 4) ====================
    let roleMatchStage = null;

    if (role === "adviser" || role === "coadviser") {
        roleMatchStage = {
            $or: [
                { "groupInfo.adviserId": userObjectId },
                { "groupInfo.coadviserId": userObjectId },
            ],
        };
    } else if (role === "panelist") {
        roleMatchStage = {
            "groupInfo.panelistIds": userObjectId,
        };
    } else if (role === "organizer" || role === "admin") {
        roleMatchStage = null;
    }

    const result = await ProposedTitleModel.aggregate([
        // 🔹 STAGE 1: Initial match
        { $match: matchStage },

        // 🔹 STAGE 2: Lookup Group
        {
            $lookup: {
                from: "groups",
                localField: "groupId",
                foreignField: "_id",
                as: "groupInfo",
            },
        },

        // 🔹 STAGE 3: Unwind groupInfo
        {
            $unwind: {
                path: "$groupInfo",
                preserveNullAndEmptyArrays: true,
            },
        },

        // 🔹 STAGE 4: Role-based filter
        ...(roleMatchStage ? [{ $match: roleMatchStage }] : []),

        // 🔹 STAGE 5: Lookup Uploader (User)
        {
            $lookup: {
                from: "userloginschemas",
                localField: "uploadedBy",
                foreignField: "_id",
                as: "uploaderInfo",
            },
        },

        // 🔹 STAGE 6: Unwind uploaderInfo
        {
            $unwind: {
                path: "$uploaderInfo",
                preserveNullAndEmptyArrays: true,
            },
        },

        // 🔹 STAGE 7: Lookup Comments
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "proposedTitleId",
                as: "comments",
            },
        },

        // 🔹 STAGE 8: Unwind comments
        {
            $unwind: {
                path: "$comments",
                preserveNullAndEmptyArrays: true,
            },
        },

        // 🔹 STAGE 9: Lookup comment author
        {
            $lookup: {
                from: "userloginschemas",
                localField: "comments.userId",
                foreignField: "_id",
                as: "comments.authorInfo",
            },
        },

        // 🔹 STAGE 10: Unwind authorInfo
        {
            $unwind: {
                path: "$comments.authorInfo",
                preserveNullAndEmptyArrays: true,
            },
        },

        // 🔹 STAGE 11: Group back the comments
        {
            $group: {
                _id: "$_id",
                title: { $first: "$title" },
                description: { $first: "$description" },
                status: { $first: "$status" },
                remarks: { $first: "$remarks" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                fileName: { $first: "$fileName" },
                fileUrl: { $first: "$fileUrl" },
                fileType: { $first: "$fileType" },
                isPdf: { $first: "$isPdf" },
                adviser: { $first: "$adviser" },
                coAdviser: { $first: "$coAdviser" },

                // ✅ IDAGDAG ITO — titleUrlTracking
                titleUrlTracking: { $first: "$titleUrlTracking" },

                groupInfo: { $first: "$groupInfo" },
                uploaderInfo: { $first: "$uploaderInfo" },
                comments: {
                    $push: {
                        _id: "$comments._id",
                        text: "$comments.text",
                        userId: "$comments.userId",
                        createdAt: "$comments.createdAt",
                        updatedAt: "$comments.updatedAt",
                        author: {
                            _id: "$comments.authorInfo._id",
                            first_name: "$comments.authorInfo.first_name",
                            last_name: "$comments.authorInfo.last_name",
                            id_number: "$comments.authorInfo.id_number",
                            email: "$comments.authorInfo.email",
                            role: "$comments.authorInfo.role",
                        }
                    }
                }
            }
        },

        // 🔹 STAGE 12: SORT comments — pinakahuli ang mauuna
        {
            $addFields: {
                comments: {
                    $sortArray: {
                        input: "$comments",
                        sortBy: { createdAt: 1 }
                    }
                }
            }
        },

        // 🔹 STAGE 13: SORT by createdAt (overall)
        { $sort: { createdAt: -1 } },

        // 🔹 STAGE 14: Facet for pagination
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
                            status: 1,
                            remarks: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            fileName: 1,
                            fileUrl: 1,
                            fileType: 1,
                            isPdf: 1,
                            adviser: 1,
                            coAdviser: 1,

                            // ✅ IDAGDAG ITO — titleUrlTracking
                            titleUrlTracking: 1,

                            groupName: {
                                $ifNull: ["$groupInfo.groupName", "N/A"],
                            },

                            uploaderName: {
                                $ifNull: [
                                    {
                                        $concat: [
                                            "$uploaderInfo.first_name",
                                            " ",
                                            "$uploaderInfo.last_name",
                                        ],
                                    },
                                    "N/A",
                                ],
                            },

                            uploaderIdNumber: {
                                $ifNull: ["$uploaderInfo.id_number", "N/A"],
                            },

                            comments: 1,
                            commentCount: { $size: "$comments" },

                            groupInfo: 1,
                            uploaderInfo: 1,
                        },
                    },
                ],

                totalCount: [{ $count: "count" }],
            },
        },
    ]);

    const proposedTitles = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages,
        totalCount,
        results: proposedTitles.length,
        data: proposedTitles,
    });
});

exports.UpdateProposedTitle = AsyncErrorHandler(async (req, res) => {
    const { status } = req.body;
    const userId = req.user._id;


    console.log("status",status)

    // ==========================================
    // 1. HANAPIN ANG PROPOSED TITLE
    // ==========================================
    const proposedTitle = await ProposedTitleModel.findById(req.params.id);

    if (!proposedTitle) {
        return res.status(404).json({
            status: "fail",
            message: "Proposed title not found",
        });
    }

    // ==========================================
    // 2. HANAPIN ANG GROUP NG PROPOSED TITLE
    // ==========================================
    const group = await Group.findById(proposedTitle.groupId);

    if (!group) {
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }
    // ==========================================
    // 3. DETERMINE KUNG ADVISER O CO-ADVISER
    // ==========================================
    let userRole = "";

    const isAdviser =
        group.adviserId &&
        group.adviserId.toString() === userId.toString();

    const isCoAdviser =
        group.coadviserId &&
        group.coadviserId.toString() === userId.toString();

    const isSubject_instructor =
        group.coadviserId &&
        group.coadviserId.toString() === userId.toString();

    if (isAdviser) {
        userRole = "adviser";
        console.log(`User ${userId} is the ADVISER of group ${group._id}`);
    } else if (isCoAdviser) {
        userRole = "co-adviser";
        console.log(`User ${userId} is the CO-ADVISER of group ${group._id}`);
    } else if (isSubject_instructor) {
        userRole = "subject_instrutor";
        console.log(`User ${userId} is the CO-ADVISER of group ${group._id}`);
    }

    // ==========================================
    // 5. I-SET ANG FIELDS DIRETSO SA DOCUMENT
    // ==========================================
    // I-apply lahat ng fields na galing sa request body
    // (hal. status, title, description, etc. kung meron)
    Object.keys(req.body).forEach((key) => {
        proposedTitle[key] = req.body[key];
    });

    // ==========================================
    // 6. SET ADVISER / CO-ADVISER FLAG
    // ==========================================
    if (userRole === "adviser") {
        proposedTitle.adviser = true;
        console.log(`Setting ProposedTitle.adviser = true for user ${userId}`);
    }

    if (userRole === "co-adviser") {
        proposedTitle.coAdviser = true;
        console.log(`Setting ProposedTitle.coAdviser = true for user ${userId}`);
    }

    // ==========================================
    // 7. I-SAVE PARA TUMAKBO ANG PRE-SAVE HOOKS
    // ==========================================
    const updatedProposedTitle = await proposedTitle.save();

    // ==========================================
    // 8. SOCKET.IO REAL-TIME UPDATE
    // ==========================================
    const io = req.app.get("io");

    if (io) {
        io.emit("ProposedTitleUpdate", {
            message: `Proposed title "${updatedProposedTitle.title}" has been ${status || updatedProposedTitle.status
                }`,
            data: updatedProposedTitle,
            updatedBy: {
                userId: userId,
                role: userRole,
                groupId: group._id,
                groupName: group.name,
            },
        });
    }

    // ==========================================
    // 9. RESPONSE
    // ==========================================
    res.status(200).json({
        status: "success",
        message: "Proposed title updated successfully",
        data: updatedProposedTitle,
        updatedBy: {
            userId: userId,
            role: userRole,
            groupId: group._id,
            groupName: group.name,
        },
    });
});


exports.deleteProposedTitle = AsyncErrorHandler(async (req, res) => {
    const proposedTitle = await ProposedTitleModel.findById(req.params.id);

    if (!proposedTitle) {
        return res.status(404).json({
            status: "fail",
            message: "Proposed title not found.",
        });
    }

    // Delete file from UploadAgta if exists
    if (proposedTitle.publicId && process.env.UPLOADAGTA_DELETE_URL) {
        try {
            await axios.delete(`${process.env.UPLOADAGTA_DELETE_URL}/${proposedTitle.publicId}`);
            console.log("🗑️ File deleted from UploadAgta:", proposedTitle.publicId);
        } catch (err) {
            console.error("❌ Failed to delete file from UploadAgta:", err.message);
        }
    }

    await ProposedTitleModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        message: "Proposed title deleted successfully.",
    });
});


exports.getProposedTitleById = AsyncErrorHandler(async (req, res) => {
    const { id } = req.params;

    const proposedTitle = await ProposedTitleModel.findById(id)
        .populate("groupId", "groupName")
        .populate("uploadedBy", "first_name last_name id_number");

    if (!proposedTitle) {
        return res.status(404).json({
            status: "fail",
            message: "Proposed title not found.",
        });
    }

    res.status(200).json({
        status: "success",
        data: proposedTitle,
    });
});

exports.getFileCloud = AsyncErrorHandler(async (req, res) => {
    const { id } = req.params;

    const file = await ProposedTitleModel.findById(id);

    if (!file) {
        return res.status(404).json({ message: "File not found." });
    }

    if (!file.fileUrl) {
        return res.status(404).json({ message: "File URL not found." });
    }

    try {
        const response = await axios({
            method: "GET",
            url: file.fileUrl,
            responseType: "stream",
        });

        const contentType = file.fileType || "application/pdf";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Disposition", `inline; filename="${file.fileName || 'document.pdf'}"`);

        return response.data.pipe(res);
    } catch (error) {
        console.error("Error fetching file from UploadAgta:", error);
        return res.status(500).json({
            status: "error",
            message: "Failed to fetch file from UploadAgta",
        });
    }
});


exports.getFileUrl = AsyncErrorHandler(async (req, res) => {
    const { id } = req.params;

    const file = await ProposedTitleModel.findById(id);

    if (!file) {
        return res.status(404).json({
            status: "fail",
            message: "File not found.",
        });
    }

    if (!file.fileUrl) {
        return res.status(404).json({
            status: "fail",
            message: "File URL not found.",
        });
    }

    res.status(200).json({
        status: "success",
        data: {
            fileUrl: file.fileUrl,
            fileName: file.fileName,
            fileType: file.fileType,
        },
    });
});

exports.getProposedTitlesByGroup = AsyncErrorHandler(async (req, res) => {
    const { groupId } = req.params;

    const proposedTitles = await ProposedTitleModel.find({ groupId })
        .populate("uploadedBy", "first_name last_name id_number")
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: "success",
        results: proposedTitles.length,
        data: proposedTitles,
    });
});


exports.getProposedTitlesByStatus = AsyncErrorHandler(async (req, res) => {
    const { status } = req.params;
    const userId = req.user.linkId;

    const matchStage = { status };

    // If student/organizer, only show their own
    if (req.user.role === "student" || req.user.role === "organizer") {
        matchStage.uploadedBy = new mongoose.Types.ObjectId(userId);
    }

    const proposedTitles = await ProposedTitleModel.find(matchStage)
        .populate("groupId", "groupName")
        .populate("uploadedBy", "first_name last_name id_number")
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: "success",
        results: proposedTitles.length,
        data: proposedTitles,
    });
});


exports.bulkUpdateStatus = AsyncErrorHandler(async (req, res) => {
    const { ids, status, remarks } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
            status: "fail",
            message: "Please provide an array of proposal IDs",
        });
    }

    const updateData = { status };
    if (remarks) {
        updateData.remarks = remarks;
    }

    const result = await ProposedTitleModel.updateMany(
        { _id: { $in: ids } },
        updateData,
        { new: true }
    );

    res.status(200).json({
        status: "success",
        message: `${result.modifiedCount} proposed titles updated successfully`,
        data: result,
    });
});


exports.DisplayReadytitle = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const {
        search,
        dateFrom,
        dateTo,
        groupId
    } = req.query;

    const role = req.user.role;
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // =========================================================
    // FIXED STATUS
    // Display ONLY "Ready for Defense"
    // =========================================================
    const matchStage = {
        status: "Ready for Defense"
    };

    // =========================================================
    // ROLE FILTER
    // =========================================================
    if (role === "student") {
        matchStage.uploadedBy = userObjectId;
    }

    // =========================================================
    // GROUP FILTER
    // =========================================================
    if (groupId) {
        matchStage.groupId = new mongoose.Types.ObjectId(groupId);
    }

    // =========================================================
    // SEARCH FILTER - TITLE
    // =========================================================
    if (search) {
        matchStage.title = {
            $regex: search.trim(),
            $options: "i"
        };
    }

    // =========================================================
    // DATE FILTER
    // =========================================================
    if (dateFrom || dateTo) {
        matchStage.createdAt = {};

        if (dateFrom) {
            matchStage.createdAt.$gte = new Date(dateFrom);
        }

        if (dateTo) {
            const endOfDay = new Date(dateTo);

            endOfDay.setHours(
                23,
                59,
                59,
                999
            );

            matchStage.createdAt.$lte = endOfDay;
        }
    }

    // =========================================================
    // ROLE-BASED MATCH
    // =========================================================
    let roleMatchStage = null;

    if (
        role === "adviser" ||
        role === "coadviser"
    ) {
        roleMatchStage = {
            $or: [
                {
                    "groupInfo.adviserId":
                        userObjectId
                },
                {
                    "groupInfo.coadviserId":
                        userObjectId
                }
            ]
        };
    }

    else if (role === "panelist") {
        roleMatchStage = {
            "groupInfo.panelistIds":
                userObjectId
        };
    }

    else if (
        role === "organizer" ||
        role === "admin"
    ) {
        roleMatchStage = null;
    }

    // =========================================================
    // AGGREGATION
    // =========================================================
    const result =
        await ProposedTitleModel.aggregate([

            // =================================================
            // STAGE 1
            // Fixed status + filters
            // =================================================
            {
                $match: matchStage
            },

            // =================================================
            // STAGE 2
            // LOOKUP GROUP
            // =================================================
            {
                $lookup: {
                    from: "groups",
                    localField: "groupId",
                    foreignField: "_id",
                    as: "groupInfo"
                }
            },

            // =================================================
            // STAGE 3
            // UNWIND GROUP
            // =================================================
            {
                $unwind: {
                    path: "$groupInfo",
                    preserveNullAndEmptyArrays: true
                }
            },

            // =================================================
            // STAGE 4
            // ROLE-BASED FILTER
            // =================================================
            ...(roleMatchStage
                ? [
                    {
                        $match: roleMatchStage
                    }
                ]
                : []),

            // =================================================
            // STAGE 5
            // LOOKUP UPLOADER
            // =================================================
            {
                $lookup: {
                    from: "userloginschemas",
                    localField: "uploadedBy",
                    foreignField: "_id",
                    as: "uploaderInfo"
                }
            },

            // =================================================
            // STAGE 6
            // UNWIND UPLOADER
            // =================================================
            {
                $unwind: {
                    path: "$uploaderInfo",
                    preserveNullAndEmptyArrays: true
                }
            },

            // =================================================
            // STAGE 7
            // LOOKUP COMMENTS
            // =================================================
            {
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "proposedTitleId",
                    as: "comments"
                }
            },

            // =================================================
            // STAGE 8
            // UNWIND COMMENTS
            // =================================================
            {
                $unwind: {
                    path: "$comments",
                    preserveNullAndEmptyArrays: true
                }
            },

            // =================================================
            // STAGE 9
            // LOOKUP COMMENT AUTHOR
            // =================================================
            {
                $lookup: {
                    from: "userloginschemas",
                    localField: "comments.userId",
                    foreignField: "_id",
                    as: "comments.authorInfo"
                }
            },

            // =================================================
            // STAGE 10
            // UNWIND AUTHOR INFO
            // =================================================
            {
                $unwind: {
                    path: "$comments.authorInfo",
                    preserveNullAndEmptyArrays: true
                }
            },

            // =================================================
            // STAGE 11
            // GROUP BACK COMMENTS
            // =================================================
            {
                $group: {
                    _id: "$_id",

                    title: {
                        $first: "$title"
                    },

                    description: {
                        $first: "$description"
                    },

                    status: {
                        $first: "$status"
                    },

                    remarks: {
                        $first: "$remarks"
                    },

                    createdAt: {
                        $first: "$createdAt"
                    },

                    updatedAt: {
                        $first: "$updatedAt"
                    },

                    fileName: {
                        $first: "$fileName"
                    },

                    fileUrl: {
                        $first: "$fileUrl"
                    },

                    fileType: {
                        $first: "$fileType"
                    },

                    isPdf: {
                        $first: "$isPdf"
                    },

                    adviser: {
                        $first: "$adviser"
                    },

                    coAdviser: {
                        $first: "$coAdviser"
                    },

                    // =========================================
                    // TITLE URL TRACKING
                    // =========================================
                    titleUrlTracking: {
                        $first: "$titleUrlTracking"
                    },

                    groupInfo: {
                        $first: "$groupInfo"
                    },

                    uploaderInfo: {
                        $first: "$uploaderInfo"
                    },

                    comments: {
                        $push: {
                            _id: "$comments._id",

                            text: "$comments.text",

                            userId: "$comments.userId",

                            createdAt:
                                "$comments.createdAt",

                            updatedAt:
                                "$comments.updatedAt",

                            author: {
                                _id:
                                    "$comments.authorInfo._id",

                                first_name:
                                    "$comments.authorInfo.first_name",

                                last_name:
                                    "$comments.authorInfo.last_name",

                                id_number:
                                    "$comments.authorInfo.id_number",

                                email:
                                    "$comments.authorInfo.email",

                                role:
                                    "$comments.authorInfo.role"
                            }
                        }
                    }
                }
            },

            // =================================================
            // STAGE 12
            // SORT COMMENTS
            // =================================================
            {
                $addFields: {
                    comments: {
                        $sortArray: {
                            input: "$comments",
                            sortBy: {
                                createdAt: 1
                            }
                        }
                    }
                }
            },

            // =================================================
            // STAGE 13
            // SORT TITLE
            // =================================================
            {
                $sort: {
                    createdAt: -1
                }
            },

            // =================================================
            // STAGE 14
            // PAGINATION
            // =================================================
            {
                $facet: {

                    // =========================================
                    // DATA
                    // =========================================
                    data: [

                        {
                            $skip: skip
                        },

                        {
                            $limit: limit
                        },

                        // =====================================
                        // PROJECT
                        // =====================================
                        {
                            $project: {

                                _id: 1,

                                title: 1,

                                description: 1,

                                // Fixed status will still be returned
                                status: 1,

                                remarks: 1,

                                createdAt: 1,

                                updatedAt: 1,

                                fileName: 1,

                                fileUrl: 1,

                                fileType: 1,

                                isPdf: 1,

                                adviser: 1,

                                coAdviser: 1,

                                // =================================
                                // TITLE URL TRACKING
                                // =================================
                                titleUrlTracking: 1,

                                // =================================
                                // GROUP NAME
                                // =================================
                                groupName: {
                                    $ifNull: [
                                        "$groupInfo.groupName",
                                        "N/A"
                                    ]
                                },

                                // =================================
                                // UPLOADER NAME
                                // =================================
                                uploaderName: {
                                    $ifNull: [
                                        {
                                            $concat: [
                                                "$uploaderInfo.first_name",
                                                " ",
                                                "$uploaderInfo.last_name"
                                            ]
                                        },
                                        "N/A"
                                    ]
                                },

                                // =================================
                                // UPLOADER ID
                                // =================================
                                uploaderIdNumber: {
                                    $ifNull: [
                                        "$uploaderInfo.id_number",
                                        "N/A"
                                    ]
                                },

                                // =================================
                                // COMMENTS
                                // =================================
                                comments: 1,

                                commentCount: {
                                    $size: "$comments"
                                },

                                // =================================
                                // FULL GROUP INFO
                                // =================================
                                groupInfo: 1,

                                // =================================
                                // FULL UPLOADER INFO
                                // =================================
                                uploaderInfo: 1
                            }
                        }
                    ],

                    // =========================================
                    // TOTAL COUNT
                    // =========================================
                    totalCount: [
                        {
                            $count: "count"
                        }
                    ]
                }
            }
        ]);

    // =========================================================
    // RESULT DATA
    // =========================================================
    const proposedTitles =
        result[0]?.data || [];

    const totalCount =
        result[0]?.totalCount?.[0]?.count || 0;

    const totalPages =
        Math.ceil(totalCount / limit);

    // =========================================================
    // RESPONSE
    // =========================================================
    res.status(200).json({
        status: "success",

        currentPage: page,

        totalPages,

        totalCount,

        results:
            proposedTitles.length,

        data:
            proposedTitles
    });
});


exports.DisplayArcivedtitle = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { search, dateFrom, dateTo, groupId } = req.query;

    const role = req.user.role;
    const userId = req.user._id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // =========================================================
    // FIXED FILTER — archived only
    // =========================================================
    const matchStage = { isArchived: true };

    // ROLE FILTER
    if (role === "student") {
        matchStage.uploadedBy = userObjectId;
    }

    // GROUP FILTER
    if (groupId) {
        matchStage.groupId = new mongoose.Types.ObjectId(groupId);
    }

    // SEARCH FILTER
    if (search) {
        matchStage.title = {
            $regex: search.trim(),
            $options: "i"
        };
    }

    // DATE FILTER
    if (dateFrom || dateTo) {
        matchStage.createdAt = {};
        if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
        if (dateTo) {
            const endOfDay = new Date(dateTo);
            endOfDay.setHours(23, 59, 59, 999);
            matchStage.createdAt.$lte = endOfDay;
        }
    }

    // ROLE-BASED MATCH
    let roleMatchStage = null;

    if (role === "adviser" || role === "coadviser") {
        roleMatchStage = {
            $or: [
                { "groupInfo.adviserId": userObjectId },
                { "groupInfo.coadviserId": userObjectId }
            ]
        };
    } else if (role === "panelist") {
        roleMatchStage = { "groupInfo.panelistIds": userObjectId };
    } else if (role === "organizer" || role === "admin") {
        roleMatchStage = null;
    }

    // =========================================================
    // AGGREGATION
    // =========================================================
    const result = await ProposedTitleModel.aggregate([

        // STAGE 1 — Match
        { $match: matchStage },

        // STAGE 2 — Lookup Group
        {
            $lookup: {
                from: "groups",
                localField: "groupId",
                foreignField: "_id",
                as: "groupInfo"
            }
        },

        // STAGE 3 — Unwind Group
        {
            $unwind: {
                path: "$groupInfo",
                preserveNullAndEmptyArrays: true
            }
        },

        // STAGE 4 — Role-based filter
        ...(roleMatchStage ? [{ $match: roleMatchStage }] : []),

        // =========================================================
        // STAGE 5 — LOOKUP MEMBERS (from groupInfo.members)
        // =========================================================
        {
            $lookup: {
                from: "userloginschemas",
                localField: "groupInfo.members",
                foreignField: "_id",
                as: "membersInfo"
            }
        },

        // =========================================================
        // STAGE 6 — LOOKUP ADVISER (from groupInfo.adviserId)
        // =========================================================
        {
            $lookup: {
                from: "userloginschemas",
                localField: "groupInfo.adviserId",
                foreignField: "_id",
                as: "adviserInfo"
            }
        },

        // =========================================================
        // STAGE 7 — LOOKUP CO-ADVISER (from groupInfo.coadviserId)
        // =========================================================
        {
            $lookup: {
                from: "userloginschemas",
                localField: "groupInfo.coadviserId",
                foreignField: "_id",
                as: "coadviserInfo"
            }
        },

        // =========================================================
        // STAGE 8 — LOOKUP PANELISTS (from groupInfo.panelistIds)
        // =========================================================
        {
            $lookup: {
                from: "userloginschemas",
                localField: "groupInfo.panelistIds",
                foreignField: "_id",
                as: "panelistsInfo"
            }
        },

        // =========================================================
        // ✅ STAGE 9 — LOOKUP USERS WHO USED THIS GROUP'S
        //             referralCode AS THEIR referredBy
        // =========================================================
        {
            $lookup: {
                from: "userloginschemas",
                localField: "groupInfo.referralCode",
                foreignField: "referredBy",
                as: "referredUsersInfo"
            }
        },

        // STAGE 10 — Lookup Uploader
        {
            $lookup: {
                from: "userloginschemas",
                localField: "uploadedBy",
                foreignField: "_id",
                as: "uploaderInfo"
            }
        },

        // STAGE 11 — Unwind Uploader
        {
            $unwind: {
                path: "$uploaderInfo",
                preserveNullAndEmptyArrays: true
            }
        },

        // STAGE 12 — Lookup Comments
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "proposedTitleId",
                as: "comments"
            }
        },

        // STAGE 13 — Unwind Comments
        {
            $unwind: {
                path: "$comments",
                preserveNullAndEmptyArrays: true
            }
        },

        // STAGE 14 — Lookup Comment Author
        {
            $lookup: {
                from: "userloginschemas",
                localField: "comments.userId",
                foreignField: "_id",
                as: "comments.authorInfo"
            }
        },

        // STAGE 15 — Unwind Author Info
        {
            $unwind: {
                path: "$comments.authorInfo",
                preserveNullAndEmptyArrays: true
            }
        },

        // =========================================================
        // STAGE 16 — GROUP BACK (preserve new lookups)
        // =========================================================
        {
            $group: {
                _id: "$_id",

                title: { $first: "$title" },
                description: { $first: "$description" },
                status: { $first: "$status" },
                isArchived: { $first: "$isArchived" },
                remarks: { $first: "$remarks" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" },
                fileName: { $first: "$fileName" },
                fileUrl: { $first: "$fileUrl" },
                fileType: { $first: "$fileType" },
                isPdf: { $first: "$isPdf" },
                adviser: { $first: "$adviser" },
                coAdviser: { $first: "$coAdviser" },
                titleUrlTracking: { $first: "$titleUrlTracking" },

                groupInfo: { $first: "$groupInfo" },
                uploaderInfo: { $first: "$uploaderInfo" },

                // ✅ Preserve looked-up users
                membersInfo: { $first: "$membersInfo" },
                adviserInfo: { $first: "$adviserInfo" },
                coadviserInfo: { $first: "$coadviserInfo" },
                panelistsInfo: { $first: "$panelistsInfo" },

                // ✅ NEW — referred users via group referralCode
                referredUsersInfo: { $first: "$referredUsersInfo" },

                comments: {
                    $push: {
                        _id: "$comments._id",
                        text: "$comments.text",
                        userId: "$comments.userId",
                        createdAt: "$comments.createdAt",
                        updatedAt: "$comments.updatedAt",
                        author: {
                            _id: "$comments.authorInfo._id",
                            first_name: "$comments.authorInfo.first_name",
                            last_name: "$comments.authorInfo.last_name",
                            id_number: "$comments.authorInfo.id_number",
                            email: "$comments.authorInfo.email",
                            role: "$comments.authorInfo.role"
                        }
                    }
                }
            }
        },

        // STAGE 17 — Sort comments
        {
            $addFields: {
                comments: {
                    $sortArray: {
                        input: "$comments",
                        sortBy: { createdAt: 1 }
                    }
                }
            }
        },

        // STAGE 18 — Sort titles
        { $sort: { createdAt: -1 } },

        // STAGE 19 — Pagination
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
                            status: 1,
                            isArchived: 1,
                            remarks: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            fileName: 1,
                            fileUrl: 1,
                            fileType: 1,
                            isPdf: 1,
                            adviser: 1,
                            coAdviser: 1,
                            titleUrlTracking: 1,

                            // GROUP NAME
                            groupName: {
                                $ifNull: ["$groupInfo.name", "N/A"]
                            },

                            // GROUP REFERRAL CODE
                            referralCode: {
                                $ifNull: ["$groupInfo.referralCode", "N/A"]
                            },

                            // UPLOADER
                            uploaderName: {
                                $ifNull: [
                                    {
                                        $concat: [
                                            "$uploaderInfo.first_name",
                                            " ",
                                            "$uploaderInfo.last_name"
                                        ]
                                    },
                                    "N/A"
                                ]
                            },
                            uploaderIdNumber: {
                                $ifNull: ["$uploaderInfo.id_number", "N/A"]
                            },

                            // COMMENTS
                            comments: 1,
                            commentCount: { $size: "$comments" },

                            // ✅ POPULATED MEMBERS (lean projection)
                            members: {
                                $map: {
                                    input: "$membersInfo",
                                    as: "m",
                                    in: {
                                        _id: "$$m._id",
                                        first_name: "$$m.first_name",
                                        last_name: "$$m.last_name",
                                        full_name: {
                                            $concat: [
                                                { $ifNull: ["$$m.first_name", ""] },
                                                " ",
                                                { $ifNull: ["$$m.last_name", ""] }
                                            ]
                                        },
                                        id_number: "$$m.id_number",
                                        email: "$$m.email",
                                        role: "$$m.role"
                                    }
                                }
                            },

                            // ✅ POPULATED ADVISER
                            adviserInfo: {
                                $arrayElemAt: ["$adviserInfo", 0]
                            },

                            // ✅ POPULATED CO-ADVISER
                            coadviserInfo: {
                                $arrayElemAt: ["$coadviserInfo", 0]
                            },

                            // ✅ POPULATED PANELISTS
                            panelists: {
                                $map: {
                                    input: "$panelistsInfo",
                                    as: "p",
                                    in: {
                                        _id: "$$p._id",
                                        first_name: "$$p.first_name",
                                        last_name: "$$p.last_name",
                                        full_name: {
                                            $concat: [
                                                { $ifNull: ["$$p.first_name", ""] },
                                                " ",
                                                { $ifNull: ["$$p.last_name", ""] }
                                            ]
                                        },
                                        id_number: "$$p.id_number",
                                        email: "$$p.email",
                                        role: "$$p.role"
                                    }
                                }
                            },

                            // =================================================
                            // ✅ NEW — USERS WHO USED THIS GROUP'S referralCode
                            //          (matched via referredBy)
                            // =================================================
                            referredUsers: {
                                $map: {
                                    input: "$referredUsersInfo",
                                    as: "r",
                                    in: {
                                        _id: "$$r._id",
                                        first_name: "$$r.first_name",
                                        last_name: "$$r.last_name",
                                        full_name: {
                                            $concat: [
                                                { $ifNull: ["$$r.first_name", ""] },
                                                " ",
                                                { $ifNull: ["$$r.last_name", ""] }
                                            ]
                                        },
                                        username: "$$r.username",
                                        id_number: "$$r.id_number",
                                        email: "$$r.email",
                                        role: "$$r.role",
                                        referredBy: "$$r.referredBy",
                                        status: "$$r.status"
                                    }
                                }
                            },
                            referredCount: { $size: "$referredUsersInfo" },

                            // FULL REFERENCES (optional — comment out if not needed)
                            groupInfo: 1,
                            uploaderInfo: 1
                        }
                    }
                ],

                totalCount: [{ $count: "count" }]
            }
        }
    ]);

    // =========================================================
    // RESULT
    // =========================================================
    const proposedTitles = result[0]?.data || [];
    const totalCount = result[0]?.totalCount?.[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages,
        totalCount,
        results: proposedTitles.length,
        data: proposedTitles
    });
});