<<<<<<< Updated upstream
const mongoose=require('mongoose');
const UserSchema=new mongoose.Schema({
    fullName:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    role:{type:String,enum:['parent','doctor', 'admin'],default:'parent'},
    
    verificationStatus:{type:String,
        enum:['pending', 'approved', 'rejected'],
        default: 'pending' 
    },
    isVerified: { type: Boolean, default: false }, 
    verificationCode: String,
=======
const mongoose = require("mongoose");
>>>>>>> Stashed changes

const UserSchema = new mongoose.Schema({
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
    enum: ["parent", "doctor"],
    default: "parent",
  },

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

  isVerified: {
    type: Boolean,
    default: false,
  },

  verificationCode: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
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

  resetPasswordToken: {
    type: String,
  },

  resetPasswordExpires: {
    type: Date,
  },

  nationalIdNumber: {
    type: String,
    trim: true,
  },

  professionalType: {
    type: String,
    default: "Child Psychiatrist",
    trim: true,
  },

  specialization: {
    type: String,
    trim: true,
  },

  practiceLicenseNumber: {
    type: String,
    trim: true,
  },

  syndicateRegistrationNumber: {
    type: String,
    trim: true,
  },

  university: {
    type: String,
    trim: true,
  },

  graduationYear: {
    type: Number,
  },

  yearsOfExperience: {
    type: Number,
  },

  doctorDocuments: {
    nationalIdFront: {
      type: String,
      default: "",
    },

    nationalIdBack: {
      type: String,
      default: "",
    },
<<<<<<< Updated upstream
verificationStep: { 
    type: String, 
    enum: ['intro', 'documents', 'review', 'submitted'], 
    default: 'intro' 
},
rejectionReason: { type: String, default: "" },
verificationSubmittedAt: { type: Date },
documentNotes: {
    nationalIdFront: { type: String, default: "" },
    nationalIdBack: { type: String, default: "" },
    syndicateCardFront: { type: String, default: "" },
    syndicateCardBack: { type: String, default: "" },
    graduationCertificate: { type: String, default: "" },
    specializationCertificate: { type: String, default: "" },
    practiceLicense: { type: String, default: "" },
    recentSelfie: { type: String, default: "" }
},
    approvedAt: { type: Date },


});

module.exports=mongoose.model('User',UserSchema);
=======

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

  verificationSubmittedAt: {
    type: Date,
  },

  approvedAt: {
    type: Date,
  },
});

module.exports = mongoose.model(
  "User",
  UserSchema
);
>>>>>>> Stashed changes
