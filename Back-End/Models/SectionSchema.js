const mongoose = require('mongoose');
const { Schema } = mongoose;

const SectionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    formatID: {
      type: Schema.Types.ObjectId,
      ref: 'Format'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', SectionSchema);