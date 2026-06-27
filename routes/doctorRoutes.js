
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
<<<<<<< Updated upstream
const Case = require('../models/Case');
const { checkToken } = require('../middleware/authMiddleware'); 
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { sendNotification:sendParentNotification } = require('../services/notificationPService');

=======
>>>>>>> Stashed changes

const Case = require("../models/Case");
const {
  checkToken,
} = require("../middleware/authMiddleware");

/* =====================================================
   CHECK DOCTOR
===================================================== */

<<<<<<< Updated upstream
router.get('/pending-cases', checkToken, async (req, res) => {
  try {
        const cases = await Case.find({ doctorId: req.user.id, status: 'pending' })
            .populate('childId', 'name') // جلب الاسم فقط
            .sort({ createdAt: -1 })
            .limit(5); // جلب أحدث 5 حالات فقط كما هو واضح في الصورة

        const formattedCases = cases.map(c => ({
            _id: c._id,
            childName: c.childId.name,
            childId: c.childId._id, // أو الـ ID الذي يظهر في الصورة
            status: c.status,
            summary: c.aiDiagnosis || "No summary available", // هنا يظهر الملخص الصغير
            type: c.dominantEmotion || "General" // هنا يظهر نوع المؤشر (مثل Anxiety Indicators)
        }));
        
        res.json(formattedCases);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/recent-activity', checkToken, async (req, res) => {
    try {
        const doctorId = req.user.id;
        
        // نجلب آخر 5 حالات تم التعامل معها
        const recentCases = await Case.find({ doctorId })
            .sort({ lastAnalysisDate: -1 })
            .limit(5);

        const activityLog = recentCases.map(c => {
            let activity = "";
            let time = c.lastAnalysisDate;
            
            // المنطق الذكي للنشاط:
            if (c.status === 'reviewed') {
                activity = "تم إرسال رد الطبيب";
            } else if (c.analysisTimeline && c.analysisTimeline.length > 0) {
                activity = "تم رفع تحليل جديد";
            }
            
            return { activity, time };
        });

        res.json(activityLog);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
=======
const checkDoctor = (req, res, next) => {
  if (
    !req.user ||
    req.user.role !== "doctor"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Doctors only.",
    });
  }

  if (
    req.user.verificationStatus !==
    "approved"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Doctor account is not approved.",
    });
  }

  next();
};

/*
  كل المسارات الموجودة في الملف:
  1- تحتاج Token صحيح.
  2- تحتاج أن يكون المستخدم Doctor معتمد.
*/
router.use(checkToken);
router.use(checkDoctor);

/* =====================================================
   HELPERS
===================================================== */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

const escapeRegex = (value) => {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const allowedStatuses = [
  "pending",
  "reviewed",
  "closed",
  "improving",
];

/* =====================================================
   DASHBOARD STATISTICS
   GET /api/doctor/dashboard-stats
===================================================== */

router.get(
  "/dashboard-stats",
  async (req, res) => {
    try {
      const doctorId =
        req.user._id;

      const oneWeekAgo =
        new Date();

      oneWeekAgo.setDate(
        oneWeekAgo.getDate() - 7
      );

      const [
        pendingCases,
        reviewedCases,
        newThisWeek,
        childrenIds,
      ] = await Promise.all([
        Case.countDocuments({
          doctorId,
          status: "pending",
        }),

        Case.countDocuments({
          doctorId,
          status: "reviewed",
        }),

        Case.countDocuments({
          doctorId,
          createdAt: {
            $gte: oneWeekAgo,
          },
        }),

        Case.distinct("childId", {
          doctorId,
        }),
      ]);

      return res.status(200).json({
        pendingCases,
        reviewedCases,
        newThisWeek,
        childrenFollowed:
          childrenIds.length,
      });
    } catch (error) {
      console.error(
        "DASHBOARD STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching dashboard statistics.",
      });
>>>>>>> Stashed changes
    }
  }
);

/* =====================================================
   PENDING CASES
   GET /api/doctor/pending-cases
===================================================== */

