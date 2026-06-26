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

    createdAt:{type:Date,default:Date.now},
    profilePic: { type: String, default: "" },
    resetPasswordToken: String,
    resetPasswordExpires: Date,

nationalIdNumber: { type: String },             
    specialization: { type: String },                
    syndicateRegistrationNumber: { type: String },   
    university: { type: String },                   
    yearsOfExperience: { type: Number },
    doctorDocuments: {
        nationalIdFront: { type: String, default: "" },       
        nationalIdBack: { type: String, default: "" },       
        syndicateCardFront: { type: String, default: "" },   
        syndicateCardBack: { type: String, default: "" },   
        graduationCertificate: { type: String, default: "" }, 
        specializationCertificate: { type: String, default: "" },
        practiceLicense: { type: String, default: "" },      
        recentSelfie: { type: String, default: "" }           
    },
    documentsVerification: {
        nationalIdFront: { type: Boolean, default: false },
        nationalIdBack: { type: Boolean, default: false },
        syndicateCardFront: { type: Boolean, default: false },
        syndicateCardBack: { type: Boolean, default: false },
        graduationCertificate: { type: Boolean, default: false },
        specializationCertificate: { type: Boolean, default: false },
        practiceLicense: { type: Boolean, default: false },
        recentSelfie: { type: Boolean, default: false }
    },
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