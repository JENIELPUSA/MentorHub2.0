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
      enum: ['Pending', 'Approved', 'Rejected', 'Revision', 'Ready for Defense', 'Done'],
      default: 'Pending'
    },
    remarks: {
      type: String,
      default: ''
    },
    titleUrlTracking: [
      {
        _id: false,
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
// ⭐ INDEX: Para mabilis ang queries at deleteMany
// ============================================================
ProposedTitleSchema.index({ groupId: 1, status: 1 });

function resolveStatus(doc) {
  const currentStatus = doc.status;

  // ⭐ FINAL STATES — huwag nang baguhin
  if (
    currentStatus === 'Ready for Defense' ||
    currentStatus === 'Rejected' ||
    currentStatus === 'Revision' ||
    currentStatus === 'Done'
  ) {
    return {
      status: currentStatus,                              // keep as is
      isSelected: currentStatus === 'Ready for Defense',  // ready = selected
      isArchived: currentStatus === 'Done',               // ⭐ Done = archived
      shouldDelete: false                                 // final = no delete
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
      shouldDelete: bothReady    // ⭐ delete lang kapag BOTH ready
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
  const resolved = resolveStatus(this);

  // ⭐ DONE: i-set ang isArchived = true
  if (this.status === 'Done') {
    this.isArchived = true;
    this.isSelected = false;
    return next();
  }

  // Huwag i-override ang Rejected/Revision (final states)
  if (this.status === 'Rejected' || this.status === 'Revision') {
    // Keep as is — pero kung may ready na, i-override pa rin
    if (resolved.status === 'Ready for Defense') {
      this.status = resolved.status;
      this.isSelected = resolved.isSelected;
    }
  } else {
    this.isSelected = resolved.isSelected;
    this.status = resolved.status;
    this.isArchived = resolved.isArchived;   // ⭐ IDINAGDAG
  }

  // Store groupId for post-save deletion
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

      // Build "next state" from current doc + update
      const nextState = {
        adviser: set.adviser !== undefined ? set.adviser : doc.adviser,
        coAdviser: set.coAdviser !== undefined ? set.coAdviser : doc.coAdviser,
        adviserReady: set.adviserReady !== undefined ? set.adviserReady : doc.adviserReady,
        coAdviserReady: set.coAdviserReady !== undefined ? set.coAdviserReady : doc.coAdviserReady,
        status: set.status !== undefined ? set.status : doc.status
      };

      // ⭐ DONE: i-set ang isArchived = true
      if (set.status === 'Done') {
        update.isArchived = true;
        update.isSelected = false;
        return next();
      }

      // ─── Rejected / Revision: huwag i-force ───
      if (set.status === 'Rejected' || set.status === 'Revision') {
        update.isSelected = false;
        return next();
      }

      // ─── Resolve base sa nextState ───
      const resolved = resolveStatus(nextState);

      update.status = resolved.status;
      update.isSelected = resolved.isSelected;
      update.isArchived = resolved.isArchived;   // ⭐ IDINAGDAG

      // ⭐ I-delete lang kapag BOTH ready (o both approved)
      if (resolved.shouldDelete) {
        this._deleteGroupId = doc.groupId;
        this._deleteDocId = doc._id;
      }

      next();
    })
    .catch(next);
});

// ============================================================
// POST-UPDATE: Delete other titles in same group
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

      // ⭐ DONE: i-set ang isArchived = true
      if (set.status === 'Done') {
        set.isArchived = true;
        set.isSelected = false;
        return next();
      }

      if (set.status === 'Rejected' || set.status === 'Revision') {
        set.isSelected = false;
        return next();
      }

      const resolved = resolveStatus(nextState);

      set.status = resolved.status;
      set.isSelected = resolved.isSelected;
      set.isArchived = resolved.isArchived;   // ⭐ IDINAGDAG

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
// POST-SAVE: Delete other titles in same group
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