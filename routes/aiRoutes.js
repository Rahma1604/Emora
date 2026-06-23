/*
1- Mn el str 80 llstr 114 : 3bara 3n enna bna5of list of analyses ely rag3a mn Python w bnghz kul analyse blshkl el monaseb l MongoDB
34an MongoDB yrbot el analyse bl child w el case w el user w b3dha y3mlhom save f collection "Analysis".

2- Mn 118 ela 123 : b3d ma el backend y3ml save ll analyses ely fe MongoDB birg3 nfs el saved results ely f response birg3ha ll frontend 2w Postman b2a.
*/

const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const mongoose = require('mongoose');
const Case = require('../models/Case');
const Analysis = require('../models/Analysis'); // To import the model we create to use it inside aiRoutes.js
const { checkToken } = require('../middleware/authMiddleware');

const upload = multer({ dest: 'uploads/' });

router.post('/analyze', checkToken, upload.single('file'), async (req, res) => {
    try {
        const { child_id, text, doctorId } = req.body;
        const file = req.file;

        if (!file || !child_id) {
            return res.status(400).json({ error: "Missing required fields (file or child_id)" });
        }

        const formData = new FormData();
        formData.append('child_id', child_id);
        formData.append('text', text || "");
        formData.append('file', fs.createReadStream(file.path));

        const aiResponse = await axios.post('http://127.0.0.1:8000/predict', formData, {
            headers: formData.getHeaders(),
            timeout: 15000 
        });

        const percentage = aiResponse.data.text_analysis?.percentage || 0;
        let priority = 'Low';
        if (percentage >= 75) priority = 'High';
        else if (percentage >= 40) priority = 'Medium';

        const updatedCase = await Case.findOneAndUpdate(
            { 
                childId: new mongoose.Types.ObjectId(child_id), 
                doctorId: doctorId 
            },
            { 
                $set: { 
                    aiDiagnosis: aiResponse.data.diagnostic_result?.diagnosis || "تحت المتابعة",
                    aiSummary: aiResponse.data.text_analysis?.summary || "",
                    dominantEmotion: aiResponse.data.text_analysis?.emotion || "غير محدد",
                    emotionPercentage: percentage,
                    priority: priority,
                    lastAnalysisDate: new Date()
                },
                $inc: { entriesCount: 1 },
                $push: { 
                    drawings: { imageUrl: file.path, analysisResult: aiResponse.data.diagnostic_result?.diagnosis },
                    textAnalyses: { content: text, analysisResult: aiResponse.data.text_analysis?.summary },
                    emotionalTrend: {
                        week: `W${Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
                        emotion: aiResponse.data.text_analysis?.emotion || "None",
                        value: percentage
                    },
                    recurringPatterns: { 
                        $each: aiResponse.data.text_analysis?.patterns || [] 
                    },
                    analysisTimeline: {
                        type: aiResponse.data.text_analysis?.emotion || "Analysis",
                        date: new Date(),
                        status: 'pending'
                    }
                }
            },
            { upsert: true, new: true }
        );

        const aiAnalyses = Array.isArray(aiResponse.data.analyses)
            ? aiResponse.data.analyses
            : [];

        const analysesToSave = aiAnalyses.map((analysis) => ({
            childId: new mongoose.Types.ObjectId(child_id),
            caseId: updatedCase._id,
            createdBy: req.user._id,

            modality: analysis.modality,

            emotion: String(
                analysis.emotion || 'unknown'
            ).toLowerCase(),

            confidence: Number(analysis.confidence) || 0,

            content: analysis.content || '',

            fileUrl: '',

            contexts: Array.isArray(analysis.contexts)
                ? analysis.contexts
                : [],

            isReliable: analysis.isReliable === true,

            rawResult: analysis
        }));

        const savedAnalyses = analysesToSave.length > 0
            ? await Analysis.insertMany(analysesToSave)
            : [];


        fs.unlinkSync(file.path);

        res.status(200).json({
        status: "success",
        case: updatedCase,
        analyses: savedAnalyses,
        message: "Analysis processed and saved successfully"
        });

    } catch (error) {
        console.error("AI Integration Error:", error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ error: "Failed to connect to AI Engine or update database" });
    }
});

module.exports = router;