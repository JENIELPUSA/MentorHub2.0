const mongoose = require('mongoose');
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        proposedTitleId: {
            type: Schema.Types.ObjectId,
            ref: 'ProposedTitle',
            required: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'UserLoginSchema',
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Comment', CommentSchema);