router.get(
  "/pending-cases",
  async (req, res) => {
    try {
<<<<<<< Updated upstream
        
       const caseData = await Case.findById(req.params.caseId)
            .populate('childId', 'name age gender');
        if (!caseData) {
            return res.status(404).json({ msg: 'Case not found' });
        }
        res.json({childInfo: {
                name: caseData.childId.name,
                age: caseData.childId.age,
                },
           progressStatus: {
                label: caseData.childProgress, // "Improving"
                description: "Showing gradual improvement, but still needs monitoring." // يمكن جعلها ديناميكية لاحقاً
            },
            entriesInfo: {
                totalEntries: caseData.entriesCount,
                lastAnalysisDate: caseData.lastAnalysisDate
            },
            currentAnalysis: {
                text: caseData.textAnalyses && caseData.textAnalyses.length > 0 
                      ? caseData.textAnalyses[caseData.textAnalyses.length - 1].content 
                      : "لا يوجد تحليل نصي متاح حالياً."
            },
            emotionData: {
                emotion: caseData.dominantEmotion, // "Anxiety"
                percentage: caseData.emotionPercentage, // "75%"
                keywords: ["School", "Fear", "Sleep", "Stress"] // هذه يجب استخراجها من الـ patterns في الـ Schema
            },
            aiSummary: caseData.aiSummary,
            status: caseData.status,
            doctorRecommendation: caseData.doctorRecommendation || ""
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching case details' });
    }
});
router.get('/child-overview/:childId', checkToken, async (req, res) => {
    try {
        const latestCase = await Case.findOne({ 
            doctorId: req.user.id, 
            childId: req.params.childId 
=======
      const cases = await Case.find({
        doctorId: req.user._id,
        status: "pending",
      })
        .populate(
          "childId",
          "name age gender parentId"
        )
        .sort({
          createdAt: -1,
>>>>>>> Stashed changes
        })
        .lean();

<<<<<<< Updated upstream
        if (!latestCase) return res.status(404).json({ msg: 'No data found for this child' });

        res.json({
            childInfo: latestCase.childId,
            longTermSummary: latestCase.aiSummary, 
            currentStatus: latestCase.status,    
            emotionalTrend: latestCase.emotionalTrend,
            mostFrequentEmotions: latestCase.frequentEmotions, 
            analysisTimeline: latestCase.analysisTimeline, 
           childProgress: latestCase.childProgress,
            doctorRecommendations: latestCase.doctorRecommendations, 
            recurringPatterns: latestCase.recurringPatterns
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.put('/review-case/:caseId', checkToken, async (req, res) => {
    try {
        const { doctorRecommendation } = req.body;
        // 1. تحديث الحالة
        const updatedCase = await Case.findByIdAndUpdate(
            req.params.caseId,
            { doctorRecommendation, status: 'reviewed' },
            { new: true }
        ).populate('childId'); // قمنا بعمل populate لجلب بيانات الطفل

        // 2. إرسال إشعار للأب تلقائياً
         await sendParentNotification({
    userId: updatedCase.childId.parentId, 
    childId: updatedCase.childId._id,
    title: "Analysis Reviewed",
    message: `Dr. ${req.user.name} has reviewed your child's case.`,
    type: 'doctor_review'
});

        res.json(updatedCase);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/home-history', checkToken, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { status, search } = req.query;
        
        let query = { doctorId };
        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }
        let cases = await Case.find(query)
            .populate({
                path: 'childId',
                select: 'name age',
                match: search ? { name: { $regex: search, $options: 'i' } } : {} // البحث بالاسم (case-insensitive)
            })
            .sort({ createdAt: -1 });
        const filteredCases = cases.filter(c => c.childId !== null);
        
        res.json(filteredCases);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/history-stats', checkToken, async (req, res) => {
    try {
        const doctorId = new mongoose.Types.ObjectId(req.user.id);
        const stats = await Case.aggregate([
            { $match: { doctorId: doctorId } },
            {
                $group: {
                    _id: null,
                    totalCases: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                    closed: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] } },
                    avgTimeMinutes: { $avg: { $divide: [{ $subtract: [new Date(), "$createdAt"] }, 60000] } } 
                }
            }

        ]);
        const defaultStats = { totalCases: 0, pending: 0, closed: 0, avgTimeMinutes: 0 };
        res.json(stats.length > 0 ? stats[0] : defaultStats);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/history', checkToken, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const { status, search } = req.query;
        
        let query = { doctorId };
        if (status && status !== 'All') {
            query.status = status.toLowerCase();
        }
        let cases = await Case.find(query)
            .populate({
                path: 'childId',
                select: 'name age',
                match: search ? { name: { $regex: search, $options: 'i' } } : {} 
            })
            .sort({ createdAt: -1 });
        const result = cases.filter(c => c.childId !== null);
        
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/weekly-stats', checkToken, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const newCases = await Case.countDocuments({ doctorId, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });
        const reviewedCases = await Case.countDocuments({ doctorId, status: 'reviewed' });
        const activeCases = await Case.countDocuments({ doctorId, status: 'pending' });
=======
      const validCases =
        cases.filter(
          (caseItem) =>
            caseItem.childId !== null
        );
>>>>>>> Stashed changes

      return res
        .status(200)
        .json(validCases);
    } catch (error) {
      console.error(
        "PENDING CASES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching pending cases.",
      });
    }
  }
);

/* =====================================================
   CASE DETAILS
   GET /api/doctor/case-details/:caseId
===================================================== */

router.get(
  "/case-details/:caseId",
  async (req, res) => {
    try {
      const { caseId } =
        req.params;

      if (
        !isValidObjectId(caseId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid case ID.",
        });
      }

      /*
        البحث بالحالة والدكتور معًا
        يمنع الدكتور من فتح حالة
        تابعة لدكتور آخر.
      */
      const caseData =
        await Case.findOne({
          _id: caseId,
          doctorId:
            req.user._id,
        }).populate(
          "childId",
          "name age gender parentId"
        );

      if (!caseData) {
        return res.status(404).json({
          success: false,
          message:
            "Case not found.",
        });
      }

      if (!caseData.childId) {
        return res.status(404).json({
          success: false,
          message:
            "Child associated with this case was not found.",
        });
      }

      return res.status(200).json({
        caseId: caseData._id,
        childId:
          caseData.childId._id,

        childInfo: {
          id: caseData.childId._id,
          name:
            caseData.childId.name,
          age:
            caseData.childId.age,
          gender:
            caseData.childId.gender,
          parentId:
            caseData.childId
              .parentId,
        },

        analysisHistory: {
          drawings:
            caseData.drawings || [],
          textAnalyses:
            caseData.textAnalyses ||
            [],
        },

        entriesCount:
          caseData.entriesCount,

        lastAnalysisDate:
          caseData.lastAnalysisDate,

        dominantEmotion:
          caseData.dominantEmotion,

        emotionPercentage:
          caseData.emotionPercentage,

        aiDiagnosis:
          caseData.aiDiagnosis,

        aiSummary:
          caseData.aiSummary,

        status:
          caseData.status,

        priority:
          caseData.priority,

        doctorRecommendation:
          caseData.doctorRecommendation,

        doctorRecommendations:
          caseData.doctorRecommendations ||
          [],

        recurringPatterns:
          caseData.recurringPatterns ||
          [],

        createdAt:
          caseData.createdAt,
      });
    } catch (error) {
      console.error(
        "CASE DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching case details.",
      });
    }
<<<<<<< Updated upstream
});

// 1. جلب الإشعارات (مع خيار التصفية بين الكل وغير المقروء)
router.get('/notifications', checkToken, async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        let query = { doctorId: req.user.id };
        if (unreadOnly === 'true') query.isRead = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 }); // الترتيب من الأحدث للأقدم

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. تحديث الكل إلى "مقروء" (زر Mark all as read في الصور)
router.put('/notifications/mark-all-read', checkToken, async (req, res) => {
    try {
        await Notification.updateMany({ doctorId: req.user.id, isRead: false }, { isRead: true });
        res.json({ message: "All notifications marked as read." });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
module.exports = router;
=======
  }
);

/* =====================================================
   CHILD OVERVIEW
   GET /api/doctor/child-overview/:childId
===================================================== */

router.get(
  "/child-overview/:childId",
  async (req, res) => {
    try {
      const { childId } =
        req.params;

      if (
        !isValidObjectId(childId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid child ID.",
        });
      }

      const latestCase =
        await Case.findOne({
          doctorId:
            req.user._id,
          childId,
        })
          .populate(
            "childId",
            "name age gender parentId"
          )
          .sort({
            createdAt: -1,
          });

      if (!latestCase) {
        return res.status(404).json({
          success: false,
          message:
            "No data found for this child.",
        });
      }

      if (!latestCase.childId) {
        return res.status(404).json({
          success: false,
          message:
            "Child was not found.",
        });
      }

      return res.status(200).json({
        childInfo: {
          id:
            latestCase.childId._id,
          name:
            latestCase.childId.name,
          age:
            latestCase.childId.age,
          gender:
            latestCase.childId.gender,
          parentId:
            latestCase.childId
              .parentId,
        },

        latestCaseId:
          latestCase._id,

        longTermSummary:
          latestCase.aiSummary,

        currentStatus:
          latestCase.status,

        priority:
          latestCase.priority,

        emotionalTrend:
          latestCase.emotionalTrend ||
          [],

        mostFrequentEmotions:
          latestCase.frequentEmotions ||
          [],

        analysisTimeline:
          latestCase.analysisTimeline ||
          [],

        doctorRecommendation:
          latestCase.doctorRecommendation,

        doctorRecommendations:
          latestCase.doctorRecommendations ||
          [],

        recurringPatterns:
          latestCase.recurringPatterns ||
          [],
      });
    } catch (error) {
      console.error(
        "CHILD OVERVIEW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching child overview.",
      });
    }
  }
);

/* =====================================================
   REVIEW CASE
   PUT /api/doctor/review-case/:caseId
===================================================== */

router.put(
  "/review-case/:caseId",
  async (req, res) => {
    try {
      const { caseId } =
        req.params;

      const doctorRecommendation =
        String(
          req.body
            .doctorRecommendation ||
            ""
        ).trim();

      if (
        !isValidObjectId(caseId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid case ID.",
        });
      }

      if (
        !doctorRecommendation
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Doctor recommendation is required.",
        });
      }

      const updatedCase =
        await Case.findOneAndUpdate(
          {
            _id: caseId,
            doctorId:
              req.user._id,
          },
          {
            $set: {
              doctorRecommendation,
              status: "reviewed",
            },

            /*
              حفظ التوصية الحالية
              داخل سجل التوصيات أيضًا.
            */
            $push: {
              doctorRecommendations: {
                note:
                  doctorRecommendation,
                date: new Date(),
              },
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).populate(
          "childId",
          "name age gender parentId"
        );

      if (!updatedCase) {
        return res.status(404).json({
          success: false,
          message:
            "Case not found or you are not authorized to review it.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Case reviewed successfully.",
        case: updatedCase,
      });
    } catch (error) {
      console.error(
        "REVIEW CASE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while reviewing the case.",
      });
    }
  }
);

