const AsyncErrorHandler = require("../Utils/AsyncErrorHandler");
const ProposedTitleModel = require("./../Models/ProposedTitle");
const path = require("path");
const mongoose = require("mongoose");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const Group = require("./../Models/GroupName");
const NotificationSchema = require("../Models/NotificationSchema");
const UserLoginSchema = require("../Models/LogInSchema");


// ⭐ ALIAS — para gumana ang lahat ng `Proposal.*` references
const Proposal = ProposedTitleModel;

// ============================================================
// ⭐ CHAPTER CONFIG
// ============================================================
const REQUIRED_CHAPTERS = ["Chapter 1", "Chapter 2", "Chapter 3", "Chapter 4", "Chapter 5"];

// ============================================================
// ⭐ EXISTING HELPERS (UNCHANGED)
// ============================================================
function syncChapterCompletion(doc) {
  if (!doc || !Array.isArray(doc.titleUrlTracking)) {
    if (doc) {
      doc.completedChapters = [];
      doc.isAllChaptersCompleted = false;
    }
    return doc;
  }
  const completedSet = new Set();
  doc.titleUrlTracking.forEach((t) => {
    if (t.isCompleted === true && t.chapter) completedSet.add(t.chapter);
  });
  doc.completedChapters = Array.from(completedSet);
  doc.isAllChaptersCompleted = REQUIRED_CHAPTERS.every((ch) => completedSet.has(ch));
  return doc;
}

const completionExpr = {
  total: { $size: { $ifNull: ["$task", []] } },
  completed: {
    $size: {
      $filter: {
        input: { $ifNull: ["$task", []] },
        as: "t",
        cond: { $eq: ["$$t.isCompleted", true] },
      },
    },
  },
};

const buildCompletionStage = () => ({
  total: completionExpr.total,
  completed: completionExpr.completed,
  pending: { $subtract: [completionExpr.total, completionExpr.completed] },
  percentage: {
    $cond: [
      { $eq: [completionExpr.total, 0] },
      0,
      {
        $round: [
          {
            $multiply: [
              { $divide: [completionExpr.completed, completionExpr.total] },
              100,
            ],
          },
          0,
        ],
      },
    ],
  },
});

const buildIsFullyCompletedStage = () => ({
  $and: [
    { $gt: [completionExpr.total, 0] },
    { $eq: [completionExpr.completed, completionExpr.total] },
  ],
});

