const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const GroupModel = require("../Models/GroupName");
const mongoose = require("mongoose");
const UserLoginSchema = require("../Models/LogInSchema")

const ProposedTitle = require("../Models/ProposedTitle");


const Group = require("../Models/GroupName");

// ==========================================
// CREATE GROUP
// ==========================================
exports.createGroup = AsyncErrorHandler(async (req, res, next) => {
    console.log("Create Group Called");
    console.log(req.body);

    const { name, sectionId } = req.body;
    const userId = req.user._id;

    // Basic validation - name and sectionId lang ang required
    if (!name || !sectionId) {
        return res.status(400).json({
            success: false,
            message: "Name and section ID are required",
        });
    }

    try {
        // Check if group name already exists in the same section
        const existingName = await GroupModel.findOne({
            name,
            sectionId
        });
        if (existingName) {
            return res.status(400).json({
                success: false,
                message: "A group with this name already exists in this section",
            });
        }

        // Create new group instance - name and sectionId lang
        const group = new GroupModel({
            name,
            sectionId
        });

        console.log("Group data before save:", group);
        console.log("Referral code before save:", group.referralCode);

        // Save the group - this will trigger the pre-save middleware
        await group.save();

        console.log("Group saved successfully");
        console.log("Generated referral code:", group.referralCode);

        // Populate the group with section details
        const populatedGroup = await GroupModel.aggregate([
            { $match: { _id: group._id } },
            {
                $lookup: {
                    from: "sections",
                    localField: "sectionId",
                    foreignField: "_id",
                    as: "sectionDetails"
                }
            },
            {
                $addFields: {
                    sectionId: { $arrayElemAt: ["$sectionDetails", 0] }
                }
            },
            {
                $project: {
                    sectionDetails: 0
                }
            }
        ]);

        return res.status(201).json({
            status: "Success",
            message: "Group created successfully",
            data: populatedGroup[0] || group
        });

    } catch (error) {
        console.error("Error creating group:", error);
        console.error("Error stack:", error.stack);

        // Check for duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `Duplicate ${field} error. Please try again.`
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create group",
            error: error.message
        });
    }
});

// ==========================================
// DISPLAY ALL GROUPS (WITH PAGINATION + SEARCH + FILTERS)
// ==========================================
exports.DisplayGroups = AsyncErrorHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, sectionId, mentorId } = req.query;

    const matchStage = {};

    // Search by name or referral code
    if (search) {
        matchStage.$or = [
            { name: { $regex: search.trim(), $options: "i" } },
            { referralCode: { $regex: search.trim(), $options: "i" } }
        ];
    }

    // Filter by section
    if (sectionId) {
        matchStage.sectionId = new mongoose.Types.ObjectId(sectionId);
    }

    // Filter by mentor (assignedMentor)
    if (mentorId) {
        matchStage.assignedMentor = new mongoose.Types.ObjectId(mentorId);
    }

    const result = await GroupModel.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },

        // Lookup for section details
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        // Lookup for members details
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        // Lookup for assignedMentor details
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        // Lookup for adviserId details
        {
            $lookup: {
                from: "userloginschemas",
                localField: "adviserId",
                foreignField: "_id",
                as: "adviserDetails"
            }
        },
        // Lookup for coadviserId details
        {
            $lookup: {
                from: "userloginschemas",
                localField: "coadviserId",
                foreignField: "_id",
                as: "coadviserDetails"
            }
        },
        // Lookup for approvedTitle details
        {
            $lookup: {
                from: "proposedtitles",
                localField: "approvedTitleId",
                foreignField: "_id",
                as: "approvedTitleDetails"
            }
        },
        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: { $arrayElemAt: ["$mentorDetails", 0] },
                adviserId: { $arrayElemAt: ["$adviserDetails", 0] },
                coadviserId: { $arrayElemAt: ["$coadviserDetails", 0] },
                approvedTitleId: { $arrayElemAt: ["$approvedTitleDetails", 0] }
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                adviserDetails: 0,
                coadviserDetails: 0,
                approvedTitleDetails: 0,

                // Exclude sensitive fields from members
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,

                // Exclude sensitive fields from mentor
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0,

                // Exclude sensitive fields from adviser
                "adviserId.password": 0,
                "adviserId.confirmPassword": 0,
                "adviserId.passwordResetToken": 0,
                "adviserId.passwordResetTokenExpires": 0,
                "adviserId.__v": 0,
                "adviserId.passwordChangedAt": 0,

                // Exclude sensitive fields from co-adviser
                "coadviserId.password": 0,
                "coadviserId.confirmPassword": 0,
                "coadviserId.passwordResetToken": 0,
                "coadviserId.passwordResetTokenExpires": 0,
                "coadviserId.__v": 0,
                "coadviserId.passwordChangedAt": 0
            }
        },
        {
            $facet: {
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            referralCode: 1,
                            sectionId: 1,
                            members: 1,
                            assignedMentor: 1,
                            adviserId: 1,
                            coadviserId: 1,
                            adviserStatus: 1,
                            coadviserStatus: 1,
                            approvedTitleId: 1,
                            createdAt: 1,
                            updatedAt: 1,
                            // Add computed fields for easier use in frontend
                            hasAdviser: { $cond: [{ $ifNull: ["$adviserId", false] }, true, false] },
                            hasCoAdviser: { $cond: [{ $ifNull: ["$coadviserId", false] }, true, false] }
                        }
                    }
                ],
                totalCount: [{ $count: "count" }]
            }
        }
    ]);

    const groups = result[0].data || [];
    const totalCount = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: "success",
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        results: groups.length,
        data: groups
    });
});


