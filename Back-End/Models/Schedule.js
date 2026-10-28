const mongoose = require('mongoose');

// ============================================================
// SUB-SCHEMA: Time Range
// ============================================================
const timeRangeSchema = new mongoose.Schema(
    {
        start: { type: String, required: true },
        end: { type: String, required: true },
    },
    { _id: false }
);

// ============================================================
// SUB-SCHEMA: Panelist Entry (status + notes)
// ============================================================
const panelistEntrySchema = new mongoose.Schema(
    {
        panelistId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'rejected'],
            default: 'pending',
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
        respondedAt: {
            type: Date,
            default: null,
        },
    },
    { _id: false }
);

// ============================================================
// MAIN SCHEMA: Defense Assignment
// ============================================================
const defenseAssignmentSchema = new mongoose.Schema(
    {
        date: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
            index: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        startTime: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        endTime: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        timeRange: {
            type: timeRangeSchema,
            required: true,
        },
        groupIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'At least one group is required.',
            },
        },
        panelistIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'At least one panelist is required.',
            },
        },
        panelists: {
            type: [panelistEntrySchema],
            default: [],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
            default: 'scheduled',
        },
        remarks: {
            type: String,
            trim: true,
            maxlength: 500,
            default: '',
        },
    },
    { timestamps: true }
);

// ============================================================
// INDEXES
// ============================================================
defenseAssignmentSchema.index({ date: 1, startTime: 1 });
defenseAssignmentSchema.index({ groupIds: 1 });
defenseAssignmentSchema.index({ panelistIds: 1 });
defenseAssignmentSchema.index({ 'panelists.panelistId': 1 });
defenseAssignmentSchema.index({ 'panelists.status': 1 });
defenseAssignmentSchema.index({ status: 1, date: 1 });

// ============================================================
// VIRTUALS
// ============================================================
defenseAssignmentSchema.virtual('isUpcoming').get(function () {
    const now = new Date();
    const eventDate = new Date(`${this.date}T${this.startTime}:00`);
    return eventDate > now;
});

defenseAssignmentSchema.virtual('isToday').get(function () {
    const today = new Date().toISOString().slice(0, 10);
    return this.date === today;
});

defenseAssignmentSchema.virtual('timeRangeLabel').get(function () {
    const fmt = (t) => {
        if (!t) return '';
        const [hStr, mStr] = t.split(':');
        let h = parseInt(hStr, 10);
        const m = mStr || '00';
        const period = h >= 12 ? 'PM' : 'AM';
        if (h === 0) h = 12;
        else if (h > 12) h -= 12;
        return `${h}:${m} ${period}`;
    };
    return `${fmt(this.startTime)} - ${fmt(this.endTime)}`;
});

defenseAssignmentSchema.virtual('panelistSummary').get(function () {
    const list = this.panelists || [];
    const total = list.length;
    const confirmed = list.filter((p) => p.status === 'confirmed').length;
    const rejected = list.filter((p) => p.status === 'rejected').length;
    const pending = list.filter((p) => p.status === 'pending').length;

    return {
        total,
        confirmed,
        rejected,
        pending,
        isFullyConfirmed: total > 0 && confirmed === total,
        hasRejection: rejected > 0,
        allResponded: total > 0 && pending === 0,
    };
});

defenseAssignmentSchema.set('toJSON', { virtuals: true });
defenseAssignmentSchema.set('toObject', { virtuals: true });

// ============================================================
// STATIC METHODS
// ============================================================
defenseAssignmentSchema.statics.findByDate = function (date) {
    return this.find({ date })
        .populate('groupIds')
        .populate('panelistIds')
        .populate('panelists.panelistId', 'FirstName Middle LastName email');
};

defenseAssignmentSchema.statics.findByGroup = function (groupId) {
    return this.find({ groupIds: groupId })
        .sort({ date: 1, startTime: 1 })
        .populate('panelists.panelistId', 'FirstName Middle LastName email');
};

defenseAssignmentSchema.statics.findByPanelist = function (panelistId) {
    return this.find({ panelistIds: panelistId })
        .sort({ date: 1, startTime: 1 })
        .populate('panelists.panelistId', 'FirstName Middle LastName email');
};

defenseAssignmentSchema.statics.findUpcoming = function (limit = 10) {
    const today = new Date().toISOString().slice(0, 10);
    return this.find({ date: { $gte: today }, status: { $ne: 'cancelled' } })
        .sort({ date: 1, startTime: 1 })
        .limit(limit)
        .populate('groupIds')
        .populate('panelistIds')
        .populate('panelists.panelistId', 'FirstName Middle LastName email');
};

