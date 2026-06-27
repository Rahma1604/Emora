const express = require("express");
const mongoose = require("mongoose");

const Case = require("../models/Case");
const Notification = require("../models/Notification");
const { checkToken } = require("../middleware/authMiddleware");
const {
  sendNotification: sendParentNotification,
} = require("../services/notificationPService");

const router = express.Router();

/* =====================================================
   CHECK DOCTOR
===================================================== */

const checkDoctor = (req, res, next) => {
  if (!req.user || req.user.role !== "doctor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Doctors only.",
    });
  }

  if (req.user.verificationStatus !== "approved") {
    return res.status(403).json({
      success: false,
      message: "Doctor account is not approved.",
    });
  }

  return next();
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

const getDoctorId = (req) => req.user._id || req.user.id;

const getDoctorObjectId = (req) => {
  const doctorId = getDoctorId(req);

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(String(doctorId));
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const escapeRegex = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

router.get("/dashboard-stats", async (req, res) => {
  try {
    const doctorId = getDoctorId(req);

    const oneWeekAgo = new Date();

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
      childrenFollowed: childrenIds.length,
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
  }
});

/* =====================================================
   PENDING CASES
   GET /api/doctor/pending-cases
===================================================== */

router.get("/pending-cases", async (req, res) => {
  try {
    const doctorId = getDoctorId(req);

    const cases = await Case.find({
      doctorId,
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
      .lean();

    const formattedCases = cases
      .filter(
        (caseItem) =>
          caseItem.childId !== null
      )
      .map((caseItem) => ({
        ...caseItem,

        childName:
          caseItem.childId.name,

        summary:
          caseItem.aiDiagnosis ||
          caseItem.aiSummary ||
          "No summary available",

        type:
          caseItem.dominantEmotion ||
          "General",
      }));

    return res
      .status(200)
      .json(formattedCases);
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
});

/* =====================================================
   RECENT ACTIVITY
   GET /api/doctor/recent-activity
===================================================== */

router.get("/recent-activity", async (req, res) => {
  try {
    const doctorId = getDoctorId(req);

    const recentCases = await Case.find({
      doctorId,
    })
      .populate("childId", "name")
      .sort({
        lastAnalysisDate: -1,
        updatedAt: -1,
      })
      .limit(5)
      .lean();

    const activityLog = recentCases
      .filter(
        (caseItem) =>
          caseItem.childId !== null
      )
      .map((caseItem) => {
        let activity =
          "تم تحديث الحالة";

        if (
          caseItem.status === "reviewed"
        ) {
          activity =
            "تم إرسال رد الطبيب";
        } else if (
          Array.isArray(
            caseItem.analysisTimeline
          ) &&
          caseItem.analysisTimeline
            .length > 0
        ) {
          activity =
            "تم رفع تحليل جديد";
        }

        return {
          caseId: caseItem._id,

          childId:
            caseItem.childId?._id,

          childName:
            caseItem.childId?.name ||
            "Unknown child",

          activity,

          time:
            caseItem.lastAnalysisDate ||
            caseItem.updatedAt ||
            caseItem.createdAt,
        };
      });

    return res
      .status(200)
      .json(activityLog);
  } catch (error) {
    console.error(
      "RECENT ACTIVITY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while fetching recent activity.",
    });
  }
});

/* =====================================================
   CASE DETAILS
   GET /api/doctor/case-details/:caseId
===================================================== */

router.get(
  "/case-details/:caseId",
  async (req, res) => {
    try {
      const { caseId } = req.params;
      const doctorId =
        getDoctorId(req);

      if (
        !isValidObjectId(caseId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid case ID.",
        });
      }

      const caseData =
        await Case.findOne({
          _id: caseId,
          doctorId,
        }).populate(
          "childId",
          "name age gender parentId"
        );

      if (!caseData) {
        return res.status(404).json({
          success: false,
          message: "Case not found.",
        });
      }

      if (!caseData.childId) {
        return res.status(404).json({
          success: false,
          message:
            "Child associated with this case was not found.",
        });
      }

      const latestTextAnalysis =
        Array.isArray(
          caseData.textAnalyses
        ) &&
        caseData.textAnalyses.length > 0
          ? caseData.textAnalyses[
              caseData.textAnalyses
                .length - 1
            ]
          : null;

      return res.status(200).json({
        caseId: caseData._id,

        childId:
          caseData.childId._id,

        childInfo: {
          id:
            caseData.childId._id,

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

        progressStatus: {
          label:
            caseData.childProgress ||
            caseData.status,

          description:
            caseData.progressDescription ||
            "Showing gradual improvement, but still needs monitoring.",
        },

        entriesInfo: {
          totalEntries:
            caseData.entriesCount ||
            0,

          lastAnalysisDate:
            caseData.lastAnalysisDate,
        },

        currentAnalysis: {
          text:
            latestTextAnalysis?.content ||
            latestTextAnalysis?.text ||
            "لا يوجد تحليل نصي متاح حالياً.",
        },

        emotionData: {
          emotion:
            caseData.dominantEmotion,

          percentage:
            caseData.emotionPercentage,

          keywords:
            caseData.recurringPatterns ||
            [],
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

        childProgress:
          caseData.childProgress,

        status:
          caseData.status,

        priority:
          caseData.priority,

        doctorRecommendation:
          caseData.doctorRecommendation ||
          "",

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

      const doctorId =
        getDoctorId(req);

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
          doctorId,
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

        childProgress:
          latestCase.childProgress,

        doctorRecommendation:
          latestCase.doctorRecommendation ||
          "",

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

      const doctorId =
        getDoctorId(req);

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
            doctorId,
          },
          {
            $set: {
              doctorRecommendation,
              status: "reviewed",
            },

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

      let notificationSent =
        false;

      if (
        updatedCase.childId
          ?.parentId
      ) {
        try {
          await sendParentNotification({
            userId:
              updatedCase.childId
                .parentId,

            childId:
              updatedCase.childId._id,

            title:
              "Analysis Reviewed",

            message: `Dr. ${
              req.user.name ||
              "Doctor"
            } has reviewed your child's case.`,

            type:
              "doctor_review",

              data: { recommendation: doctorRecommendation }
          });

          notificationSent = true;
        } catch (
          notificationError
        ) {
          console.error(
            "PARENT NOTIFICATION ERROR:",
            notificationError
          );
        }
      }

      return res.status(200).json({
        success: true,

        message:
          "Case reviewed successfully.",

        notificationSent,

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
      getDoctorId(req);

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
        getDoctorId(req);

      const doctorObjectId =
        getDoctorObjectId(req);

      if (!doctorObjectId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid doctor ID.",
        });
      }

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

        Case.aggregate([
          {
            $match: {
              doctorId:
                doctorObjectId,

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
        averageResult.length > 0 &&
        Number.isFinite(
          averageResult[0]
            .avgTimeMinutes
        )
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
        getDoctorId(req);

      const doctorObjectId =
        getDoctorObjectId(req);

      if (!doctorObjectId) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid doctor ID.",
        });
      }

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

/* =====================================================
   NOTIFICATIONS
   GET /api/doctor/notifications
===================================================== */

router.get(
  "/notifications",
  async (req, res) => {
    try {
      const doctorId =
        getDoctorId(req);

      const unreadOnly =
        String(
          req.query.unreadOnly ||
            ""
        ).toLowerCase();

      const query = {
        doctorId,
      };

      if (
        unreadOnly === "true"
      ) {
        query.isRead = false;
      }

      const notifications =
        await Notification.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .lean();

          

      return res
        .status(200)
        .json(notifications);
    } catch (error) {
      console.error(
        "GET NOTIFICATIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while fetching notifications.",
      });
    }
  }
);

/* =====================================================
   MARK ALL NOTIFICATIONS AS READ
   PUT /api/doctor/notifications/mark-all-read
===================================================== */

router.put(
  "/notifications/mark-all-read",
  async (req, res) => {
    try {
      const doctorId =
        getDoctorId(req);

      const result =
        await Notification.updateMany(
          {
            doctorId,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
            },
          }
        );

      return res.status(200).json({
        success: true,

        message:
          "All notifications marked as read.",

        modifiedCount:
          result.modifiedCount || 0,
      });
    } catch (error) {
      console.error(
        "MARK NOTIFICATIONS READ ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while updating notifications.",
      });
    }
  }
);

module.exports = router;