exports.getSingleGroup = AsyncErrorHandler(async (req, res) => {
    try {
        const { referredBy } = req.params;

        console.log("========================================");
        console.log("GET SINGLE GROUP");
        console.log("========================================");
        console.log("Request referredBy:", referredBy);

        // ==========================================
        // 1. GET ALL USERS WITH SAME referredBy
        // ==========================================
        const users = await UserLoginSchema.find({
            referredBy: referredBy
        }).lean();

        console.log("Users found:", users.length);

        if (!users || users.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "No users found with this referral code",
                referralCode: referredBy
            });
        }

        // ==========================================
        // 2. GET THE referralCode FROM USER
        // ==========================================
        // Since all students have the same referredBy,
        // we only need to get it from one user.
        const referralCode = users[0].referredBy;

        console.log("Referral Code from User:", referralCode);

        // ==========================================
        // 3. FIND GROUP USING referralCode
        // ==========================================
        const group = await Group.findOne({
            referralCode: referralCode
        }).lean();

        console.log("Matched Group:", group);

        // ==========================================
        // 4. GET GROUP ID
        // ==========================================
        const groupId = group?._id || null;

        console.log("Matched Group ID:", groupId);

        // ==========================================
        // 5. FIND PROPOSED TITLE USING GROUP ID
        // ==========================================
        let proposedTitles = [];

        if (groupId) {
            proposedTitles = await ProposedTitle.find({
                groupId: groupId
            }).lean();
        }

        console.log(
            "Matched ProposedTitle count:",
            proposedTitles.length
        );

        console.log(
            "Matched ProposedTitles:",
            proposedTitles
        );

        // ==========================================
        // 6. FORMAT USERS
        // ==========================================
        const formattedUsers = users.map(user => ({
            id: user._id,
            first_name: user.first_name,
            last_name: user.last_name,
            middle_name: user.middle_name,
            suffix: user.suffix,
            username: user.username,
            email: user.username,
            role: user.role,
            status: user.status,
            referredBy: user.referredBy,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        }));

        // ==========================================
        // 7. RESPONSE
        // ==========================================
        return res.status(200).json({
            status: "success",

            message: `${users.length} user(s) found with referral code: ${referralCode}`,

            count: users.length,

            // ======================================
            // ORIGINAL USER DATA
            // ======================================
            data: formattedUsers,

            // ======================================
            // GROUP INFORMATION
            // ======================================
            group: group || null,

            // ======================================
            // PROPOSED TITLE OF THE GROUP
            // ======================================
            proposedTitles: proposedTitles
        });

    } catch (error) {
        console.error("getSingleGroup Error:", error);

        return res.status(500).json({
            status: "error",
            message: "Something went wrong while getting the group",
            error: error.message
        });
    }
});

