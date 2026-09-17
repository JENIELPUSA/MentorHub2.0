const mongoose = require("mongoose");

const QMScornerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    description: {
      type: String,
      required: false, // Optional field
      trim: true,
      default: "",
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: ["Citizen Character", "5S", "QMS corner", "GAD Corner"],
        message: "Category must be one of: Citizen Character, 5S, QMS corner, GAD Corner"
      },
      default: "QMS corner"
    },

    subtitle: [
      {
        subtitle: {
          type: String,
          required: [true, "Subtitle is required"],
          trim: true,
        },
        googleLink: {
          type: String,
          required: [true, "Google Link is required"],
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QmsCorner", QMScornerSchema);