// Hna hn7dd shkl el report ely MongoDB hi3mlo save b3d ma el AI y3ml ll report generate.

const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    childId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },

    childName: {
      type: String,
      required: true,
    },

    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Case",
      default: null,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    doctorName: {
      type: String,
      default: "Not assigned",
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    requestedByRole: {
      type: String,
      enum: ["parent", "doctor"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    analysisCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    statistics: {
      modalityCounts: {
        text: {
          type: Number,
          min: 0,
          default: 0,
        },
        image: {
          type: Number,
          min: 0,
          default: 0,
        },
        voice: {
          type: Number,
          min: 0,
          default: 0,
        },
      },

      emotionCounts: {
        angry: {
          type: Number,
          min: 0,
          default: 0,
        },
        disgust: {
          type: Number,
          min: 0,
          default: 0,
        },
        fear: {
          type: Number,
          min: 0,
          default: 0,
        },
        happy: {
          type: Number,
          min: 0,
          default: 0,
        },
        neutral: {
          type: Number,
          min: 0,
          default: 0,
        },
        sad: {
          type: Number,
          min: 0,
          default: 0,
        },
        surprise: {
          type: Number,
          min: 0,
          default: 0,
        },
        unknown: {
          type: Number,
          min: 0,
          default: 0,
        },
      },

      dominantEmotion: {
        type: String,
        enum: [
          "angry",
          "disgust",
          "fear",
          "happy",
          "neutral",
          "sad",
          "surprise",
          "unknown",
          "mixed",
        ],
        default: "unknown",
      },

      averageConfidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      reliableCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      unreliableCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      recurringPatterns: {
        type: [String],
        default: [],
      },
    },

    summary: {
      type: String,
      required: true,
    },

    report: {
      type: String,
      required: true,
    },

    recommendations: {
      type: [String],
      default: [],
    },

    overallStatus: {
      type: String,
      enum: ["stable", "improving", "needs_attention", "insufficient_data"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

ReportSchema.index({
  childId: 1,
  createdAt: -1,
});

ReportSchema.index({
  requestedBy: 1,
  createdAt: -1,
});

module.exports = mongoose.model("Report", ReportSchema);