exports.getgroupdetails = AsyncErrorHandler(async (req, res) => {
    const { referredBy } = req.params;

    console.log("referredBy:", referredBy);

    const cleanReferralCode = referredBy ? referredBy.toUpperCase().trim() : '';

    // 1. Hanapin ang Group gamit ang Aggregation ($lookup)
    const groupResult = await GroupModel.aggregate([
        {
            $match: { referralCode: cleanReferralCode }
        },
        {
            $lookup: {
                from: 'sections',
                localField: 'sectionId',
                foreignField: '_id',
                as: 'section'
            }
        },
        { $unwind: { path: '$section', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'subjects',
                localField: 'section.subjectId',
                foreignField: '_id',
                as: 'section.subject'
            }
        },
        { $unwind: { path: '$section.subject', preserveNullAndEmptyArrays: true } },

        // ==========================================
        // 🔗 LOOKUP FOR FORMAT (through subject.formatID)
        // ==========================================
        {
            $lookup: {
                from: 'formats',
                localField: 'section.subject.formatID',
                foreignField: '_id',
                as: 'section.subject.formatDetails'
            }
        },
        {
            $unwind: {
                path: '$section.subject.formatDetails',
                preserveNullAndEmptyArrays: true
            }
        },

        // ==========================================
        // 🔗 LOOKUP FOR FORMAT UPLOADER (optional)
        // ==========================================
        {
            $lookup: {
                from: 'userloginschemas',
                localField: 'section.subject.formatDetails.uploadedBy',
                foreignField: '_id',
                as: 'section.subject.formatDetails.uploaderDetails'
            }
        },
        {
            $unwind: {
                path: '$section.subject.formatDetails.uploaderDetails',
                preserveNullAndEmptyArrays: true
            }
        },

        {
            $lookup: {
                from: 'userlogins',
                localField: 'members',
                foreignField: '_id',
                as: 'membersDetails'
            }
        },
        {
            $lookup: {
                from: 'userlogins',
                localField: 'assignedMentor',
                foreignField: '_id',
                as: 'assignedMentorDetails'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                referralCode: 1,
                approvedTitleId: 1,
                createdAt: 1,
                updatedAt: 1,
                memberCount: { $size: { $ifNull: ['$members', []] } },
                mentorCount: { $size: { $ifNull: ['$assignedMentor', []] } },
                section: {
                    _id: '$section._id',
                    name: '$section.name',
                    subject: {
                        _id: '$section.subject._id',
                        title: '$section.subject.title',
                        createdBy: '$section.subject.createdBy',
                        formatID: '$section.subject.formatID',
                        createdAt: '$section.subject.createdAt',
                        updatedAt: '$section.subject.updatedAt',
                        // ==========================================
                        // 🔗 FORMAT DETAILS (populated)
                        // ==========================================
                        formatDetails: {
                            _id: '$section.subject.formatDetails._id',
                            titleFormat: '$section.subject.formatDetails.titleFormat',
                            description: '$section.subject.formatDetails.description',
                            fileUrl: '$section.subject.formatDetails.fileUrl',
                            type: '$section.subject.formatDetails.type',
                            uploadedBy: {
                                _id: '$section.subject.formatDetails.uploaderDetails._id',
                                first_name: '$section.subject.formatDetails.uploaderDetails.first_name',
                                last_name: '$section.subject.formatDetails.uploaderDetails.last_name',
                                username: '$section.subject.formatDetails.uploaderDetails.username',
                                email: '$section.subject.formatDetails.uploaderDetails.username',
                                role: '$section.subject.formatDetails.uploaderDetails.role'
                            },
                            createdAt: '$section.subject.formatDetails.createdAt',
                            updatedAt: '$section.subject.formatDetails.updatedAt'
                        }
                    }
                },
                members: {
                    $map: {
                        input: '$membersDetails',
                        as: 'm',
                        in: {
                            _id: '$$m._id',
                            first_name: '$$m.first_name',
                            last_name: '$$m.last_name',
                            email: '$$m.username'
                        }
                    }
                },
                assignedMentor: {
                    $map: {
                        input: '$assignedMentorDetails',
                        as: 'mentor',
                        in: {
                            _id: '$$mentor._id',
                            first_name: '$$mentor.first_name',
                            last_name: '$$mentor.last_name',
                            email: '$$mentor.username'
                        }
                    }
                }
            }
        }
    ]);

    // 2. Hanapin ang LAHAT ng users na nag-register gamit ang referral code na ito
    const users = await UserLoginSchema.find({ referredBy: cleanReferralCode });

    if ((!groupResult || groupResult.length === 0) && (!users || users.length === 0)) {
        return res.status(404).json({
            status: "fail",
            message: "No group or users found with this referral code",
            referralCode: referredBy
        });
    }

    // 3. I-format ang data ng bawat user
    const formattedUsers = users.map(user => ({
        id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        suffix: user.suffix,
        username: user.username,
        email: user.username,
        role: user.role,
        status: user.status,
        referredBy: user.referredBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    }));

    // 4. Ibalik ang pinag-isang JSON Response
    res.status(200).json({
        status: "success",
        message: `Group details and referred users retrieved for code: ${cleanReferralCode}`,
        userCount: formattedUsers.length,
        group: groupResult.length > 0 ? groupResult[0] : null,
        referredUsers: formattedUsers
    });
});



