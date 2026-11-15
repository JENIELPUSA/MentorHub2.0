const mongoose = require('mongoose');
const AsyncErrorHandler = require('../Utils/AsyncErrorHandler');
const Groups = require('../Models/GroupName');
const ProposeTitle = require('../Models/ProposedTitle');
const UserLoginSchema = require('../Models/LogInSchema');

const Subject = require('../Models/SubjectSchema');
const Section = require('../Models/SectionSchema');
const Format = require('../Models/FormatSchema')


exports.getAdviserStatistics = AsyncErrorHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        console.log('=== DEBUG: Starting Dashboard Statistics ===');
        console.log('UserId:', userId.toString());

        // ==========================================
        // STEP 1: COUNT SUBJECTS PER MONTH (LINE GRAPH)
        // ==========================================
        let monthlyTrends = [];
        try {
            const monthlyData = await Subject.aggregate([
                {
                    $match: {
                        createdBy: new mongoose.Types.ObjectId(userId),
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" }
                        },
                        total: { $sum: 1 }
                    }
                },
                { $sort: { "_id.year": 1, "_id.month": 1 } }
            ]);

            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];

            monthlyTrends = monthlyData.map(item => ({
                month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
                total: item.total
            }));
        } catch (err) {
            console.error('❌ [STEP 1] Monthly trends error:', err);
            // Continue with empty array — hindi mag-crash
        }

        // ==========================================
        // STEP 2: TOTAL SUBJECT COUNT
        // ==========================================
        let totalSubjects = 0;
        try {
            totalSubjects = await Subject.countDocuments({ createdBy: userId });
        } catch (err) {
            console.error('❌ [STEP 2] Total subjects error:', err);
        }

        // ==========================================
        // STEP 2.5: SECTIONS (with formatID)
        // ==========================================
        let userSections = [];
        let sectionIds = [];
        let totalSections = 0;

        try {
            const userSubjects = await Subject.find({ createdBy: userId }).select('_id');
            const subjectIds = userSubjects.map(s => s._id);

            userSections = await Section.find({
                subjectId: { $in: subjectIds }
            }).select('_id name formatID subjectId');

            sectionIds = userSections.map(s => s._id);
            totalSections = userSections.length;
        } catch (err) {
            console.error('❌ [STEP 2.5] Sections error:', err);
        }

        // ==========================================
        // ⭐ STEP 2.5.1: FORMAT STATISTICS
        // ==========================================
        let totalSectionsWithFormat = 0;
        let totalSectionsWithoutFormat = 0;
        let totalUniqueFormats = 0;
        let formatUsageData = [];
        let sectionsWithoutFormat = [];

        try {
            // 1️⃣ Sections with format
            const sectionsWithFormat = userSections.filter(s => s.formatID);
            totalSectionsWithFormat = sectionsWithFormat.length;
            totalSectionsWithoutFormat = totalSections - totalSectionsWithFormat;

            // 2️⃣ Unique format IDs
            const uniqueFormatIds = [
                ...new Set(
                    sectionsWithFormat
                        .map(s => s.formatID?.toString())
                        .filter(Boolean)
                )
            ];
            totalUniqueFormats = uniqueFormatIds.length;

            // 3️⃣ Format usage breakdown
            if (uniqueFormatIds.length > 0) {
                try {
                    const formatDetails = await Format.find({
                        _id: { $in: uniqueFormatIds }
                    }).select('_id titleFormat type description uploadedBy');

                    const formatCountMap = {};
                    sectionsWithFormat.forEach(section => {
                        const fid = section.formatID?.toString();
                        if (fid) {
                            formatCountMap[fid] = (formatCountMap[fid] || 0) + 1;
                        }
                    });

                    formatUsageData = formatDetails
                        .map(format => ({
                            formatId: format._id,
                            formatTitle: format.titleFormat,
                            formatType: format.type,
                            description: format.description || '',
                            uploadedBy: format.uploadedBy,
                            sectionCount: formatCountMap[format._id.toString()] || 0,
                            sectionNames: sectionsWithFormat
                                .filter(s => s.formatID?.toString() === format._id.toString())
                                .map(s => s.name || 'Untitled'),
                        }))
                        .sort((a, b) => b.sectionCount - a.sectionCount);
                } catch (err) {
                    console.error('❌ [STEP 2.5.1] Format details error:', err);
                }
            }

            // 4️⃣ Sections WITHOUT format
            sectionsWithoutFormat = userSections
                .filter(s => !s.formatID)
                .map(s => ({
                    sectionId: s._id,
                    sectionName: s.name || 'Untitled',
                    subjectId: s.subjectId,
                }));
        } catch (err) {
            console.error('❌ [STEP 2.5.1] Format stats error:', err);
        }

        // ==========================================
        // STEP 2.6: GROUPS
        // ==========================================
        let userGroups = [];
        let totalGroups = 0;
        let groupIds = [];

        try {
            userGroups = await Groups.find({
                sectionId: { $in: sectionIds }
            })
                .select('_id name referralCode createdAt')
                .sort({ createdAt: -1 });

            totalGroups = userGroups.length;
            groupIds = userGroups.map(g => g._id);
        } catch (err) {
            console.error('❌ [STEP 2.6] Groups error:', err);
        }

        // ==========================================
        // STEP 2.7: USERS PER GROUP
        // ==========================================
        let totalUsers = 0;
        let referralCodes = [];

        try {
            referralCodes = userGroups
                .map(g => g.referralCode)
                .filter(code => code && code.trim() !== '');

            if (referralCodes.length > 0) {
                totalUsers = await UserLoginSchema.countDocuments({
                    referredBy: { $in: referralCodes }
                });
            }
        } catch (err) {
            console.error('❌ [STEP 2.7] Users error:', err);
        }

        // ==========================================
        // STEP 2.8: PIE GRAPH DATA
        // ==========================================
        let groupPieData = [];

        try {
            if (referralCodes.length > 0) {
                const usersPerGroup = await UserLoginSchema.aggregate([
                    {
                        $match: {
                            referredBy: { $in: referralCodes }
                        }
                    },
                    {
                        $group: {
                            _id: '$referredBy',
                            count: { $sum: 1 }
                        }
                    }
                ]);

                const countMap = {};
                usersPerGroup.forEach(item => {
                    countMap[item._id] = item.count;
                });

                groupPieData = userGroups
                    .map(g => ({
                        groupId: g._id,
                        groupName: g.name,
                        referralCode: g.referralCode,
                        userCount: countMap[g.referralCode] || 0,
                        createdAt: g.createdAt,
                    }))
                    .filter(item => item.userCount > 0);
            }
        } catch (err) {
            console.error('❌ [STEP 2.8] Pie data error:', err);
        }

        // ==========================================
        // STEP 2.9: REVISIONS
        // ==========================================
        let totalRevisions = 0;

        try {
            if (groupIds.length > 0) {
                totalRevisions = await ProposeTitle.countDocuments({
                    groupId: { $in: groupIds },
                    'titleUrlTracking.action': 'revision'
                });
            }
        } catch (err) {
            console.error('❌ [STEP 2.9] Revisions error:', err);
        }

        // ==========================================
        // STEP 3: FINAL RESPONSE
        // ==========================================
        res.status(200).json({
            status: "success",
            message: "Subject statistics fetched",
            data: {
                userId: userId,
                cards: {
                    totalSubjects,
                    totalSections,
                    totalGroups,
                    totalUsers,
                    totalRevisions,
                    // ⭐ Format stats
                    totalSectionsWithFormat,
                    totalSectionsWithoutFormat,
                    totalUniqueFormats,
                },
                graphs: {
                    monthlyTrends,
                    groupPieData,
                    formatUsageData,
                },
                sectionsWithoutFormat,
            }
        });

    } catch (error) {
        res.status(500).json({
            status: "fail",
            message: "Failed to fetch dashboard statistics",
            error: error.message,
            // ⭐ Show stack trace only in development
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

exports.getDashboardStatistics = AsyncErrorHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        // ==========================================
        // STEP 1: HANAPIN ANG MGA GROUPS KUNG SAAN SI userId AY ADVISER O CO-ADVISER
        // ==========================================
        const userGroups = await Groups.find({
            $or: [
                { adviserId: userId },
                { coadviserId: userId }
            ]
        });

        console.log("userGroups", userGroups);

        // ==========================================
        // STEP 2: KUNG WALANG MATCH, RETURN AGAD
        // ==========================================
        if (userGroups.length === 0) {
            return res.status(200).json({
                status: "success",
                message: "User is not an adviser or co-adviser of any group",
                data: {
                    userId: userId,
                    isAdviser: false,
                    isCoAdviser: false,
                    totalGroups: 0,
                    cards: {
                        totalTitles: 0,
                        totalGroups: 0,
                        totalUsers: 0,
                        withRemarks: 0,
                        withoutRemarks: 0,
                        totalStudents: 0,
                        totalFormats: 0,
                        sectionsWithFormat: 0,
                        sectionsWithoutFormat: 0,
                        uniqueFormatsUsed: 0
                    },
                    graphs: {
                        statusBreakdown: [],
                        monthlyTrends: [],
                        userRoleBreakdown: [],
                        formatBreakdown: []
                    },
                    formatStatistics: {
                        totalFormats: 0,
                        formatsByType: [],
                        sectionsWithFormat: 0,
                        sectionsWithoutFormat: 0,
                        usedFormats: []
                    },
                    groups: []
                }
            });
        }

        // ==========================================
        // STEP 3: KUNIN ANG LAHAT NG groupId
        // ==========================================
        const groupIds = userGroups.map(g => g._id);

        // ==========================================
        // STEP 4: KUNIN ANG LAHAT NG PROPOSED TITLES
        // ==========================================
        const proposedTitles = await ProposeTitle.find({});
        console.log('Proposed Titles Found:', proposedTitles.length);

        const totalTitles = proposedTitles.length;

        // ==========================================
        // STEP 4.5: COUNT STUDENTS WITH MATCHING REFERRAL CODES
        // ==========================================
        const referralCodes = userGroups
            .map(g => g.referralCode)
            .filter(code => code && code.trim() !== '');

        console.log('Referral Codes:', referralCodes);

        let totalStudents = 0;
        let studentsByGroup = {};

        if (referralCodes.length > 0) {
            const students = await UserLoginSchema.find({
                referredBy: { $in: referralCodes },
                role: 'student'
            });

            totalStudents = students.length;

            students.forEach(student => {
                const code = student.referredBy;
                if (code) {
                    studentsByGroup[code] = (studentsByGroup[code] || 0) + 1;
                }
            });
        }

        // ==========================================
        // STEP 4.6: KUNIN ANG MGA SECTIONS AT SUBJECTS
        //            ⭐ formatID is now in Section, NOT Subject
        // ==========================================
        const adviserGroupIds = userGroups
            .filter(g => g.adviserId && g.adviserId.toString() === userId.toString())
            .map(g => g._id.toString());

        const coAdviserGroupIds = userGroups
            .filter(g => g.coadviserId && g.coadviserId.toString() === userId.toString())
            .map(g => g._id.toString());

        const bothGroupIds = userGroups
            .filter(g =>
                g.adviserId && g.adviserId.toString() === userId.toString() &&
                g.coadviserId && g.coadviserId.toString() === userId.toString()
            )
            .map(g => g._id.toString());

        // Kunin ang sectionIds mula sa user's groups
        const sectionIds = userGroups
            .map(g => g.sectionId)
            .filter(id => id);

        // ⭐ KUNIN ANG SECTIONS — may formatID na ang Section
        let userSections = [];
        let userSubjects = [];

        if (sectionIds.length > 0) {
            // Sections ng user (kasama ang formatID)
            userSections = await Section.find({
                _id: { $in: sectionIds }
            })
                .select('_id name subjectId formatID')
                .populate('formatID');

            console.log('=== DEBUG: User Sections ===');
            console.log('userSections count:', userSections.length);

            // Subjects ng user (walang formatID — title lang)
            const subjectIds = userSections
                .map(s => s.subjectId)
                .filter(id => id);

            if (subjectIds.length > 0) {
                userSubjects = await Subject.find({
                    _id: { $in: subjectIds }
                }).select('_id title createdBy');
            }
        }

        console.log('userSubjects count:', userSubjects.length);

        // ==========================================
        // ⭐ STEP 4.7: COMPUTE FORMAT STATISTICS
        //            formatID is now in SECTION
        // ==========================================
        // Kunin lahat ng formats para sa lookup
        const allFormats = await mongoose.model('Format').find({});

        // I-map ang formats by _id
        const formatsMap = {};
        allFormats.forEach(f => {
            formatsMap[f._id.toString()] = f;
        });

        // ⭐ SECTIONS with/without format
        let sectionsWithFormat = 0;
        let sectionsWithoutFormat = 0;

        // ⭐ Unique formats used across sections
        const uniqueFormatIds = new Set();

        // ⭐ Formats by type (base sa sections)
        const formatsByTypeMap = {};

        userSections.forEach(section => {
            const formatRef = section.formatID;
            const formatId = typeof formatRef === 'string'
                ? formatRef
                : formatRef?._id?.toString() || null;

            if (formatId && formatsMap[formatId]) {
                sectionsWithFormat++;
                uniqueFormatIds.add(formatId);

                const formatType = formatsMap[formatId].type || 'Unknown';
                formatsByTypeMap[formatType] = (formatsByTypeMap[formatType] || 0) + 1;
            } else {
                sectionsWithoutFormat++;
            }
        });

        const uniqueFormatsUsed = uniqueFormatIds.size;

        // I-convert sa array format
        const formatsByType = Object.entries(formatsByTypeMap).map(([type, count]) => ({
            type,
            count,
            percentage: userSections.length > 0
                ? parseFloat(((count / userSections.length) * 100).toFixed(2))
                : 0,
            color: type === 'Thesis' ? '#66BB6A'
                : type === 'Capstone' ? '#42A5F5'
                : type === 'Research' ? '#FFA726'
                : '#9E9E9E'
        }));

        // Format breakdown para sa chart
        const formatBreakdown = formatsByType.map(item => ({
            label: item.type,
            count: item.count,
            percentage: item.percentage,
            color: item.color
        }));

        // ⭐ USED FORMATS — per section (hindi per subject)
        const usedFormats = userSections
            .filter(s => s.formatID)
            .map(s => {
                const formatRef = s.formatID;
                const formatId = typeof formatRef === 'string'
                    ? formatRef
                    : formatRef?._id?.toString();

                const format = formatsMap[formatId];
                if (!format) return null;

                // Hanapin ang subject title
                const subject = userSubjects.find(sub =>
                    sub._id.toString() === (s.subjectId?._id || s.subjectId)?.toString()
                );

                return {
                    sectionId: s._id,
                    sectionName: s.name,
                    subjectId: s.subjectId?._id || s.subjectId,
                    subjectTitle: subject?.title || 'Unknown Subject',
                    formatId: format._id,
                    titleFormat: format.titleFormat,
                    type: format.type,
                    description: format.description,
                    fileUrl: format.fileUrl
                };
            })
            .filter(Boolean);

        // ==========================================
        // STEP 5: I-COUNT ANG MGA TITLES BASE SA ROLE NI USER SA GROUPS
        // ==========================================
        const titlesAsAdviser = proposedTitles.filter(p =>
            p.groupId && adviserGroupIds.includes(p.groupId.toString())
        );
        const titlesAsCoAdviser = proposedTitles.filter(p =>
            p.groupId && coAdviserGroupIds.includes(p.groupId.toString())
        );
        const titlesAsBoth = proposedTitles.filter(p =>
            p.groupId && bothGroupIds.includes(p.groupId.toString())
        );

        const countAsAdviser = titlesAsAdviser.length;
        const countAsCoAdviser = titlesAsCoAdviser.length;
        const countAsBoth = titlesAsBoth.length;

        // ==========================================
        // STEP 6: COMPUTE CARD STATISTICS
        // ==========================================
        const totalGroupsCount = userGroups.length;
        const withRemarks = proposedTitles.filter(p => p.remarks && p.remarks.length > 0).length;
        const withoutRemarks = proposedTitles.filter(p => !p.remarks || p.remarks.length === 0).length;
        const uniqueUsers = new Set(proposedTitles.map(p => p.uploadedBy?.toString())).size;

        // ==========================================
        // STEP 7: USER ROLE BREAKDOWN
        // ==========================================
        const userRoleBreakdown = [
            { label: 'As Adviser', count: countAsAdviser, description: 'Titles where user is the adviser' },
            { label: 'As Co-Adviser', count: countAsCoAdviser, description: 'Titles where user is the co-adviser' },
            { label: 'As Both', count: countAsBoth, description: 'Titles where user is both adviser and co-adviser' }
        ].filter(item => item.count > 0);

        // ==========================================
        // STEP 8: STATUS BREAKDOWN FOR PIE CHART
        // ==========================================
        const pending = proposedTitles.filter(p => p.status === 'Pending').length;
        const approved = proposedTitles.filter(p => p.status === 'Approved').length;
        const rejected = proposedTitles.filter(p => p.status === 'Rejected').length;
        const revision = proposedTitles.filter(p => p.status === 'Revision').length;

        const statusBreakdown = [
            { status: 'Pending', count: pending, percentage: totalTitles > 0 ? parseFloat(((pending / totalTitles) * 100).toFixed(2)) : 0, color: '#FFA726' },
            { status: 'Approved', count: approved, percentage: totalTitles > 0 ? parseFloat(((approved / totalTitles) * 100).toFixed(2)) : 0, color: '#66BB6A' },
            { status: 'Rejected', count: rejected, percentage: totalTitles > 0 ? parseFloat(((rejected / totalTitles) * 100).toFixed(2)) : 0, color: '#EF5350' },
            { status: 'Revision', count: revision, percentage: totalTitles > 0 ? parseFloat(((revision / totalTitles) * 100).toFixed(2)) : 0, color: '#42A5F5' }
        ].filter(item => item.count > 0);

        // ==========================================
        // STEP 9: MONTHLY TRENDS FOR LINE CHART
        // ==========================================
        const monthlyData = await ProposeTitle.aggregate([
            {
                $match: {
                    createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
                }
            },
            {
                $group: {
                    _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
                    total: { $sum: 1 },
                    approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
                    revision: { $sum: { $cond: [{ $eq: ["$status", "Revision"] }, 1, 0] } }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const monthlyTrends = monthlyData.map(item => ({
            month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
            total: item.total,
            approved: item.approved,
            pending: item.pending,
            rejected: item.rejected,
            revision: item.revision
        }));

        // ==========================================
        // STEP 10: FORMAT NG GROUP DATA
        // ==========================================
        const formattedGroups = userGroups.map(g => {
            const isAdviser = g.adviserId && g.adviserId.toString() === userId.toString();
            const isCoAdviser = g.coadviserId && g.coadviserId.toString() === userId.toString();
            const isBoth = isAdviser && isCoAdviser;
            const referralCode = g.referralCode || null;

            return {
                groupId: g._id,
                groupName: g.name || 'Unknown Group',
                referralCode: referralCode,
                studentCount: referralCode ? (studentsByGroup[referralCode] || 0) : 0,
                isAdviser: isAdviser,
                isCoAdviser: isCoAdviser,
                isBoth: isBoth,
                adviserStatus: g.adviserStatus || 'pending',
                coadviserStatus: g.coadviserStatus || 'pending'
            };
        });

        // ==========================================
        // STEP 11: FINAL RESPONSE
        // ==========================================
        res.status(200).json({
            status: "success",
            message: "User found as adviser or co-adviser",
            data: {
                userId: userId,
                isAdviser: userGroups.some(g => g.adviserId?.toString() === userId.toString()),
                isCoAdviser: userGroups.some(g => g.coadviserId?.toString() === userId.toString()),
                isBoth: userGroups.some(g =>
                    g.adviserId?.toString() === userId.toString() &&
                    g.coadviserId?.toString() === userId.toString()
                ),
                totalGroups: userGroups.length,
                cards: {
                    totalTitles,
                    totalGroups: totalGroupsCount,
                    totalUsers: uniqueUsers,
                    withRemarks: withRemarks,
                    withoutRemarks: withoutRemarks,
                    totalStudents: totalStudents,
                    // ⭐ Format stats
                    totalFormats: allFormats.length,
                    sectionsWithFormat: sectionsWithFormat,
                    sectionsWithoutFormat: sectionsWithoutFormat,
                    uniqueFormatsUsed: uniqueFormatsUsed
                },
                graphs: {
                    statusBreakdown: statusBreakdown,
                    monthlyTrends: monthlyTrends,
                    userRoleBreakdown: userRoleBreakdown,
                    formatBreakdown: formatBreakdown
                },
                formatStatistics: {
                    totalFormats: allFormats.length,
                    formatsByType: formatsByType,
                    sectionsWithFormat: sectionsWithFormat,
                    sectionsWithoutFormat: sectionsWithoutFormat,
                    uniqueFormatsUsed: uniqueFormatsUsed,
                    usedFormats: usedFormats
                },
                groups: formattedGroups
            }
        });

    } catch (error) {
        console.error('❌ [getDashboardStatistics] FATAL ERROR:', error);
        console.error('❌ Stack:', error.stack);

        res.status(500).json({
            status: "fail",
            message: "Failed to fetch dashboard statistics",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});

exports.getAdminStatistics = AsyncErrorHandler(async (req, res) => {
  const [
    totalUsers,
    totalGroups,
    totalProposals,
    totalSubjects,
    totalSections,
    pendingProposals,
    approvedProposals,
    rejectedProposals,
    revisionProposals,
    readyForDefenseProposals,
    selectedProposals,
  ] = await Promise.all([
    UserLoginSchema.countDocuments(),
    Groups.countDocuments(),
    ProposeTitle.countDocuments(),
    Subject.countDocuments(),
    Section.countDocuments(),
    ProposeTitle.countDocuments({ status: 'Pending' }),
    ProposeTitle.countDocuments({ status: 'Approved' }),
    ProposeTitle.countDocuments({ status: 'Rejected' }),
    ProposeTitle.countDocuments({ status: 'Revision' }),
    ProposeTitle.countDocuments({ status: 'Ready for Defense' }),
    ProposeTitle.countDocuments({ isSelected: true }),
  ]);

  const statisticalCards = {
    totalUsers,
    totalGroups,
    totalProposals,
    totalSubjects,
    totalSections,
    pendingProposals,
    approvedProposals,
    rejectedProposals,
    revisionProposals,
    readyForDefenseProposals,
    selectedProposals,
  };

  const pieGraph = {
    labels: ['Pending', 'Approved', 'Revision', 'Ready for Defense', 'Rejected'],
    data: [
      pendingProposals,
      approvedProposals,
      revisionProposals,
      readyForDefenseProposals,
      rejectedProposals,
    ],
  };

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const monthlyProposals = await ProposeTitle.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const lineGraphLabels = [];
  const lineGraphData = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    lineGraphLabels.push(`${monthNames[month - 1]} ${year}`);

    const found = monthlyProposals.find(
      (m) => m._id.year === year && m._id.month === month
    );
    lineGraphData.push(found ? found.count : 0);
  }

  const lineGraph = {
    labels: lineGraphLabels,
    data: lineGraphData,
    label: 'Proposals Submitted',
  };

  const groupsPerSection = await Groups.aggregate([
    { $group: { _id: '$section', count: { $sum: 1 } } },
    {
      $lookup: {
        from: 'sections',
        localField: '_id',
        foreignField: '_id',
        as: 'sectionInfo',
      },
    },
    { $unwind: { path: '$sectionInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        section: { $ifNull: ['$sectionInfo.name', 'Unassigned'] },
        count: 1,
      },
    },
  ]);

  const pieGraphGroups = {
    labels: groupsPerSection.map((g) => g.section),
    data: groupsPerSection.map((g) => g.count),
  };

  res.status(200).json({
    success: true,
    data: {
      statisticalCards,
      pieGraph,
      lineGraph,
      pieGraphGroups,
    },
  });
});