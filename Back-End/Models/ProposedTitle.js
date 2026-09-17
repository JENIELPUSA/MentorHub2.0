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
      enum: ['Pending', 'Approved', 'Rejected', 'Revision','ready'],
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
          enum: ['create', 'revision', 'update'],
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
    }
  },
  { timestamps: true }
);

// MIDDLEWARE: Pre-save middleware to automatically set isSelected and status
ProposedTitleSchema.pre('save', function (next) {
  // If both adviser and coAdviser are true, set isSelected to true and status to Approved
  if (this.adviser === true && this.coAdviser === true) {
    this.isSelected = true;
    this.status = 'Approved'; // Auto-set status to Approved
  } else {
    this.isSelected = false;
    // If status is Approved but not both are true, keep it as Approved
    // (this handles the case where one already approved)
    if (this.status === 'Approved') {
      // Keep as Approved (waiting for the other)
    } else {
      // Otherwise keep current status or default to Pending
      this.status = this.status || 'Pending';
    }
  }

  // Store groupId and id for post-save deletion
  if (this.adviser === true && this.coAdviser === true) {
    this._groupId = this.groupId;
    this._currentDocId = this._id;
  }

  next();
});

// MIDDLEWARE: Pre-findOneAndUpdate middleware for update operations
ProposedTitleSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();

  // Check if adviser and coAdviser are being updated
  if (update.adviser !== undefined || update.coAdviser !== undefined) {
    // Get the current document to check both values
    this.model.findOne(query).then((doc) => {
      if (doc) {
        const adviser = update.adviser !== undefined ? update.adviser : doc.adviser;
        const coAdviser = update.coAdviser !== undefined ? update.coAdviser : doc.coAdviser;

        // Set isSelected based on both values
        if (adviser === true && coAdviser === true) {
          update.isSelected = true;
          update.status = 'Approved'; // Auto-set status to Approved

          // Store the groupId and current document ID for deletion
          this._groupId = doc.groupId;
          this._currentDocId = doc._id;
        } else {
          update.isSelected = false;

          // If both are not true, but status is being updated to Approved,
          // keep it as Approved (waiting for other approval)
          if (update.status !== 'Rejected' && update.status !== 'Revision') {
            // Don't change status if it's already Approved
            if (doc.status === 'Approved') {
              // Keep as Approved (waiting for the other)
            } else if (adviser === true || coAdviser === true) {
              // If one is true, set status to Approved (waiting for the other)
              update.status = 'Approved';
            }
          }
        }
      }
      next();
    }).catch(next);
  } else {
    // If status is being updated directly, check if it should be Approved
    if (update.status) {
      this.model.findOne(query).then((doc) => {
        if (doc) {
          const adviser = doc.adviser;
          const coAdviser = doc.coAdviser;

          // If both are true, force status to Approved
          if (adviser === true && coAdviser === true) {
            update.status = 'Approved';
            update.isSelected = true;
          }
        }
        next();
      }).catch(next);
    } else {
      next();
    }
  }
});

// POST-UPDATE: Delete other titles in the same group
ProposedTitleSchema.post('findOneAndUpdate', function (doc, next) {
  // If this was an approval (isSelected became true), delete other pending titles
  if (this._groupId && this._currentDocId) {
    const groupId = this._groupId;
    const currentDocId = this._currentDocId;

    // Delete all other titles in the same group that are not Approved and not the current one
    this.model.deleteMany({
      groupId: groupId,
      _id: { $ne: currentDocId },
      status: { $in: ['Pending', 'Revision'] } // Delete only Pending and Revision statuses
    }).then((result) => {
      console.log(`Deleted ${result.deletedCount} other titles in group ${groupId} after approval`);
      next();
    }).catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
  } else {
    next();
  }
});

// OPTIONAL: Pre-update middleware for updateOne and updateMany
ProposedTitleSchema.pre('updateOne', function (next) {
  const update = this.getUpdate();
  const query = this.getQuery();

  if (update.adviser !== undefined || update.coAdviser !== undefined) {
    this.model.findOne(query).then((doc) => {
      if (doc) {
        const adviser = update.adviser !== undefined ? update.adviser : doc.adviser;
        const coAdviser = update.coAdviser !== undefined ? update.coAdviser : doc.coAdviser;

        if (adviser === true && coAdviser === true) {
          update.isSelected = true;
          update.status = 'Approved'; // Auto-set status to Approved
        } else {
          update.isSelected = false;
        }
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// POST-SAVE: Delete other titles in the same group
ProposedTitleSchema.post('save', function (doc, next) {
  // If this was an approval (isSelected became true), delete other pending titles
  if (this._groupId && this._currentDocId) {
    const groupId = this._groupId;
    const currentDocId = this._currentDocId;

    // Use the model to delete other titles in the same group
    this.constructor.deleteMany({
      groupId: groupId,
      _id: { $ne: currentDocId },
      status: { $in: ['Pending', 'Revision'] } // Delete only Pending and Revision statuses
    }).then((result) => {
      console.log(`Deleted ${result.deletedCount} other titles in group ${groupId} after saving new approved title`);
      next();
    }).catch((error) => {
      console.error('Error deleting other titles:', error);
      next();
    });
  } else {
    next();
  }
});

module.exports = mongoose.model('ProposedTitle', ProposedTitleSchema);