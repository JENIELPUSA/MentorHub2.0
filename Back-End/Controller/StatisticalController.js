const mongoose = require('mongoose');
const AsyncErrorHandler = require('../Utils/AsyncErrorHandler');
const Groups = require('../Models/GroupName');
const ProposeTitle = require('../Models/ProposedTitle');
const UserLoginSchema = require('../Models/LogInSchema');

const Subject = require('../Models/SubjectSchema');
const Section = require('../Models/SectionSchema');


exports.getAdviserStatistics = AsyncErrorHandler(async (req, res) => {
    const userId = req.user._id;

    console.log('=== DEBUG: Starting Dashboard Statistics ===');
    console.log('UserId:', userId.toString());

    // ==========================================
    // STEP 1: COUNT SUBJECTS PER MONTH (LINE GRAPH)
    //         FILTERED BY createdBy === userId
    // ==========================================
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

    const monthlyTrends = monthlyData.map(item => ({
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        total: item.total
    }));

    // ==========================================
    // STEP 2: TOTAL SUBJECT COUNT FOR THIS USER
    // ==========================================
    const totalSubjects = await Subject.countDocuments({ createdBy: userId });

    // ==========================================
    // STEP 2.5: TOTAL SECTIONS NA TUGMA SA subjectId
    //            NG MGA SUBJECT NA GAWA NG USER
    // ==========================================
    const userSubjects = await Subject.find({ createdBy: userId }).select('_id');
    const subjectIds = userSubjects.map(s => s._id);

    const userSections = await Section.find({
        subjectId: { $in: subjectIds }
    }).select('_id');

    const sectionIds = userSections.map(s => s._id);
    const totalSections = userSections.length;

    // ==========================================
    // STEP 2.6: TOTAL GROUPS NA TUGMA SA sectionId
    //            NG MGA NAKITANG SECTION
    // ==========================================
    const userGroups = await Groups.find({
        sectionId: { $in: sectionIds }
    }).select('_id name referralCode');

    const totalGroups = userGroups.length;
    const groupIds = userGroups.map(g => g._id);

    // ==========================================
    // STEP 2.7: TOTAL USERS NA ANG referredBy
    //            AY TUGMA SA referralCode NG GROUPS
    // ==========================================
    const referralCodes = userGroups
        .map(g => g.referralCode)
        .filter(code => code && code.trim() !== '');

    const totalUsers = await UserLoginSchema.countDocuments({
        referredBy: { $in: referralCodes }
    });

    // ==========================================
    // STEP 2.8: PIE GRAPH DATA
    //            Bawat Group name -> ilang user
    //            ang may referredBy === referralCode
    // ==========================================
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

    // Map referralCode -> count
    const countMap = {};
    usersPerGroup.forEach(item => {
        countMap[item._id] = item.count;
    });

    // I-build ang pie data kasama ang group name
    const groupPieData = userGroups
        .map(g => ({
            groupId: g._id,
            groupName: g.name,
            referralCode: g.referralCode,
            userCount: countMap[g.referralCode] || 0
        }))
        .filter(item => item.userCount > 0); // optional: tanggalin kung gusto mo isama ang zero

    // ==========================================
    // STEP 2.9: TOTAL PROPOSED TITLES NA MAY
    //            action === 'revision' SA titleUrlTracking
    //            BASED SA groupId NG MGA NAKITANG GROUP
    // ==========================================
    const totalRevisions = await ProposeTitle.countDocuments({
        groupId: { $in: groupIds },
        'titleUrlTracking.action': 'revision'
    });

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
                totalRevisions
            },
            graphs: {
                monthlyTrends,
                groupPieData
            }
        }
    });
});