// ==========================================
// UPDATE GROUP
// ==========================================
exports.updateGroup = AsyncErrorHandler(async (req, res) => {
    const { name, referralCode, sectionId, members, assignedMentor, approvedTitleId } = req.body;

    const existingGroup = await GroupModel.findById(req.params.id);
    if (!existingGroup) {
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }

    // Check if referral code already exists (if changing)
    if (referralCode && referralCode !== existingGroup.referralCode) {
        const codeExists = await GroupModel.findOne({
            referralCode,
            _id: { $ne: req.params.id }
        });
        if (codeExists) {
            return res.status(400).json({
                status: "fail",
                message: "Referral code already exists",
            });
        }
    }

    // Check if name already exists in the same section (if changing)
    if (name && name !== existingGroup.name && sectionId) {
        const nameExists = await GroupModel.findOne({
            name,
            sectionId,
            _id: { $ne: req.params.id }
        });
        if (nameExists) {
            return res.status(400).json({
                status: "fail",
                message: "A group with this name already exists in this section",
            });
        }
    }

    const group = await GroupModel.findByIdAndUpdate(
        req.params.id,
        {
            name,
            referralCode,
            sectionId,
            members,
            assignedMentor,
            approvedTitleId
        },
        {
            new: true,
            runValidators: true,
        }
    );

    // Populate the updated group
    const populatedResult = await GroupModel.aggregate([
        { $match: { _id: group._id } },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        {
            $lookup: {
                from: "proposedtitles",
                localField: "approvedTitleId",
                foreignField: "_id",
                as: "approvedTitleDetails"
            }
        },
        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: "$mentorDetails",
                approvedTitleId: { $arrayElemAt: ["$approvedTitleDetails", 0] }
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                approvedTitleDetails: 0,
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        message: "Group updated successfully",
        data: populatedResult[0] || group,
    });
});





