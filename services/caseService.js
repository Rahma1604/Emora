const Case = require('../models/Case');
const mongoose = require('mongoose');

async function updateCaseWithAIResults(childId, doctorId, aiData) {
    const { diagnostic_result, text_analysis, analyses, patterns } = aiData;
    
    const avgConfidence = analyses?.reduce((acc, curr) => acc + (curr.confidence || 0), 0) / (analyses?.length || 1);
    let priority = avgConfidence >= 75 ? 'High' : (avgConfidence >= 40 ? 'Medium' : 'Low');

    const updatedCase = await Case.findOneAndUpdate(
        { childId: new mongoose.Types.ObjectId(childId), doctorId },
        { 
            $set: { 
                aiDiagnosis: diagnostic_result?.diagnosis || "تحت المتابعة",
                aiSummary: text_analysis?.content || "no summary",
                dominantEmotion: text_analysis?.emotion || "غير محدد",
                emotionPercentage: avgConfidence,
                priority: priority,
                lastAnalysisDate: new Date()
            },
            $inc: { entriesCount: 1 },
            $addToSet: { recurringPatterns: { $each: patterns || [] } }, 
            $push: { 
                analysisTimeline: {
                    diagnosis: diagnostic_result?.diagnosis || "تحت المتابعة",
                    emotion: text_analysis?.emotion || "غير محدد",
                    confidence: avgConfidence,
                    date: new Date()
                },
                emotionalTrend: {
                    week: `W${Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
                    emotion: text_analysis?.emotion || "None",
                    value: avgConfidence
                }
            }
        },
        { upsert: true, new: true }
    );
    
    return updatedCase;
}
module.exports = { updateCaseWithAIResults };