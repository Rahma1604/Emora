/*
Updates :
1- Bnshof list of analyses ely rag3a mn Python w bnghz kul analyse blshkl el monaseb l MongoDB
34an MongoDB yrbot el analyse bl child w el case w el user w b3dha y3mlhom save f collection "Analysis".

2- B3d ma el backend y3ml save ll analyses ely fe MongoDB birg3 nfs el saved results ely f response birg3ha ll frontend 2w Postman b2a.

3- Checks whether the authenticated user is allowed to analyze this child where a parent can only analyze their own child and a doctor can only analyze a child linked to one of their cases.
*/

const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const mongoose = require("mongoose");
const Case = require("../models/Case");
const Analysis = require("../models/Analysis"); // To import the model we create to use it inside aiRoutes.js
const Child = require("../models/Child"); // Allows us to look for the child inside MongoDB and assures from his/her parent.
const { checkToken } = require("../middleware/authMiddleware");

const upload = multer({ dest: "uploads/" });

router.post("/analyze", checkToken, upload.single("file"), async (req, res) => {
    try {
        const { child_id, text } = req.body;
        const file = req.file;

        if (!file || !child_id) {
            return res
                .status(400)
                .json({ error: "Missing required fields (file or child_id)" });
        }

        const child = await Child.findById(child_id);

        if (!child) {
            return res.status(404).json({
                error: "Child not found",
            });
        }
        let hasChildAccess = false;
        let linkedCase = null;

        if (req.user.role === "parent") {
            hasChildAccess = child.parentId.toString() === req.user._id.toString();
        }

        if (req.user.role === "doctor") {
            linkedCase = await Case.findOne({
                childId: child._id,
                doctorId: req.user._id,
            });

            hasChildAccess = Boolean(linkedCase);
        }

        if (!hasChildAccess) {
            return res.status(403).json({
                error: "You are not authorized to analyze this child.",
            });
        }

        const formData = new FormData();
        formData.append("child_id", child_id);
        formData.append("text", text || "");
        formData.append("file", fs.createReadStream(file.path));

        const aiResponse = await axios.post(
            "http://127.0.0.1:8000/predict",
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 15000,
            },
        );

        const percentage = aiResponse.data.text_analysis?.percentage || 0;
        let priority = "Low";
        if (percentage >= 75) priority = "High";
        else if (percentage >= 40) priority = "Medium";

        let updatedCase = null;

        if (req.user.role === "doctor" && linkedCase) {
            updatedCase = await Case.findByIdAndUpdate(
                linkedCase._id,
                {
                    $set: {
                        aiDiagnosis:
                            aiResponse.data.diagnostic_result?.diagnosis || "Under review",
                        aiSummary: aiResponse.data.text_analysis?.summary || "",
                        dominantEmotion:
                            aiResponse.data.text_analysis?.emotion || "Unknown",
                        emotionPercentage: percentage,
                        priority: priority,
                        lastAnalysisDate: new Date(),
                    },
                    $inc: {
                        entriesCount: 1,
                    },
                    $push: {
                        drawings: {
                            imageUrl: file.path,
                            analysisResult:
                                aiResponse.data.diagnostic_result?.diagnosis || "",
                        },
                        textAnalyses: {
                            content: text || "",

                            analysisResult: aiResponse.data.text_analysis?.summary || "",
                        },
                        emotionalTrend: {
                            week: `W${Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000))}`,
                            emotion: aiResponse.data.text_analysis?.emotion || "None",
                            value: percentage,
                        },
                        recurringPatterns: {
                            $each: Array.isArray(aiResponse.data.text_analysis?.patterns)
                                ? aiResponse.data.text_analysis.patterns
                                : [],
                        },
                        analysisTimeline: {
                            type: aiResponse.data.text_analysis?.emotion || "Analysis",
                            date: new Date(),
                            status: "pending",
                        },
                    },
                },
                {
                    new: true,
                    runValidators: true,
                },
            );
        }

        const fallbackAnalyses = [];

        if (text && text.trim()) {
            fallbackAnalyses.push({
                modality: "text",

                emotion: aiResponse.data.text_analysis?.emotion || "unknown",

                confidence: Number(aiResponse.data.text_analysis?.percentage) || 0,

                content: text.trim(),

                fileUrl: "",

                contexts: Array.isArray(aiResponse.data.text_analysis?.patterns)
                    ? aiResponse.data.text_analysis.patterns
                    : [],

                isReliable: aiResponse.data.text_analysis?.isReliable === true,

                rawResult: aiResponse.data.text_analysis || {},
            });
        }

        const uploadedFileModality =
            file.mimetype && file.mimetype.startsWith("audio/") ? "voice" : "image";

        fallbackAnalyses.push({
            modality: uploadedFileModality,

            emotion:
                aiResponse.data.diagnostic_result?.emotion ||
                aiResponse.data.text_analysis?.emotion ||
                "unknown",

            confidence:
                Number(aiResponse.data.diagnostic_result?.confidence ?? percentage) ||
                0,

            content: aiResponse.data.diagnostic_result?.diagnosis || "",

            fileUrl: "",

            contexts: [],

            isReliable: aiResponse.data.diagnostic_result?.isReliable === true,

            rawResult: aiResponse.data.diagnostic_result || {},
        });

        const aiAnalyses =
            Array.isArray(aiResponse.data.analyses) &&
                aiResponse.data.analyses.length > 0
                ? aiResponse.data.analyses
                : fallbackAnalyses;

        const allowedModalities = ["text", "image", "voice"];

        const allowedEmotions = [
            "angry",
            "disgust",
            "fear",
            "happy",
            "neutral",
            "sad",
            "surprise",
            "unknown",
        ];

        const analysesToSave = aiAnalyses.map((analysis) => {
            let modality = String(analysis.modality || "text").toLowerCase();

            if (modality === "audio") {
                modality = "voice";
            }

            if (!allowedModalities.includes(modality)) {
                modality = "text";
            }

            let emotion = String(analysis.emotion || "unknown").toLowerCase();

            if (!allowedEmotions.includes(emotion)) {
                emotion = "unknown";
            }

            const confidence = Math.min(
                100,
                Math.max(0, Number(analysis.confidence) || 0),
            );

            return {
                childId: new mongoose.Types.ObjectId(child_id),

                caseId: linkedCase?._id || null,

                createdBy: req.user._id,

                modality: modality,

                emotion: emotion,

                confidence: confidence,

                content: analysis.content || "",

                fileUrl: analysis.fileUrl || "",

                contexts: Array.isArray(analysis.contexts) ? analysis.contexts : [],

                isReliable: analysis.isReliable === true,

                rawResult: analysis.rawResult || analysis,
            };
        });

        const savedAnalyses =
            analysesToSave.length > 0
                ? await Analysis.insertMany(analysesToSave)
                : [];

        fs.unlinkSync(file.path);

        res.status(200).json({
            status: "success",
            case: updatedCase,
            analyses: savedAnalyses,
            message: "Analysis processed and saved successfully",
        });
    } catch (error) {
        console.error("AI Integration Error:", error);

        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res
            .status(500)
            .json({ error: "Failed to connect to AI Engine or update database" });
    }
});

module.exports = router;
