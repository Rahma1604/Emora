const express = require("express");
const router = express.Router();
<<<<<<< Updated upstream
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
=======

const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const mongoose = require("mongoose");

const Case = require("../models/Case");
const Child = require("../models/Child");
const User = require("../models/User");

const {
  checkToken,
} = require("../middleware/authMiddleware");

/*
  عنوان خدمة Python.

  محليًا:
  http://127.0.0.1:8000

  ويمكن تغييره لاحقًا من .env:
  AI_BASE_URL=http://127.0.0.1:8000
*/
const AI_BASE_URL = (
  process.env.AI_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/$/, "");

/*
  حفظ الصورة مؤقتًا داخل uploads.
*/
const upload = multer({
  dest: "uploads/",

  limits: {
    fileSize:
      10 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    if (
      !file.mimetype ||
      !file.mimetype.startsWith(
        "image/"
      )
    ) {
      return callback(
        new Error(
          "Only image files are supported by the current AI model"
        )
      );
>>>>>>> Stashed changes
    }

    callback(null, true);
  },
});
router.post('/analyze-result', async (req, res) => {
    try {
        const { assignedDoctorId, childId, priority, isWeeklySummary, reviewedCount, doctorId } = req.body;
        
        // 1. جلب اسم الطفل من قاعدة البيانات لجعل الرسالة ديناميكية
        const child = await mongoose.model('Child').findById(childId).select('name');
        const childName = child ? child.name : "the child";

<<<<<<< Updated upstream
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
=======
/*
  Wrapper لإرجاع خطأ Multer بشكل واضح.
*/
const uploadImage = (
  req,
  res,
  next
) => {
  upload.single("file")(
    req,
    res,
    (error) => {
      if (error) {
        return res
          .status(400)
          .json({
            error:
              error.message ||
              "Failed to upload image",
          });
      }

      next();
    }
  );
};

function removeUploadedFile(
  filePath
) {
  if (
    !filePath ||
    !fs.existsSync(filePath)
  ) {
    return;
  }

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.log(
      "TEMP FILE DELETE ERROR:",
      error.message
    );
  }
}

function normalizePercentage(
  value
) {
  const numericValue =
    Number(value);

  if (
    Number.isNaN(
      numericValue
    ) ||
    numericValue < 0
  ) {
    return 0;
  }

  /*
    بعض الموديلات ترجع:
    0.85

    وبعضها يرجع:
    85
  */
  const percentage =
    numericValue <= 1
      ? numericValue * 100
      : numericValue;

  return Math.min(
    100,
    Number(
      percentage.toFixed(2)
    )
  );
}

function convertToText(
  value,
  fallback = ""
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  try {
    return JSON.stringify(
      value
    );
  } catch {
    return fallback;
  }
}

router.post(
  "/analyze",
  checkToken,
  uploadImage,
  async (req, res) => {
    const file =
      req.file;

    try {
      const childId =
        String(
          req.body.child_id ||
            ""
        ).trim();

      const text =
        String(
          req.body.text ||
            ""
        ).trim();

      /*
        Route خاص بفلو البيرنت.
      */
      if (
        req.user?.role &&
        req.user.role !==
          "parent"
      ) {
        removeUploadedFile(
          file?.path
        );

        return res
          .status(403)
          .json({
            error:
              "Only parent accounts can submit child AI analyses",
          });
      }

      if (!childId) {
        removeUploadedFile(
          file?.path
        );

        return res
          .status(400)
          .json({
            error:
              "Child ID is required",
          });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          childId
        )
      ) {
        removeUploadedFile(
          file?.path
        );

        return res
          .status(400)
          .json({
            error:
              "Invalid child ID",
          });
      }

      if (!file) {
        return res
          .status(400)
          .json({
            error:
              "An image is required for the current AI model",
          });
      }

      if (!text) {
        removeUploadedFile(
          file.path
        );

        return res
          .status(400)
          .json({
            error:
              "A written observation is required",
          });
      }

      /*
        التأكد إن الطفل تابع
        للبيرنت صاحب الـToken.
      */
      const child =
        await Child.findOne({
          _id: childId,
          parentId:
            req.user._id,
        });

      if (!child) {
        removeUploadedFile(
          file.path
        );

        return res
          .status(404)
          .json({
            error:
              "Child not found or does not belong to this parent",
          });
      }

      /*
        البحث عن أحدث Case للطفل.
      */
      let currentCase =
        await Case.findOne({
          childId:
            child._id,
        }).sort({
          lastAnalysisDate: -1,
          createdAt: -1,
        });

      let assignedDoctorId =
        currentCase?.doctorId ||
        null;

      /*
        لو الطفل لسه معندوش Case،
        نربطه بأول دكتور معتمد.

        ده يمنع فشل الحفظ بسبب
        doctorId المطلوب في Case.
      */
      if (!assignedDoctorId) {
        const approvedDoctor =
          await User.findOne({
            role: "doctor",

            $or: [
              {
                verificationStatus:
                  "approved",
              },
              {
                verificationStatus:
                  "verified",
              },
              {
                isVerified: true,
              },
            ],
          })
            .sort({
              createdAt: 1,
            })
            .select("_id");

        if (
          !approvedDoctor
        ) {
          removeUploadedFile(
            file.path
          );

          return res
            .status(409)
            .json({
              error:
                "No approved doctor is currently available to receive this case",
            });
        }

        assignedDoctorId =
          approvedDoctor._id;
      }

      /*
        تجهيز الطلب لخدمة FastAPI.

        Python ينتظر:
        child_id
        text
        file
      */
      const formData =
        new FormData();

      formData.append(
        "child_id",
        childId
      );

      formData.append(
        "text",
        text
      );

      formData.append(
        "file",
        fs.createReadStream(
          file.path
        ),
        {
          filename:
            file.originalname ||
            "child-image.jpg",

          contentType:
            file.mimetype ||
            "image/jpeg",
        }
      );

      const aiResponse =
        await axios.post(
          `${AI_BASE_URL}/predict`,
          formData,
          {
            headers:
              formData.getHeaders(),

            timeout:
              180000,

            maxBodyLength:
              Infinity,

            maxContentLength:
              Infinity,
          }
        );

      const aiData =
        aiResponse.data || {};

      const imageAnalysis =
        aiData.image_analysis ||
        {};

      const textAnalysis =
        aiData.text_analysis ||
        {};

      const diagnosticResult =
        aiData.diagnostic_result ||
        {};

      const diagnostic =
        diagnosticResult.diagnostic ||
        diagnosticResult;

      const motherReport =
        diagnosticResult.mother_report ||
        diagnosticResult.motherReport ||
        {};

      const imageEmotion =
        imageAnalysis.emotion ||
        "Unknown";

      const textEmotion =
        textAnalysis.emotion ||
        imageEmotion ||
        "Unknown";

      const percentage =
        normalizePercentage(
          textAnalysis.confidence ??
            textAnalysis.percentage ??
            0
        );

      const diagnosis =
        diagnostic.diagnosis ||
        diagnosticResult.diagnosis ||
        "تحت المتابعة";

      const summary =
        textAnalysis.summary ||
        diagnostic.details ||
        motherReport.message ||
        "";

      const patterns =
        Array.isArray(
          textAnalysis.patterns
        )
          ? textAnalysis.patterns
          : Array.isArray(
                diagnosticResult.patterns
              )
            ? diagnosticResult.patterns
            : [];

      let priority =
        "Low";

      if (
        percentage >= 75
      ) {
        priority = "High";
      } else if (
        percentage >= 40
      ) {
        priority =
          "Medium";
      }

      const now =
        new Date();

      const imageAnalysisText =
        `Image emotion: ${imageEmotion}`;

      const textAnalysisText =
        summary ||
        `Text emotion: ${textEmotion} (${percentage}%)`;

      const normalizedImagePath =
        file.path.replace(
          /\\/g,
          "/"
        );

      const caseFilter =
        currentCase
          ? {
              _id:
                currentCase._id,
            }
          : {
              childId:
                child._id,

              doctorId:
                assignedDoctorId,
            };

      const pushData = {
        drawings: {
          imageUrl:
            normalizedImagePath,

          analysisResult:
            imageAnalysisText,

          emotion:
            imageEmotion,

          confidence:
            percentage,

          createdAt:
            now,
        },

        textAnalyses: {
          content:
            text,

          analysisResult:
            textAnalysisText,

          emotion:
            textEmotion,

          confidence:
            percentage,

          createdAt:
            now,
        },

        emotionalTrend: {
          week:
            `W${Math.ceil(
              Date.now() /
                (
                  7 *
                  24 *
                  60 *
                  60 *
                  1000
                )
            )}`,

          emotion:
            textEmotion,

          value:
            percentage,
        },

        analysisTimeline: {
          type:
            textEmotion ||
            "Analysis",

          date:
            now,

          status:
            "pending",
        },
      };

      if (
        patterns.length > 0
      ) {
        pushData.recurringPatterns =
          {
            $each:
              patterns.map(
                (
                  pattern
                ) =>
                  convertToText(
                    pattern
                  )
              ),
          };
      }

      const updatedCase =
        await Case.findOneAndUpdate(
          caseFilter,
          {
            $set: {
              doctorId:
                assignedDoctorId,

              aiDiagnosis:
                convertToText(
                  diagnosis,
                  "تحت المتابعة"
                ),

              aiSummary:
                convertToText(
                  summary
                ),

              dominantEmotion:
                textEmotion,

              emotionPercentage:
                percentage,

              priority,

              lastAnalysisDate:
                now,
            },

            $setOnInsert: {
              childId:
                child._id,

              status:
                "pending",
            },

            $inc: {
              entriesCount: 1,
            },

            $push:
              pushData,
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
            setDefaultsOnInsert:
              true,
          }
        );

      return res
        .status(200)
        .json({
          status:
            "success",

          /*
            النتيجة الأصلية القادمة
            من موديل Python.
          */
          analysis:
            aiData,

          case:
            updatedCase,

          message:
            "Analysis processed and case updated successfully",
        });
    } catch (error) {
      console.error(
        "AI INTEGRATION ERROR:",
        error.response?.data ||
          error.message ||
          error
      );

      /*
        عند فشل التحليل أو الحفظ،
        نمسح الصورة المؤقتة.
      */
      removeUploadedFile(
        file?.path
      );

      if (
        axios.isAxiosError(
          error
        )
      ) {
        if (
          error.code ===
          "ECONNABORTED"
        ) {
          return res
            .status(504)
            .json({
              error:
                "The AI engine took too long to respond",
            });
        }

        if (
          error.code ===
            "ECONNREFUSED" ||
          error.message?.includes(
            "ECONNREFUSED"
          )
        ) {
          return res
            .status(503)
            .json({
              error:
                "The Python AI service is not running on port 8000",
            });
        }

        const pythonError =
          error.response?.data
            ?.detail ||
          error.response?.data
            ?.error;

        return res
          .status(
            error.response
              ?.status || 500
          )
          .json({
            error:
              pythonError ||
              "Failed to connect to the AI engine",
          });
      }

      return res
        .status(500)
        .json({
          error:
            error.message ||
            "Failed to process the AI analysis or update the database",
        });
    }
  }
);

>>>>>>> Stashed changes
module.exports = router;