/* =====================================================
   HISTORY HANDLER
===================================================== */

const getDoctorHistory = async (
  req,
  res
) => {
  try {
    const doctorId =
      req.user._id;

    const status =
      String(
        req.query.status || ""
      ).trim();

    const search =
      String(
        req.query.search || ""
      ).trim();

    const query = {
      doctorId,
    };

    if (
      status &&
      status.toLowerCase() !==
        "all"
    ) {
      const normalizedStatus =
        status.toLowerCase();

      if (
        !allowedStatuses.includes(
          normalizedStatus
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid case status.",
        });
      }

      query.status =
        normalizedStatus;
    }

    const safeSearch =
      escapeRegex(search);

    const cases = await Case.find(
      query
    )
      .populate({
        path: "childId",
        select:
          "name age gender parentId",

        match: safeSearch
          ? {
              name: {
                $regex:
                  safeSearch,
                $options: "i",
              },
            }
          : {},
      })
      .sort({
        createdAt: -1,
      })
      .lean();

    const result =
      cases.filter(
        (caseItem) =>
          caseItem.childId !== null
      );

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      "DOCTOR HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching case history.",
    });
  }
};

/* =====================================================
   HOME HISTORY
   GET /api/doctor/home-history
===================================================== */

router.get(
  "/home-history",
  getDoctorHistory
);

