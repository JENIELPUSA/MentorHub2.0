const mongoose = require('mongoose');
const { Schema } = mongoose;

const SubjectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'UserLoginSchema',
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', SubjectSchema);