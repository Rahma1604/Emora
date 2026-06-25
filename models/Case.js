const mongoose = require('mongoose');

const CaseSchema = new mongoose.Schema({
   doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'closed'], default: 'pending' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
childProgress: { 
    type: String, 
    enum: ['improving', 'stable', 'needs attention', 'no enough data yet'], 
    default: 'no enough data yet' 
},

    drawings: [{
        imageUrl: String,
        analysisResult: String,
        createdAt: { type: Date, default: Date.now }
    }],
    textAnalyses: [{
        content: String,
        analysisResult: String,
        createdAt: { type: Date, default: Date.now }
    }],

    entriesCount: { type: Number, default: 0 },
    lastAnalysisDate: { type: Date },
    dominantEmotion: { type: String },
    emotionPercentage: { type: Number },

    aiDiagnosis: String,
    aiSummary: String, 
    doctorRecommendation: String,

    emotionalTrend: [{ 
        week: String, 
        emotion: String,
        value: Number   
    }],
    frequentEmotions: [{
        label: String, 
        percentage: Number
    }],
    recurringPatterns: [String],
    
    doctorRecommendations: [{ 
        date: { type: Date, default: Date.now },
        note: String
    }],

    analysisTimeline: [{
        type: String, 
        date: Date, 
        status: String 
    }],

    images: [String], 
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Case', CaseSchema);