// ============================================================
// INSTANCE METHODS
// ============================================================
defenseAssignmentSchema.methods.conflictWith = function (other) {
    if (this.date !== other.date) return false;

    const overlap =
        this.startTime < other.endTime && this.endTime > other.startTime;
    if (!overlap) return false;

    const sharedGroups = this.groupIds.some((g) =>
        other.groupIds.map(String).includes(String(g))
    );
    const sharedPanelists = this.panelistIds.some((p) =>
        other.panelistIds.map(String).includes(String(p))
    );

    return sharedGroups || sharedPanelists;
};

// Confirm a panelist
defenseAssignmentSchema.methods.confirmPanelist = async function (
    panelistId,
    notes = ''
) {
    const target = this.panelists.find(
        (p) => String(p.panelistId) === String(panelistId)
    );
    if (!target) {
        throw new Error('Panelist not found in this defense assignment.');
    }
    target.status = 'confirmed';
    target.notes = notes || '';
    target.respondedAt = new Date();
    await this.save();
    return true;
};

// 🆕 Reject a panelist — REMOVES from panelistIds + panelists
defenseAssignmentSchema.methods.rejectPanelist = async function (
    panelistId,
    notes = ''
) {
    const targetIdStr = String(panelistId);

    // Check kung existing bago mag-remove
    const exists = this.panelists.some(
        (p) => String(p.panelistId) === targetIdStr
    );
    if (!exists) {
        throw new Error('Panelist not found in this defense assignment.');
    }

    // Prevent removing the last panelist
    if ((this.panelistIds || []).length <= 1) {
        throw new Error(
            'Cannot reject the last remaining panelist. Assign a replacement first.'
        );
    }

    // 🆕 Remove from panelistIds
    this.panelistIds = (this.panelistIds || []).filter(
        (id) => String(id) !== targetIdStr
    );

    // 🆕 Remove from panelists sub-array
    this.panelists = (this.panelists || []).filter(
        (p) => String(p.panelistId) !== targetIdStr
    );

    // Save
    await this.save();

    // Return removed info for logging/notification
    return {
        removedPanelistId: panelistId,
        notes: notes || '',
        removedAt: new Date(),
    };
};

// Reset panelist response (keep ID)
defenseAssignmentSchema.methods.resetPanelistResponse = async function (
    panelistId
) {
    const target = this.panelists.find(
        (p) => String(p.panelistId) === String(panelistId)
    );
    if (!target) {
        throw new Error('Panelist not found in this defense assignment.');
    }
    target.status = 'pending';
    target.notes = '';
    target.respondedAt = null;
    await this.save();
    return true;
};

// 🆕 Add a replacement panelist (para sa rejected na panelist)
defenseAssignmentSchema.methods.addPanelist = async function (panelistId) {
    const targetIdStr = String(panelistId);

    // Check if already exists
    if (
        (this.panelistIds || []).some(
            (id) => String(id) === targetIdStr
        )
    ) {
        throw new Error('Panelist already assigned to this defense.');
    }

    // Add to panelistIds
    this.panelistIds = [...(this.panelistIds || []), panelistId];

    // Add to panelists
    this.panelists = [
        ...(this.panelists || []),
        {
            panelistId,
            status: 'pending',
            notes: '',
            respondedAt: null,
        },
    ];

    await this.save();
    return true;
};

// ============================================================
// MIDDLEWARE — Auto-sync panelists from panelistIds
// ============================================================
defenseAssignmentSchema.pre('save', function (next) {
    if (this.isNew) {
        const existing = new Map(
            (this.panelists || []).map((p) => [String(p.panelistId), p])
        );
        this.panelists = (this.panelistIds || []).map((id) => {
            const found = existing.get(String(id));
            return found
                ? {
                      panelistId: id,
                      status: found.status || 'pending',
                      notes: found.notes || '',
                      respondedAt: found.respondedAt || null,
                  }
                : {
                      panelistId: id,
                      status: 'pending',
                      notes: '',
                      respondedAt: null,
                  };
        });
    } else if (this.isModified('panelistIds')) {
        // Keep only panelists na nasa panelistIds
        const existing = new Map(
            (this.panelists || []).map((p) => [String(p.panelistId), p])
        );
        this.panelists = (this.panelistIds || []).map((id) => {
            const found = existing.get(String(id));
            return found
                ? {
                      panelistId: id,
                      status: found.status || 'pending',
                      notes: found.notes || '',
                      respondedAt: found.respondedAt || null,
                  }
                : {
                      panelistId: id,
                      status: 'pending',
                      notes: '',
                      respondedAt: null,
                  };
        });
    }
    next();
});

// ============================================================
// EXPORT
// ============================================================
module.exports = mongoose.model('DefenseAssignment', defenseAssignmentSchema);