// ==========================================
// GET ALL STATISTICS FOR DASHBOARD
// ==========================================
exports.getDashboardStatistics = AsyncErrorHandler(async (req, res) => {
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
                    totalWithRemarks: 0,
                    totalWithoutRemarks: 0,
                    totalStudents: 0
                },
                graphs: {
                    statusBreakdown: [],
                    monthlyTrends: [],
                    userRoleBreakdown: []
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
    // STEP 4: KUNIN ANG LAHAT NG PROPOSED TITLES (WALANG FILTER)
    // ==========================================
    const proposedTitles = await ProposeTitle.find({});

    console.log('Proposed Titles Found:', proposedTitles.length);

    if (proposedTitles.length === 0) {
        console.log('No proposed titles found in the entire database');
    }

    const totalTitles = proposedTitles.length;

    // ==========================================
    // STEP 4.5: COUNT STUDENTS WITH MATCHING REFERRAL CODES (using referredBy)
    // ==========================================
    // Get all referral codes from user's groups
    const referralCodes = userGroups
        .map(g => g.referralCode)
        .filter(code => code && code.trim() !== '');

    console.log('=== DEBUG: Referral Codes from groups ===');
    console.log('Referral Codes:', referralCodes);
    console.log('Number of referral codes:', referralCodes.length);

    let totalStudents = 0;
    let studentsByGroup = {};

    if (referralCodes.length > 0) {
        // Find students with matching referredBy codes
        const students = await UserLoginSchema.find({
            referredBy: { $in: referralCodes },
            role: 'student'
        });

        console.log('=== DEBUG: Matching students (with role=student) ===');
        console.log('Found students with matching referredBy:', students.length);

        totalStudents = students.length;

        // Count students per referral code/group
        students.forEach(student => {
            const code = student.referredBy;
            if (code) {
                studentsByGroup[code] = (studentsByGroup[code] || 0) + 1;
            }
        });

        console.log('=== DEBUG: Students by referral code ===');
        console.log('studentsByGroup:', studentsByGroup);
    } else {
        console.log('=== DEBUG: No referral codes found in groups ===');
    }

    // ==========================================
    // STEP 5: I-COUNT ANG MGA TITLES BASE SA ROLE NI USER SA GROUPS
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

    console.log('Adviser Group IDs:', adviserGroupIds);
    console.log('Co-Adviser Group IDs:', coAdviserGroupIds);
    console.log('Both Group IDs:', bothGroupIds);

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

    console.log('Titles as Adviser:', countAsAdviser);
    console.log('Titles as Co-Adviser:', countAsCoAdviser);
    console.log('Titles as Both:', countAsBoth);

    // ==========================================
    // STEP 6: COMPUTE CARD STATISTICS
    // ==========================================

    // Count total groups based on userGroups length
    const totalGroupsCount = userGroups.length;

    const withRemarks = proposedTitles.filter(p => p.remarks && p.remarks.length > 0).length;
    const withoutRemarks = proposedTitles.filter(p => !p.remarks || p.remarks.length === 0).length;

    // Count unique users who uploaded titles
    const uniqueUsers = new Set(proposedTitles.map(p => p.uploadedBy?.toString())).size;

    // ==========================================
    // STEP 7: USER ROLE BREAKDOWN (WALANG COLOR)
    // ==========================================
    const userRoleBreakdown = [
        {
            label: 'As Adviser',
            count: countAsAdviser,
            description: 'Titles where user is the adviser'
        },
        {
            label: 'As Co-Adviser',
            count: countAsCoAdviser,
            description: 'Titles where user is the co-adviser'
        },
        {
            label: 'As Both',
            count: countAsBoth,
            description: 'Titles where user is both adviser and co-adviser'
        }
    ].filter(item => item.count > 0);

    // ==========================================
    // STEP 8: STATUS BREAKDOWN FOR PIE CHART
    // ==========================================
    const pending = proposedTitles.filter(p => p.status === 'Pending').length;
    const approved = proposedTitles.filter(p => p.status === 'Approved').length;
    const rejected = proposedTitles.filter(p => p.status === 'Rejected').length;
    const revision = proposedTitles.filter(p => p.status === 'Revision').length;

    const statusBreakdown = [
        {
            status: 'Pending',
            count: pending,
            percentage: totalTitles > 0 ? parseFloat(((pending / totalTitles) * 100).toFixed(2)) : 0,
            color: '#FFA726' // Orange
        },
        {
            status: 'Approved',
            count: approved,
            percentage: totalTitles > 0 ? parseFloat(((approved / totalTitles) * 100).toFixed(2)) : 0,
            color: '#66BB6A' // Green
        },
        {
            status: 'Rejected',
            count: rejected,
            percentage: totalTitles > 0 ? parseFloat(((rejected / totalTitles) * 100).toFixed(2)) : 0,
            color: '#EF5350' // Red
        },
        {
            status: 'Revision',
            count: revision,
            percentage: totalTitles > 0 ? parseFloat(((revision / totalTitles) * 100).toFixed(2)) : 0,
            color: '#42A5F5' // Blue
        }
    ].filter(item => item.count > 0);

    // ==========================================
    // STEP 9: MONTHLY TRENDS FOR LINE CHART (LAST 12 MONTHS)
    // ==========================================
    const monthlyData = await ProposeTitle.aggregate([
        {
            $match: {
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
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const monthlyTrends = monthlyData.map(item => ({
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        total: item.total,
        approved: item.approved,
        pending: item.pending,
        rejected: item.rejected,
        revision: item.revision
    }));

    // ==========================================
    // STEP 10: FORMAT NG GROUP DATA (REMOVED memberCount, titleCount, titleStatus, withRemarks, withoutRemarks)
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
                totalStudents: totalStudents
            },
            graphs: {
                statusBreakdown: statusBreakdown,
                monthlyTrends: monthlyTrends,
                userRoleBreakdown: userRoleBreakdown
            },
            groups: formattedGroups
        }
    });
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