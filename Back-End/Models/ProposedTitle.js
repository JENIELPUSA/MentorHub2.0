const mongoose = require('mongoose');
const { Schema } = mongoose;

// ============================================================
// CHAPTER ENUM
// ============================================================
const CHAPTERS = [
  'Preliminary Pages',
  'Chapter 1',
  'Chapter 2',
  'Chapter 3',
  'Chapter 4',
  'Chapter 5',
  'Appendices',
  'Full Manuscript',
  'Others',
];

// ⭐UPDATED: Full sequential order from Preliminary to Full Manuscript
const SEQUENTIAL_CHAPTERS = [
  'Preliminary Pages',
  'Chapter 1',
  'Chapter 2',
  'Chapter 3',
  'Chapter 4',
  'Chapter 5',
  'Appendices',
  'Full Manuscript',
];

// Chapters na kailangan para maging "all completed"
const REQUIRED_CHAPTERS = ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5'];

// Chapters na counted sa sequential progression (Prelim → Full Manuscript)
const PROGRESSION_CHAPTERS = SEQUENTIAL_CHAPTERS;

// ============================================================
// NEW ENUMS (ADDITIVE ONLY)
// ============================================================
const TRACK_ENUM = [
  'Autonomous Systems',
  'Healthcare Informatics',
  'Post-Quantum Cryptography',
  'Computer Vision',
  'Computer Science & Data Systems',
  'Intelligent Robotics & IoT',
  'Cybersecurity & Privacy',
  'Software Architecture',
  'Biomedical Machine Learning',
  'Embedded Hardware',
  'Energy & Distributed AI',
  'Decentralized Systems',
  'Quantum Informatics',
  'Bio-computational Systems',
  'Applied Cryptography',
  'Robotics & Vision',
  'Medical Informatics',
];

const SCOPE_STATUS_ENUM = ['Pending', 'Unrated', 'Approved', 'Rejected', 'Needs Revision'];

const PANEL_DECISION_ENUM = [
  'Endorse for Title Defense',
  'Request Major Methodology Revision',
  'Recommend Scope Downsizing',
  'Reject',
];

const GROUP_STATUS_ENUM = ['Pending Acceptance', 'Accepted', 'Rejected', 'Under Revision'];

const SDG_GOALS_ENUM = [
  'SDG 3: Good Health and Well-being',
  'SDG 4: Quality Education',
  'SDG 6: Clean Water and Sanitation',
  'SDG 7: Affordable and Clean Energy',
  'SDG 9: Industry, Innovation and Infrastructure',
  'SDG 11: Sustainable Cities and Communities',
  'SDG 12: Responsible Consumption and Production',
  'SDG 13: Climate Action',
  'SDG 16: Peace, Justice and Strong Institutions',
];

const DEFENSE_MODALITY_ENUM = ['In-Person', 'HyFlex', 'Virtual'];

// ============================================================
// SUB-SCHEMAS
// ============================================================
const RubricSchema = new Schema(
  {
    scientificSignificance: { type: Number, min: 0, max: 5, default: 0 },
    technicalNovelty: { type: Number, min: 0, max: 5, default: 0 },
    methodologyRigor: { type: Number, min: 0, max: 5, default: 0 },
    resourceFeasibility: { type: Number, min: 0, max: 5, default: 0 },
    overallScore: { type: Number, min: 0, max: 5, default: 0 },
    scoredBy: { type: Schema.Types.ObjectId, ref: 'UserLogin', default: null },
    scoredAt: { type: Date, default: null },
  },
  { _id: false }
);

const ReviewEntrySchema = new Schema(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'UserLogin', required: true },
    decision: { type: String, enum: PANEL_DECISION_ENUM, required: true },
    feedback: { type: String, default: '' },
    scores: {
      scientificSignificance: { type: Number, min: 0, max: 5, default: 0 },
      technicalNovelty: { type: Number, min: 0, max: 5, default: 0 },
      methodologyRigor: { type: Number, min: 0, max: 5, default: 0 },
      resourceFeasibility: { type: Number, min: 0, max: 5, default: 0 },
    },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const ObjectiveSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

