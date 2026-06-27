
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Case = require("../models/Case");
const Child = require("../models/Child");
const User = require("../models/User");

const {
  cloudinary,
} = require("../config/cloudinary");

const {
  checkToken,
} = require("../middleware/authMiddleware");

const router = express.Router();

/* =====================================================
   AI SERVICE CONFIGURATION
===================================================== */

const AI_BASE_URL = (
  process.env.AI_BASE_URL ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

/* =====================================================
   TEMPORARY UPLOAD DIRECTORY
===================================================== */

const uploadsDirectory = path.join(
  process.cwd(),
  "uploads"
);

if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory, {
    recursive: true,
  });
}

/* =====================================================
   MULTER CONFIGURATION
===================================================== */

const upload = multer({
  dest: uploadsDirectory,

  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 2,
  },

  fileFilter: (
    req,
    file,
    callback
  ) => {
    const isImage =
      file.fieldname === "file" &&
      file.mimetype &&
      file.mimetype.startsWith(
        "image/"
      );

    const isAudio =
      file.fieldname === "audio" &&
      file.mimetype &&
      (
        file.mimetype.startsWith(
          "audio/"
        ) ||
        file.mimetype ===
          "video/mp4" ||
        file.mimetype ===
          "application/octet-stream"
      );

    if (
      !isImage &&
      !isAudio
    ) {
      return callback(
        new Error(
          file.fieldname ===
            "audio"
            ? "The audio field must contain a valid audio file"
            : "The file field must contain a valid image"
        )
      );
    }

    return callback(
      null,
      true
    );
  },
}).fields([
  {
    name: "file",
    maxCount: 1,
  },

  {
    name: "audio",
    maxCount: 1,
  },
]);

/* =====================================================
   UPLOAD ERROR HANDLER
===================================================== */

const handleUpload = (
  req,
  res,
  next
) => {
  upload(
    req,
    res,
    (error) => {
      if (!error) {
        return next();
      }

      console.error(
        "AI UPLOAD ERROR:",
        error
      );

      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Each uploaded file must be 15 MB or less",
          });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Only one image and one audio file are allowed",
          });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Only the fields file and audio are supported",
          });
      }

      return res
        .status(400)
        .json({
          success: false,

          error:
            error.message ||
            "Could not upload the entry files",
        });
    }
  );
};

/* =====================================================
   FILE HELPERS
===================================================== */

const removeTemporaryFile = (
  filePath
) => {
  if (
    !filePath ||
    !fs.existsSync(filePath)
  ) {
    return;
  }

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(
      "TEMP FILE DELETE ERROR:",
      error.message
    );
  }
};

const removeRequestFiles = (
  files
) => {
  removeTemporaryFile(
    files?.file?.[0]?.path
  );

  removeTemporaryFile(
    files?.audio?.[0]?.path
  );
};

/* =====================================================
   DATA HELPERS
===================================================== */

const normalizeConfidence = (
  value
) => {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue
    ) ||
    numberValue < 0
  ) {
    return 0;
  }

  /*
    بعض الموديلات ترجع 0.85
    وبعضها ترجع 85
  */
  const percentage =
    numberValue <= 1
      ? numberValue * 100
      : numberValue;

  return Math.min(
    100,
    Number(
      percentage.toFixed(2)
    )
  );
};

const normalizeEmotion = (
  value
) => {
  const emotion =
    String(value || "")
      .trim()
      .toLowerCase();

  const aliases = {
    anger: "angry",
    happiness: "happy",
    sadness: "sad",
    fearful: "fear",
    surprised: "surprise",
  };

  return (
    aliases[emotion] ||
    emotion ||
    "unknown"
  );
};

const toText = (
  value,
  fallback = ""
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  try {
    return JSON.stringify(
      value
    );
  } catch (error) {
    return fallback;
  }
};

/* =====================================================
   GET ANALYSIS FROM DIFFERENT AI RESPONSE FORMATS
===================================================== */

const getAnalysisByModality = (
  aiData,
  modality
) => {
  const analyses =
    Array.isArray(
      aiData.analyses
    )
      ? aiData.analyses
      : [];

  const arrayAnalysis =
    analyses.find(
      (item) =>
        String(
          item?.modality ||
          ""
        ).toLowerCase() ===
        modality
    );

  if (arrayAnalysis) {
    return arrayAnalysis;
  }

  if (
    modality === "text"
  ) {
    return (
      aiData.text_analysis ||
      aiData.textAnalysis ||
      {}
    );
  }

  if (
    modality === "image"
  ) {
    return (
      aiData.image_analysis ||
      aiData.imageAnalysis ||
      {}
    );
  }

  if (
    modality === "voice"
  ) {
    return (
      aiData.voice_analysis ||
      aiData.audio_analysis ||
      aiData.voiceAnalysis ||
      aiData.audioAnalysis ||
      {}
    );
  }

  return {};
};