exports.AssignAdviserandCoAdviser = AsyncErrorHandler(async (req, res) => {
    const { adviserId, coadviserId } = req.body;
    const groupId = req.params.id;

    console.log("🔍 [AssignAdviserandCoAdviser] Triggered!");
    console.log("📌 groupId from params:", groupId);
    console.log("📌 adviserId from body:", adviserId);
    console.log("📌 coadviserId from body:", coadviserId);

    // ✅ Check if groupId is provided
    if (!groupId) {
        console.log("❌ groupId is missing!");
        return res.status(400).json({
            status: "fail",
            message: "Group ID is required",
        });
    }

    // ✅ Find the group first
    const group = await GroupModel.findById(groupId);
    if (!group) {
        console.log(`❌ Group not found with ID: ${groupId}`);
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }

    console.log(`✅ Group found: ${group.name} (${group._id})`);

    // ✅ Validate adviserId if provided (only check if user exists)
    if (adviserId) {
        console.log(`🔍 Checking adviser: ${adviserId}`);
        const adviserExists = await UserLoginSchema.findById(adviserId);
        if (!adviserExists) {
            console.log(`❌ Adviser not found: ${adviserId}`);
            return res.status(404).json({
                status: "fail",
                message: "Adviser not found",
            });
        }
        console.log(`✅ Adviser exists: ${adviserExists.first_name} ${adviserExists.last_name}`);

        // Set the adviserId
        group.adviserId = adviserId;
    } else if (adviserId === null || adviserId === 'null') {
        // Remove adviser if null is passed
        group.adviserId = null;
    }

    // ✅ Validate coadviserId if provided (only check if user exists)
    if (coadviserId) {
        console.log(`🔍 Checking co-adviser: ${coadviserId}`);
        const coadviserExists = await UserLoginSchema.findById(coadviserId);
        if (!coadviserExists) {
            console.log(`❌ Co-adviser not found: ${coadviserId}`);
            return res.status(404).json({
                status: "fail",
                message: "Co-adviser not found",
            });
        }
        console.log(`✅ Co-adviser exists: ${coadviserExists.first_name} ${coadviserExists.last_name}`);

        // Set the coadviserId
        group.coadviserId = coadviserId;
    } else if (coadviserId === null || coadviserId === 'null') {
        // Remove co-adviser if null is passed
        group.coadviserId = null;
    }

    console.log("📝 Updated group data:", {
        adviserId: group.adviserId,
        coadviserId: group.coadviserId
    });

    // ✅ Save the group (this will trigger pre('save') middleware)
    await group.save();

    console.log(`✅ Group updated successfully: ${group.name}`);

    // ✅ Populate the updated group with adviser and co-adviser details
    const populatedResult = await GroupModel.aggregate([
        { $match: { _id: group._id } },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "adviserId",
                foreignField: "_id",
                as: "adviserDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "coadviserId",
                foreignField: "_id",
                as: "coadviserDetails"
            }
        },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        {
            $lookup: {
                from: "proposedtitles",
                localField: "approvedTitleId",
                foreignField: "_id",
                as: "approvedTitleDetails"
            }
        },
        {
            $addFields: {
                adviserId: { $arrayElemAt: ["$adviserDetails", 0] },
                coadviserId: { $arrayElemAt: ["$coadviserDetails", 0] },
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: "$mentorDetails",
                approvedTitleId: { $arrayElemAt: ["$approvedTitleDetails", 0] }
            }
        },
        {
            $project: {
                adviserDetails: 0,
                coadviserDetails: 0,
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                approvedTitleDetails: 0,
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,
                "adviserId.password": 0,
                "adviserId.confirmPassword": 0,
                "adviserId.passwordResetToken": 0,
                "adviserId.passwordResetTokenExpires": 0,
                "adviserId.__v": 0,
                "adviserId.passwordChangedAt": 0,
                "coadviserId.password": 0,
                "coadviserId.confirmPassword": 0,
                "coadviserId.passwordResetToken": 0,
                "coadviserId.passwordResetTokenExpires": 0,
                "coadviserId.__v": 0,
                "coadviserId.passwordChangedAt": 0,
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        message: "Adviser and Co-adviser assigned successfully",
        data: populatedResult[0] || group,
    });
});


// ==========================================
// DELETE GROUP
// ==========================================
exports.deleteGroup = AsyncErrorHandler(async (req, res) => {
    const group = await GroupModel.findById(req.params.id);

    if (!group) {
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }

    await GroupModel.findByIdAndDelete(req.params.id);

    res.status(200).json({
        status: "success",
        message: "Group deleted successfully",
    });
});

// ==========================================
// ADD MEMBER TO GROUP
// ==========================================
exports.addMemberToGroup = AsyncErrorHandler(async (req, res) => {
    const { userId } = req.body;
    const { id } = req.params;

    if (!userId) {
        return res.status(400).json({
            status: "fail",
            message: "User ID is required",
        });
    }

    const group = await GroupModel.findById(id);
    if (!group) {
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }

    // Check if user is already a member
    if (group.members.includes(userId)) {
        return res.status(400).json({
            status: "fail",
            message: "User is already a member of this group",
        });
    }

    // Add member
    group.members.push(userId);
    await group.save();

    // Populate and return updated group
    const updatedGroup = await GroupModel.aggregate([
        { $match: { _id: group._id } },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        {
            $lookup: {
                from: "proposedtitles",
                localField: "approvedTitleId",
                foreignField: "_id",
                as: "approvedTitleDetails"
            }
        },
        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: "$mentorDetails",
                approvedTitleId: { $arrayElemAt: ["$approvedTitleDetails", 0] }
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                approvedTitleDetails: 0,
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        message: "Member added successfully",
        data: updatedGroup[0] || group
    });
});

// ==========================================
// REMOVE MEMBER FROM GROUP
// ==========================================
exports.removeMemberFromGroup = AsyncErrorHandler(async (req, res) => {
    const { userId } = req.body;
    const { id } = req.params;

    if (!userId) {
        return res.status(400).json({
            status: "fail",
            message: "User ID is required",
        });
    }

    const group = await GroupModel.findById(id);
    if (!group) {
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }

    // Check if user is a member
    if (!group.members.includes(userId)) {
        return res.status(400).json({
            status: "fail",
            message: "User is not a member of this group",
        });
    }

    // Remove member
    group.members = group.members.filter(
        member => member.toString() !== userId
    );
    await group.save();

    res.status(200).json({
        status: "success",
        message: "Member removed successfully",
        data: group
    });
});

