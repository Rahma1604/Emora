
const express = require("express");
const router = express.Router();
<<<<<<< Updated upstream
const Child = require('../models/Child');
const axios = require('axios');

const Notification = require('../models/NotificationP');

const FormData = require('form-data');
const fs = require('fs');
const Entry = require('../models/entry');
// في أعلى ملف الـ router الخاص بالأهل
const { updateCaseWithAIResults } = require('../services/caseService');
const { sendNotification: sendDoctorNotification } = require('../services/notificationService');
const { checkToken } = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }).fields([
    { name: 'file', maxCount: 1 }, 
    { name: 'audio', maxCount: 1 }
]);



router.get('/all', checkToken, async (req, res) => {
    try {
        const children = await Child.find({ parentId: req.user._id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch children", message: err.message });
    }
=======

const Child = require("../models/Child");
const Case = require("../models/Case");
const {
  checkToken,
} = require("../middleware/authMiddleware");

/* =========================
   Get All Parent Children
   GET /api/children/all
========================= */

router.get("/all", checkToken, async (req, res) => {
  try {
    const children = await Child.find({
      parentId: req.user._id,
    });

    return res.status(200).json(children);
  } catch (err) {
    console.error("GET CHILDREN ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch children",
      message: err.message,
    });
  }
>>>>>>> Stashed changes
});

/* =========================
   Get Child Overview
   GET /api/children/:childId/overview
========================= */

router.get(
  "/:childId/overview",
  checkToken,
  async (req, res) => {
    try {
      const child = await Child.findOne({
        _id: req.params.childId,
        parentId: req.user._id,
      }).lean();

      if (!child) {
        return res.status(404).json({
          message: "Child not found",
        });
      }

      const latestCase = await Case.findOne({
        childId: child._id,
      })
        .populate(
          "doctorId",
          "fullName specialization profilePic isVerified"
        )
        .sort({
          lastAnalysisDate: -1,
          createdAt: -1,
        })
        .lean();

      if (!latestCase) {
        return res.status(200).json({
          childInfo: child,
          caseData: null,
          recentEntries: [],
        });
      }

      const caseStatus =
        latestCase.status || "pending";

      const dominantEmotion =
        latestCase.dominantEmotion || "Unknown";

      const confidence =
        Number(latestCase.emotionPercentage) || 0;

      const textAnalyses = Array.isArray(
        latestCase.textAnalyses
      )
        ? latestCase.textAnalyses
        : [];

      const drawings = Array.isArray(
        latestCase.drawings
      )
        ? latestCase.drawings
        : [];

      const textEntries = textAnalyses.map(
        (entry, index) => ({
          id:
            entry?._id?.toString?.() ||
            `text-${latestCase._id}-${index}`,

          caseId:
            latestCase._id?.toString?.() || "",

          date:
            entry?.createdAt ||
            latestCase.lastAnalysisDate ||
            latestCase.createdAt,

          type: "Text Entry",

          emotion:
            typeof entry?.emotion === "string" &&
            entry.emotion.trim()
              ? entry.emotion
              : dominantEmotion,

          description:
            (typeof entry?.analysisResult ===
              "string" &&
            entry.analysisResult.trim()
              ? entry.analysisResult
              : "") ||
            (typeof entry?.content === "string" &&
            entry.content.trim()
              ? entry.content
              : "") ||
            "Text analysis entry",

          status: caseStatus,

          confidence:
            Number(entry?.confidence) ||
            confidence,
        })
      );

      const drawingEntries = drawings.map(
        (entry, index) => ({
          id:
            entry?._id?.toString?.() ||
            `drawing-${latestCase._id}-${index}`,

          caseId:
            latestCase._id?.toString?.() || "",

          date:
            entry?.createdAt ||
            latestCase.lastAnalysisDate ||
            latestCase.createdAt,

          type: "Drawing Entry",

          emotion:
            typeof entry?.emotion === "string" &&
            entry.emotion.trim()
              ? entry.emotion
              : dominantEmotion,

          description:
            typeof entry?.analysisResult ===
              "string" &&
            entry.analysisResult.trim()
              ? entry.analysisResult
              : "Drawing analysis entry",

          status: caseStatus,

          confidence:
            Number(entry?.confidence) ||
            confidence,

          imageUrl:
            typeof entry?.imageUrl === "string"
              ? entry.imageUrl
              : "",
        })
      );

      const recentEntries = [
        ...textEntries,
        ...drawingEntries,
      ]
        .sort((firstEntry, secondEntry) => {
          const firstDate =
            new Date(firstEntry.date).getTime() || 0;

          const secondDate =
            new Date(secondEntry.date).getTime() ||
            0;

          return secondDate - firstDate;
        })
        .slice(0, 5);

      const doctor =
        latestCase.doctorId &&
        typeof latestCase.doctorId === "object"
          ? {
              _id: latestCase.doctorId._id,

              fullName:
                latestCase.doctorId.fullName,

              specialization:
                latestCase.doctorId
                  .specialization || "",

              profilePic:
                latestCase.doctorId.profilePic ||
                "",

              isVerified: Boolean(
                latestCase.doctorId.isVerified
              ),
            }
          : null;

      return res.status(200).json({
        childInfo: child,

        caseData: {
          _id: latestCase._id,

          status: latestCase.status,

          priority: latestCase.priority,

          entriesCount:
            latestCase.entriesCount ||
            textEntries.length +
              drawingEntries.length,

          lastAnalysisDate:
            latestCase.lastAnalysisDate,

          dominantEmotion:
            latestCase.dominantEmotion,

          emotionPercentage:
            latestCase.emotionPercentage,

          aiDiagnosis:
            latestCase.aiDiagnosis || "",

          aiSummary:
            latestCase.aiSummary || "",

          doctorRecommendation:
            latestCase.doctorRecommendation ||
            "",

          emotionalTrend:
            Array.isArray(
              latestCase.emotionalTrend
            )
              ? latestCase.emotionalTrend
              : [],

          frequentEmotions:
            Array.isArray(
              latestCase.frequentEmotions
            )
              ? latestCase.frequentEmotions
              : [],

          recurringPatterns:
            Array.isArray(
              latestCase.recurringPatterns
            )
              ? latestCase.recurringPatterns
              : [],

          doctorRecommendations:
            Array.isArray(
              latestCase.doctorRecommendations
            )
              ? latestCase.doctorRecommendations
              : [],

          analysisTimeline:
            Array.isArray(
              latestCase.analysisTimeline
            )
              ? latestCase.analysisTimeline
              : [],

          doctor,
        },

        recentEntries,
      });
    } catch (err) {
      console.error(
        "GET CHILD OVERVIEW ERROR:",
        err
      );

      return res.status(500).json({
        error:
          "Failed to fetch child overview",
        message:
          err?.message ||
          "Unexpected error while loading child overview",
      });
    }
  }
);

/* =========================
   Get All Child Entries
   GET /api/children/:childId/entries
========================= */

router.get(
  "/:childId/entries",
  checkToken,
  async (req, res) => {
    try {
      console.log(
        "CHILD ENTRIES ROUTE HIT:",
        req.params.childId
      );

      const child = await Child.findOne({
        _id: req.params.childId,
        parentId: req.user._id,
      }).lean();

      if (!child) {
        return res.status(404).json({
          message: "Child not found",
        });
      }

      const childCases = await Case.find({
        childId: child._id,
      })
        .sort({
          lastAnalysisDate: -1,
          createdAt: -1,
        })
        .lean();

      const entries = [];

      childCases.forEach((caseData) => {
        const caseStatus =
          typeof caseData.status === "string"
            ? caseData.status
            : "pending";

        const caseEmotion =
          typeof caseData.dominantEmotion ===
            "string" &&
          caseData.dominantEmotion.trim()
            ? caseData.dominantEmotion
            : "Unknown";

        const caseConfidence =
          Number(caseData.emotionPercentage) ||
          0;

        const mainDoctorRecommendation =
          typeof caseData.doctorRecommendation ===
          "string"
            ? caseData.doctorRecommendation.trim()
            : "";

        const doctorRecommendations =
          Array.isArray(
            caseData.doctorRecommendations
          )
            ? caseData.doctorRecommendations
            : [];

        const doctorResponseExists =
          Boolean(mainDoctorRecommendation) ||
          doctorRecommendations.length > 0;

        const fallbackDate =
          caseData.lastAnalysisDate ||
          caseData.createdAt ||
          new Date();

        const textAnalyses =
          Array.isArray(caseData.textAnalyses)
            ? caseData.textAnalyses
            : [];

        textAnalyses.forEach((entry, index) => {
          const entryId =
            entry?._id?.toString?.() ||
            `text-${caseData._id}-${index}`;

          entries.push({
            id: entryId,

            caseId:
              caseData._id?.toString?.() ||
              "",

            date:
              entry?.createdAt ||
              fallbackDate,

            type: "Text Entry",

            emotion:
              typeof entry?.emotion ===
                "string" &&
              entry.emotion.trim()
                ? entry.emotion
                : caseEmotion,

            description:
              (typeof entry?.analysisResult ===
                "string" &&
              entry.analysisResult.trim()
                ? entry.analysisResult
                : "") ||
              (typeof entry?.content === "string" &&
              entry.content.trim()
                ? entry.content
                : "") ||
              "Text analysis entry",

            status: caseStatus,

            confidence:
              Number(entry?.confidence) ||
              caseConfidence,

            doctorResponseExists,
          });
        });

        const drawings =
          Array.isArray(caseData.drawings)
            ? caseData.drawings
            : [];

        drawings.forEach((entry, index) => {
          const entryId =
            entry?._id?.toString?.() ||
            `drawing-${caseData._id}-${index}`;

          entries.push({
            id: entryId,

            caseId:
              caseData._id?.toString?.() ||
              "",

            date:
              entry?.createdAt ||
              fallbackDate,

            type: "Drawing Entry",

            emotion:
              typeof entry?.emotion ===
                "string" &&
              entry.emotion.trim()
                ? entry.emotion
                : caseEmotion,

            description:
              typeof entry?.analysisResult ===
                "string" &&
              entry.analysisResult.trim()
                ? entry.analysisResult
                : "Drawing analysis entry",

            status: caseStatus,

            confidence:
              Number(entry?.confidence) ||
              caseConfidence,

            doctorResponseExists,

            imageUrl:
              typeof entry?.imageUrl ===
              "string"
                ? entry.imageUrl
                : "",
          });
        });

        const voiceAnalyses =
          Array.isArray(caseData.voiceAnalyses)
            ? caseData.voiceAnalyses
            : [];

        voiceAnalyses.forEach(
          (entry, index) => {
            const entryId =
              entry?._id?.toString?.() ||
              `voice-${caseData._id}-${index}`;

            entries.push({
              id: entryId,

              caseId:
                caseData._id?.toString?.() ||
                "",

              date:
                entry?.createdAt ||
                fallbackDate,

              type: "Voice Entry",

              emotion:
                typeof entry?.emotion ===
                  "string" &&
                entry.emotion.trim()
                  ? entry.emotion
                  : caseEmotion,

              description:
                (typeof entry?.analysisResult ===
                  "string" &&
                entry.analysisResult.trim()
                  ? entry.analysisResult
                  : "") ||
                (typeof entry?.transcribedText ===
                  "string" &&
                entry.transcribedText.trim()
                  ? entry.transcribedText
                  : "") ||
                "Voice analysis entry",

              status: caseStatus,

              confidence:
                Number(entry?.confidence) ||
                caseConfidence,

              doctorResponseExists,
            });
          }
        );
      });

      entries.sort(
        (firstEntry, secondEntry) => {
          const firstDate =
            new Date(firstEntry.date).getTime() ||
            0;

          const secondDate =
            new Date(
              secondEntry.date
            ).getTime() || 0;

          return secondDate - firstDate;
        }
      );

      const pendingCount =
        entries.filter(
          (entry) =>
            entry.status === "pending"
        ).length;

      const reviewedCount =
        entries.filter(
          (entry) =>
            entry.status === "reviewed" ||
            entry.status === "improving"
        ).length;

      const closedCount =
        entries.filter(
          (entry) =>
            entry.status === "closed"
        ).length;

      console.log(
        "CHILD ENTRIES SUCCESS:",
        entries.length
      );

      return res.status(200).json({
        childInfo: {
          _id: child._id,
          name: child.name,
          age: child.age,
          gender: child.gender,
          notes: child.notes || "",
        },

        counts: {
          all: entries.length,
          pending: pendingCount,
          reviewed: reviewedCount,
          closed: closedCount,
        },

        entries,
      });
    } catch (err) {
      console.error(
        "GET CHILD ENTRIES ERROR:",
        err
      );

      return res.status(500).json({
        error:
          "Failed to fetch child entries",

        message:
          err?.message ||
          "Unexpected error while loading entries",
      });
    }
<<<<<<< Updated upstream
});
router.post('/add-entry', checkToken, upload, async (req, res) => {
    try {
        const { childId, text } = req.body;
        
        const child = await Child.findById(childId);
        if (!child) return res.status(404).json({ error: "Child not found" });

        // 1. حفظ المدخلات في قاعدة البيانات (كما فعلتِ)
        const newEntry = await Entry.create({
            childId,
            parentId: req.user.id,
            text,
            audioUrl: req.files.audio ? req.files.audio[0].path : null,
            imageUrl: req.files.file ? req.files.file[0].path : null
        });

        // 2. تجهيز البيانات للـ AI
        const formData = new FormData();
        formData.append('child_id', childId);
        formData.append('text', text || "");
        if (req.files.file) formData.append('file', fs.createReadStream(req.files.file[0].path));
        if (req.files.audio) formData.append('audio', fs.createReadStream(req.files.audio[0].path));

        // 3. إرسال الطلب للـ AI Engine
        const aiResponse = await axios.post('http://127.0.0.1:8000/predict', formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });

        // 4. هنا نقوم بتحديث الـ Case بناءً على النتيجة (بنفس منطق الـ analyzeController)
        // يمكنك استدعاء دالة معالجة النتائج التي كتبناها سابقاً لتحديث الـ Case
       
        const updatedCase = await updateCaseWithAIResults(childId, child.doctorId, aiResponse.data);
        // 5. إبلاغ الطبيب بوجود مدخل جديد (New Parent Follow-up)
        // نستدعي دالة الإشعارات التي كتبناها مسبقاً
        await sendDoctorNotification({
    doctorId: child.doctorId, 
    childId: childId,
            title: "New Parent Follow-up",
            message: `Parent added new information about ${childId}'s recent emotional behavior.`,
            type: 'follow_up'
        });

        res.json({ success: true, entry: newEntry, aiResult: aiResponse.data, case:updatedCase });
    } catch (err) {
        console.error("Error in add-entry integration:", err);
        res.status(500).json({ error: 'Failed to process entry and analyze with AI' });
    }
});
router.get('/progress-stats/:childId', checkToken, async (req, res) => {
    try {
        const caseData = await Case.findOne({ childId: req.params.childId });
        
        if (!caseData) {
            return res.json({ entries: 0, reviewed: 0, insights: 0 });
        }

        // حساب القيم بناءً على البيانات الموجودة في الـ Case
        const stats = {
            entries: caseData.entriesCount || 0, // إجمالي المدخلات
            
            // عدد المدخلات التي تمت مراجعتها من الطبيب 
            // (نبحث في الـ analysisTimeline عن الحالات التي قيمتها الطبيب)
            reviewed: caseData.analysisTimeline.filter(item => item.diagnosis !== "تحت المتابعة").length,
            
            // عدد الرؤى (يمكن اعتبارها عدد التحليلات النصية أو مجموع التقارير)
            insights: caseData.textAnalyses ? caseData.textAnalyses.length : 0
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
router.get('/child-progress/:childId', checkToken, async (req, res) => {
    try {
        const caseData = await Case.findOne({ childId: req.params.childId })
            .populate('doctorRecommendations'); // لجلب توصيات الطبيب

        if (!caseData) return res.status(404).json({ msg: "No progress data yet" });

        res.json({
            summary: caseData.aiSummary, // الـ Long-term Summary
            stats: {
                entries: caseData.entriesCount,
                reviewed: caseData.analysisTimeline.filter(a => a.status === 'reviewed').length,
                insights: caseData.textAnalyses.length
            },
            trends: caseData.emotionalTrend, // لعمل الـ Chart
            patterns: caseData.recurringPatterns, // "School anxiety", "Sleep routine"
            latestDoctorInsight: caseData.doctorRecommendations[0] // أحدث توصية من الدكتور
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});
router.get('/entry-timeline/:childId', checkToken, async (req, res) => {
    try {
        const entries = await Entry.find({ childId: req.params.childId })
            .sort({ createdAt: -1 }); // الترتيب من الأحدث للأقدم
            
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch timeline" });
    }
});
router.get('/recommendations/:childId', checkToken, async (req, res) => {
    try {
        const caseData = await Case.findOne({ childId: req.params.childId });
        if (!caseData) return res.status(404).json({ error: "No data found" });
        
        res.json(caseData.doctorRecommendations);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/my-notifications', checkToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 }); // الترتيب من الأحدث للأقدم
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});
router.patch('/read/:notificationId', checkToken, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
        res.status(200).json({ msg: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update notification" });
    }
});

module.exports = router;
=======
  }
);

/* =========================
   Get One Child
   GET /api/children/:childId
========================= */

router.get(
  "/:childId",
  checkToken,
  async (req, res) => {
    try {
      const child = await Child.findOne({
        _id: req.params.childId,
        parentId: req.user._id,
      });

      if (!child) {
        return res.status(404).json({
          msg: "Child not found",
        });
      }

      return res.status(200).json(child);
    } catch (err) {
      console.error(
        "GET CHILD DETAILS ERROR:",
        err
      );

      return res.status(500).json({
        error:
          "Failed to fetch child details",
      });
    }
  }
);

/* =========================
   Add Child
   POST /api/children/add
========================= */

router.post(
  "/add",
  checkToken,
  async (req, res) => {
    try {
      const {
        name,
        age,
        gender,
        notes,
      } = req.body;

      const newChild = new Child({
        name:
          typeof name === "string"
            ? name.trim()
            : name,

        age: Number(age),

        gender:
          typeof gender === "string"
            ? gender
                .toLowerCase()
                .trim()
            : gender,

        notes:
          typeof notes === "string"
            ? notes.trim()
            : "",

        parentId: req.user._id,
      });

      await newChild.save();

      return res.status(201).json({
        message:
          "Child added successfully",
        child: newChild,
      });
    } catch (err) {
      console.error(
        "ADD CHILD ERROR:",
        err
      );

      return res.status(500).json({
        error: err.message,
      });
    }
  }
);

/* =========================
   Delete Child
   DELETE /api/children/:childId
========================= */

router.delete(
  "/:childId",
  checkToken,
  async (req, res) => {
    try {
      const child =
        await Child.findOneAndDelete({
          _id: req.params.childId,
          parentId: req.user._id,
        });

      if (!child) {
        return res.status(404).json({
          msg: "Child not found",
        });
      }

      return res.status(200).json({
        msg:
          "Child and all their data deleted successfully",
      });
    } catch (err) {
      console.error(
        "DELETE CHILD ERROR:",
        err
      );

      return res.status(500).json({
        error: "Failed to delete child",
      });
    }
  }
);

/* =========================
   Update Child
   PUT /api/children/:childId
========================= */

router.put(
  "/:childId",
  checkToken,
  async (req, res) => {
    try {
      const {
        name,
        age,
        gender,
        notes,
      } = req.body;

      const updatedChild =
        await Child.findOneAndUpdate(
          {
            _id: req.params.childId,
            parentId: req.user._id,
          },
          {
            $set: {
              name:
                typeof name === "string"
                  ? name.trim()
                  : name,

              age: Number(age),

              gender:
                typeof gender === "string"
                  ? gender
                      .toLowerCase()
                      .trim()
                  : gender,

              notes:
                typeof notes === "string"
                  ? notes.trim()
                  : "",
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

      if (!updatedChild) {
        return res.status(404).json({
          msg: "Child not found",
        });
      }

      return res.status(200).json({
        msg:
          "Child updated successfully",
        child: updatedChild,
      });
    } catch (err) {
      console.error(
        "UPDATE CHILD ERROR:",
        err
      );

      return res.status(500).json({
        error:
          "Failed to update child",

        message:
          err?.message ||
          "Unexpected error while updating child",
      });
    }
  }
);

module.exports = router;

>>>>>>> Stashed changes