const buildChapterCompletionStage = () => ({
  $let: {
    vars: {
      completedEntries: {
        $filter: {
          input: { $ifNull: ["$titleUrlTracking", []] },
          as: "t",
          cond: { $eq: ["$$t.isCompleted", true] },
        },
      },
      allEntries: { $ifNull: ["$titleUrlTracking", []] },
    },
    in: {
      completedChapters: {
        $setUnion: [
          {
            $map: {
              input: "$$completedEntries",
              as: "e",
              in: "$$e.chapter",
            },
          },
          [],
        ],
      },
      chapters: {
        $map: {
          input: {
            $setUnion: [
              {
                $map: {
                  input: "$$allEntries",
                  as: "a",
                  in: "$$a.chapter",
                },
              },
              [],
            ],
          },
          as: "ch",
          in: {
            chapter: "$$ch",
            isCompleted: {
              $in: [
                "$$ch",
                {
                  $map: {
                    input: "$$completedEntries",
                    as: "e",
                    in: "$$e.chapter",
                  },
                },
              ],
            },
            latestEntry: {
              $let: {
                vars: {
                  chapterEntries: {
                    $filter: {
                      input: "$$allEntries",
                      as: "x",
                      cond: { $eq: ["$$x.chapter", "$$ch"] },
                    },
                  },
                },
                in: {
                  $arrayElemAt: [
                    {
                      $sortArray: {
                        input: "$$chapterEntries",
                        sortBy: { date: -1 },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      isAllChaptersCompleted: {
        $and: [
          {
            $gte: [
              {
                $size: {
                  $setIntersection: [
                    {
                      $map: {
                        input: "$$completedEntries",
                        as: "e",
                        in: "$$e.chapter",
                      },
                    },
                    REQUIRED_CHAPTERS,
                  ],
                },
              },
              REQUIRED_CHAPTERS.length,
            ],
          },
        ],
      },
      chapterProgress: {
        $round: [
          {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $setIntersection: [
                        {
                          $map: {
                            input: "$$completedEntries",
                            as: "e",
                            in: "$$e.chapter",
                          },
                        },
                        REQUIRED_CHAPTERS,
                      ],
                    },
                  },
                  REQUIRED_CHAPTERS.length,
                ],
              },
              100,
            ],
          },
          0,
        ],
      },
    },
  },
});

// ============================================================
// ⭐ NEW HELPERS (ADDITIVE)
// ============================================================

const buildRubricStage = () => ({
  $ifNull: [
    "$rubric",
    {
      scientificSignificance: 0,
      technicalNovelty: 0,
      methodologyRigor: 0,
      resourceFeasibility: 0,
      overallScore: 0,
    },
  ],
});

const buildDefenseScheduleStage = () => ({
  $ifNull: [
    "$defenseSchedule",
    {
      scheduledAt: null,
      venue: "",
      modality: "In-Person",
      zoomLink: "",
      zoomPasscode: "",
      panelQuorum: { required: 3, confirmed: 0 },
    },
  ],
});

const buildObjectivesStage = () => ({
  $ifNull: ["$objectives", []],
});

const buildAdviserLookupStages = () => [
  {
    $lookup: {
      from: "userloginschemas",
      localField: "adviserId",
      foreignField: "_id",
      as: "adviserInfo",
    },
  },
  { $unwind: { path: "$adviserInfo", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "userloginschemas",
      localField: "coAdviserId",
      foreignField: "_id",
      as: "coAdviserInfo",
    },
  },
  { $unwind: { path: "$coAdviserInfo", preserveNullAndEmptyArrays: true } },
];

const buildReviewersLookupStage = () => [
  {
    $lookup: {
      from: "userloginschemas",
      localField: "assignedReviewers",
      foreignField: "_id",
      as: "assignedReviewerInfo",
    },
  },
  {
    $project: {
      assignedReviewers: 1,
      assignedReviewerInfo: {
        $map: {
          input: "$assignedReviewerInfo",
          as: "r",
          in: {
            _id: "$$r._id",
            first_name: "$$r.first_name",
            last_name: "$$r.last_name",
            full_name: {
              $concat: [
                { $ifNull: ["$$r.first_name", ""] },
                " ",
                { $ifNull: ["$$r.last_name", ""] },
              ],
            },
            email: "$$r.email",
            role: "$$r.role",
          },
        },
      },
    },
  },
];

const buildReviewedByLookupStage = () => ({
  $lookup: {
    from: "userloginschemas",
    let: { reviewerIds: { $ifNull: ["$reviewedBy.reviewerId", []] } },
    pipeline: [
      { $match: { $expr: { $in: ["$_id", "$$reviewerIds"] } } },
      {
        $project: {
          first_name: 1,
          last_name: 1,
          email: 1,
          role: 1,
          full_name: {
            $concat: [
              { $ifNull: ["$first_name", ""] },
              " ",
              { $ifNull: ["$last_name", ""] },
            ],
          },
        },
      },
    ],
    as: "reviewerProfiles",
  },
});

const buildReviewsWithProfilesStage = () => ({
  $map: {
    input: { $ifNull: ["$reviewedBy", []] },
    as: "rev",
    in: {
      reviewerId: "$$rev.reviewerId",
      reviewerProfile: {
        $arrayElemAt: [
          {
            $filter: {
              input: "$reviewerProfiles",
              as: "p",
              cond: { $eq: ["$$p._id", "$$rev.reviewerId"] },
            },
          },
          0,
        ],
      },
      decision: "$$rev.decision",
      feedback: "$$rev.feedback",
      scores: "$$rev.scores",
      reviewedAt: "$$rev.reviewedAt",
    },
  },
});


exports.GetProposedTitleStatistics = AsyncErrorHandler(async (req, res) => {
  const { groupId, dateFrom, dateTo } = req.query;

  const role = req.user.role;
  const userObjectId = new mongoose.Types.ObjectId(req.user._id);

  const matchStage = {};
  if (role === "student") matchStage.uploadedBy = userObjectId;
  if (groupId) matchStage.groupId = new mongoose.Types.ObjectId(groupId);
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = end;
    }
  }

  const needsGroupFilter = ["adviser", "coadviser", "panelist"].includes(role);

  const result = await ProposedTitleModel.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "groups",
        localField: "groupId",
        foreignField: "_id",
        as: "groupInfo",
      },
    },
    { $unwind: { path: "$groupInfo", preserveNullAndEmptyArrays: true } },
    ...(needsGroupFilter
      ? [
        {
          $match: {
            $or: [
              { "groupInfo.adviserId": userObjectId },
              { "groupInfo.coadviserId": userObjectId },
              { "groupInfo.panelistIds": userObjectId },
            ],
          },
        },
      ]
      : []),
    {
      $lookup: {
        from: "comments",
        let: {
          urlIds: {
            $cond: [
              { $isArray: "$titleUrlTracking" },
              {
                $map: {
                  input: "$titleUrlTracking",
                  as: "t",
                  in: "$$t._id",
                },
              },
              [],
            ],
          },
        },
        pipeline: [
          { $match: { $expr: { $in: ["$proposedTitleId", "$$urlIds"] } } },
          {
            $lookup: {
              from: "userloginschemas",
              localField: "userId",
              foreignField: "_id",
              as: "author",
            },
          },
          { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 1,
              proposedTitleId: 1,
              userId: 1,
              text: 1,
              isResolved: 1,
              annotationType: 1,
              severity: 1,
              parentCommentId: 1,
              createdAt: 1,
              author: {
                _id: "$author._id",
                first_name: "$author.first_name",
                last_name: "$author.last_name",
                id_number: "$author.id_number",
                email: "$author.email",
                role: "$author.role",
              },
            },
          },
        ],
        as: "urlComments",
      },
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
              pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
              rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
              forRevision: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$status", "For Revision"] },
                        { $eq: ["$isRevesion", true] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],

        byStatus: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        byMonth: [
          {
            $group: {
              _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ],

        byGroup: [
          {
            $group: {
              _id: "$groupId",
              groupName: { $first: "$groupInfo.groupName" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              groupId: "$_id",
              groupName: { $ifNull: ["$groupName", "Unassigned"] },
              count: 1,
            },
          },
        ],

        totalUrls: [
          {
            $project: {
              urlCount: {
                $cond: [
                  { $isArray: "$titleUrlTracking" },
                  {
                    $size: {
                      $filter: {
                        input: "$titleUrlTracking",
                        as: "t",
                        cond: {
                          $and: [
                            { $ne: ["$$t.url", null] },
                            { $ne: ["$$t.url", ""] },
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
          { $group: { _id: null, totalUrls: { $sum: "$urlCount" } } },
        ],

        urlCoverage: [
          {
            $project: {
              hasUrl: {
                $gt: [
                  {
                    $cond: [
                      { $isArray: "$titleUrlTracking" },
                      {
                        $size: {
                          $filter: {
                            input: "$titleUrlTracking",
                            as: "t",
                            cond: {
                              $and: [
                                { $ne: ["$$t.url", null] },
                                { $ne: ["$$t.url", ""] },
                              ],
                            },
                          },
                        },
                      },
                      0,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          {
            $group: {
              _id: null,
              withUrls: { $sum: { $cond: ["$hasUrl", 1, 0] } },
              withoutUrls: { $sum: { $cond: ["$hasUrl", 0, 1] } },
            },
          },
        ],

        urlsByGroup: [
          {
            $project: {
              groupId: 1,
              groupName: { $ifNull: ["$groupInfo.groupName", "Unassigned"] },
              urlCount: {
                $cond: [
                  { $isArray: "$titleUrlTracking" },
                  {
                    $size: {
                      $filter: {
                        input: "$titleUrlTracking",
                        as: "t",
                        cond: {
                          $and: [
                            { $ne: ["$$t.url", null] },
                            { $ne: ["$$t.url", ""] },
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $group: {
              _id: "$groupId",
              groupName: { $first: "$groupName" },
              urlCount: { $sum: "$urlCount" },
            },
          },
          { $sort: { urlCount: -1 } },
          { $limit: 10 },
          {
            $project: { _id: 0, groupId: "$_id", groupName: 1, urlCount: 1 },
          },
        ],

        commentStats: [
          { $unwind: "$urlComments" },
          {
            $group: {
              _id: null,
              totalComments: { $sum: 1 },
              resolved: { $sum: { $cond: ["$urlComments.isResolved", 1, 0] } },
              unresolved: {
                $sum: { $cond: [{ $eq: ["$urlComments.isResolved", false] }, 1, 0] },
              },
              replies: {
                $sum: {
                  $cond: [{ $ne: ["$urlComments.parentCommentId", null] }, 1, 0],
                },
              },
            },
          },
        ],

        commentsByType: [
          { $unwind: "$urlComments" },
          { $group: { _id: "$urlComments.annotationType", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        commentsBySeverity: [
          { $unwind: "$urlComments" },
          { $group: { _id: "$urlComments.severity", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        commentsByUrl: [
          { $unwind: "$titleUrlTracking" },
          {
            $lookup: {
              from: "comments",
              let: { urlId: "$titleUrlTracking._id" },
              pipeline: [
                {
                  $match: { $expr: { $eq: ["$proposedTitleId", "$$urlId"] } },
                },
                { $project: { _id: 1, isResolved: 1 } },
              ],
              as: "urlCommentDocs",
            },
          },
          {
            $project: {
              urlId: "$titleUrlTracking._id",
              urlLabel: { $ifNull: ["$titleUrlTracking.label", "$titleUrlTracking.url"] },
              url: "$titleUrlTracking.url",
              title: "$title",
              groupName: { $ifNull: ["$groupInfo.groupName", "Unassigned"] },
              commentCount: { $size: "$urlCommentDocs" },
              unresolvedCount: {
                $size: {
                  $filter: {
                    input: "$urlCommentDocs",
                    as: "c",
                    cond: { $eq: ["$$c.isResolved", false] },
                  },
                },
              },
            },
          },
          { $sort: { commentCount: -1 } },
          { $limit: 10 },
        ],

        commentsByGroup: [
          { $unwind: "$urlComments" },
          {
            $group: {
              _id: "$groupId",
              groupName: { $first: "$groupInfo.groupName" },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              groupId: "$_id",
              groupName: { $ifNull: ["$groupName", "Unassigned"] },
              count: 1,
            },
          },
        ],

        commentsByMonth: [
          { $unwind: "$urlComments" },
          {
            $group: {
              _id: {
                year: { $year: "$urlComments.createdAt" },
                month: { $month: "$urlComments.createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ],

        commentActivityByDate: [
          { $unwind: "$urlComments" },
          {
            $match: {
              "urlComments.createdAt": {
                $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$urlComments.createdAt",
                  timezone: "Asia/Manila",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],

        proposalActivityByDate: [
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createdAt",
                  timezone: "Asia/Manila",
                },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],

        activityByDate: [
          {
            $project: {
              days: {
                $concatArrays: [
                  [{ date: "$createdAt", type: "proposal" }],
                  {
                    $map: {
                      input: { $ifNull: ["$urlComments", []] },
                      as: "c",
                      in: { date: "$$c.createdAt", type: "comment" },
                    },
                  },
                ],
              },
            },
          },
          { $unwind: "$days" },
          {
            $match: {
              "days.date": {
                $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$days.date",
                  timezone: "Asia/Manila",
                },
              },
              proposals: {
                $sum: { $cond: [{ $eq: ["$days.type", "proposal"] }, 1, 0] },
              },
              comments: {
                $sum: { $cond: [{ $eq: ["$days.type", "comment"] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              count: { $add: ["$proposals", "$comments"] },
              proposals: 1,
              comments: 1,
            },
          },
          { $sort: { date: 1 } },
        ],

        mentorship: [
          { $limit: 1 },
          {
            $lookup: {
              from: "userloginschemas",
              localField: "groupInfo.adviserId",
              foreignField: "_id",
              as: "adviserUser",
            },
          },
          { $unwind: { path: "$adviserUser", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "userloginschemas",
              localField: "groupInfo.coadviserId",
              foreignField: "_id",
              as: "coAdviserUser",
            },
          },
          { $unwind: { path: "$coAdviserUser", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              title: { $ifNull: ["$title", "Untitled"] },
              description: { $ifNull: ["$description", ""] },
              status: { $ifNull: ["$status", "Unknown"] },
              groupName: { $ifNull: ["$groupInfo.groupName", "Unassigned"] },
              referralCode: { $ifNull: ["$groupInfo.referralCode", "N/A"] },
              sectionName: { $ifNull: ["$groupInfo.section.name", "N/A"] },
              subjectTitle: { $ifNull: ["$groupInfo.section.subject.title", "N/A"] },
              adviser: {
                _id: "$adviserUser._id",
                first_name: "$adviserUser.first_name",
                last_name: "$adviserUser.last_name",
                email: "$adviserUser.email",
                role: "$adviserUser.role",
                fullName: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ["$adviserUser.first_name", ""] },
                        " ",
                        { $ifNull: ["$adviserUser.last_name", ""] },
                      ],
                    },
                  },
                },
              },
              coAdviser: {
                _id: "$coAdviserUser._id",
                first_name: "$coAdviserUser.first_name",
                last_name: "$coAdviserUser.last_name",
                email: "$coAdviserUser.email",
                role: "$coAdviserUser.role",
                fullName: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ["$coAdviserUser.first_name", ""] },
                        " ",
                        { $ifNull: ["$coAdviserUser.last_name", ""] },
                      ],
                    },
                  },
                },
              },
            },
          },
        ],

        recentComments: [
          { $unwind: "$urlComments" },
          {
            $addFields: {
              matchedTracking: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: { $ifNull: ["$titleUrlTracking", []] },
                      as: "t",
                      cond: { $eq: ["$$t._id", "$urlComments.proposedTitleId"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
          {
            $lookup: {
              from: "userloginschemas",
              localField: "groupInfo.adviserId",
              foreignField: "_id",
              as: "adviserUser",
            },
          },
          { $unwind: { path: "$adviserUser", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "userloginschemas",
              localField: "groupInfo.coadviserId",
              foreignField: "_id",
              as: "coAdviserUser",
            },
          },
          { $unwind: { path: "$coAdviserUser", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: "$urlComments._id",
              text: "$urlComments.text",
              isResolved: "$urlComments.isResolved",
              annotationType: "$urlComments.annotationType",
              severity: "$urlComments.severity",
              parentCommentId: "$urlComments.parentCommentId",
              createdAt: "$urlComments.createdAt",
              author: "$urlComments.author",
              titleId: "$_id",
              proposedTitle: {
                _id: "$_id",
                title: { $ifNull: ["$title", "Untitled"] },
                description: { $ifNull: ["$description", ""] },
                status: { $ifNull: ["$status", "Unknown"] },
              },
              groupName: { $ifNull: ["$groupInfo.groupName", "Unassigned"] },
              adviser: {
                _id: "$adviserUser._id",
                first_name: "$adviserUser.first_name",
                last_name: "$adviserUser.last_name",
                email: "$adviserUser.email",
                role: "$adviserUser.role",
                fullName: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ["$adviserUser.first_name", ""] },
                        " ",
                        { $ifNull: ["$adviserUser.last_name", ""] },
                      ],
                    },
                  },
                },
              },
              coAdviser: {
                _id: "$coAdviserUser._id",
                first_name: "$coAdviserUser.first_name",
                last_name: "$coAdviserUser.last_name",
                email: "$coAdviserUser.email",
                role: "$coAdviserUser.role",
                fullName: {
                  $trim: {
                    input: {
                      $concat: [
                        { $ifNull: ["$coAdviserUser.first_name", ""] },
                        " ",
                        { $ifNull: ["$coAdviserUser.last_name", ""] },
                      ],
                    },
                  },
                },
              },
              urlTracking: {
                _id: "$matchedTracking._id",
                label: { $ifNull: ["$matchedTracking.label", "$matchedTracking.url"] },
                url: "$matchedTracking.url",
                isCompleted: { $ifNull: ["$matchedTracking.isCompleted", false] },
                completedAt: "$matchedTracking.completedAt",
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 20 },
        ],

        // ============================================================
        // ⭐ NEW FACETS
        // ============================================================
        byScopeStatus: [
          { $group: { _id: "$scopeStatus", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        byTrack: [
          { $match: { track: { $ne: null } } },
          { $group: { _id: "$track", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        byPanelDecision: [
          { $match: { panelDecision: { $ne: null } } },
          { $group: { _id: "$panelDecision", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],

        urgentCount: [
          { $match: { isUrgent: true } },
          { $count: "count" },
        ],

        reviewerWorkload: [
          { $unwind: { path: "$assignedReviewers", preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: "$assignedReviewers",
              assignedCount: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "userloginschemas",
              localField: "_id",
              foreignField: "_id",
              as: "reviewer",
            },
          },
          { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
          {
            $project: {
              _id: 0,
              reviewerId: "$_id",
              full_name: {
                $trim: {
                  input: {
                    $concat: [
                      { $ifNull: ["$reviewer.first_name", ""] },
                      " ",
                      { $ifNull: ["$reviewer.last_name", ""] },
                    ],
                  },
                },
              },
              email: "$reviewer.email",
              role: "$reviewer.role",
              assignedCount: 1,
            },
          },
          { $sort: { assignedCount: -1 } },
          { $limit: 10 },
        ],

        rubricAverages: [
          {
            $group: {
              _id: null,
              avgSignificance: { $avg: "$rubric.scientificSignificance" },
              avgNovelty: { $avg: "$rubric.technicalNovelty" },
              avgRigor: { $avg: "$rubric.methodologyRigor" },
              avgFeasibility: { $avg: "$rubric.resourceFeasibility" },
              avgOverall: { $avg: "$rubric.overallScore" },
            },
          },
          {
            $project: {
              _id: 0,
              avgSignificance: { $round: ["$avgSignificance", 2] },
              avgNovelty: { $round: ["$avgNovelty", 2] },
              avgRigor: { $round: ["$avgRigor", 2] },
              avgFeasibility: { $round: ["$avgFeasibility", 2] },
              avgOverall: { $round: ["$avgOverall", 2] },
            },
          },
        ],

        reviewCompletion: [
          {
            $project: {
              totalReviewers: { $size: { $ifNull: ["$assignedReviewers", []] } },
              submittedReviews: { $size: { $ifNull: ["$reviewedBy", []] } },
            },
          },
          {
            $group: {
              _id: null,
              totalAssigned: { $sum: "$totalReviewers" },
              totalSubmitted: { $sum: "$submittedReviews" },
            },
          },
        ],

        upcomingDefenses: [
          {
            $match: {
              "defenseSchedule.scheduledAt": {
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              groupId: 1,
              scheduledAt: "$defenseSchedule.scheduledAt",
              venue: "$defenseSchedule.venue",
              modality: "$defenseSchedule.modality",
            },
          },
          { $sort: { scheduledAt: 1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);

  const r = result[0] || {};
  const summary = r.summary?.[0] || {
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    forRevision: 0,
  };
  const totalUrls = r.totalUrls?.[0]?.totalUrls || 0;
  const coverage = r.urlCoverage?.[0] || { withUrls: 0, withoutUrls: 0 };
  const commentStats = r.commentStats?.[0] || {
    totalComments: 0,
    resolved: 0,
    unresolved: 0,
    replies: 0,
  };

  const mentorship = r.mentorship?.[0] || {
    title: null,
    description: null,
    status: null,
    groupName: null,
    referralCode: null,
    sectionName: null,
    subjectTitle: null,
    adviser: null,
    coAdviser: null,
  };

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const urgentCount = r.urgentCount?.[0]?.count || 0;
  const rubricAverages = r.rubricAverages?.[0] || {
    avgSignificance: 0,
    avgNovelty: 0,
    avgRigor: 0,
    avgFeasibility: 0,
    avgOverall: 0,
  };
  const reviewCompletion = r.reviewCompletion?.[0] || {
    totalAssigned: 0,
    totalSubmitted: 0,
  };
  const reviewCompletionRate =
    reviewCompletion.totalAssigned > 0
      ? Math.round(
        (reviewCompletion.totalSubmitted / reviewCompletion.totalAssigned) * 100
      )
      : 0;

  res.status(200).json({
    status: "success",
    mentorship,

    cards: {
      total: summary.total,
      approved: summary.approved,
      pending: summary.pending,
      rejected: summary.rejected,
      forRevision: summary.forRevision,
      approvalRate:
        summary.total > 0
          ? Math.round((summary.approved / summary.total) * 100)
          : 0,
      totalUrls,
      withUrls: coverage.withUrls,
      withoutUrls: coverage.withoutUrls,
      totalComments: commentStats.totalComments,
      resolvedComments: commentStats.resolved,
      unresolvedComments: commentStats.unresolved,
      commentReplies: commentStats.replies,
      resolutionRate:
        commentStats.totalComments > 0
          ? Math.round(
            (commentStats.resolved / commentStats.totalComments) * 100
          )
          : 0,
      urgentCount,
      totalReviewersAssigned: reviewCompletion.totalAssigned,
      totalReviewsSubmitted: reviewCompletion.totalSubmitted,
      reviewCompletionRate,
    },

    charts: {
      byStatus: (r.byStatus || []).map((s) => ({
        label: s._id || "Unknown",
        count: s.count,
      })),
      byMonth: (r.byMonth || []).map((m) => ({
        label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
        count: m.count,
      })),
      byGroup: r.byGroup || [],
      urlsByGroup: r.urlsByGroup || [],
      commentsByType: (r.commentsByType || []).map((c) => ({
        label: c._id || "unknown",
        count: c.count,
      })),
      commentsBySeverity: (r.commentsBySeverity || []).map((c) => ({
        label: c._id || "unknown",
        count: c.count,
      })),
      commentsByUrl: r.commentsByUrl || [],
      commentsByGroup: r.commentsByGroup || [],
      commentsByMonth: (r.commentsByMonth || []).map((m) => ({
        label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
        count: m.count,
      })),
      recentComments: r.recentComments || [],
      commentActivityByDate: (r.commentActivityByDate || []).map((d) => ({
        date: d._id,
        count: d.count,
      })),
      proposalActivityByDate: (r.proposalActivityByDate || []).map((d) => ({
        date: d._id,
        count: d.count,
      })),
      activityByDate: r.activityByDate || [],

      byScopeStatus: (r.byScopeStatus || []).map((s) => ({
        label: s._id || "Pending",
        count: s.count,
      })),
      byTrack: (r.byTrack || []).map((t) => ({
        label: t._id || "Unknown",
        count: t.count,
      })),
      byPanelDecision: (r.byPanelDecision || []).map((p) => ({
        label: p._id || "Not Set",
        count: p.count,
      })),
      reviewerWorkload: r.reviewerWorkload || [],
      rubricAverages,
      upcomingDefenses: r.upcomingDefenses || [],
    },
  });
});

// ============================================================
// GET BY TRACKING ID
// ============================================================
exports.GetByTrackingID = AsyncErrorHandler(async (req, res) => {
  const { trackingId } = req.params;

  if (!trackingId) {
    return res.status(400).json({ status: "fail", message: "trackingId is required" });
  }
  if (!mongoose.Types.ObjectId.isValid(trackingId)) {
    return res.status(400).json({ status: "fail", message: "Invalid trackingId format" });
  }

  const role = req.user.role;
  const userId = req.user._id;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const trackingObjectId = new mongoose.Types.ObjectId(trackingId);

  let roleMatchStage = null;
  if (role === "adviser" || role === "coadviser" || role === "panelist") {
    roleMatchStage = {
      $or: [
        { "groupInfo.adviserId": userObjectId },
        { "groupInfo.coadviserId": userObjectId },
        { "groupInfo.panelistIds": userObjectId },
      ],
    };
  }

  const matchStage = { "titleUrlTracking._id": trackingObjectId };
  if (role === "student") matchStage.uploadedBy = userObjectId;

  const result = await ProposedTitleModel.aggregate([
    { $match: matchStage },
    { $lookup: { from: "groups", localField: "groupId", foreignField: "_id", as: "groupInfo" } },
    { $unwind: { path: "$groupInfo", preserveNullAndEmptyArrays: true } },
    ...(roleMatchStage ? [{ $match: roleMatchStage }] : []),
    {
      $project: {
        _id: 1, fileUrl: 1, fileName: 1, fileType: 1, titleUrlTracking: 1, task: 1,
      },
    },
    { $limit: 1 },
  ]);

  const submission = result[0];
  if (!submission) {
    return res.status(404).json({
      status: "fail",
      message: "Submission not found or you don't have access to this file",
    });
  }

  const tracking = submission.titleUrlTracking?.find(
    (t) => t._id.toString() === trackingId
  );
  const remoteUrl = tracking?.url || tracking?.titleUrl || submission.fileUrl;

  if (!remoteUrl) {
    return res.status(404).json({ status: "fail", message: "PDF URL not found" });
  }

  try {
    const remoteResponse = await axios.get(remoteUrl, {
      responseType: "stream",
      timeout: 30000,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PDFProxy/1.0)" },
      validateStatus: (s) => s >= 200 && s < 400,
    });

    const contentType = remoteResponse.headers["content-type"] || submission.fileType || "application/pdf";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${submission.fileName || "document.pdf"}"`);
    if (remoteResponse.headers["content-length"]) {
      res.setHeader("Content-Length", remoteResponse.headers["content-length"]);
    }
    res.setHeader("Cache-Control", "private, max-age=300");
    remoteResponse.data.pipe(res);
  } catch (err) {
    console.error("❌ PDF Proxy Error:", err.message);
    if (!res.headersSent) {
      return res.status(502).json({ status: "fail", message: "Failed to fetch PDF", detail: err.message });
    }
  }
});


exports.DisplayProposedTitles = AsyncErrorHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const { search, status, dateFrom, dateTo, groupId, track, scopeStatus, assignedTo } = req.query;

  const role = req.user.role;
  const userId = req.user._id;
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const matchStage = {};

  if (role === "student") matchStage.uploadedBy = userObjectId;
  if (groupId) matchStage.groupId = new mongoose.Types.ObjectId(groupId);

  if (search) {
    matchStage.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
      { topicCode: { $regex: search.trim(), $options: "i" } },
    ];
  }

  if (status) matchStage.status = status;
  if (track) matchStage.track = track;
  if (scopeStatus) matchStage.scopeStatus = scopeStatus;
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
    matchStage.assignedReviewers = new mongoose.Types.ObjectId(assignedTo);
  }

  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = endOfDay;
    }
  }

  let roleMatchStage = null;
  if (role === "adviser" || role === "coadviser" || role === "panelist") {
    roleMatchStage = {
      $or: [
        { "groupInfo.adviserId": userObjectId },
        { "groupInfo.coadviserId": userObjectId },
        { "groupInfo.panelistIds": userObjectId },
      ],
    };
  }

  const result = await ProposedTitleModel.aggregate([
    { $match: matchStage },
    { $lookup: { from: "groups", localField: "groupId", foreignField: "_id", as: "groupInfo" } },
    { $unwind: { path: "$groupInfo", preserveNullAndEmptyArrays: true } },
    ...(roleMatchStage ? [{ $match: roleMatchStage }] : []),

    ...buildAdviserLookupStages(),

    { $lookup: { from: "userloginschemas", localField: "uploadedBy", foreignField: "_id", as: "uploaderInfo" } },
    { $unwind: { path: "$uploaderInfo", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "proposedTitleId",
        as: "comments",
      },
    },
    { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "userloginschemas",
        localField: "comments.userId",
        foreignField: "_id",
        as: "commentAuthorInfo",
      },
    },
    { $unwind: { path: "$commentAuthorInfo", preserveNullAndEmptyArrays: true } },

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
        isRevesion: { $first: "$isRevesion" },
        titleUrlTracking: { $first: "$titleUrlTracking" },
        task: { $first: "$task" },
        completedChapters: { $first: "$completedChapters" },
        isAllChaptersCompleted: { $first: "$isAllChaptersCompleted" },
        groupInfo: { $first: "$groupInfo" },
        uploaderInfo: { $first: "$uploaderInfo" },

        topicCode: { $first: "$topicCode" },
        track: { $first: "$track" },
        revisionNumber: { $first: "$revisionNumber" },
        revisionRequestedAt: { $first: "$revisionRequestedAt" },
        groupStatus: { $first: "$groupStatus" },
        adviserId: { $first: "$adviserId" },
        coAdviserId: { $first: "$coAdviserId" },
        adviserInfo: { $first: "$adviserInfo" },
        coAdviserInfo: { $first: "$coAdviserInfo" },
        rubric: { $first: "$rubric" },
        noveltyScore: { $first: "$noveltyScore" },
        feasibilityScore: { $first: "$feasibilityScore" },
        scopeStatus: { $first: "$scopeStatus" },
        panelDecision: { $first: "$panelDecision" },
        panelFeedback: { $first: "$panelFeedback" },
        reviewDeadline: { $first: "$reviewDeadline" },
        assignedReviewers: { $first: "$assignedReviewers" },
        reviewedBy: { $first: "$reviewedBy" },
        commentCount: { $first: "$commentCount" },
        objectives: { $first: "$objectives" },
        sdgGoals: { $first: "$sdgGoals" },
        defenseSchedule: { $first: "$defenseSchedule" },
        isUrgent: { $first: "$isUrgent" },
        priority: { $first: "$priority" },

        // ⭐ IMPORTANT: Chapter progression fields
        chapterProgressionApprovals: { $first: "$chapterProgressionApprovals" },
        chapterProgressionApprovedBy: { $first: "$chapterProgressionApprovedBy" },
        chapterProgressionApprovedAt: { $first: "$chapterProgressionApprovedAt" },
        nextAllowedChapter: { $first: "$nextAllowedChapter" },
        lockedChapters: { $first: "$lockedChapters" },

        comments: {
          $push: {
            _id: "$comments._id",
            text: "$comments.text",
            userId: "$comments.userId",
            createdAt: "$comments.createdAt",
            updatedAt: "$comments.updatedAt",
            author: {
              _id: "$commentAuthorInfo._id",
              first_name: "$commentAuthorInfo.first_name",
              last_name: "$commentAuthorInfo.last_name",
              id_number: "$commentAuthorInfo.id_number",
              email: "$commentAuthorInfo.email",
              role: "$commentAuthorInfo.role",
            },
          },
        },
      },
    },

    {
      $addFields: {
        comments: {
          $sortArray: {
            input: {
              $filter: {
                input: "$comments",
                as: "comment",
                cond: { $ne: ["$$comment._id", null] },
              },
            },
            sortBy: { createdAt: 1 },
          },
        },
      },
    },

    buildReviewedByLookupStage(),
    {
      $addFields: {
        reviewsWithProfiles: buildReviewsWithProfilesStage(),
      },
    },

    { $sort: { priority: -1, createdAt: -1 } },

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
              titleUrlTracking: 1,
              task: 1,
              isRevesion: 1,
              completion: buildCompletionStage(),
              isFullyCompleted: buildIsFullyCompletedStage(),
              chapterCompletion: buildChapterCompletionStage(),

              // ⭐ IMPORTANT
              chapterProgressionApprovals: 1,
              chapterProgressionApprovedBy: 1,
              chapterProgressionApprovedAt: 1,
              nextAllowedChapter: 1,
              lockedChapters: 1,

              topicCode: 1,
              track: 1,
              revisionNumber: 1,
              revisionRequestedAt: 1,
              groupStatus: 1,
              adviserId: 1,
              coAdviserId: 1,
              rubric: buildRubricStage(),
              noveltyScore: 1,
              feasibilityScore: 1,
              scopeStatus: 1,
              panelDecision: 1,
              panelFeedback: 1,
              reviewDeadline: 1,
              assignedReviewers: 1,
              reviewedBy: 1,
              reviewsWithProfiles: 1,
              commentCount: { $ifNull: ["$commentCount", { $size: "$comments" }] },
              objectives: buildObjectivesStage(),
              sdgGoals: { $ifNull: ["$sdgGoals", []] },
              defenseSchedule: buildDefenseScheduleStage(),
              isUrgent: 1,
              priority: 1,

              adviserInfo: {
                _id: "$adviserInfo._id",
                first_name: "$adviserInfo.first_name",
                last_name: "$adviserInfo.last_name",
                email: "$adviserInfo.email",
                role: "$adviserInfo.role",
                full_name: {
                  $concat: [
                    { $ifNull: ["$adviserInfo.first_name", ""] },
                    " ",
                    { $ifNull: ["$adviserInfo.last_name", ""] },
                  ],
                },
              },
              coAdviserInfo: {
                _id: "$coAdviserInfo._id",
                first_name: "$coAdviserInfo.first_name",
                last_name: "$coAdviserInfo.last_name",
                email: "$coAdviserInfo.email",
                role: "$coAdviserInfo.role",
                full_name: {
                  $concat: [
                    { $ifNull: ["$coAdviserInfo.first_name", ""] },
                    " ",
                    { $ifNull: ["$coAdviserInfo.last_name", ""] },
                  ],
                },
              },

              groupName: { $ifNull: ["$groupInfo.groupName", "N/A"] },
              uploaderName: {
                $ifNull: [
                  { $concat: ["$uploaderInfo.first_name", " ", "$uploaderInfo.last_name"] },
                  "N/A",
                ],
              },
              uploaderIdNumber: { $ifNull: ["$uploaderInfo.id_number", "N/A"] },
              comments: 1,
              commentCountActual: { $size: "$comments" },
              groupInfo: 1,
              uploaderInfo: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const proposedTitles = result[0]?.data || [];
  const totalCount = result[0]?.totalCount?.[0]?.count || 0;
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

// ============================================================
// CREATE
// ============================================================
exports.createProposedTitle = AsyncErrorHandler(async (req, res) => {
  try {
    const {
      title,
      description,
      remarks,
      status,
      groupId,
      action,
      titleId,
      chapter = "Chapter 1",
      track,
      objectives,
      sdgGoals,
      reviewDeadline,
      assignedReviewers,
      scopeStatus,
      rubric,
    } = req.body;

    const isRevision = action === "revision";

    console.log("req.body:", req.body);

    let fileData = {};
    if (req.file) {
      console.log("📸 Uploading file...");
      const form = new FormData();
      form.append("file", fs.createReadStream(req.file.path), req.file.originalname);

      try {
        const response = await axios.post(process.env.UPLOADAGTA_URL, form, {
          maxBodyLength: Infinity,
          headers: { ...form.getHeaders() },
        });

        let fileUrl = "";
        let publicId = "";
        if (response.data?.url) {
          fileUrl = response.data.url;
          publicId = response.data.public_id || response.data.filename || req.file.filename;
        } else if (response.data?.success && response.data?.data) {
          fileUrl = response.data.data.url;
          publicId = response.data.data.public_id || req.file.filename;
        } else if (response.data?.file) {
          fileUrl = response.data.file;
          publicId = req.file.filename;
        } else {
          fileUrl = `/temp-uploads/${req.file.filename}`;
          publicId = req.file.filename;
        }

        fileData = {
          fileUrl,
          fileName: req.file.originalname,
          publicId,
          fileType: req.file.mimetype,
          isPdf: req.file.mimetype === "application/pdf",
        };

        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error("❌ Upload Error:", err.message);
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(500).json({
          status: false,
          message: "File upload failed",
          error: err.message,
        });
      }
    }

    if (isRevision) {
      if (!titleId) {
        return res.status(400).json({ status: false, message: "titleId is required for revision" });
      }
      if (!fileData.fileUrl) {
        return res.status(400).json({ status: false, message: "Revision file is required" });
      }

      const existing = await ProposedTitleModel.findById(titleId);
      if (!existing) {
        return res.status(404).json({ status: false, message: "Proposed title not found" });
      }

      if (!Array.isArray(existing.titleUrlTracking)) existing.titleUrlTracking = [];

      const lastEntry = existing.titleUrlTracking[existing.titleUrlTracking.length - 1];
      if (lastEntry?.publicId && lastEntry.publicId === fileData.publicId) {
        return res.status(400).json({
          status: false,
          message: "This file was already submitted.",
        });
      }

      existing.titleUrlTracking.push({
        chapter,
        url: fileData.fileUrl,
        date: new Date(),
        remarks: remarks?.trim() || "Revision submitted.",
        action: "revision",
        fileName: fileData.fileName,
        publicId: fileData.publicId,
        fileType: fileData.fileType,
        isPdf: fileData.isPdf,
        isCompleted: false,
        completedAt: null,
        completedBy: null,
      });

      existing.fileUrl = fileData.fileUrl;
      existing.fileName = fileData.fileName;
      existing.publicId = fileData.publicId;
      existing.fileType = fileData.fileType;
      existing.isPdf = fileData.isPdf;

      if (remarks && remarks.trim()) existing.remarks = remarks.trim();
      if (typeof description === "string") existing.description = description.trim();
      if (title && title !== "undefined" && title.trim() !== "") existing.title = title.trim();

      if (track) existing.track = track;
      if (Array.isArray(objectives)) existing.objectives = objectives;
      if (Array.isArray(sdgGoals)) existing.sdgGoals = sdgGoals;
      if (reviewDeadline) existing.reviewDeadline = new Date(reviewDeadline);
      if (Array.isArray(assignedReviewers)) {
        existing.assignedReviewers = assignedReviewers
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id));
      }
      if (scopeStatus) existing.scopeStatus = scopeStatus;
      if (rubric && typeof rubric === "object") {
        existing.rubric = { ...existing.rubric, ...rubric };
      }

      existing.adviser = false;
      existing.coAdviser = false;
      existing.adviserReady = false;
      existing.coAdviserReady = false;
      existing.isSelected = false;
      existing.isArchived = false;
      existing.status = "Revision";

      delete req.body.status;

      await existing.save();

      return res.status(200).json({
        status: true,
        message: "Revision uploaded successfully",
        data: existing,
      });
    }

    const group = await Group.findById(groupId).select(
      "adviserId coadviserId referralCode groupStatus"
    );
    if (!group) {
      return res.status(404).json({ status: false, message: "Group not found." });
    }

    const cleanTitle = title && title !== "undefined" ? title.trim() : "";
    if (!cleanTitle) {
      return res.status(400).json({ status: false, message: "Title is required" });
    }
    if (!fileData.fileUrl) {
      return res.status(400).json({ status: false, message: "File is required" });
    }

    await ProposedTitleModel.deleteMany({ groupId });

    const createStatus = status?.trim() || "Pending";

    const proposedTitle = await ProposedTitleModel.create({
      title: cleanTitle,
      description,
      remarks,
      status: createStatus,
      groupId,
      uploadedBy: req.user.linkId,
      completedChapters: [],
      isAllChaptersCompleted: false,
      titleUrlTracking: [
        {
          chapter,
          url: fileData.fileUrl,
          date: new Date(),
          remarks: remarks?.trim() || "Initial submission.",
          action: "create",
          fileName: fileData.fileName,
          publicId: fileData.publicId,
          fileType: fileData.fileType,
          isPdf: fileData.isPdf,
          isCompleted: false,
          completedAt: null,
          completedBy: null,
        },
      ],
      ...fileData,

      track: track || undefined,
      groupStatus: group.groupStatus || "Pending Acceptance",
      adviserId: group.adviserId || null,
      coAdviserId: group.coadviserId || null,
      scopeStatus: scopeStatus || "Pending",
      reviewDeadline: reviewDeadline ? new Date(reviewDeadline) : null,
      assignedReviewers: Array.isArray(assignedReviewers)
        ? assignedReviewers
          .filter((id) => mongoose.Types.ObjectId.isValid(id))
          .map((id) => new mongoose.Types.ObjectId(id))
        : [],
      objectives: Array.isArray(objectives) ? objectives : [],
      sdgGoals: Array.isArray(sdgGoals) ? sdgGoals : [],
      rubric: rubric && typeof rubric === "object" ? rubric : undefined,
    });

    return res.status(201).json({
      status: true,
      message: "Proposed title created successfully",
      data: proposedTitle,
    });
  } catch (error) {
    console.error("Create Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create",
      error: error.message,
    });
  }
});

// ============================================================
// UPDATE
// ============================================================
exports.UpdateProposedTitle = AsyncErrorHandler(async (req, res) => {
  const { status } = req.body;
  const userId = req.user._id;

  console.log("Req.body", req.body);

  const proposedTitle = await ProposedTitleModel.findById(req.params.id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  const group = await Group.findById(proposedTitle.groupId);
  if (!group) return res.status(404).json({ status: "fail", message: "Group not found" });

  let userRole = "";
  const isAdviser = group.adviserId && group.adviserId.toString() === userId.toString();
  const isCoAdviser = group.coadviserId && group.coadviserId.toString() === userId.toString();

  if (isAdviser) userRole = "adviser";
  else if (isCoAdviser) userRole = "co-adviser";

  Object.keys(req.body).forEach((key) => {
    proposedTitle[key] = req.body[key];
  });

  if (userRole === "adviser") proposedTitle.adviser = true;
  if (userRole === "co-adviser") proposedTitle.coAdviser = true;

  syncChapterCompletion(proposedTitle);

  const updated = await proposedTitle.save();

  const io = req.app.get("io");
  if (io) {
    io.emit("ProposedTitleUpdate", {
      message: `Proposed title "${updated.title}" has been ${status || updated.status}`,
      data: updated,
      updatedBy: { userId, role: userRole, groupId: group._id, groupName: group.name },
    });
  }

  res.status(200).json({
    status: "success",
    message: "Proposed title updated successfully",
    data: updated,
  });
});

// ============================================================
// SUBMIT PANEL REVIEW
// ============================================================
exports.SubmitPanelReview = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { decision, feedback, scores } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }
  if (!decision) {
    return res.status(400).json({ status: "fail", message: "decision is required" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  const isAssigned = (proposedTitle.assignedReviewers || []).some(
    (rid) => rid.toString() === userId.toString()
  );
  if (!isAssigned) {
    return res
      .status(403)
      .json({ status: "fail", message: "You are not assigned to review this proposal" });
  }

  await proposedTitle.addReview({
    reviewerId: userId,
    decision,
    feedback: feedback || "",
    scores: scores || {},
  });

  const updated = await ProposedTitleModel.findById(id);

  const io = req.app.get("io");
  if (io) {
    io.emit("PanelReviewSubmitted", {
      proposedTitleId: updated._id,
      reviewerId: userId,
      decision,
      totalReviews: updated.reviewedBy?.length || 0,
    });
  }

  res.status(200).json({
    status: "success",
    message: "Review submitted successfully",
    data: updated,
  });
});

// ============================================================
// ASSIGN REVIEWERS
// ============================================================
exports.AssignReviewers = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { reviewerIds } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }
  if (!Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    return res.status(400).json({ status: "fail", message: "reviewerIds array is required" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  const newIds = reviewerIds
    .filter((rid) => mongoose.Types.ObjectId.isValid(rid))
    .map((rid) => new mongoose.Types.ObjectId(rid));

  const existingSet = new Set(
    (proposedTitle.assignedReviewers || []).map((rid) => rid.toString())
  );
  newIds.forEach((rid) => {
    if (!existingSet.has(rid.toString())) {
      proposedTitle.assignedReviewers.push(rid);
    }
  });

  const updated = await proposedTitle.save();

  res.status(200).json({
    status: "success",
    message: "Reviewers assigned successfully",
    data: updated,
  });
});

// ============================================================
// UPDATE RUBRIC SCORES
// ============================================================
exports.UpdateRubricScores = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const {
    scientificSignificance,
    technicalNovelty,
    methodologyRigor,
    resourceFeasibility,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  const isAssigned = (proposedTitle.assignedReviewers || []).some(
    (rid) => rid.toString() === userId.toString()
  );
  const group = await Group.findById(proposedTitle.groupId);
  const isAdviser =
    group &&
    (group.adviserId?.toString() === userId.toString() ||
      group.coadviserId?.toString() === userId.toString());

  if (!isAssigned && !isAdviser) {
    return res
      .status(403)
      .json({ status: "fail", message: "Not authorized to update rubric scores" });
  }

  if (!proposedTitle.rubric) proposedTitle.rubric = {};

  if (typeof scientificSignificance === "number")
    proposedTitle.rubric.scientificSignificance = scientificSignificance;
  if (typeof technicalNovelty === "number")
    proposedTitle.rubric.technicalNovelty = technicalNovelty;
  if (typeof methodologyRigor === "number")
    proposedTitle.rubric.methodologyRigor = methodologyRigor;
  if (typeof resourceFeasibility === "number")
    proposedTitle.rubric.resourceFeasibility = resourceFeasibility;

  proposedTitle.rubric.scoredBy = userId;
  proposedTitle.rubric.scoredAt = new Date();

  const updated = await proposedTitle.save();

  res.status(200).json({
    status: "success",
    message: "Rubric updated successfully",
    data: updated,
  });
});

// ============================================================
// UPDATE SCOPE STATUS
// ============================================================
exports.UpdateScopeStatus = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { scopeStatus } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }
  const allowed = ["Pending", "Unrated", "Approved", "Rejected", "Needs Revision"];
  if (!allowed.includes(scopeStatus)) {
    return res.status(400).json({ status: "fail", message: "Invalid scopeStatus" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  const group = await Group.findById(proposedTitle.groupId);
  const isAdviser =
    group &&
    (group.adviserId?.toString() === userId.toString() ||
      group.coadviserId?.toString() === userId.toString());
  const isAssigned = (proposedTitle.assignedReviewers || []).some(
    (rid) => rid.toString() === userId.toString()
  );

  if (!isAdviser && !isAssigned) {
    return res
      .status(403)
      .json({ status: "fail", message: "Not authorized to update scope status" });
  }

  proposedTitle.scopeStatus = scopeStatus;
  const updated = await proposedTitle.save();

  res.status(200).json({
    status: "success",
    message: "Scope status updated",
    data: updated,
  });
});

// ============================================================
// UPDATE PANEL DECISION
// ============================================================
exports.UpdatePanelDecision = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { panelDecision, panelFeedback } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }
  const allowed = [
    "Endorse for Title Defense",
    "Request Major Methodology Revision",
    "Recommend Scope Downsizing",
    "Reject",
  ];
  if (!allowed.includes(panelDecision)) {
    return res.status(400).json({ status: "fail", message: "Invalid panelDecision" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  const isAssigned = (proposedTitle.assignedReviewers || []).some(
    (rid) => rid.toString() === userId.toString()
  );
  if (!isAssigned) {
    return res
      .status(403)
      .json({ status: "fail", message: "Only assigned reviewers can set panel decision" });
  }

  proposedTitle.panelDecision = panelDecision;
  if (typeof panelFeedback === "string") {
    proposedTitle.panelFeedback = panelFeedback;
  }
  const updated = await proposedTitle.save();

  res.status(200).json({
    status: "success",
    message: "Panel decision updated",
    data: updated,
  });
});

// ============================================================
// UPDATE DEFENSE SCHEDULE
// ============================================================
exports.UpdateDefenseSchedule = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { scheduledAt, venue, modality, zoomLink, zoomPasscode, panelQuorum } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  if (!proposedTitle.defenseSchedule) proposedTitle.defenseSchedule = {};

  if (scheduledAt) proposedTitle.defenseSchedule.scheduledAt = new Date(scheduledAt);
  if (venue !== undefined) proposedTitle.defenseSchedule.venue = venue;
  if (modality) proposedTitle.defenseSchedule.modality = modality;
  if (zoomLink !== undefined) proposedTitle.defenseSchedule.zoomLink = zoomLink;
  if (zoomPasscode !== undefined) proposedTitle.defenseSchedule.zoomPasscode = zoomPasscode;
  if (panelQuorum && typeof panelQuorum === "object") {
    proposedTitle.defenseSchedule.panelQuorum = {
      ...(proposedTitle.defenseSchedule.panelQuorum || {}),
      ...panelQuorum,
    };
  }

  const updated = await proposedTitle.save();

  res.status(200).json({
    status: "success",
    message: "Defense schedule updated",
    data: updated,
  });
});

// ============================================================
// UPDATE OBJECTIVES
// ============================================================
exports.UpdateObjectives = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { objectives } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }
  if (!Array.isArray(objectives)) {
    return res.status(400).json({ status: "fail", message: "objectives array required" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });

  proposedTitle.objectives = objectives.map((o) => ({
    text: o.text || "",
    isCompleted: !!o.isCompleted,
    notes: o.notes || "",
    completedAt: o.isCompleted ? o.completedAt || new Date() : null,
  }));

  const updated = await proposedTitle.save();

  res.status(200).json({
    status: "success",
    message: "Objectives updated",
    data: updated,
  });
});

// ============================================================
// MARK CHAPTER COMPLETE
// ============================================================
exports.MarkChapterComplete = AsyncErrorHandler(async (req, res) => {
  const { id, trackingId } = req.params;
  const { isCompleted = true } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(trackingId)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle) {
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });
  }

  const group = await Group.findById(proposedTitle.groupId);
  if (!group) {
    return res.status(404).json({ status: "fail", message: "Group not found" });
  }

  const isAdviser = group.adviserId && group.adviserId.toString() === userId.toString();
  const isCoAdviser = group.coadviserId && group.coadviserId.toString() === userId.toString();

  const user = await UserLoginSchema.findById(userId);
  const isStudentMember = user && user.referredBy === group.referralCode;

  if (!isAdviser && !isCoAdviser && !isStudentMember) {
    return res.status(403).json({
      status: "fail",
      message: "You are not allowed to mark this chapter as complete",
    });
  }

  const entry = proposedTitle.titleUrlTracking.id(trackingId);
  if (!entry) {
    return res.status(404).json({ status: "fail", message: "Tracking entry not found" });
  }

  entry.isCompleted = isCompleted === true;
  entry.completedAt = isCompleted === true ? new Date() : null;
  entry.completedBy = isCompleted === true ? userId : null;

  syncChapterCompletion(proposedTitle);

  const saved = await proposedTitle.save();

  const io = req.app.get("io");
  if (io) {
    io.emit("ChapterCompletionUpdated", {
      proposedTitleId: saved._id,
      trackingId,
      chapter: entry.chapter,
      isCompleted: entry.isCompleted,
      completedChapters: saved.completedChapters,
      isAllChaptersCompleted: saved.isAllChaptersCompleted,
    });
  }

  res.status(200).json({
    status: "success",
    message: isCompleted
      ? `Chapter "${entry.chapter}" marked as completed`
      : `Chapter "${entry.chapter}" marked as incomplete`,
    data: {
      proposedTitleId: saved._id,
      trackingId,
      chapter: entry.chapter,
      isCompleted: entry.isCompleted,
      completedAt: entry.completedAt,
      completedBy: entry.completedBy,
      completedChapters: saved.completedChapters,
      isAllChaptersCompleted: saved.isAllChaptersCompleted,
    },
  });
});

// ============================================================
// GET CHAPTER COMPLETION
// ============================================================
exports.GetChapterCompletion = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id).populate(
    "titleUrlTracking.completedBy",
    "first_name last_name role email"
  );

  if (!proposedTitle) {
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });
  }

  const tracking = proposedTitle.titleUrlTracking || [];

  const chapterMap = {};
  tracking.forEach((t) => {
    if (!t.chapter) return;
    if (!chapterMap[t.chapter]) {
      chapterMap[t.chapter] = {
        chapter: t.chapter,
        isCompleted: false,
        completedAt: null,
        completedBy: null,
        latestEntry: null,
        entries: [],
      };
    }
    chapterMap[t.chapter].entries.push(t);
    if (
      !chapterMap[t.chapter].latestEntry ||
      new Date(t.date) > new Date(chapterMap[t.chapter].latestEntry.date)
    ) {
      chapterMap[t.chapter].latestEntry = t;
    }
    if (t.isCompleted === true) {
      chapterMap[t.chapter].isCompleted = true;
      chapterMap[t.chapter].completedAt = t.completedAt;
      chapterMap[t.chapter].completedBy = t.completedBy;
    }
  });

  REQUIRED_CHAPTERS.forEach((ch) => {
    if (!chapterMap[ch]) {
      chapterMap[ch] = {
        chapter: ch,
        isCompleted: false,
        completedAt: null,
        completedBy: null,
        latestEntry: null,
        entries: [],
      };
    }
  });

  const chapters = Object.values(chapterMap).sort((a, b) => {
    const idxA = REQUIRED_CHAPTERS.indexOf(a.chapter);
    const idxB = REQUIRED_CHAPTERS.indexOf(b.chapter);
    if (idxA === -1 && idxB === -1) return a.chapter.localeCompare(b.chapter);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const completedRequired = chapters.filter(
    (c) => c.isCompleted && REQUIRED_CHAPTERS.includes(c.chapter)
  ).length;

  res.status(200).json({
    status: "success",
    data: {
      proposedTitleId: proposedTitle._id,
      title: proposedTitle.title,
      status: proposedTitle.status,
      requiredChapters: REQUIRED_CHAPTERS,
      chapters,
      completedChapters: proposedTitle.completedChapters || [],
      isAllChaptersCompleted: proposedTitle.isAllChaptersCompleted || false,
      progress: Math.round((completedRequired / REQUIRED_CHAPTERS.length) * 100),
    },
  });
});

// ============================================================
// MARK ALL CHAPTERS COMPLETE
// ============================================================
exports.MarkAllChaptersComplete = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { isCompleted = true } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ status: "fail", message: "Invalid ID format" });
  }

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle) {
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });
  }

  const group = await Group.findById(proposedTitle.groupId);
  if (!group) {
    return res.status(404).json({ status: "fail", message: "Group not found" });
  }

  const isAdviser = group.adviserId && group.adviserId.toString() === userId.toString();
  const isCoAdviser = group.coadviserId && group.coadviserId.toString() === userId.toString();

  if (!isAdviser && !isCoAdviser) {
    return res.status(403).json({
      status: "fail",
      message: "Only adviser or co-adviser can mark all chapters as complete",
    });
  }

  (proposedTitle.titleUrlTracking || []).forEach((t) => {
    t.isCompleted = isCompleted === true;
    t.completedAt = isCompleted === true ? new Date() : null;
    t.completedBy = isCompleted === true ? userId : null;
  });

  syncChapterCompletion(proposedTitle);

  const saved = await proposedTitle.save();

  const io = req.app.get("io");
  if (io) {
    io.emit("ChapterCompletionUpdated", {
      proposedTitleId: saved._id,
      isBulk: true,
      isCompleted,
      completedChapters: saved.completedChapters,
      isAllChaptersCompleted: saved.isAllChaptersCompleted,
    });
  }

  res.status(200).json({
    status: "success",
    message: isCompleted ? "All chapters marked as completed" : "All chapters marked as incomplete",
    data: {
      proposedTitleId: saved._id,
      completedChapters: saved.completedChapters,
      isAllChaptersCompleted: saved.isAllChaptersCompleted,
    },
  });
});

// ============================================================
// CONFIRM TASK / ALL TASKS
// ============================================================
exports.ConfirmTask = AsyncErrorHandler(async (req, res) => {
  const { id, taskId } = req.params;
  const { isCompleted = true } = req.body;
  const userId = req.user._id;

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle) {
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });
  }

  const group = await Group.findById(proposedTitle.groupId);
  const user = await UserLoginSchema.findById(userId);
  if (!group || !user || user.referredBy !== group.referralCode) {
    return res.status(403).json({ status: "fail", message: "You are not a member of this group" });
  }

  const task = proposedTitle.task.id(taskId);
  if (!task) return res.status(404).json({ status: "fail", message: "Task not found" });

  task.isCompleted = isCompleted === true;
  task.completedAt = isCompleted === true ? new Date() : null;

  const saved = await proposedTitle.save();

  const io = req.app.get("io");
  if (io) {
    io.emit("TaskConfirmed", {
      proposedTitleId: saved._id,
      taskId,
      isCompleted: task.isCompleted,
      completion: saved.getOverallCompletion ? saved.getOverallCompletion() : null,
    });
  }

  res.status(200).json({
    status: "success",
    message: "Task updated",
    data: saved,
    completion: saved.getCompletionSummary ? saved.getCompletionSummary() : null,
  });
});

exports.ConfirmAllTasks = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { isCompleted = true } = req.body;
  const userId = req.user._id;

  const proposedTitle = await ProposedTitleModel.findById(id);
  if (!proposedTitle) {
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });
  }

  const group = await Group.findById(proposedTitle.groupId);
  const user = await UserLoginSchema.findById(userId);
  if (!group || !user || user.referredBy !== group.referralCode) {
    return res.status(403).json({ status: "fail", message: "You are not a member of this group" });
  }

  proposedTitle.task.forEach((t) => {
    t.isCompleted = isCompleted === true;
    t.completedAt = isCompleted === true ? new Date() : null;
  });

  const saved = await proposedTitle.save();

  res.status(200).json({
    status: "success",
    message: "All tasks updated",
    data: saved,
    completion: saved.getCompletionSummary ? saved.getCompletionSummary() : null,
  });
});

// ============================================================
// GET COMPLETION SUMMARY
// ============================================================
exports.GetCompletionSummary = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;

  const proposedTitle = await ProposedTitleModel.findById(id).populate(
    "task.requestedBy",
    "first_name last_name role email"
  );

  if (!proposedTitle) {
    return res.status(404).json({ status: "fail", message: "Proposed title not found" });
  }

  const summary = proposedTitle.getCompletionSummary
    ? proposedTitle.getCompletionSummary()
    : { total: 0, completed: 0, pending: 0, percentage: 0, perTeacher: {} };

  const perTeacherWithInfo = {};
  Object.keys(summary.perTeacher || {}).forEach((teacherId) => {
    const teacher = proposedTitle.task.find(
      (t) => t.requestedBy && t.requestedBy._id?.toString() === teacherId
    )?.requestedBy;
    perTeacherWithInfo[teacherId] = {
      ...summary.perTeacher[teacherId],
      teacher: teacher
        ? {
          _id: teacher._id,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          role: teacher.role,
          email: teacher.email,
        }
        : null,
    };
  });

  const completedChapters = proposedTitle.completedChapters || [];
  const completedRequired = completedChapters.filter((ch) =>
    REQUIRED_CHAPTERS.includes(ch)
  ).length;

  res.status(200).json({
    status: "success",
    data: {
      proposedTitleId: proposedTitle._id,
      title: proposedTitle.title,
      status: proposedTitle.status,
      completion: {
        ...summary,
        perTeacher: perTeacherWithInfo,
      },
      chapterCompletion: {
        requiredChapters: REQUIRED_CHAPTERS,
        completedChapters,
        isAllChaptersCompleted: proposedTitle.isAllChaptersCompleted || false,
        progress: Math.round((completedRequired / REQUIRED_CHAPTERS.length) * 100),
      },
      tasks: proposedTitle.task,
    },
  });
});

// ============================================================
// DELETE
// ============================================================
exports.deleteProposedTitle = AsyncErrorHandler(async (req, res) => {
  const proposedTitle = await ProposedTitleModel.findById(req.params.id);
  if (!proposedTitle)
    return res.status(404).json({ status: "fail", message: "Proposed title not found." });

  if (proposedTitle.publicId && process.env.UPLOADAGTA_DELETE_URL) {
    try {
      await axios.delete(`${process.env.UPLOADAGTA_DELETE_URL}/${proposedTitle.publicId}`);
    } catch (err) {
      console.error("Failed to delete file:", err.message);
    }
  }

  await ProposedTitleModel.findByIdAndDelete(req.params.id);
  res.status(200).json({ status: "success", message: "Proposed title deleted successfully." });
});

// ============================================================
// GET BY ID
// ============================================================
exports.getProposedTitleById = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;

  const proposedTitle = await ProposedTitleModel.findById(id)
    .populate("groupId", "groupName")
    .populate("uploadedBy", "first_name last_name id_number")
    .populate("task.requestedBy", "first_name last_name role email")
    .populate("adviserId", "first_name last_name email role")
    .populate("coAdviserId", "first_name last_name email role")
    .populate("assignedReviewers", "first_name last_name email role")
    .populate("reviewedBy.reviewerId", "first_name last_name email role");

  if (!proposedTitle) {
    return res.status(404).json({ status: "fail", message: "Proposed title not found." });
  }

  const completedRequired = (proposedTitle.completedChapters || []).filter((ch) =>
    REQUIRED_CHAPTERS.includes(ch)
  ).length;

  res.status(200).json({
    status: "success",
    data: {
      ...proposedTitle.toObject({ virtuals: true }),
      completion: proposedTitle.getCompletionSummary
        ? proposedTitle.getCompletionSummary()
        : null,
      chapterCompletion: {
        requiredChapters: REQUIRED_CHAPTERS,
        completedChapters: proposedTitle.completedChapters || [],
        isAllChaptersCompleted: proposedTitle.isAllChaptersCompleted || false,
        progress: Math.round((completedRequired / REQUIRED_CHAPTERS.length) * 100),
      },
    },
  });
});

// ============================================================
// GET FILE CLOUD / URL
// ============================================================
exports.getFileCloud = AsyncErrorHandler(async (req, res) => {
  const file = await ProposedTitleModel.findById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found." });
  if (!file.fileUrl) return res.status(404).json({ message: "File URL not found." });

  try {
    const response = await axios({ method: "GET", url: file.fileUrl, responseType: "stream" });
    res.setHeader("Content-Type", file.fileType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${file.fileName || "document.pdf"}"`);
    return response.data.pipe(res);
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Failed to fetch file" });
  }
});

exports.getFileUrl = AsyncErrorHandler(async (req, res) => {
  const file = await ProposedTitleModel.findById(req.params.id);
  if (!file) return res.status(404).json({ status: "fail", message: "File not found." });
  if (!file.fileUrl) return res.status(404).json({ status: "fail", message: "File URL not found." });

  res.status(200).json({
    status: "success",
    data: { fileUrl: file.fileUrl, fileName: file.fileName, fileType: file.fileType },
  });
});

// ============================================================
// GET BY GROUP / STATUS
// ============================================================
exports.getProposedTitlesByGroup = AsyncErrorHandler(async (req, res) => {
  const { groupId } = req.params;
  const proposedTitles = await ProposedTitleModel.find({ groupId })
    .populate("uploadedBy", "first_name last_name id_number")
    .populate("task.requestedBy", "first_name last_name role email")
    .populate("adviserId", "first_name last_name email role")
    .populate("coAdviserId", "first_name last_name email role")
    .populate("assignedReviewers", "first_name last_name email role")
    .sort({ createdAt: -1 });

  const data = proposedTitles.map((t) => ({
    ...t.toObject({ virtuals: true }),
    completion: t.getCompletionSummary ? t.getCompletionSummary() : null,
    chapterCompletion: {
      requiredChapters: REQUIRED_CHAPTERS,
      completedChapters: t.completedChapters || [],
      isAllChaptersCompleted: t.isAllChaptersCompleted || false,
      progress: Math.round(
        ((t.completedChapters || []).filter((ch) => REQUIRED_CHAPTERS.includes(ch)).length /
          REQUIRED_CHAPTERS.length) *
        100
      ),
    },
  }));

  res.status(200).json({ status: "success", results: data.length, data });
});

exports.getProposedTitlesByStatus = AsyncErrorHandler(async (req, res) => {
  const { status } = req.params;
  const userId = req.user.linkId;
  const matchStage = { status };

  if (req.user.role === "student" || req.user.role === "organizer") {
    matchStage.uploadedBy = new mongoose.Types.ObjectId(userId);
  }

  const proposedTitles = await ProposedTitleModel.find(matchStage)
    .populate("groupId", "groupName")
    .populate("uploadedBy", "first_name last_name id_number")
    .populate("task.requestedBy", "first_name last_name role email")
    .populate("adviserId", "first_name last_name email role")
    .populate("coAdviserId", "first_name last_name email role")
    .sort({ createdAt: -1 });

  const data = proposedTitles.map((t) => ({
    ...t.toObject({ virtuals: true }),
    completion: t.getCompletionSummary ? t.getCompletionSummary() : null,
  }));

  res.status(200).json({ status: "success", results: data.length, data });
});

// ============================================================
// BULK UPDATE STATUS
// ============================================================
exports.bulkUpdateStatus = AsyncErrorHandler(async (req, res) => {
  const { ids, status, remarks } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res
      .status(400)
      .json({ status: "fail", message: "Please provide an array of proposal IDs" });
  }

  const updateData = { status };
  if (remarks) updateData.remarks = remarks;

  const result = await ProposedTitleModel.updateMany({ _id: { $in: ids } }, updateData, {
    new: true,
  });

  res.status(200).json({
    status: "success",
    message: `${result.modifiedCount} proposed titles updated successfully`,
    data: result,
  });
});

// ============================================================
// DISPLAY READY TITLES
// ============================================================
exports.DisplayReadytitle = AsyncErrorHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const { search, dateFrom, dateTo, groupId } = req.query;

  const role = req.user.role;
  const userId = req.user._id;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const matchStage = { status: "Ready for Defense" };

  if (role === "student") matchStage.uploadedBy = userObjectId;
  if (groupId) matchStage.groupId = new mongoose.Types.ObjectId(groupId);
  if (search) matchStage.title = { $regex: search.trim(), $options: "i" };
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = endOfDay;
    }
  }

  let roleMatchStage = null;
  if (role === "adviser" || role === "coadviser") {
    roleMatchStage = {
      $or: [
        { "groupInfo.adviserId": userObjectId },
        { "groupInfo.coadviserId": userObjectId },
      ],
    };
  } else if (role === "panelist") {
    roleMatchStage = { "groupInfo.panelistIds": userObjectId };
  }

  const result = await ProposedTitleModel.aggregate([
    { $match: matchStage },
    { $lookup: { from: "groups", localField: "groupId", foreignField: "_id", as: "groupInfo" } },
    { $unwind: { path: "$groupInfo", preserveNullAndEmptyArrays: true } },
    ...(roleMatchStage ? [{ $match: roleMatchStage }] : []),

    ...buildAdviserLookupStages(),

    { $lookup: { from: "userloginschemas", localField: "uploadedBy", foreignField: "_id", as: "uploaderInfo" } },
    { $unwind: { path: "$uploaderInfo", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "comments", localField: "_id", foreignField: "proposedTitleId", as: "comments" } },
    { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "userloginschemas", localField: "comments.userId", foreignField: "_id", as: "comments.authorInfo" } },
    { $unwind: { path: "$comments.authorInfo", preserveNullAndEmptyArrays: true } },
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
        titleUrlTracking: { $first: "$titleUrlTracking" },
        task: { $first: "$task" },
        completedChapters: { $first: "$completedChapters" },
        isAllChaptersCompleted: { $first: "$isAllChaptersCompleted" },
        groupInfo: { $first: "$groupInfo" },
        uploaderInfo: { $first: "$uploaderInfo" },

        topicCode: { $first: "$topicCode" },
        track: { $first: "$track" },
        revisionNumber: { $first: "$revisionNumber" },
        groupStatus: { $first: "$groupStatus" },
        adviserId: { $first: "$adviserId" },
        coAdviserId: { $first: "$coAdviserId" },
        adviserInfo: { $first: "$adviserInfo" },
        coAdviserInfo: { $first: "$coAdviserInfo" },
        rubric: { $first: "$rubric" },
        noveltyScore: { $first: "$noveltyScore" },
        feasibilityScore: { $first: "$feasibilityScore" },
        scopeStatus: { $first: "$scopeStatus" },
        panelDecision: { $first: "$panelDecision" },
        panelFeedback: { $first: "$panelFeedback" },
        reviewDeadline: { $first: "$reviewDeadline" },
        assignedReviewers: { $first: "$assignedReviewers" },
        reviewedBy: { $first: "$reviewedBy" },
        objectives: { $first: "$objectives" },
        sdgGoals: { $first: "$sdgGoals" },
        defenseSchedule: { $first: "$defenseSchedule" },
        isUrgent: { $first: "$isUrgent" },
        priority: { $first: "$priority" },

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
            },
          },
        },
      },
    },
    {
      $addFields: {
        comments: { $sortArray: { input: "$comments", sortBy: { createdAt: 1 } } },
      },
    },
    { $sort: { priority: -1, createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1, title: 1, description: 1, status: 1, remarks: 1,
              createdAt: 1, updatedAt: 1, fileName: 1, fileUrl: 1, fileType: 1,
              isPdf: 1, adviser: 1, coAdviser: 1, titleUrlTracking: 1,
              task: 1,
              completion: buildCompletionStage(),
              isFullyCompleted: buildIsFullyCompletedStage(),
              chapterCompletion: buildChapterCompletionStage(),

              topicCode: 1,
              track: 1,
              revisionNumber: 1,
              groupStatus: 1,
              adviserId: 1,
              coAdviserId: 1,
              adviserInfo: 1,
              coAdviserInfo: 1,
              rubric: buildRubricStage(),
              noveltyScore: 1,
              feasibilityScore: 1,
              scopeStatus: 1,
              panelDecision: 1,
              panelFeedback: 1,
              reviewDeadline: 1,
              assignedReviewers: 1,
              reviewedBy: 1,
              objectives: buildObjectivesStage(),
              sdgGoals: { $ifNull: ["$sdgGoals", []] },
              defenseSchedule: buildDefenseScheduleStage(),
              isUrgent: 1,
              priority: 1,

              groupName: { $ifNull: ["$groupInfo.groupName", "N/A"] },
              uploaderName: {
                $ifNull: [
                  { $concat: ["$uploaderInfo.first_name", " ", "$uploaderInfo.last_name"] },
                  "N/A",
                ],
              },
              uploaderIdNumber: { $ifNull: ["$uploaderInfo.id_number", "N/A"] },
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

  const proposedTitles = result[0]?.data || [];
  const totalCount = result[0]?.totalCount?.[0]?.count || 0;
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

// ============================================================
// DISPLAY ARCHIVED TITLES
// ============================================================
exports.DisplayArcivedtitle = AsyncErrorHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const { search, dateFrom, dateTo, groupId } = req.query;

  const role = req.user.role;
  const userId = req.user._id;
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const matchStage = { isArchived: true };

  if (role === "student") matchStage.uploadedBy = userObjectId;
  if (groupId) matchStage.groupId = new mongoose.Types.ObjectId(groupId);
  if (search) matchStage.title = { $regex: search.trim(), $options: "i" };
  if (dateFrom || dateTo) {
    matchStage.createdAt = {};
    if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      matchStage.createdAt.$lte = endOfDay;
    }
  }

  let roleMatchStage = null;
  if (role === "adviser" || role === "coadviser") {
    roleMatchStage = {
      $or: [
        { "groupInfo.adviserId": userObjectId },
        { "groupInfo.coadviserId": userObjectId },
      ],
    };
  } else if (role === "panelist") {
    roleMatchStage = { "groupInfo.panelistIds": userObjectId };
  }

  const result = await ProposedTitleModel.aggregate([
    { $match: matchStage },
    { $lookup: { from: "groups", localField: "groupId", foreignField: "_id", as: "groupInfo" } },
    { $unwind: { path: "$groupInfo", preserveNullAndEmptyArrays: true } },
    ...(roleMatchStage ? [{ $match: roleMatchStage }] : []),

    { $lookup: { from: "userloginschemas", localField: "groupInfo.members", foreignField: "_id", as: "membersInfo" } },
    { $lookup: { from: "userloginschemas", localField: "groupInfo.adviserId", foreignField: "_id", as: "adviserInfo" } },
    { $lookup: { from: "userloginschemas", localField: "groupInfo.coadviserId", foreignField: "_id", as: "coadviserInfo" } },
    { $lookup: { from: "userloginschemas", localField: "groupInfo.panelistIds", foreignField: "_id", as: "panelistsInfo" } },
    { $lookup: { from: "userloginschemas", localField: "groupInfo.referralCode", foreignField: "referredBy", as: "referredUsersInfo" } },
    { $lookup: { from: "userloginschemas", localField: "uploadedBy", foreignField: "_id", as: "uploaderInfo" } },
    { $unwind: { path: "$uploaderInfo", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "comments", localField: "_id", foreignField: "proposedTitleId", as: "comments" } },
    { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "userloginschemas", localField: "comments.userId", foreignField: "_id", as: "comments.authorInfo" } },
    { $unwind: { path: "$comments.authorInfo", preserveNullAndEmptyArrays: true } },
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
        task: { $first: "$task" },
        completedChapters: { $first: "$completedChapters" },
        isAllChaptersCompleted: { $first: "$isAllChaptersCompleted" },
        groupInfo: { $first: "$groupInfo" },
        uploaderInfo: { $first: "$uploaderInfo" },
        membersInfo: { $first: "$membersInfo" },
        adviserInfo: { $first: "$adviserInfo" },
        coadviserInfo: { $first: "$coadviserInfo" },
        panelistsInfo: { $first: "$panelistsInfo" },
        referredUsersInfo: { $first: "$referredUsersInfo" },

        topicCode: { $first: "$topicCode" },
        track: { $first: "$track" },
        revisionNumber: { $first: "$revisionNumber" },
        groupStatus: { $first: "$groupStatus" },
        rubric: { $first: "$rubric" },
        noveltyScore: { $first: "$noveltyScore" },
        feasibilityScore: { $first: "$feasibilityScore" },
        scopeStatus: { $first: "$scopeStatus" },
        panelDecision: { $first: "$panelDecision" },
        panelFeedback: { $first: "$panelFeedback" },
        defenseSchedule: { $first: "$defenseSchedule" },

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
            },
          },
        },
      },
    },
    {
      $addFields: {
        comments: { $sortArray: { input: "$comments", sortBy: { createdAt: 1 } } },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1, title: 1, description: 1, status: 1, isArchived: 1, remarks: 1,
              createdAt: 1, updatedAt: 1, fileName: 1, fileUrl: 1, fileType: 1,
              isPdf: 1, adviser: 1, coAdviser: 1, titleUrlTracking: 1,
              task: 1,
              completion: buildCompletionStage(),
              isFullyCompleted: buildIsFullyCompletedStage(),
              chapterCompletion: buildChapterCompletionStage(),

              topicCode: 1,
              track: 1,
              revisionNumber: 1,
              groupStatus: 1,
              rubric: buildRubricStage(),
              noveltyScore: 1,
              feasibilityScore: 1,
              scopeStatus: 1,
              panelDecision: 1,
              panelFeedback: 1,
              defenseSchedule: buildDefenseScheduleStage(),

              groupName: { $ifNull: ["$groupInfo.name", "N/A"] },
              referralCode: { $ifNull: ["$groupInfo.referralCode", "N/A"] },
              uploaderName: {
                $ifNull: [
                  { $concat: ["$uploaderInfo.first_name", " ", "$uploaderInfo.last_name"] },
                  "N/A",
                ],
              },
              uploaderIdNumber: { $ifNull: ["$uploaderInfo.id_number", "N/A"] },
              comments: 1,
              commentCount: { $size: "$comments" },
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
                        { $ifNull: ["$$m.last_name", ""] },
                      ],
                    },
                    id_number: "$$m.id_number",
                    email: "$$m.email",
                    role: "$$m.role",
                  },
                },
              },
              adviserInfo: { $arrayElemAt: ["$adviserInfo", 0] },
              coadviserInfo: { $arrayElemAt: ["$coadviserInfo", 0] },
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
                        { $ifNull: ["$$p.last_name", ""] },
                      ],
                    },
                    id_number: "$$p.id_number",
                    email: "$$p.email",
                    role: "$$p.role",
                  },
                },
              },
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
                        { $ifNull: ["$$r.last_name", ""] },
                      ],
                    },
                    username: "$$r.username",
                    id_number: "$$r.id_number",
                    email: "$$r.email",
                    role: "$$r.role",
                    referredBy: "$$r.referredBy",
                    status: "$$r.status",
                  },
                },
              },
              referredCount: { $size: "$referredUsersInfo" },
              groupInfo: 1,
              uploaderInfo: 1,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const proposedTitles = result[0]?.data || [];
  const totalCount = result[0]?.totalCount?.[0]?.count || 0;
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

