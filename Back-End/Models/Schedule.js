const mongoose = require('mongoose');

// ============================================================
// SUB-SCHEMA: Time Range (start + end lang, walang label)
// ============================================================
const timeRangeSchema = new mongoose.Schema(
    {
        start: { type: String, required: true }, // "09:00" (24h format)
        end: { type: String, required: true }, // "11:00" (24h format)
    },
    { _id: false }
);

// ============================================================
// MAIN SCHEMA: Defense Assignment
// ============================================================
const defenseAssignmentSchema = new mongoose.Schema(
    {
        // ----- Date -----
        date: {
            type: String,          // "2026-09-15" (YYYY-MM-DD)
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
            index: true,
        },

        // ----- Location -----
        location: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        // ----- Time -----
        startTime: {
            type: String,          // "09:00"
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        endTime: {
            type: String,          // "11:00"
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        timeRange: {
            type: timeRangeSchema,
            required: true,
        },

        // ----- Groups (references) -----
        groupIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'At least one group is required.',
            },
        },

        // ----- Panelists (references) -----
        panelistIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: 'At least one panelist is required.',
            },
        },

        // ----- Metadata -----
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
    { timestamps: true } // createdAt, updatedAt
);

// ============================================================
// INDEXES
// ============================================================
defenseAssignmentSchema.index({ date: 1, startTime: 1 });
defenseAssignmentSchema.index({ groupIds: 1 });
defenseAssignmentSchema.index({ panelistIds: 1 });
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

// ✅ Virtual para sa 12-hour formatted display (para sa frontend)
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

// Ensure virtuals are included when converted to JSON
defenseAssignmentSchema.set('toJSON', { virtuals: true });
defenseAssignmentSchema.set('toObject', { virtuals: true });

// ============================================================
// STATIC METHODS
// ============================================================
defenseAssignmentSchema.statics.findByDate = function (date) {
    return this.find({ date }).populate('groupIds').populate('panelistIds');
};

defenseAssignmentSchema.statics.findByGroup = function (groupId) {
    return this.find({ groupIds: groupId }).sort({ date: 1, startTime: 1 });
};

defenseAssignmentSchema.statics.findByPanelist = function (panelistId) {
    return this.find({ panelistIds: panelistId }).sort({ date: 1, startTime: 1 });
};

defenseAssignmentSchema.statics.findUpcoming = function (limit = 10) {
    const today = new Date().toISOString().slice(0, 10);
    return this.find({ date: { $gte: today }, status: { $ne: 'cancelled' } })
        .sort({ date: 1, startTime: 1 })
        .limit(limit)
        .populate('groupIds')
        .populate('panelistIds');
};

// ============================================================
// INSTANCE METHODS
// ============================================================
defenseAssignmentSchema.methods.conflictWith = function (other) {
    if (this.date !== other.date) return false;

    const overlap = this.startTime < other.endTime && this.endTime > other.startTime;
    if (!overlap) return false;

    const sharedGroups = this.groupIds.some((g) =>
        other.groupIds.map(String).includes(String(g))
    );
    const sharedPanelists = this.panelistIds.some((p) =>
        other.panelistIds.map(String).includes(String(p))
    );

    return sharedGroups || sharedPanelists;
};

// ============================================================
// EXPORT
// ============================================================
module.exports = mongoose.model('DefenseAssignment', defenseAssignmentSchema);