// ==========================================
// ASSIGN MENTOR TO GROUP
// ==========================================
exports.assignMentor = AsyncErrorHandler(async (req, res) => {
    const { mentorId } = req.body;
    const { id } = req.params;

    if (!mentorId) {
        return res.status(400).json({
            status: "fail",
            message: "Mentor ID is required",
        });
    }

    const group = await GroupModel.findById(id);
    if (!group) {
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }

    // Check if mentor is already assigned
    if (group.assignedMentor.includes(mentorId)) {
        return res.status(400).json({
            status: "fail",
            message: "Mentor is already assigned to this group",
        });
    }

    // Assign mentor
    group.assignedMentor.push(mentorId);
    await group.save();

    // Populate and return updated group
    const updatedGroup = await GroupModel.aggregate([
        { $match: { _id: group._id } },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        {
            $lookup: {
                from: "proposedtitles",
                localField: "approvedTitleId",
                foreignField: "_id",
                as: "approvedTitleDetails"
            }
        },
        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: "$mentorDetails",
                approvedTitleId: { $arrayElemAt: ["$approvedTitleDetails", 0] }
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                approvedTitleDetails: 0,
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        message: "Mentor assigned successfully",
        data: updatedGroup[0] || group
    });
});

// ==========================================
// GET GROUPS BY SECTION
// ==========================================
exports.getGroupsBySection = AsyncErrorHandler(async (req, res) => {
    const { sectionId } = req.params;

    const groups = await GroupModel.aggregate([
        {
            $match: {
                sectionId: new mongoose.Types.ObjectId(sectionId)
            }
        },
        { $sort: { name: 1 } },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: "$mentorDetails"
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: groups.length,
        data: groups
    });
});

// ==========================================
// GET GROUPS BY MENTOR
// ==========================================
exports.getGroupsByMentor = AsyncErrorHandler(async (req, res) => {
    const { mentorId } = req.params;

    const groups = await GroupModel.aggregate([
        {
            $match: {
                assignedMentor: new mongoose.Types.ObjectId(mentorId)
            }
        },
        { $sort: { name: 1 } },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: "$mentorDetails"
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: groups.length,
        data: groups
    });
});

// ==========================================
// GET GROUP BY REFERRAL CODE
// ==========================================
exports.getGroupByReferralCode = AsyncErrorHandler(async (req, res) => {
    const { referralCode } = req.params;

    const result = await GroupModel.aggregate([
        {
            $match: {
                referralCode: referralCode
            }
        },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "assignedMentor",
                foreignField: "_id",
                as: "mentorDetails"
            }
        },
        {
            $lookup: {
                from: "proposedtitles",
                localField: "approvedTitleId",
                foreignField: "_id",
                as: "approvedTitleDetails"
            }
        },

        // ==========================================
        // 🔗 LOOKUP FOR SUBJECT (through sectionDetails.subjectId)
        // ==========================================
        {
            $lookup: {
                from: "subjects",
                localField: "sectionDetails.subjectId",   // ✅ SA SECTION
                foreignField: "_id",
                as: "subjectDetails"
            }
        },
        {
            $addFields: {
                subjectDetails: { $arrayElemAt: ["$subjectDetails", 0] }
            }
        },

        // ==========================================
        // 🔗 LOOKUP FOR FORMAT (through subject.formatID)
        // ==========================================
        {
            $lookup: {
                from: "formats",
                localField: "subjectDetails.formatID",
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
        // 🔗 LOOKUP FOR FORMAT UPLOADER (optional)
        // ==========================================
        {
            $lookup: {
                from: "userloginschemas",
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

        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails",
                assignedMentor: "$mentorDetails",
                approvedTitleId: { $arrayElemAt: ["$approvedTitleDetails", 0] }
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                mentorDetails: 0,
                approvedTitleDetails: 0,
                formatUploaderDetails: 0,

                // Exclude sensitive fields from members
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0,

                // Exclude sensitive fields from mentor
                "mentor.password": 0,
                "mentor.confirmPassword": 0,
                "mentor.passwordResetToken": 0,
                "mentor.passwordResetTokenExpires": 0,
                "mentor.__v": 0,
                "mentor.passwordChangedAt": 0,

                // Exclude sensitive fields from format uploader
                "formatDetails.uploadedBy.password": 0,
                "formatDetails.uploadedBy.confirmPassword": 0,
                "formatDetails.uploadedBy.passwordResetToken": 0,
                "formatDetails.uploadedBy.passwordResetTokenExpires": 0,
                "formatDetails.uploadedBy.__v": 0,
                "formatDetails.uploadedBy.passwordChangedAt": 0
            }
        }
    ]);

    console.log("result", result);

    if (!result || result.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "Group not found",
        });
    }

    // ==========================================
    // 🔹 DAGDAG: Kunin ang groupId at hanapin ang mga ProposedTitle
    // ==========================================
    const groupId = result[0]._id;

    const proposedTitles = await ProposedTitle.find({ groupId: groupId })
        .populate({
            path: 'uploadedBy',
            model: 'UserLoginSchema',
            select: 'first_name last_name id_number email role'
        })
        .sort({ createdAt: -1 });

    // ==========================================
    // 🔹 I-MERGE ang proposedTitles sa loob ng data
    // ==========================================
    const groupData = {
        ...result[0],
        proposedTitles: proposedTitles,
        proposedTitlesCount: proposedTitles.length,
    };

    // ==========================================
    // 🔹 RESPONSE — nasa loob na ng data ang proposedTitles
    // ==========================================
    res.status(200).json({
        status: "success",
        data: groupData,
    });
});

