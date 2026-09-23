const mongoose = require('mongoose');
const { Schema } = mongoose;

const FormatSchema = new Schema(
    {
        titleFormat: {
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
        type: {
            type: String,
            enum: ['Capstone', 'Thesis'],
            default: 'Capstone'
        },
        uploadedBy: {
            type: Schema.Types.ObjectId,
            ref: 'UserLoginSchema',
            required: true
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Format', FormatSchema);