/* =====================================================
   SELECT RANDOM APPROVED DOCTOR
===================================================== */

const chooseApprovedDoctor =
  async () => {
    const doctorFilter = {
      role: "doctor",

      verificationStatus:
        "approved",

      isVerified: true,
    };

    const doctorsCount =
      await User.countDocuments(
        doctorFilter
      );

    if (
      doctorsCount === 0
    ) {
      return null;
    }

    const randomIndex =
      Math.floor(
        Math.random() *
        doctorsCount
      );

    return User.findOne(
      doctorFilter
    )
      .skip(randomIndex)
      .select(
        "_id fullName email specialization"
      );
  };

/* =====================================================
   CLOUDINARY UPLOAD HELPER
===================================================== */

const uploadFileToCloudinary =
  async (
    file,
    folder,
    resourceType
  ) => {
    if (!file?.path) {
      return "";
    }

    try {
      const result =
        await cloudinary
          .uploader
          .upload(
            file.path,
            {
              folder,

              resource_type:
                resourceType,
            }
          );

      return (
        result.secure_url ||
        result.url ||
        ""
      );
    } catch (error) {
      console.error(
        "CLOUDINARY ENTRY UPLOAD ERROR:",
        error.message
      );

      /*
        فشل Cloudinary لا يوقف
        نتيجة تحليل الـAI.
      */
      return "";
    }
  };

/* =====================================================
   ANALYZE CHILD ENTRY

   POST /api/ai/analyze

   FormData fields:

   child_id : required
   text     : optional
   file     : optional image
   audio    : optional audio

   يجب إرسال نص أو صورة أو صوت على الأقل.
===================================================== */