const DefenseScheduleSchema = new Schema(
  {
    scheduledAt: { type: Date, default: null },
    venue: { type: String, default: '' },
    modality: { type: String, enum: DEFENSE_MODALITY_ENUM, default: 'In-Person' },
    zoomLink: { type: String, default: '' },
    zoomPasscode: { type: String, default: '' },
    panelQuorum: {
      required: { type: Number, default: 3 },
      confirmed: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

// ============================================================
// MAIN SCHEMA
// ============================================================
const ProposedTitleSchema = new Schema(
  {
    // ============================================================
    // EXISTING FIELDS — UNCHANGED
    // ============================================================
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    fileUrl: { type: String, required: true },
    isSelected: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'for_schedule', 'Rejected', 'Revision', 'Ready for Defense', 'Done'],
      default: 'Pending'
    },
    remarks: { type: String, default: '' },
    titleUrlTracking: [
      {
        chapter: { type: String, enum: CHAPTERS, required: true, default: 'Preliminary Pages' },
        url: { type: String, required: true },
        date: { type: Date, default: Date.now },
        remarks: { type: String, default: '' },
        action: {
          type: String,
          enum: ['create', 'revision', 'update', 'ready for defense'],
          default: 'revision'
        },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
        completedBy: { type: Schema.Types.ObjectId, ref: 'UserLogin', default: null }
      }
    ],
    completedChapters: { type: [String], enum: CHAPTERS, default: [] },
    isAllChaptersCompleted: { type: Boolean, default: false },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'UserLogin', required: true },
    adviser: { type: Boolean, default: false },
    coAdviser: { type: Boolean, default: false },
    adviserReady: { type: Boolean, default: false },
    coAdviserReady: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    isRevesion: { type: Boolean, default: false },

    // ============================================================
    // NEW ADDITIONS — FRONTEND DISPLAY
    // ============================================================
    topicCode: { type: String, unique: true, sparse: true, trim: true, index: true },
    track: { type: String, enum: TRACK_ENUM, default: 'Computer Science & Data Systems', index: true },
    revisionNumber: { type: Number, default: 1, min: 1 },
    revisionRequestedAt: { type: Date, default: null },
    groupStatus: { type: String, enum: GROUP_STATUS_ENUM, default: 'Pending Acceptance' },
    adviserId: { type: Schema.Types.ObjectId, ref: 'UserLogin', default: null, index: true },
    coAdviserId: { type: Schema.Types.ObjectId, ref: 'UserLogin', default: null, index: true },
    rubric: { type: RubricSchema, default: () => ({}) },
    noveltyScore: { type: Number, min: 0, max: 5, default: 0 },
    feasibilityScore: { type: Number, min: 0, max: 5, default: 0 },
    scopeStatus: { type: String, enum: SCOPE_STATUS_ENUM, default: 'Pending', index: true },
    panelDecision: { type: String, enum: PANEL_DECISION_ENUM, default: null },
    panelFeedback: { type: String, default: '' },
    reviewDeadline: { type: Date, default: null, index: true },
    assignedReviewers: [{ type: Schema.Types.ObjectId, ref: 'UserLogin' }],
    reviewedBy: { type: [ReviewEntrySchema], default: [] },
    commentCount: { type: Number, default: 0, min: 0 },
    objectives: { type: [ObjectiveSchema], default: [] },
    sdgGoals: [{ type: String, enum: SDG_GOALS_ENUM }],
    defenseSchedule: { type: DefenseScheduleSchema, default: () => ({}) },
    isUrgent: { type: Boolean, default: false, index: true },
    priority: { type: Number, default: 0, min: 0, max: 10, index: true },

    // ============================================================
    // ⭐SEQUENTIAL CHAPTER LOCK FIELDS
    // ============================================================

    /**
     * Current chapter na pwedeng i-submit/re-revise.
     * Auto-computed from completedChapters[] + progression approvals.
     * 
     * Order: Preliminary Pages → Chapter 1 → ... → Chapter 5 → Appendices → Full Manuscript
     */
    nextAllowedChapter: {
      type: String,
      enum: CHAPTERS,
      default: 'Preliminary Pages', // Bagong default — Preliminary Pages muna
      index: true,
    },

    /**
     * Chapters na LOCKED — hindi pa pwedeng isumite.
     * Default: lahat maliban sa Preliminary Pages
     */
    lockedChapters: {
      type: [String],
      enum: CHAPTERS,
      default: ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Chapter 5', 'Appendices', 'Full Manuscript'],
    },

    /**
     * Subject Instructor approval per chapter.
     * { "Preliminary Pages": true, "Chapter 1": false, ... }
     */
    chapterProgressionApprovals: {
      type: Map,
      of: Boolean,
      default: () => new Map([['Preliminary Pages', true]]), // Prelim auto-approved
    },

    /**
     * Sino ang nag-approve per chapter.
     */
    chapterProgressionApprovedBy: {
      type: Map,
      of: Schema.Types.ObjectId,
      default: () => new Map(),
    },

    /**
     * Kailan na-approve per chapter.
     */
    chapterProgressionApprovedAt: {
      type: Map,
      of: Date,
      default: () => new Map(),
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================================
// VIRTUALS
// ============================================================
ProposedTitleSchema.virtual('reviewerCount').get(function () {
  return Array.isArray(this.assignedReviewers) ? this.assignedReviewers.length : 0;
});

ProposedTitleSchema.virtual('reviewsSubmitted').get(function () {
  return Array.isArray(this.reviewedBy) ? this.reviewedBy.length : 0;
});

ProposedTitleSchema.virtual('isFullyReviewed').get(function () {
  const total = this.assignedReviewers?.length || 0;
  const done = this.reviewedBy?.length || 0;
  return total > 0 && done >= total;
});

/**
 * Current active chapter (kung ano pwedeng gawin ng student)
 */
ProposedTitleSchema.virtual('currentActiveChapter').get(function () {
  const completed = new Set(this.completedChapters || []);
  const approvals = this.chapterProgressionApprovals instanceof Map
    ? this.chapterProgressionApprovals
    : new Map(Object.entries(this.chapterProgressionApprovals || {}));

  for (const ch of SEQUENTIAL_CHAPTERS) {
    if (completed.has(ch)) continue;

    const isFirst = ch === 'Preliminary Pages';
    const isApproved = approvals.get(ch) === true;

    if (isFirst || isApproved) {
      return ch;
    }
    return null;
  }
  return null;
});

/**
 * Sequential progress (Prelim → Full Manuscript)
 */
ProposedTitleSchema.virtual('chapterProgress').get(function () {
  const completed = new Set(this.completedChapters || []);
  const done = SEQUENTIAL_CHAPTERS.filter((ch) => completed.has(ch)).length;
  return {
    completed: done,
    total: SEQUENTIAL_CHAPTERS.length,
    percentage: Math.round((done / SEQUENTIAL_CHAPTERS.length) * 100),
    completedList: SEQUENTIAL_CHAPTERS.filter((ch) => completed.has(ch)),
    pendingList: SEQUENTIAL_CHAPTERS.filter((ch) => !completed.has(ch)),
  };
});

// ============================================================
// INDEXES
// ============================================================
ProposedTitleSchema.index({ groupId: 1, status: 1 });
ProposedTitleSchema.index({ 'titleUrlTracking.chapter': 1 });
ProposedTitleSchema.index({ groupId: 1, completedChapters: 1 });
ProposedTitleSchema.index({ groupId: 1, isRevesion: 1 });
ProposedTitleSchema.index({ topicCode: 1 }, { unique: true, sparse: true });
ProposedTitleSchema.index({ track: 1, status: 1 });
ProposedTitleSchema.index({ groupStatus: 1 });
ProposedTitleSchema.index({ scopeStatus: 1 });
ProposedTitleSchema.index({ reviewDeadline: 1 });
ProposedTitleSchema.index({ isUrgent: 1, priority: -1 });
ProposedTitleSchema.index({ assignedReviewers: 1 });
ProposedTitleSchema.index({ 'reviewedBy.reviewerId': 1 });
ProposedTitleSchema.index({ title: 'text', description: 'text' });
ProposedTitleSchema.index({ nextAllowedChapter: 1 });
ProposedTitleSchema.index({ lockedChapters: 1 });

// ============================================================
// STATICS
// ============================================================
ProposedTitleSchema.statics.CHAPTERS = CHAPTERS;
ProposedTitleSchema.statics.REQUIRED_CHAPTERS = REQUIRED_CHAPTERS;
ProposedTitleSchema.statics.SEQUENTIAL_CHAPTERS = SEQUENTIAL_CHAPTERS; // NEW
ProposedTitleSchema.statics.PROGRESSION_CHAPTERS = PROGRESSION_CHAPTERS; // NEW
ProposedTitleSchema.statics.TRACK_ENUM = TRACK_ENUM;
ProposedTitleSchema.statics.SCOPE_STATUS_ENUM = SCOPE_STATUS_ENUM;
ProposedTitleSchema.statics.PANEL_DECISION_ENUM = PANEL_DECISION_ENUM;
ProposedTitleSchema.statics.GROUP_STATUS_ENUM = GROUP_STATUS_ENUM;
ProposedTitleSchema.statics.SDG_GOALS_ENUM = SDG_GOALS_ENUM;

ProposedTitleSchema.statics.generateTopicCode = async function (year) {
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year + 1}-01-01`);
  const count = await this.countDocuments({ createdAt: { $gte: start, $lt: end } });
  return `TOP-${year}-${String(count + 1).padStart(2, '0')}`;
};

/**
 * STATIC: Compute chapter lock based on completed chapters + approvals
 * Sequence: Preliminary Pages → Chapter 1-5 → Appendices → Full Manuscript
 */
ProposedTitleSchema.statics.computeChapterLock = function (
  completedChapters = [],
  chapterProgressionApprovals = {}
) {
  const completed = new Set(completedChapters || []);
  const approvals = chapterProgressionApprovals instanceof Map
    ? chapterProgressionApprovals
    : new Map(Object.entries(chapterProgressionApprovals || {}));

  let nextAllowed = null;
  const locked = [];

  for (let i = 0; i < SEQUENTIAL_CHAPTERS.length; i++) {
    const ch = SEQUENTIAL_CHAPTERS[i];

    if (completed.has(ch)) continue; // Tapos na, skip

    // First uncompleted chapter
    const isFirst = ch === 'Preliminary Pages';
    const isApproved = approvals.get(ch) === true;

    if (isFirst || isApproved) {
      nextAllowed = ch;
      // Lock lahat ng succeeding
      for (let j = i + 1; j < SEQUENTIAL_CHAPTERS.length; j++) {
        locked.push(SEQUENTIAL_CHAPTERS[j]);
      }
    } else {
      // Hindi pa approved → lock lahat simula dito
      for (let j = i; j < SEQUENTIAL_CHAPTERS.length; j++) {
        locked.push(SEQUENTIAL_CHAPTERS[j]);
      }
    }
    break;
  }

  return {
    nextAllowedChapter: nextAllowed || null,
    lockedChapters: locked,
  };
};

/**
 * STATIC: Check kung pwede bang i-submit ang specific chapter
 */
ProposedTitleSchema.statics.canSubmitChapter = function (doc, chapter) {
  // Non-sequential chapters — always allowed (Others)
  if (!SEQUENTIAL_CHAPTERS.includes(chapter)) {
    return { allowed: true };
  }

  const completed = new Set(doc.completedChapters || []);

  // Kung tapos na ang chapter na ito → revision lang pwede
  if (completed.has(chapter)) {
    return {
      allowed: false,
      reason: 'CHAPTER_COMPLETED',
      message: `${chapter} is already completed. Use revision if you need to update it.`,
    };
  }

  // Preliminary Pages — always allowed (first)
  if (chapter === 'Preliminary Pages') {
    return { allowed: true };
  }

  // Chapter 1 to Full Manuscript — check if previous chapters completed + approval
  const idx = SEQUENTIAL_CHAPTERS.indexOf(chapter);
  for (let i = 0; i < idx; i++) {
    const prev = SEQUENTIAL_CHAPTERS[i];
    if (!completed.has(prev)) {
      return {
        allowed: false,
        reason: 'PREVIOUS_NOT_COMPLETED',
        message: `Cannot submit ${chapter}. Must complete ${prev} first.`,
        missingChapter: prev,
      };
    }
  }

  // Check instructor approval for this chapter
  const approvals = doc.chapterProgressionApprovals instanceof Map
    ? doc.chapterProgressionApprovals
    : new Map(Object.entries(doc.chapterProgressionApprovals || {}));

  if (approvals.get(chapter) !== true) {
    return {
      allowed: false,
      reason: 'INSTRUCTOR_NOT_APPROVED',
      message: `Cannot submit ${chapter}. Subject Instructor must approve progression first.`,
      needsApprovalFrom: 'subject_instructor',
    };
  }

  return { allowed: true };
};

// ============================================================
// HELPERS
// ============================================================
function syncCompletionFlags(doc) {
  if (!Array.isArray(doc.titleUrlTracking)) {
    doc.completedChapters = [];
    doc.isAllChaptersCompleted = false;
    return;
  }
  const completedSet = new Set();
  doc.titleUrlTracking.forEach((t) => {
    if (t.isCompleted === true && t.chapter) completedSet.add(t.chapter);
  });
  doc.completedChapters = Array.from(completedSet);
  doc.isAllChaptersCompleted = REQUIRED_CHAPTERS.every((ch) => completedSet.has(ch));
}

/**
 * Sync chapter lock fields based on current state
 */
function syncChapterLock(doc) {
  const approvalsObj = {};
  if (doc.chapterProgressionApprovals instanceof Map) {
    for (const [key, val] of doc.chapterProgressionApprovals.entries()) {
      approvalsObj[key] = val;
    }
  } else if (doc.chapterProgressionApprovals) {
    Object.assign(approvalsObj, doc.chapterProgressionApprovals);
  }

  const result = ProposedTitleSchema.statics.computeChapterLock(
    doc.completedChapters || [],
    approvalsObj
  );

  doc.nextAllowedChapter = result.nextAllowedChapter;
  doc.lockedChapters = result.lockedChapters;
}

const FINAL_STATES = ['Ready for Defense', 'Rejected', 'Revision', 'Done', 'for_schedule'];

function isFinalState(status) {
  return FINAL_STATES.includes(status);
}

function resolveStatus(doc) {
  const currentStatus = doc.status;
  if (isFinalState(currentStatus)) {
    return {
      status: currentStatus,
      isSelected: currentStatus === 'Ready for Defense',
      isArchived: currentStatus === 'Done',
      shouldDelete: false
    };
  }
  const adviser = doc.adviser === true;
  const coAdviser = doc.coAdviser === true;
  const adviserReady = doc.adviserReady === true;
  const coAdviserReady = doc.coAdviserReady === true;

  if (adviserReady || coAdviserReady) {
    const bothReady = adviserReady && coAdviserReady;
    return { status: 'Ready for Defense', isSelected: true, isArchived: false, shouldDelete: bothReady };
  }
  if (adviser && coAdviser) {
    return { status: 'Approved', isSelected: true, isArchived: false, shouldDelete: true };
  }
  if (adviser || coAdviser) {
    return { status: 'Approved', isSelected: false, isArchived: false, shouldDelete: false };
  }
  return { status: 'Pending', isSelected: false, isArchived: false, shouldDelete: false };
}

function isRevisionStatus(status) {
  return status === 'Revision';
}

function applyRevisionFlag(target, status) {
  if (isRevisionStatus(status)) target.isRevesion = true;
}

function getUpdateFields(update) {
  return update.$set || update;
}

async function deleteOtherTitles(model, groupId, currentDocId) {
  const result = await model.deleteMany({
    groupId,
    _id: { $ne: currentDocId },
    status: { $in: ['Pending', 'Revision'] }
  });
  console.log(`Deleted ${result.deletedCount} other titles in group ${groupId}`);
  return result;
}

function computeRubricScores(doc) {
  const r = doc.rubric;
  if (!r) return;
  const scores = [
    r.scientificSignificance || 0,
    r.technicalNovelty || 0,
    r.methodologyRigor || 0,
    r.resourceFeasibility || 0,
  ].filter((n) => n > 0);
  r.overallScore = scores.length
    ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    : 0;
  doc.noveltyScore = r.technicalNovelty || 0;
  doc.feasibilityScore = r.resourceFeasibility || 0;
}

function computePriority(doc) {
  if (!doc.reviewDeadline) {
    doc.isUrgent = false;
    doc.priority = 0;
    return;
  }
  const now = new Date();
  const deadline = new Date(doc.reviewDeadline);
  const hoursLeft = (deadline - now) / (1000 * 60 * 60);
  doc.isUrgent = hoursLeft <= 48 && hoursLeft > 0;
  doc.priority = Math.max(0, Math.min(10, Math.round(10 - hoursLeft / 24)));
}

function syncAdviserFlags(doc) {
  if (doc.adviserId && !doc.adviser) doc.adviser = true;
  if (doc.coAdviserId && !doc.coAdviser) doc.coAdviser = true;
}

function computeRevisionNumber(doc) {
  if (!doc.isRevesion) return;
  const revCount = (doc.titleUrlTracking || []).filter((t) => t.action === 'revision').length;
  doc.revisionNumber = Math.max(1, revCount + 1);
  if (!doc.revisionRequestedAt) doc.revisionRequestedAt = new Date();
}

// ============================================================
// PRE-SAVE
// ============================================================
ProposedTitleSchema.pre('save', async function (next) {
  try {
    if (!this.topicCode) {
      try {
        this.topicCode = await this.constructor.generateTopicCode(new Date().getFullYear());
      } catch (err) {
        console.warn('topicCode generation failed:', err.message);
      }
    }

    syncAdviserFlags(this);
    computeRubricScores(this);
    computePriority(this);
    syncCompletionFlags(this);
    applyRevisionFlag(this, this.status);
    computeRevisionNumber(this);
    syncChapterLock(this);

    if (this._skipStatusResolve) {
      return next();
    }

    if (isFinalState(this.status)) {
      if (this.status === 'Done') {
        this.isArchived = true;
        this.isSelected = false;
      } else if (this.status === 'Ready for Defense') {
        this.isSelected = true;
        this.isArchived = false;
      } else {
        this.isSelected = false;
        this.isArchived = false;
      }
      return next();
    }

    const resolved = resolveStatus(this);
    this.isSelected = resolved.isSelected;
    this.status = resolved.status;
    this.isArchived = resolved.isArchived;
    applyRevisionFlag(this, this.status);

    if (resolved.shouldDelete) {
      this._deleteGroupId = this.groupId;
    }

    next();
  } catch (err) {
    next(err);
  }
});

// ============================================================
// PRE-FINDONEANDUPDATE / PRE-UPDATEONE
// ============================================================
ProposedTitleSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();
  const set = getUpdateFields(update);

  const hasTrackingPush = update.$push && update.$push.titleUrlTracking;
  const hasTrackingSet = update.$set && update.$set.titleUrlTracking !== undefined;

  if (set.adviserId !== undefined && set.adviser === undefined) set.adviser = true;
  if (set.coAdviserId !== undefined && set.coAdviser === undefined) set.coAdviser = true;

  if (set.status !== undefined) {
    applyRevisionFlag(set, set.status);
  }

  if (this._skipStatusResolve) {
    if (hasTrackingPush || hasTrackingSet) {
      return this._syncCompletionAfterUpdate(set, hasTrackingPush, next);
    }
    return next();
  }

  if (set.status !== undefined && isFinalState(set.status)) {
    if (set.status === 'Done') {
      set.isArchived = true;
      set.isSelected = false;
    } else if (set.status === 'Ready for Defense') {
      set.isSelected = true;
      set.isArchived = false;
    } else {
      set.isSelected = false;
      set.isArchived = false;
    }
    if (hasTrackingPush || hasTrackingSet) {
      return this._syncCompletionAfterUpdate(set, hasTrackingPush, next);
    }
    return next();
  }

  const touchesApprovalFields =
    set.adviser !== undefined ||
    set.coAdviser !== undefined ||
    set.adviserReady !== undefined ||
    set.coAdviserReady !== undefined;

  const touchesStatus = set.status !== undefined;
  const touchesChapterProgression =
    set.chapterProgressionApprovals !== undefined ||
    set.completedChapters !== undefined;

  if (!touchesApprovalFields && !touchesStatus && !hasTrackingPush && !hasTrackingSet && !touchesChapterProgression) {
    return next();
  }

  this.model.findOne(query)
    .select('adviser coAdviser adviserReady coAdviserReady status groupId titleUrlTracking completedChapters isAllChaptersCompleted isRevesion chapterProgressionApprovals')
    .then((doc) => {
      if (!doc) return next();

      const nextState = {
        adviser: set.adviser !== undefined ? set.adviser : doc.adviser,
        coAdviser: set.coAdviser !== undefined ? set.coAdviser : doc.coAdviser,
        adviserReady: set.adviserReady !== undefined ? set.adviserReady : doc.adviserReady,
        coAdviserReady: set.coAdviserReady !== undefined ? set.coAdviserReady : doc.coAdviserReady,
        status: set.status !== undefined ? set.status : doc.status
      };

      const resolved = resolveStatus(nextState);
      update.status = resolved.status;
      update.isSelected = resolved.isSelected;
      update.isArchived = resolved.isArchived;

      if (isRevisionStatus(resolved.status)) {
        set.isRevesion = true;
      }

      if (resolved.shouldDelete) {
        this._deleteGroupId = doc.groupId;
        this._deleteDocId = doc._id;
      }

      if (hasTrackingPush || hasTrackingSet) {
        return this._syncCompletionAfterUpdate(set, hasTrackingPush, next, doc);
      }

      next();
    })
    .catch(next);
});

ProposedTitleSchema.methods._syncCompletionAfterUpdate = function (set, hasTrackingPush, next, existingDoc) {
  const model = this.model;
  const query = this.getQuery();

  model.findOne(query)
    .select('titleUrlTracking chapterProgressionApprovals')
    .then((doc) => {
      if (!doc) return next();

      let finalTracking = [...(doc.titleUrlTracking || [])];

      if (hasTrackingPush) {
        const pushed = this.getUpdate().$push.titleUrlTracking;
        if (Array.isArray(pushed)) finalTracking.push(...pushed);
        else finalTracking.push(pushed);
      }

      if (set.titleUrlTracking !== undefined) {
        finalTracking = set.titleUrlTracking;
      }

      const completedSet = new Set();
      finalTracking.forEach((t) => {
        if (t.isCompleted === true && t.chapter) {
          completedSet.add(t.chapter);
        }
      });

      set.completedChapters = Array.from(completedSet);
      set.isAllChaptersCompleted = REQUIRED_CHAPTERS.every((ch) => completedSet.has(ch));

      // Recompute chapter lock
      const approvalsSource =
        set.chapterProgressionApprovals !== undefined
          ? set.chapterProgressionApprovals
          : doc.chapterProgressionApprovals;

      let approvalsObj = {};
      if (approvalsSource instanceof Map) {
        for (const [k, v] of approvalsSource.entries()) approvalsObj[k] = v;
      } else if (approvalsSource) {
        Object.assign(approvalsObj, approvalsSource);
      }

      const lockResult = ProposedTitleSchema.statics.computeChapterLock(
        set.completedChapters,
        approvalsObj
      );

      set.nextAllowedChapter = lockResult.nextAllowedChapter;
      set.lockedChapters = lockResult.lockedChapters;

      next();
    })
    .catch(next);
};

ProposedTitleSchema.post('findOneAndUpdate', function (doc, next) {
  if (!this._deleteGroupId || !this._deleteDocId) return next();
  deleteOtherTitles(this.model, this._deleteGroupId, this._deleteDocId)
    .then(() => next())
    .catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
});

ProposedTitleSchema.pre('updateOne', function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();
  const set = getUpdateFields(update);

  const hasTrackingPush = update.$push && update.$push.titleUrlTracking;
  const hasTrackingSet = update.$set && update.$set.titleUrlTracking !== undefined;

  if (set.adviserId !== undefined && set.adviser === undefined) set.adviser = true;
  if (set.coAdviserId !== undefined && set.coAdviser === undefined) set.coAdviser = true;

  if (set.status !== undefined) {
    applyRevisionFlag(set, set.status);
  }

  if (this._skipStatusResolve) {
    if (hasTrackingPush || hasTrackingSet) {
      return this._syncCompletionAfterUpdate(set, hasTrackingPush, next);
    }
    return next();
  }

  if (set.status !== undefined && isFinalState(set.status)) {
    if (set.status === 'Done') {
      set.isArchived = true;
      set.isSelected = false;
    } else if (set.status === 'Ready for Defense') {
      set.isSelected = true;
      set.isArchived = false;
    } else {
      set.isSelected = false;
      set.isArchived = false;
    }
    if (hasTrackingPush || hasTrackingSet) {
      return this._syncCompletionAfterUpdate(set, hasTrackingPush, next);
    }
    return next();
  }

  const touchesApprovalFields =
    set.adviser !== undefined ||
    set.coAdviser !== undefined ||
    set.adviserReady !== undefined ||
    set.coAdviserReady !== undefined;

  const touchesStatus = set.status !== undefined;
  const touchesChapterProgression =
    set.chapterProgressionApprovals !== undefined ||
    set.completedChapters !== undefined;

  if (!touchesApprovalFields && !touchesStatus && !hasTrackingPush && !hasTrackingSet && !touchesChapterProgression) {
    return next();
  }

  this.model.findOne(query)
    .select('adviser coAdviser adviserReady coAdviserReady status groupId titleUrlTracking isRevesion chapterProgressionApprovals')
    .then((doc) => {
      if (!doc) return next();

      const nextState = {
        adviser: set.adviser !== undefined ? set.adviser : doc.adviser,
        coAdviser: set.coAdviser !== undefined ? set.coAdviser : doc.coAdviser,
        adviserReady: set.adviserReady !== undefined ? set.adviserReady : doc.adviserReady,
        coAdviserReady: set.coAdviserReady !== undefined ? set.coAdviserReady : doc.coAdviserReady,
        status: set.status !== undefined ? set.status : doc.status
      };

      const resolved = resolveStatus(nextState);
      set.status = resolved.status;
      set.isSelected = resolved.isSelected;
      set.isArchived = resolved.isArchived;

      if (isRevisionStatus(resolved.status)) {
        set.isRevesion = true;
      }

      if (resolved.shouldDelete) {
        this._deleteGroupId = doc.groupId;
        this._deleteDocId = doc._id;
      }

      if (hasTrackingPush || hasTrackingSet) {
        return this._syncCompletionAfterUpdate(set, hasTrackingPush, next, doc);
      }

      next();
    })
    .catch(next);
});

ProposedTitleSchema.post('updateOne', function (result, next) {
  if (!this._deleteGroupId || !this._deleteDocId) return next();
  deleteOtherTitles(this.model, this._deleteGroupId, this._deleteDocId)
    .then(() => next())
    .catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
});

ProposedTitleSchema.post('save', function (doc, next) {
  if (!this._deleteGroupId || !doc._id) return next();
  deleteOtherTitles(this.constructor, this._deleteGroupId, doc._id)
    .then(() => next())
    .catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
});

// ============================================================
// INSTANCE METHODS
// ============================================================
ProposedTitleSchema.methods.addReview = function ({ reviewerId, decision, feedback, scores }) {
  const already = this.reviewedBy.find((r) => r.reviewerId.toString() === reviewerId.toString());
  if (already) {
    already.decision = decision;
    already.feedback = feedback;
    already.scores = { ...already.scores, ...scores };
    already.reviewedAt = new Date();
  } else {
    this.reviewedBy.push({
      reviewerId,
      decision,
      feedback,
      scores,
      reviewedAt: new Date(),
    });
  }
  return this.save();
};

ProposedTitleSchema.methods.assignReviewer = function (userId) {
  const exists = this.assignedReviewers.some((id) => id.toString() === userId.toString());
  if (!exists) this.assignedReviewers.push(userId);
  return this.save();
};

ProposedTitleSchema.methods.completeObjective = function (objectiveId) {
  const obj = this.objectives.id(objectiveId);
  if (obj) {
    obj.isCompleted = true;
    obj.completedAt = new Date();
  }
  return this.save();
};

/**
 * ⭐NEW: Proceed chapter to next (Subject Instructor only)
 * Sets approval flag, unlocks next chapter
 */
ProposedTitleSchema.methods.proceedChapter = function (chapter, instructorId, feedback = '') {
  if (!SEQUENTIAL_CHAPTERS.includes(chapter)) {
    throw new Error(`Invalid chapter: ${chapter}. Must be one of: ${SEQUENTIAL_CHAPTERS.join(', ')}`);
  }

  // 1. Mark chapter approval
  if (!(this.chapterProgressionApprovals instanceof Map)) {
    this.chapterProgressionApprovals = new Map(Object.entries(this.chapterProgressionApprovals || {}));
  }
  this.chapterProgressionApprovals.set(chapter, true);

  if (!(this.chapterProgressionApprovedBy instanceof Map)) {
    this.chapterProgressionApprovedBy = new Map(Object.entries(this.chapterProgressionApprovedBy || {}));
  }
  this.chapterProgressionApprovedBy.set(chapter, instructorId);

  if (!(this.chapterProgressionApprovedAt instanceof Map)) {
    this.chapterProgressionApprovedAt = new Map(Object.entries(this.chapterProgressionApprovedAt || {}));
  }
  this.chapterProgressionApprovedAt.set(chapter, new Date());

  // 2. Auto-unlock next chapter
  const idx = SEQUENTIAL_CHAPTERS.indexOf(chapter);
  if (idx >= 0 && idx + 1 < SEQUENTIAL_CHAPTERS.length) {
    const nextChapter = SEQUENTIAL_CHAPTERS[idx + 1];
    this.chapterProgressionApprovals.set(nextChapter, true);
  }

  // 3. Recompute lock
  const approvalsObj = {};
  for (const [k, v] of this.chapterProgressionApprovals.entries()) {
    approvalsObj[k] = v;
  }
  const lockResult = ProposedTitleSchema.statics.computeChapterLock(
    this.completedChapters || [],
    approvalsObj
  );
  this.nextAllowedChapter = lockResult.nextAllowedChapter;
  this.lockedChapters = lockResult.lockedChapters;

  return this.save();
};

// ============================================================
// EXPORT
// ============================================================
module.exports = mongoose.model('ProposedTitle', ProposedTitleSchema);