// ============================================================
// ⭐ PROCEED CHAPTER (Subject Instructor / Admin / Organizer only)
// PATCH /api/v1/proposed-titles/:id/chapters/:chapter/proceed
// ============================================================
exports.proceedChapter = async (req, res) => {
  try {
    const { id, chapter } = req.params;
    const decodedChapter = decodeURIComponent(chapter);
    const { feedback = '' } = req.body;

    const SEQUENTIAL_CHAPTERS = ProposedTitleModel.SEQUENTIAL_CHAPTERS || [
      'Preliminary Pages', 'Chapter 1', 'Chapter 2', 'Chapter 3',
      'Chapter 4', 'Chapter 5', 'Appendices', 'Full Manuscript',
    ];

    if (!SEQUENTIAL_CHAPTERS.includes(decodedChapter)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid chapter: "${decodedChapter}". Must be one of: ${SEQUENTIAL_CHAPTERS.join(', ')}`,
      });
    }

    const role = (req.user?.role || '').toLowerCase().trim();
    const allowedRoles = ['subject_instructor', 'admin', 'organizer'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only Subject Instructors can proceed chapters',
      });
    }

    // ✅ FIXED: ProposedTitleModel instead of Proposal
    const doc = await ProposedTitleModel.findById(id);
    if (!doc) {
      return res.status(404).json({
        status: 'fail',
        message: 'Proposed title not found',
      });
    }

    await doc.proceedChapter(decodedChapter, req.user._id, feedback);

    const idx = SEQUENTIAL_CHAPTERS.indexOf(decodedChapter);
    const nextChapter =
      idx + 1 < SEQUENTIAL_CHAPTERS.length ? SEQUENTIAL_CHAPTERS[idx + 1] : null;

    // ✅ FIXED
    const updated = await ProposedTitleModel.findById(id);

    res.status(200).json({
      status: 'success',
      data: updated,
      nextChapter,
    });
  } catch (err) {
    console.error('proceedChapter error:', err);
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ============================================================
// ⭐ REJECT CHAPTER (Subject Instructor / Admin / Organizer only)
// PATCH /api/v1/proposed-titles/:id/chapters/:chapter/reject
// ============================================================
exports.rejectChapter = async (req, res) => {
  try {
    const { id, chapter } = req.params;
    const decodedChapter = decodeURIComponent(chapter);
    const { feedback } = req.body;

    if (!feedback || !feedback.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Feedback is required to reject a chapter',
      });
    }

    // ✅ FIXED
    const SEQUENTIAL_CHAPTERS = ProposedTitleModel.SEQUENTIAL_CHAPTERS || [
      'Preliminary Pages', 'Chapter 1', 'Chapter 2', 'Chapter 3',
      'Chapter 4', 'Chapter 5', 'Appendices', 'Full Manuscript',
    ];

    if (!SEQUENTIAL_CHAPTERS.includes(decodedChapter)) {
      return res.status(400).json({
        status: 'fail',
        message: `Invalid chapter: "${decodedChapter}"`,
      });
    }

    const role = (req.user?.role || '').toLowerCase().trim();
    const allowedRoles = ['subject_instructor', 'admin', 'organizer'];
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only Subject Instructors can reject chapters',
      });
    }

    const doc = await ProposedTitleModel.findById(id);
    if (!doc) {
      return res.status(404).json({
        status: 'fail',
        message: 'Proposed title not found',
      });
    }

    if (!(doc.chapterProgressionApprovals instanceof Map)) {
      doc.chapterProgressionApprovals = new Map(
        Object.entries(doc.chapterProgressionApprovals || {})
      );
    }
    doc.chapterProgressionApprovals.set(decodedChapter, false);

    (doc.titleUrlTracking || []).forEach((t) => {
      if (t.chapter === decodedChapter) t.isCompleted = false;
    });

    doc.completedChapters = (doc.completedChapters || []).filter(
      (c) => c !== decodedChapter
    );

    const approvalsObj = {};
    for (const [k, v] of doc.chapterProgressionApprovals.entries()) {
      approvalsObj[k] = v;
    }

    // ✅ FIXED
    const lockResult = ProposedTitleModel.computeChapterLock(
      doc.completedChapters,
      approvalsObj
    );
    doc.nextAllowedChapter = lockResult.nextAllowedChapter;
    doc.lockedChapters = lockResult.lockedChapters;

    await doc.save();

    res.status(200).json({ status: 'success', data: doc });
  } catch (err) {
    console.error('rejectChapter error:', err);
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ============================================================
// ⭐ GET CHAPTER PROGRESSION (any authenticated user)
// GET /api/v1/proposed-titles/:id/chapters/progression
// ============================================================
exports.getChapterProgression = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await ProposedTitleModel.findById(id);
    if (!doc) {
      return res.status(404).json({
        status: 'fail',
        message: 'Proposed title not found',
      });
    }

    const approvals =
      doc.chapterProgressionApprovals instanceof Map
        ? Object.fromEntries(doc.chapterProgressionApprovals)
        : doc.chapterProgressionApprovals || {};

    const approvedBy =
      doc.chapterProgressionApprovedBy instanceof Map
        ? Object.fromEntries(doc.chapterProgressionApprovedBy)
        : doc.chapterProgressionApprovedBy || {};

    const approvedAt =
      doc.chapterProgressionApprovedAt instanceof Map
        ? Object.fromEntries(doc.chapterProgressionApprovedAt)
        : doc.chapterProgressionApprovedAt || {};

    res.status(200).json({
      status: 'success',
      data: {
        chapterProgressionApprovals: approvals,
        chapterProgressionApprovedBy: approvedBy,
        chapterProgressionApprovedAt: approvedAt,
        completedChapters: doc.completedChapters || [],
        nextAllowedChapter: doc.nextAllowedChapter,
        lockedChapters: doc.lockedChapters || [],
        titleUrlTracking: doc.titleUrlTracking || [],
      },
    });
  } catch (err) {
    console.error('getChapterProgression error:', err);
    res.status(400).json({ status: 'fail', message: err.message });
  }
};