// ==========================================
// GET SIMPLE GROUPS LIST (FOR DROPDOWNS)
// ==========================================
exports.getSimpleGroups = AsyncErrorHandler(async (req, res) => {
    const groups = await GroupModel.aggregate([
        { $sort: { name: 1 } },
        {
            $project: {
                _id: 1,
                name: 1,
                referralCode: 1,
                memberCount: { $size: "$members" }
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: groups.length,
        data: groups
    });
});

// ==========================================
// GET GROUPS WITH NO MENTOR
// ==========================================
exports.getGroupsWithoutMentor = AsyncErrorHandler(async (req, res) => {
    const groups = await GroupModel.aggregate([
        {
            $match: {
                assignedMentor: { $size: 0 }
            }
        },
        { $sort: { name: 1 } },
        {
            $lookup: {
                from: "sections",
                localField: "sectionId",
                foreignField: "_id",
                as: "sectionDetails"
            }
        },
        {
            $lookup: {
                from: "userloginschemas",
                localField: "members",
                foreignField: "_id",
                as: "membersDetails"
            }
        },
        {
            $addFields: {
                sectionId: { $arrayElemAt: ["$sectionDetails", 0] },
                members: "$membersDetails"
            }
        },
        {
            $project: {
                sectionDetails: 0,
                membersDetails: 0,
                "members.password": 0,
                "members.confirmPassword": 0,
                "members.passwordResetToken": 0,
                "members.passwordResetTokenExpires": 0,
                "members.__v": 0,
                "members.passwordChangedAt": 0
            }
        }
    ]);

    res.status(200).json({
        status: "success",
        count: groups.length,
        data: groups
    });
});


exports.getGroupByUserId = AsyncErrorHandler(async (req, res) => {
    const userId = req.user._id;

    console.log("🔍 Looking for user ID:", userId);

    // Find ALL groups where user is adviser or co-adviser
    const groups = await GroupModel.find({
        $or: [
            { adviserId: userId },
            { coadviserId: userId }
        ]
    })

        .populate({
            path: 'members',
            model: 'UserLoginSchema',
            select: 'firstName lastName email profilePicture'
        })
        .populate({
            path: 'sectionId',
            populate: {
                path: 'subjectId',
                model: 'Subject',
                select: 'subjectName subjectCode description'
            }
        })
        .populate({
            path: 'adviserId',
            model: 'UserLoginSchema',
            select: 'firstName lastName email'
        })
        .populate({
            path: 'coadviserId',
            model: 'UserLoginSchema',
            select: 'firstName lastName email'
        })
        // TANGGAL NA ANG .populate('approvedTitleId')
        .lean();

    // Check kung walang nakitang grupo
    if (!groups || groups.length === 0) {
        return res.status(404).json({
            status: "fail",
            message: "No groups found where user is assigned as Adviser or Co-Adviser",
            debug: {
                userId: userId.toString()
            }
        });
    }

    // I-process ang bawat grupo para matukoy ang role
    const processedGroups = groups.map(group => {
        let foundIn = null;
        const userIdStr = userId.toString();

        // Safe checking para sa adviserId at coadviserId
        const adviserId = group.adviserId?._id?.toString() || group.adviserId?.toString();
        const coadviserId = group.coadviserId?._id?.toString() || group.coadviserId?.toString();

        if (adviserId === userIdStr) {
            foundIn = 'adviser';
        } else if (coadviserId === userIdStr) {
            foundIn = 'coadviser';
        }

        return {
            ...group,
            foundIn: foundIn,
            isAdviser: foundIn === 'adviser',
            isCoAdviser: foundIn === 'coadviser',
            memberCount: group.members?.length || 0
            // TANGGAL NA ANG hasApprovedTitle
        };
    });

    // Ibalik ang lahat ng grupo
    res.status(200).json({
        status: "success",
        data: processedGroups,
        totalGroups: processedGroups.length,
        summary: {
            asAdviser: processedGroups.filter(g => g.isAdviser).length,
            asCoAdviser: processedGroups.filter(g => g.isCoAdviser).length
        }
    });
});


const SubjectSchema = require("../Models/SubjectSchema");
const Section = require("../Models/SectionSchema")

// ==========================================
// GET GROUPS FOR DEFENSE
// ==========================================
exports.getGroupForDefense = AsyncErrorHandler(async (req, res) => {
    const userId = req.user._id;

    // Validate userId
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized. User ID not found.",
        });
    }

    // Step 1: Find all subjects created by this user
    const subjects = await SubjectSchema.find({ createdBy: userId });

    if (!subjects || subjects.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No subjects found for this user.",
        });
    }

    // Step 2: Extract subjectIds
    const subjectIds = subjects.map((s) => s._id);

    // Step 3: Find sections matching those subjectIds
    const sections = await Section.find({ subjectId: { $in: subjectIds } });

    if (!sections || sections.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No sections found for this user's subjects.",
        });
    }

    // Step 4: Extract sectionIds
    const sectionIds = sections.map((s) => s._id);

    // Step 5: Find groups matching those sectionIds
    const groups = await Group.find({ sectionId: { $in: sectionIds } })
        .select("_id name")
        .sort({ createdAt: -1 });

    if (!groups || groups.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No groups found for this user's sections.",
        });
    }

    // Step 6: Extract groupIds
    const groupIds = groups.map((g) => g._id);

    // Step 7: Find ProposedTitles with status === 'ready'
    const readyTitles = await ProposedTitle.find({
        groupId: { $in: groupIds },
        status: "Ready for Defense",
    }).select("groupId");

    // Step 8: Build a Set of groupIds na may ready title
    const readyGroupIds = new Set(
        readyTitles.map((t) => t.groupId.toString())
    );

    // Step 9: Filter — groups lang na may ready title
    const filteredGroups = groups
        .filter((group) => readyGroupIds.has(group._id.toString()))
        .map((group) => ({
            groupId: group._id,
            groupName: group.name,
        }));

    if (filteredGroups.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No groups found with a ready proposed title.",
        });
    }

    // ==========================================
    // Step 10: Kunin ang users na role === 'adviser' o 'panelist' (ISA LANG QUERY)
    // ==========================================
    const panelMembers = await UserLoginSchema.find({
        role: { $in: ["adviser", "panelist"] },
    }).select("_id first_name last_name middle_name suffix email role");

    // Helper para i-format ang full name
    const formatName = (u) =>
        [u.first_name, u.middle_name, u.last_name]
            .filter(Boolean)
            .join(" ") + (u.suffix ? ` ${u.suffix}` : "");

    // ==========================================
    // Step 11: Return response
    // ==========================================
    return res.status(200).json({
        status: "Success",
        results: {
            groups: filteredGroups.length,
            panelMembers: panelMembers.length,
        },
        data: {
            groups: filteredGroups,
            panelMembers: panelMembers.map((u) => ({
                userId: u._id,
                fullName: formatName(u),
                email: u.email,
                role: u.role,        // ✅ 'adviser' o 'panelist'
            })),
        },
    });
});