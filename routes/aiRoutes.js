const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const mongoose = require('mongoose');
const Case = require('../models/Case');
const { checkToken } = require('../middleware/authMiddleware');
const { sendNotification } = require('../services/notificationService');

const upload = multer({ dest: 'uploads/' }).fields([
    { name: 'file', maxCount: 1 }, 
    { name: 'audio', maxCount: 1 }
]);
router.post('/analyze', checkToken, upload, async (req, res) => {
    try {
        const { child_id, text, doctorId } = req.body;
        const files = req.files;

if (!child_id) {
            return res.status(400).json({ error: "child_id is required" });
        }

        const formData = new FormData();
        formData.append('child_id', child_id);
        formData.append('text', text || "");
       
        if (files.file) formData.append('file', fs.createReadStream(files.file[0].path));
        if (files.audio) formData.append('audio', fs.createReadStream(files.audio[0].path));

        const aiResponse = await axios.post('http://127.0.0.1:8000/predict', formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });

        const analyses = aiResponse.data.analyses;
        const textAnalysis = analyses.find(a => a.modality === 'text') || {};
        const imageAnalysis = analyses.find(a => a.modality === 'image') || {};
        const voiceAnalysis = analyses.find(a => a.modality === 'voice') || {};
      
        const avgConfidence = (
            (textAnalysis.confidence || 0) + 
            (imageAnalysis.confidence || 0) + 
            (voiceAnalysis.confidence || 0)
        ) / (analyses.length || 1);
      
    
        let priority = 'Low';
        if (avgConfidence >= 75) priority = 'High';
        else if (avgConfidence>= 40) priority = 'Medium';

        let existingCase = await Case.findOne({ childId: new mongoose.Types.ObjectId(child_id), doctorId });
        
        let progress = 'no enough data yet';
        if (existingCase && existingCase.entriesCount >= 1) {
            const diff = avgConfidence - (existingCase.emotionPercentage || 0);
            if (diff < -5) progress = 'improving';
            else if (diff > 5) progress = 'needs attention';
            else progress = 'stable';
        }

        const updatedCase = await Case.findOneAndUpdate(
            { 
                childId: new mongoose.Types.ObjectId(child_id),doctorId},
            { 
                $set: { 
                    aiDiagnosis: aiResponse.data.diagnostic_result?.diagnosis || "تحت المتابعة",
                    aiSummary: aiResponse.data.text_analysis?.content || "no summary",
                    dominantEmotion: aiResponse.data.text_analysis?.emotion || "غير محدد",
                    emotionPercentage: avgConfidence,
                    priority: priority,
                    childProgress: progress,
                    lastAnalysisDate: new Date()
                },
                $inc: { entriesCount: 1 },
                $push: { 
                  drawings: files?.file ? { imageUrl: files.file[0].path, analysisResult: imageAnalysis.emotion } : undefined,
                    textAnalyses: { content: text, analysisResult: textAnalysis.summary }, emotionalTrend: {
                        week: `W${Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
                        emotion: textAnalysis.emotion || "None",
                        value:avgConfidence
                    },
                    audioAnalyses: files?.audio ? { audioUrl: files.audio[0].path } : undefined,
                   analysisTimeline: {
    diagnosis: aiResponse.data.diagnostic_result?.diagnosis || "تحت المتابعة",
    emotion: textAnalysis.emotion || imageAnalysis.emotion || voiceAnalysis.emotion || "غير محدد",
    confidence: avgConfidence,
    date: new Date()
}
            },
            $addToSet: { 
            recurringPatterns: { $each: aiResponse.data.text_analysis?.patterns || [] }
            }
            },
            { upsert: true, new: true }
        ).populate('childId', 'name');
        if (priority === 'High') {
    await sendNotification({
        doctorId: doctorId,
        childId: child_id,
        title: "Urgent Review Required",
        // الآن أصبح updatedCase.childId.name متاحاً
        message: `Analysis for ${updatedCase.childId.name} indicates high priority.`,
        type: 'urgent'
    });
}
if (files?.file) fs.unlinkSync(files.file[0].path);
        if (files?.audio) fs.unlinkSync(files.audio[0].path);

        res.status(200).json({
            status: "success",
            case: updatedCase,
            message: "Analysis processed and case updated successfully"
        });

    } catch (error) {
        console.error("AI Integration Error:", error);
        
       if (req.files) {
            if (req.files.file) fs.unlinkSync(req.files.file[0].path);
            if (req.files.audio) fs.unlinkSync(req.files.audio[0].path);
        }
        
        res.status(500).json({ error: "Failed to connect to AI Engine or update database" });
    }
});
router.post('/analyze-result', async (req, res) => {
    try {
        const { assignedDoctorId, childId, priority, isWeeklySummary, reviewedCount, doctorId } = req.body;
        
        // 1. جلب اسم الطفل من قاعدة البيانات لجعل الرسالة ديناميكية
        const child = await mongoose.model('Child').findById(childId).select('name');
        const childName = child ? child.name : "the child";

        // 2. منطق الحالة العاجلة
        if (priority === 'High') {
            await sendNotification({
                doctorId: assignedDoctorId,
                childId: childId,
                title: "Urgent Review Required",
                message: `${childName}'s latest analysis shows indicators that may require your attention.`,
                type: 'urgent'
            });
        }

        // 3. منطق الملخص الأسبوعي
        if (isWeeklySummary) {
            await sendNotification({
                doctorId: doctorId,
                title: "Weekly Performance Summary",
                message: `Your weekly insights are ready. You reviewed ${reviewedCount} cases.`,
                type: 'summary'
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Error processing analyze-result:", err);
        res.status(500).json({ error: "Failed to process notification" });
    }
});
module.exports = router;