/* =====================================================
   FULL HISTORY
   GET /api/doctor/history
===================================================== */

router.get(
  "/history",
  getDoctorHistory
);

/* =====================================================
   HISTORY STATISTICS
   GET /api/doctor/history-stats
===================================================== */

router.get(
  "/history-stats",
  async (req, res) => {
    try {
      const doctorId =
        new mongoose.Types.ObjectId(
          req.user._id
        );

      const [
        totalCases,
        pending,
        reviewed,
        closed,
        improving,
        averageResult,
      ] = await Promise.all([
        Case.countDocuments({
          doctorId,
        }),

        Case.countDocuments({
          doctorId,
          status: "pending",
        }),

        Case.countDocuments({
          doctorId,
          status: "reviewed",
        }),

        Case.countDocuments({
          doctorId,
          status: "closed",
        }),

        Case.countDocuments({
          doctorId,
          status: "improving",
        }),

        /*
          حساب متوسط وقت المراجعة
          من وقت إنشاء الحالة حتى
          تاريخ أول توصية للدكتور.
        */
        Case.aggregate([
          {
            $match: {
              doctorId,
              "doctorRecommendations.0":
                {
                  $exists: true,
                },
            },
          },

          {
            $project: {
              reviewTimeMinutes: {
                $divide: [
                  {
                    $subtract: [
                      {
                        $arrayElemAt: [
                          "$doctorRecommendations.date",
                          0,
                        ],
                      },

                      "$createdAt",
                    ],
                  },

                  1000 * 60,
                ],
              },
            },
          },

          {
            $match: {
              reviewTimeMinutes: {
                $gte: 0,
              },
            },
          },

          {
            $group: {
              _id: null,

              avgTimeMinutes: {
                $avg:
                  "$reviewTimeMinutes",
              },
            },
          },
        ]),
      ]);

      const avgTimeMinutes =
        averageResult.length > 0
          ? Number(
              averageResult[0]
                .avgTimeMinutes.toFixed(
                  1
                )
            )
          : 0;

      return res.status(200).json({
        totalCases,
        pending,
        reviewed,
        closed,
        improving,
        avgTimeMinutes,
      });
    } catch (error) {
      console.error(
        "HISTORY STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching history statistics.",
      });
    }
  }
);

