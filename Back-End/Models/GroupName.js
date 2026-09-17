// models/Group.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const GroupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    referralCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserLoginSchema'
      }
    ],
    adviserId: {
      type: Schema.Types.ObjectId,
      ref: 'UserLoginSchema',
      default: null
    },
    coadviserId: {
      type: Schema.Types.ObjectId,
      ref: 'UserLoginSchema',
      default: null
    },
    adviserStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'removed'],
      default: 'pending'
    },
    coadviserStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'removed'],
      default: 'pending'
    },
    approvedTitleId: {
      type: Schema.Types.ObjectId,
      ref: 'ProposedTitle',
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

GroupSchema.pre('validate', function (next) {
  if (this.adviserId && this.coadviserId &&
    this.adviserId.toString() === this.coadviserId.toString()) {
    return next(new Error('Adviser and Co-adviser cannot be the same person in the same group'));
  }
  next();
});

GroupSchema.pre('save', async function (next) {
  if (this.adviserId && this.coadviserId &&
    this.adviserId.toString() === this.coadviserId.toString()) {
    return next(new Error('Adviser and Co-adviser cannot be the same person in the same group'));
  }

  if (!this.referralCode) {
    try {
      this.referralCode = await generateUniqueReferralCode();
    } catch (error) {
      return next(error);
    }
  }

  next();
});

GroupSchema.pre('findOneAndUpdate', async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (!doc) {
    return next(new Error('Group not found'));
  }

  const update = this.getUpdate();
  const adviserId = update.adviserId !== undefined ? update.adviserId : doc.adviserId;
  const coadviserId = update.coadviserId !== undefined ? update.coadviserId : doc.coadviserId;

  if (adviserId && coadviserId && adviserId.toString() === coadviserId.toString()) {
    return next(new Error('Adviser and Co-adviser cannot be the same person in the same group'));
  }

  next();
});

async function generateUniqueReferralCode() {
  const Group = mongoose.model('Group');
  let referralCode;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    referralCode = generateRandomCode(8);
    const existingGroup = await Group.findOne({ referralCode });
    if (!existingGroup) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique referral code after multiple attempts');
  }

  return referralCode;
}

function generateRandomCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

GroupSchema.virtual('memberCount').get(function () {
  return this.members ? this.members.length : 0;
});

GroupSchema.virtual('mentorCount').get(function () {
  let count = 0;
  if (this.adviserId) count++;
  if (this.coadviserId) count++;
  return count;
});

GroupSchema.methods.addMember = async function (userId) {
  if (!this.members.includes(userId)) {
    this.members.push(userId);
    return this.save();
  }
  return this;
};

GroupSchema.methods.removeMember = async function (userId) {
  this.members = this.members.filter(member => member.toString() !== userId.toString());
  return this.save();
};

GroupSchema.methods.isMember = function (userId) {
  return this.members.some(member => member.toString() === userId.toString());
};

GroupSchema.methods.regenerateReferralCode = async function () {
  const newCode = await generateUniqueReferralCode();
  this.referralCode = newCode;
  await this.save();
  return newCode;
};

GroupSchema.statics.findByReferralCode = async function (referralCode) {
  return this.findOne({ referralCode: referralCode.toUpperCase().trim() });
};

GroupSchema.statics.getGroupsWithMemberCount = async function (filter = {}) {
  return this.aggregate([
    { $match: filter },
    {
      $project: {
        name: 1,
        referralCode: 1,
        sectionId: 1,
        createdAt: 1,
        updatedAt: 1,
        memberCount: { $size: '$members' },
        mentorCount: {
          $add: [
            { $cond: [{ $ifNull: ['$adviserId', false] }, 1, 0] },
            { $cond: [{ $ifNull: ['$coadviserId', false] }, 1, 0] }
          ]
        }
      }
    }
  ]);
};

GroupSchema.statics.getActiveGroupsBySection = async function (sectionId) {
  return this.find({
    sectionId
  }).populate('members', 'name email');
};

GroupSchema.index({ referralCode: 1 }, { unique: true });
GroupSchema.index({ sectionId: 1 });
GroupSchema.index({ adviserId: 1 });
GroupSchema.index({ coadviserId: 1 });

module.exports = mongoose.model('Group', GroupSchema);