router.post(
  "/analyze",
  checkToken,
  handleUpload,
  async (req, res) => {
    const files =
      req.files || {};

    const imageFile =
      files.file?.[0] ||
      null;

    const audioFile =
      files.audio?.[0] ||
      null;

    try {
      /* =========================
         CHECK PARENT ROLE
      ========================= */

      if (
        req.user.role !==
        "parent"
      ) {
        return res
          .status(403)
          .json({
            success: false,

            error:
              "Only parent accounts can submit child entries",
          });
      }

      /* =========================
         REQUEST DATA
      ========================= */

      const childId =
        String(
          req.body.child_id ||
          req.body.childId ||
          ""
        ).trim();

      const text =
        String(
          req.body.text ||
          ""
        ).trim();

      if (!childId) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Child ID is required",
          });
      }

      if (
        !mongoose
          .Types
          .ObjectId
          .isValid(childId)
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "Invalid child ID",
          });
      }

      if (
        !text &&
        !imageFile &&
        !audioFile
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error:
              "The entry must contain text, an image or an audio file",
          });
      }

      /* =========================
         CHECK CHILD OWNERSHIP
      ========================= */

      const child =
        await Child.findOne({
          _id:
            childId,

          parentId:
            req.user._id,
        });

      if (!child) {
        return res
          .status(404)
          .json({
            success: false,

            error:
              "Child not found or does not belong to this parent",
          });
      }

      /* =========================
         FIND CURRENT CASE
      ========================= */

      let currentCase =
        await Case.findOne({
          childId:
            child._id,

          status: {
            $ne:
              "closed",
          },
        }).sort({
          lastAnalysisDate:
            -1,

          createdAt:
            -1,
        });

      let assignedDoctorId =
        currentCase?.doctorId ||
        null;

      /* =========================
         ASSIGN APPROVED DOCTOR
      ========================= */

      if (
        !assignedDoctorId
      ) {
        const approvedDoctor =
          await chooseApprovedDoctor();

        if (!approvedDoctor) {
          return res
            .status(409)
            .json({
              success: false,

              error:
                "No approved doctor is currently available to receive this entry",
            });
        }

        assignedDoctorId =
          approvedDoctor._id;
      }

      /* =========================
         SEND DATA TO PYTHON AI
      ========================= */

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

      if (imageFile) {
        formData.append(
          "file",

          fs.createReadStream(
            imageFile.path
          ),

          {
            filename:
              imageFile
                .originalname ||
              "child-image.jpg",

            contentType:
              imageFile
                .mimetype ||
              "image/jpeg",
          }
        );
      }

      if (audioFile) {
        formData.append(
          "audio",

          fs.createReadStream(
            audioFile.path
          ),

          {
            filename:
              audioFile
                .originalname ||
              "child-audio.m4a",

            contentType:
              audioFile
                .mimetype ||
              "audio/m4a",
          }
        );
      }

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
        aiResponse.data ||
        {};

      /* =========================
         READ AI ANALYSES
      ========================= */

      const textAnalysis =
        getAnalysisByModality(
          aiData,
          "text"
        );

      const imageAnalysis =
        getAnalysisByModality(
          aiData,
          "image"
        );

      const voiceAnalysis =
        getAnalysisByModality(
          aiData,
          "voice"
        );

      const availableAnalyses =
        [
          textAnalysis,
          imageAnalysis,
          voiceAnalysis,
        ].filter(
          (analysis) =>
            analysis &&
            Object.keys(
              analysis
            ).length > 0
        );

      /* =========================
         CALCULATE CONFIDENCE
      ========================= */

      const confidenceValues =
        availableAnalyses
          .map(
            (analysis) =>
              normalizeConfidence(
                analysis.confidence ??
                analysis.percentage ??
                analysis.score
              )
          )
          .filter(
            (confidence) =>
              Number.isFinite(
                confidence
              )
          );

      const averageConfidence =
        confidenceValues.length >
        0
          ? Number(
              (
                confidenceValues
                  .reduce(
                    (
                      total,
                      confidence
                    ) =>
                      total +
                      confidence,
                    0
                  ) /
                confidenceValues
                  .length
              ).toFixed(2)
            )
          : 0;

      /* =========================
         FIND DOMINANT EMOTION
      ========================= */

      const emotionCandidates =
        availableAnalyses
          .map(
            (analysis) => ({
              emotion:
                normalizeEmotion(
                  analysis.emotion ||
                  analysis.label
                ),

              confidence:
                normalizeConfidence(
                  analysis.confidence ??
                  analysis.percentage ??
                  analysis.score
                ),
            })
          )
          .filter(
            (item) =>
              item.emotion !==
              "unknown"
          )
          .sort(
            (first, second) =>
              second.confidence -
              first.confidence
          );

      const dominantEmotion =
        normalizeEmotion(
          aiData.dominant_emotion ||
          aiData.dominantEmotion ||
          emotionCandidates[0]
            ?.emotion ||
          textAnalysis.emotion ||
          imageAnalysis.emotion ||
          voiceAnalysis.emotion
        );

      /* =========================
         DIAGNOSIS AND SUMMARY
      ========================= */

      const diagnosticResult =
        aiData.diagnostic_result ||
        aiData.diagnosticResult ||
        {};

      const diagnosis =
        toText(
          diagnosticResult
            .diagnosis ||
          diagnosticResult
            .diagnostic
            ?.diagnosis ||
          aiData.diagnosis,

          "Under follow-up"
        );

      const summary =
        toText(
          aiData.summary ||
          textAnalysis.summary ||
          textAnalysis.content ||
          diagnosticResult
            .summary ||
          diagnosticResult
            .diagnostic
            ?.details ||
          diagnosticResult
            .mother_report
            ?.message,

          ""
        );

      /* =========================
         PRIORITY
      ========================= */

      const rawPriority =
        String(
          diagnosticResult
            .priority ||
          aiData.priority ||
          "Low"
        ).trim();

      const priorityMap = {
        low:
          "Low",

        medium:
          "Medium",

        high:
          "High",
      };

      const priority =
        priorityMap[
          rawPriority
            .toLowerCase()
        ] ||
        "Low";

      /* =========================
         RECURRING PATTERNS
      ========================= */

      const patternsSource =
        textAnalysis.patterns ||
        diagnosticResult.patterns ||
        aiData.patterns ||
        [];

      const patterns =
        Array.isArray(
          patternsSource
        )
          ? patternsSource
              .map(
                (pattern) =>
                  toText(
                    pattern
                  )
              )
              .filter(Boolean)
          : [];

      /* =========================
         UPLOAD MEDIA TO CLOUDINARY
      ========================= */

      const imageUrl =
        await uploadFileToCloudinary(
          imageFile,

          "Emora_Children_Drawings",

          "image"
        );

      const audioUrl =
        await uploadFileToCloudinary(
          audioFile,

          "Emora_Children_Voices",

          "video"
        );

      const now =
        new Date();

      /* =========================
         CREATE MONGODB UPDATE
      ========================= */

      const update = {
        $set: {
          doctorId:
            assignedDoctorId,

          childId:
            child._id,

          status:
            "pending",

          priority,

          aiDiagnosis:
            diagnosis,

          aiSummary:
            summary,

          dominantEmotion,

          emotionPercentage:
            averageConfidence,

          lastAnalysisDate:
            now,
        },

        $setOnInsert: {
          createdAt:
            now,
        },

        $inc: {
          entriesCount:
            1,
        },

        $push: {
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
              dominantEmotion,

            value:
              averageConfidence,
          },

          analysisTimeline: {
            diagnosis,

            emotion:
              dominantEmotion,

            confidence:
              averageConfidence,

            date:
              now,
          },
        },
      };

      /* =========================
         SAVE TEXT ANALYSIS
      ========================= */

      if (text) {
        update.$push
          .textAnalyses = {
            content:
              text,

            analysisResult:
              toText(
                textAnalysis
                  .summary ||
                textAnalysis
                  .content ||
                textAnalysis
                  .emotion,

                summary
              ),

            createdAt:
              now,
          };
      }

      /* =========================
         SAVE IMAGE ANALYSIS
      ========================= */

      if (imageFile) {
        update.$push
          .drawings = {
            imageUrl,

            analysisResult:
              toText(
                imageAnalysis
                  .summary ||
                imageAnalysis
                  .content ||
                imageAnalysis
                  .emotion,

                dominantEmotion
              ),

            createdAt:
              now,
          };
      }

      /* =========================
         SAVE AUDIO ANALYSIS
      ========================= */

      if (audioFile) {
        update.$push
          .audioAnalyses = {
            audioUrl,

            createdAt:
              now,
          };
      }

      /* =========================
         SAVE PATTERNS
      ========================= */

      if (
        patterns.length >
        0
      ) {
        update.$addToSet = {
          recurringPatterns: {
            $each:
              patterns,
          },
        };
      }

      /* =========================
         CREATE OR UPDATE CASE
      ========================= */

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

              status: {
                $ne:
                  "closed",
              },
            };

      const updatedCase =
        await Case
          .findOneAndUpdate(
            caseFilter,

            update,

            {
              upsert:
                true,

              new:
                true,

              runValidators:
                true,

              setDefaultsOnInsert:
                true,
            }
          )
          .populate(
            "childId",
            "name age gender"
          )
          .populate(
            "doctorId",
            "fullName email specialization"
          );

      /* =========================
         RESPONSE TO FRONTEND
      ========================= */

      return res
        .status(200)
        .json({
          success:
            true,

          status:
            "success",

          message:
            "Analysis processed successfully",

          result: {
            childId:
              child._id,

            assignedDoctorId,

            diagnosis,

            summary,

            dominantEmotion,

            confidence:
              averageConfidence,

            priority,

            analyses: {
              text:
                textAnalysis,

              image:
                imageAnalysis,

              voice:
                voiceAnalysis,
            },
          },

          case:
            updatedCase,

          rawAiResult:
            aiData,
        });
    } catch (error) {
      console.error(
        "AI INTEGRATION ERROR:",

        error.response?.data ||
        error.message ||
        error
      );

      /* =========================
         AXIOS ERRORS
      ========================= */

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
              success:
                false,

              error:
                "The AI service took too long to respond",
            });
        }

        if (
          error.code ===
            "ECONNREFUSED" ||
          String(
            error.message ||
            ""
          ).includes(
            "ECONNREFUSED"
          )
        ) {
          return res
            .status(503)
            .json({
              success:
                false,

              error:
                "The Python AI service is not running or cannot be reached",
            });
        }

        const pythonError =
          error.response
            ?.data
            ?.detail ||
          error.response
            ?.data
            ?.error ||
          error.response
            ?.data
            ?.message;

        return res
          .status(
            error.response
              ?.status ||
            500
          )
          .json({
            success:
              false,

            error:
              toText(
                pythonError,

                "Failed to connect to the AI service"
              ),
          });
      }

      /* =========================
         GENERAL ERRORS
      ========================= */

      return res
        .status(500)
        .json({
          success:
            false,

          error:
            error.message ||
            "Failed to process the AI analysis",
        });
    } finally {
      /*
        نمسح الملفات المؤقتة بعد
        انتهاء التحليل ورفعها على Cloudinary.
      */
      removeRequestFiles(
        files
      );
    }
  }
);
module.exports = router;