/* =====================================================
   WEEKLY STATISTICS
   GET /api/doctor/weekly-stats
===================================================== */

router.get(
  "/weekly-stats",
  async (req, res) => {
    try {
      const doctorId =
        req.user._id;

      const doctorObjectId =
        new mongoose.Types.ObjectId(
          doctorId
        );

      const oneWeekAgo =
        new Date(
          Date.now() -
            7 *
              24 *
              60 *
              60 *
              1000
        );

      const [
        newCases,
        reviewedCases,
        activeCases,
        emotionCounts,
        attentionRequired,
      ] = await Promise.all([
        Case.countDocuments({
          doctorId,
          createdAt: {
            $gte: oneWeekAgo,
          },
        }),

        /*
          الحالات التي تمت مراجعتها
          خلال آخر سبعة أيام.
        */
        Case.countDocuments({
          doctorId,
          status: "reviewed",

          doctorRecommendations: {
            $elemMatch: {
              date: {
                $gte: oneWeekAgo,
              },
            },
          },
        }),

        Case.countDocuments({
          doctorId,
          status: "pending",
        }),

        Case.aggregate([
          {
            $match: {
              doctorId:
                doctorObjectId,

              createdAt: {
                $gte: oneWeekAgo,
              },

              dominantEmotion: {
                $nin: [
                  null,
                  "",
                ],
              },
            },
          },

          {
            $group: {
              _id:
                "$dominantEmotion",

              count: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              count: -1,
            },
          },
        ]),

        Case.find({
          doctorId,
          priority: "High",
          status: "pending",
        })
          .populate(
            "childId",
            "name age gender parentId"
          )
          .sort({
            createdAt: -1,
          })
          .limit(5)
          .lean(),
      ]);

      const totalEmotionCases =
        emotionCounts.reduce(
          (total, item) =>
            total + item.count,
          0
        );

      const emotionStats =
        emotionCounts.map(
          (item) => ({
            emotion: item._id,

            count: item.count,

            percentage:
              totalEmotionCases > 0
                ? Number(
                    (
                      (item.count /
                        totalEmotionCases) *
                      100
                    ).toFixed(1)
                  )
                : 0,
          })
        );

      const validAttentionCases =
        attentionRequired.filter(
          (caseItem) =>
            caseItem.childId !==
            null
        );

      return res.status(200).json({
        summary: {
          newCases,
          reviewedCases,
          activeCases,
        },

        emotionStats,

        attentionRequired:
          validAttentionCases,
      });
    } catch (error) {
      console.error(
        "WEEKLY STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching weekly statistics.",
      });
    }
  }
);

module.exports = router;

>>>>>>> Stashed changes
