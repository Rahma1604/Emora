
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  /* =========================
     Basic Account Information
  ========================= */

  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["parent", "doctor", "admin"],
    default: "parent",
  },

  profilePic: {
    type: String,
    default: "",
  },

  phone: {
    type: String,
    trim: true,
    default: "",
  },

  city: {
    type: String,
    trim: true,
    default: "",
  },

  bio: {
    type: String,
    trim: true,
    maxlength: 500,
    default: "",
  },

  /* =========================
     Email Verification
  ========================= */

  isVerified: {
    type: Boolean,
    default: false,
  },

  verificationCode: {
    type: String,
    default: null,
  },

  /* =========================
     Password Reset
  ========================= */

  resetPasswordToken: {
    type: String,
    default: null,
  },

  resetPasswordExpires: {
    type: Date,
    default: null,
  },

  /* =========================
     Doctor Verification Status
  ========================= */

  verificationStatus: {
    type: String,
    enum: [
      "not_started",
      "draft",
      "pending",
      "approved",
      "rejected",
    ],
    default: "pending",
  },

  verificationStep: {
    type: String,
    enum: [
      "intro",
      "professional-info",
      "documents",
      "review",
      "submitted",
    ],
    default: "intro",
  },

  rejectionReason: {
    type: String,
    trim: true,
    default: "",
  },

  verificationSubmittedAt: {
    type: Date,
    default: null,
  },

  approvedAt: {
    type: Date,
    default: null,
  },

  /* =========================
     Doctor Professional Info
  ========================= */

  nationalIdNumber: {
    type: String,
    trim: true,
    default: "",
  },

  professionalType: {
    type: String,
    trim: true,
    default: "Child Psychiatrist",
  },

  specialization: {
    type: String,
    trim: true,
    default: "",
  },

  practiceLicenseNumber: {
    type: String,
    trim: true,
    default: "",
  },

  syndicateRegistrationNumber: {
    type: String,
    trim: true,
    default: "",
  },

  university: {
    type: String,
    trim: true,
    default: "",
  },

  graduationYear: {
    type: Number,
    default: null,
  },

  yearsOfExperience: {
    type: Number,
    default: null,
    min: 0,
  },

  /* =========================
     Doctor Document URLs
  ========================= */

  doctorDocuments: {
    nationalIdFront: {
      type: String,
      default: "",
    },

    nationalIdBack: {
      type: String,
      default: "",
    },

    syndicateCardFront: {
      type: String,
      default: "",
    },

    syndicateCardBack: {
      type: String,
      default: "",
    },

    graduationCertificate: {
      type: String,
      default: "",
    },

    specializationCertificate: {
      type: String,
      default: "",
    },

    practiceLicense: {
      type: String,
      default: "",
    },

    recentSelfie: {
      type: String,
      default: "",
    },
  },

  /* =========================
     Admin Document Decisions
  ========================= */

  documentsVerification: {
    nationalIdFront: {
      type: Boolean,
      default: false,
    },

    nationalIdBack: {
      type: Boolean,
      default: false,
    },

    syndicateCardFront: {
      type: Boolean,
      default: false,
    },

    syndicateCardBack: {
      type: Boolean,
      default: false,
    },

    graduationCertificate: {
      type: Boolean,
      default: false,
    },

    specializationCertificate: {
      type: Boolean,
      default: false,
    },

    practiceLicense: {
      type: Boolean,
      default: false,
    },

    recentSelfie: {
      type: Boolean,
      default: false,
    },
  },

  /* =========================
     Admin Document Notes
  ========================= */

  documentNotes: {
    nationalIdFront: {
      type: String,
      default: "",
    },

    nationalIdBack: {
      type: String,
      default: "",
    },

    syndicateCardFront: {
      type: String,
      default: "",
    },

    syndicateCardBack: {
      type: String,
      default: "",
    },

    graduationCertificate: {
      type: String,
      default: "",
    },

    specializationCertificate: {
      type: String,
      default: "",
    },

    practiceLicense: {
      type: String,
      default: "",
    },

    recentSelfie: {
      type: String,
      default: "",
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);

