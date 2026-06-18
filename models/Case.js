const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    childName: { type: String, required: true },
    childId: { type: String, required: true },
    childAge: { type: Number },
    status: { type: String, enum: ['pending', 'reviewed', 'closed', 'improving'], default: 'pending' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },

    entriesCount: { type: Number, default: 0 },
    lastAnalysisDate: { type: Date },
    dominantEmotion: { type: String },
    emotionPercentage: { type: Number },

    aiDiagnosis: String,
    aiSummary: String, 
    doctorRecommendation: String,
    
    images: [String], 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Case', CaseSchema);