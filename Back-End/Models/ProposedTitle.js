const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProposedTitleSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    fileUrl: {
      type: String,
      required: true
    },
    isSelected: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'for_schedule', 'Rejected', 'Revision', 'Ready for Defense', 'Done'],
      default: 'Pending'
    },
    remarks: {
      type: String,
      default: ''
    },
    titleUrlTracking: [
      {
        url: {
          type: String,
          required: true
        },
        date: {
          type: Date,
          default: Date.now
        },
        remarks: {
          type: String,
          default: ''
        },
        action: {
          type: String,
          enum: ['create', 'revision', 'update', 'ready for defense'],
          default: 'revision'
        }
      }
    ],
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserLogin',
      required: true
    },
    adviser: {
      type: Boolean,
      default: false
    },
    coAdviser: {
      type: Boolean,
      default: false
    },
    adviserReady: {
      type: Boolean,
      default: false
    },
    coAdviserReady: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
  },
  { timestamps: true }
);

// ============================================================
// ⭐ INDEX
// ============================================================
ProposedTitleSchema.index({ groupId: 1, status: 1 });

// ============================================================
// ⭐ FINAL / MANUAL STATES — hindi dadaan sa resolveStatus
//    (diretso update lang sa status)
// ============================================================
const FINAL_STATES = ['Ready for Defense', 'Rejected', 'Revision', 'Done', 'for_schedule'];

function isFinalState(status) {
  return FINAL_STATES.includes(status);
}

function resolveStatus(doc) {
  const currentStatus = doc.status;

  // ⭐ FINAL STATES — huwag nang baguhin
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

  // ─── Priority 1: MAY READY (isa o both) → Ready for Defense ───
  if (adviserReady || coAdviserReady) {
    const bothReady = adviserReady && coAdviserReady;

    return {
      status: 'Ready for Defense',
      isSelected: true,
      isArchived: false,
      shouldDelete: bothReady
    };
  }

  // ─── Priority 2: BOTH APPROVED → Approved ───
  if (adviser && coAdviser) {
    return {
      status: 'Approved',
      isSelected: true,
      isArchived: false,
      shouldDelete: true
    };
  }

  // ─── Priority 3: ISA LANG APPROVED → Approved (waiting) ───
  if (adviser || coAdviser) {
    return {
      status: 'Approved',
      isSelected: false,
      isArchived: false,
      shouldDelete: false
    };
  }

  // ─── Priority 4: Default ───
  return {
    status: 'Pending',
    isSelected: false,
    isArchived: false,
    shouldDelete: false
  };
}

// ============================================================
// ⭐ HELPER: Safe $set extraction
// ============================================================
function getUpdateFields(update) {
  return update.$set || update;
}

// ============================================================
// ⭐ HELPER: Common delete logic
// ============================================================
async function deleteOtherTitles(model, groupId, currentDocId) {
  const result = await model.deleteMany({
    groupId,
    _id: { $ne: currentDocId },
    status: { $in: ['Pending', 'Revision'] }
  });
  console.log(`Deleted ${result.deletedCount} other titles in group ${groupId}`);
  return result;
}

// ============================================================
// MIDDLEWARE: Pre-save
// ============================================================
ProposedTitleSchema.pre('save', function (next) {
  // ⭐ FINAL STATE (kasama na for_schedule) — diretso update lang
  if (isFinalState(this.status)) {
    if (this.status === 'Done') {
      this.isArchived = true;
      this.isSelected = false;
    } else if (this.status === 'Ready for Defense') {
      this.isSelected = true;
      this.isArchived = false;
    } else {
      // for_schedule, Rejected, Revision
      this.isSelected = false;
      this.isArchived = false;
    }
    return next();
  }

  // ─── Resolve base sa current fields ───
  const resolved = resolveStatus(this);

  this.isSelected = resolved.isSelected;
  this.status = resolved.status;
  this.isArchived = resolved.isArchived;

  if (resolved.shouldDelete) {
    this._deleteGroupId = this.groupId;
  }

  next();
});

// ============================================================
// MIDDLEWARE: Pre-findOneAndUpdate
// ============================================================
ProposedTitleSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();
  const set = getUpdateFields(update);

  // ⭐ FINAL STATE (kasama na for_schedule) — diretso update lang
  if (set.status !== undefined && isFinalState(set.status)) {
    if (set.status === 'Done') {
      set.isArchived = true;
      set.isSelected = false;
    } else if (set.status === 'Ready for Defense') {
      set.isSelected = true;
      set.isArchived = false;
    } else {
      // for_schedule, Rejected, Revision
      set.isSelected = false;
      set.isArchived = false;
    }
    return next();
  }

  const touchesApprovalFields =
    set.adviser !== undefined ||
    set.coAdviser !== undefined ||
    set.adviserReady !== undefined ||
    set.coAdviserReady !== undefined;

  const touchesStatus = set.status !== undefined;

  if (!touchesApprovalFields && !touchesStatus) {
    return next();
  }

  this.model.findOne(query)
    .select('adviser coAdviser adviserReady coAdviserReady status groupId')
    .then((doc) => {
      if (!doc) return next();

      const nextState = {
        adviser: set.adviser !== undefined ? set.adviser : doc.adviser,
        coAdviser: set.coAdviser !== undefined ? set.coAdviser : doc.coAdviser,
        adviserReady: set.adviserReady !== undefined ? set.adviserReady : doc.adviserReady,
        coAdviserReady: set.coAdviserReady !== undefined ? set.coAdviserReady : doc.coAdviserReady,
        status: set.status !== undefined ? set.status : doc.status
      };

      // ─── Resolve ───
      const resolved = resolveStatus(nextState);

      update.status = resolved.status;
      update.isSelected = resolved.isSelected;
      update.isArchived = resolved.isArchived;

      if (resolved.shouldDelete) {
        this._deleteGroupId = doc.groupId;
        this._deleteDocId = doc._id;
      }

      next();
    })
    .catch(next);
});

// ============================================================
// POST-UPDATE: Delete other titles
// ============================================================
ProposedTitleSchema.post('findOneAndUpdate', function (doc, next) {
  if (!this._deleteGroupId || !this._deleteDocId) return next();

  deleteOtherTitles(this.model, this._deleteGroupId, this._deleteDocId)
    .then(() => next())
    .catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
});

// ============================================================
// MIDDLEWARE: Pre-updateOne
// ============================================================
ProposedTitleSchema.pre('updateOne', function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();
  const set = getUpdateFields(update);

  // ⭐ FINAL STATE (kasama na for_schedule) — diretso update lang
  if (set.status !== undefined && isFinalState(set.status)) {
    if (set.status === 'Done') {
      set.isArchived = true;
      set.isSelected = false;
    } else if (set.status === 'Ready for Defense') {
      set.isSelected = true;
      set.isArchived = false;
    } else {
      // for_schedule, Rejected, Revision
      set.isSelected = false;
      set.isArchived = false;
    }
    return next();
  }

  const touchesApprovalFields =
    set.adviser !== undefined ||
    set.coAdviser !== undefined ||
    set.adviserReady !== undefined ||
    set.coAdviserReady !== undefined;

  const touchesStatus = set.status !== undefined;

  if (!touchesApprovalFields && !touchesStatus) return next();

  this.model.findOne(query)
    .select('adviser coAdviser adviserReady coAdviserReady status groupId')
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

      if (resolved.shouldDelete) {
        this._deleteGroupId = doc.groupId;
        this._deleteDocId = doc._id;
      }

      next();
    })
    .catch(next);
});

// ============================================================
// POST-UPDATE: Delete other titles (updateOne)
// ============================================================
ProposedTitleSchema.post('updateOne', function (result, next) {
  if (!this._deleteGroupId || !this._deleteDocId) return next();

  deleteOtherTitles(this.model, this._deleteGroupId, this._deleteDocId)
    .then(() => next())
    .catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
});

// ============================================================
// POST-SAVE: Delete other titles
// ============================================================
ProposedTitleSchema.post('save', function (doc, next) {
  if (!this._deleteGroupId || !doc._id) return next();

  deleteOtherTitles(this.constructor, this._deleteGroupId, doc._id)
    .then(() => next())
    .catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
});

module.exports = mongoose.model('ProposedTitle', ProposedTitleSchema);