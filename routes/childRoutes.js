const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const multer = require("multer");

const router = express.Router();

const Child = require("../models/Child");
const Case = require("../models/Case");
const Entry = require("../models/entry");
const Notification = require("../models/NotificationP");
const User = require("../models/User");

const {
  updateCaseWithAIResults,
} = require("../services/caseService");

const {
  sendNotification: sendDoctorNotification,
} = require("../services/notificationService");

const {
  checkToken,
} = require("../middleware/authMiddleware");

const upload = multer({
  dest: "uploads/",
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

/*
  اختيار أقل دكتور في عدد الأطفال المسندين إليه.
  ولو عدد الأطفال متساوٍ، يتم اختيار الأقل في الحالات النشطة.
*/
const findAvailableDoctor =
  async () => {
    const doctors =
      await User.find({
        role: "doctor",
        verificationStatus:
          "approved",
        isVerified: true,
      }).select(
        "_id fullName"
      );

    if (
      !doctors ||
      doctors.length === 0
    ) {
      return null;
    }

    const doctorsWithLoad =
      await Promise.all(
        doctors.map(
          async (doctor) => {
            const [
              assignedChildren,
              activeCases,
            ] =
              await Promise.all([
                Child.countDocuments({
                  doctorId:
                    doctor._id,
                }),

                Case.countDocuments({
                  doctorId:
                    doctor._id,

                  status: {
                    $in: [
                      "pending",
                      "reviewed",
                    ],
                  },
                }),
              ]);

            return {
              doctor,
              assignedChildren,
              activeCases,
            };
          }
        )
      );

    doctorsWithLoad.sort(
      (
        firstDoctor,
        secondDoctor
      ) => {
        if (
          firstDoctor.assignedChildren !==
          secondDoctor.assignedChildren
        ) {
          return (
            firstDoctor.assignedChildren -
            secondDoctor.assignedChildren
          );
        }

        return (
          firstDoctor.activeCases -
          secondDoctor.activeCases
        );
      }
    );

    return doctorsWithLoad[0]
      .doctor;
  };

/* =========================
   Get All Parent Children
   GET /api/children/all
========================= */

router.get(
  "/all",
  checkToken,
  async (req, res) => {
    try {
      const children =
        await Child.find({
          parentId:
            req.user._id,
        });

      return res
        .status(200)
        .json(children);
    } catch (err) {
      console.error(
        "GET CHILDREN ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch children",

          message:
            err.message,
        });
    }
  }
);

/* =========================
   Get Child Overview
   GET /api/children/:childId/overview
========================= */

router.get(
  "/:childId/overview",
  checkToken,
  async (req, res) => {
    try {
      const child =
        await Child.findOne({
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        }).lean();

      if (!child) {
        return res
          .status(404)
          .json({
            message:
              "Child not found",
          });
      }

      const latestCase =
        await Case.findOne({
          childId:
            child._id,
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
        return res
          .status(200)
          .json({
            childInfo:
              child,

            caseData:
              null,

            recentEntries:
              [],
          });
      }

      const caseStatus =
        latestCase.status ||
        "pending";

      const dominantEmotion =
        latestCase.dominantEmotion ||
        "Unknown";

      const confidence =
        Number(
          latestCase.emotionPercentage
        ) || 0;

      const textAnalyses =
        Array.isArray(
          latestCase.textAnalyses
        )
          ? latestCase.textAnalyses
          : [];

      const drawings =
        Array.isArray(
          latestCase.drawings
        )
          ? latestCase.drawings
          : [];

      const audioAnalyses =
        Array.isArray(
          latestCase.audioAnalyses
        )
          ? latestCase.audioAnalyses
          : [];

      const textEntries =
        textAnalyses.map(
          (
            entry,
            index
          ) => ({
            id:
              entry?._id?.toString?.() ||
              `text-${latestCase._id}-${index}`,

            caseId:
              latestCase._id?.toString?.() ||
              "",

            date:
              entry?.createdAt ||
              latestCase.lastAnalysisDate ||
              latestCase.createdAt,

            type:
              "Text Entry",

            emotion:
              typeof entry?.emotion ===
                "string" &&
              entry.emotion.trim()
                ? entry.emotion
                : dominantEmotion,

            description:
              (
                typeof entry?.analysisResult ===
                  "string" &&
                entry.analysisResult.trim()
                  ? entry.analysisResult
                  : ""
              ) ||
              (
                typeof entry?.content ===
                  "string" &&
                entry.content.trim()
                  ? entry.content
                  : ""
              ) ||
              "Text analysis entry",

            status:
              caseStatus,

            confidence:
              Number(
                entry?.confidence
              ) ||
              confidence,
          })
        );

      const drawingEntries =
        drawings.map(
          (
            entry,
            index
          ) => ({
            id:
              entry?._id?.toString?.() ||
              `drawing-${latestCase._id}-${index}`,

            caseId:
              latestCase._id?.toString?.() ||
              "",

            date:
              entry?.createdAt ||
              latestCase.lastAnalysisDate ||
              latestCase.createdAt,

            type:
              "Drawing Entry",

            emotion:
              typeof entry?.emotion ===
                "string" &&
              entry.emotion.trim()
                ? entry.emotion
                : dominantEmotion,

            description:
              typeof entry?.analysisResult ===
                "string" &&
              entry.analysisResult.trim()
                ? entry.analysisResult
                : "Drawing analysis entry",

            status:
              caseStatus,

            confidence:
              Number(
                entry?.confidence
              ) ||
              confidence,

            imageUrl:
              typeof entry?.imageUrl ===
                "string"
                ? entry.imageUrl
                : "",
          })
        );

      const audioEntries =
        audioAnalyses.map(
          (
            entry,
            index
          ) => ({
            id:
              entry?._id?.toString?.() ||
              `audio-${latestCase._id}-${index}`,

            caseId:
              latestCase._id?.toString?.() ||
              "",

            date:
              entry?.createdAt ||
              latestCase.lastAnalysisDate ||
              latestCase.createdAt,

            type:
              "Voice Entry",

            emotion:
              typeof entry?.emotion ===
                "string" &&
              entry.emotion.trim()
                ? entry.emotion
                : dominantEmotion,

            description:
              (
                typeof entry?.analysisResult ===
                  "string" &&
                entry.analysisResult.trim()
                  ? entry.analysisResult
                  : ""
              ) ||
              "Voice analysis entry",

            status:
              caseStatus,

            confidence:
              Number(
                entry?.confidence
              ) ||
              confidence,

            audioUrl:
              typeof entry?.audioUrl ===
                "string"
                ? entry.audioUrl
                : "",
          })
        );

      const recentEntries = [
        ...textEntries,
        ...drawingEntries,
        ...audioEntries,
      ]
        .sort(
          (
            firstEntry,
            secondEntry
          ) => {
            const firstDate =
              new Date(
                firstEntry.date
              ).getTime() ||
              0;

            const secondDate =
              new Date(
                secondEntry.date
              ).getTime() ||
              0;

            return (
              secondDate -
              firstDate
            );
          }
        )
        .slice(0, 5);

      const doctor =
        latestCase.doctorId &&
        typeof latestCase.doctorId ===
          "object"
          ? {
              _id:
                latestCase
                  .doctorId._id,

              fullName:
                latestCase
                  .doctorId
                  .fullName,

              specialization:
                latestCase
                  .doctorId
                  .specialization ||
                "",

              profilePic:
                latestCase
                  .doctorId
                  .profilePic ||
                "",

              isVerified:
                Boolean(
                  latestCase
                    .doctorId
                    .isVerified
                ),
            }
          : null;

      return res
        .status(200)
        .json({
          childInfo:
            child,

          caseData: {
            _id:
              latestCase._id,

            status:
              latestCase.status,

            priority:
              latestCase.priority,

            entriesCount:
              latestCase.entriesCount ||
              textEntries.length +
                drawingEntries.length +
                audioEntries.length,

            lastAnalysisDate:
              latestCase
                .lastAnalysisDate,

            dominantEmotion:
              latestCase
                .dominantEmotion,

            emotionPercentage:
              latestCase
                .emotionPercentage,

            aiDiagnosis:
              latestCase
                .aiDiagnosis ||
              "",

            aiSummary:
              latestCase
                .aiSummary ||
              "",

            doctorRecommendation:
              latestCase
                .doctorRecommendation ||
              "",

            emotionalTrend:
              Array.isArray(
                latestCase
                  .emotionalTrend
              )
                ? latestCase
                    .emotionalTrend
                : [],

            frequentEmotions:
              Array.isArray(
                latestCase
                  .frequentEmotions
              )
                ? latestCase
                    .frequentEmotions
                : [],

            recurringPatterns:
              Array.isArray(
                latestCase
                  .recurringPatterns
              )
                ? latestCase
                    .recurringPatterns
                : [],

            doctorRecommendations:
              Array.isArray(
                latestCase
                  .doctorRecommendations
              )
                ? latestCase
                    .doctorRecommendations
                : [],

            analysisTimeline:
              Array.isArray(
                latestCase
                  .analysisTimeline
              )
                ? latestCase
                    .analysisTimeline
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

      return res
        .status(500)
        .json({
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

      const child =
        await Child.findOne({
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        }).lean();

      if (!child) {
        return res
          .status(404)
          .json({
            message:
              "Child not found",
          });
      }

      const childCases =
        await Case.find({
          childId:
            child._id,
        })
          .sort({
            lastAnalysisDate:
              -1,

            createdAt:
              -1,
          })
          .lean();

      const entries = [];

      childCases.forEach(
        (
          caseData
        ) => {
          const caseStatus =
            typeof caseData.status ===
              "string"
              ? caseData.status
              : "pending";

          const caseEmotion =
            typeof caseData.dominantEmotion ===
              "string" &&
            caseData.dominantEmotion.trim()
              ? caseData.dominantEmotion
              : "Unknown";

          const caseConfidence =
            Number(
              caseData.emotionPercentage
            ) || 0;

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
            Boolean(
              mainDoctorRecommendation
            ) ||
            doctorRecommendations.length >
              0;

          const fallbackDate =
            caseData.lastAnalysisDate ||
            caseData.createdAt ||
            new Date();

          const textAnalyses =
            Array.isArray(
              caseData.textAnalyses
            )
              ? caseData.textAnalyses
              : [];

          textAnalyses.forEach(
            (
              entry,
              index
            ) => {
              const entryId =
                entry?._id?.toString?.() ||
                `text-${caseData._id}-${index}`;

              entries.push({
                id:
                  entryId,

                caseId:
                  caseData._id?.toString?.() ||
                  "",

                date:
                  entry?.createdAt ||
                  fallbackDate,

                type:
                  "Text Entry",

                emotion:
                  typeof entry?.emotion ===
                    "string" &&
                  entry.emotion.trim()
                    ? entry.emotion
                    : caseEmotion,

                description:
                  (
                    typeof entry?.analysisResult ===
                      "string" &&
                    entry.analysisResult.trim()
                      ? entry.analysisResult
                      : ""
                  ) ||
                  (
                    typeof entry?.content ===
                      "string" &&
                    entry.content.trim()
                      ? entry.content
                      : ""
                  ) ||
                  "Text analysis entry",

                status:
                  caseStatus,

                confidence:
                  Number(
                    entry?.confidence
                  ) ||
                  caseConfidence,

                doctorResponseExists,
              });
            }
          );

          const drawings =
            Array.isArray(
              caseData.drawings
            )
              ? caseData.drawings
              : [];

          drawings.forEach(
            (
              entry,
              index
            ) => {
              const entryId =
                entry?._id?.toString?.() ||
                `drawing-${caseData._id}-${index}`;

              entries.push({
                id:
                  entryId,

                caseId:
                  caseData._id?.toString?.() ||
                  "",

                date:
                  entry?.createdAt ||
                  fallbackDate,

                type:
                  "Drawing Entry",

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

                status:
                  caseStatus,

                confidence:
                  Number(
                    entry?.confidence
                  ) ||
                  caseConfidence,

                doctorResponseExists,

                imageUrl:
                  typeof entry?.imageUrl ===
                    "string"
                    ? entry.imageUrl
                    : "",
              });
            }
          );

          const audioAnalyses =
            Array.isArray(
              caseData.audioAnalyses
            )
              ? caseData.audioAnalyses
              : [];

          audioAnalyses.forEach(
            (
              entry,
              index
            ) => {
              const entryId =
                entry?._id?.toString?.() ||
                `voice-${caseData._id}-${index}`;

              entries.push({
                id:
                  entryId,

                caseId:
                  caseData._id?.toString?.() ||
                  "",

                date:
                  entry?.createdAt ||
                  fallbackDate,

                type:
                  "Voice Entry",

                emotion:
                  typeof entry?.emotion ===
                    "string" &&
                  entry.emotion.trim()
                    ? entry.emotion
                    : caseEmotion,

                description:
                  (
                    typeof entry?.analysisResult ===
                      "string" &&
                    entry.analysisResult.trim()
                      ? entry.analysisResult
                      : ""
                  ) ||
                  (
                    typeof entry?.transcribedText ===
                      "string" &&
                    entry.transcribedText.trim()
                      ? entry.transcribedText
                      : ""
                  ) ||
                  "Voice analysis entry",

                status:
                  caseStatus,

                confidence:
                  Number(
                    entry?.confidence
                  ) ||
                  caseConfidence,

                doctorResponseExists,

                audioUrl:
                  typeof entry?.audioUrl ===
                    "string"
                    ? entry.audioUrl
                    : "",
              });
            }
          );
        }
      );

      entries.sort(
        (
          firstEntry,
          secondEntry
        ) => {
          const firstDate =
            new Date(
              firstEntry.date
            ).getTime() ||
            0;

          const secondDate =
            new Date(
              secondEntry.date
            ).getTime() ||
            0;

          return (
            secondDate -
            firstDate
          );
        }
      );

      const pendingCount =
        entries.filter(
          (
            entry
          ) =>
            entry.status ===
            "pending"
        ).length;

      const reviewedCount =
        entries.filter(
          (
            entry
          ) =>
            entry.status ===
              "reviewed" ||
            entry.status ===
              "improving"
        ).length;

      const closedCount =
        entries.filter(
          (
            entry
          ) =>
            entry.status ===
            "closed"
        ).length;

      console.log(
        "CHILD ENTRIES SUCCESS:",
        entries.length
      );

      return res
        .status(200)
        .json({
          childInfo: {
            _id:
              child._id,

            name:
              child.name,

            age:
              child.age,

            gender:
              child.gender,

            notes:
              child.notes ||
              "",
          },

          counts: {
            all:
              entries.length,

            pending:
              pendingCount,

            reviewed:
              reviewedCount,

            closed:
              closedCount,
          },

          entries,
        });
    } catch (err) {
      console.error(
        "GET CHILD ENTRIES ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch child entries",

          message:
            err?.message ||
            "Unexpected error while loading child entries",
        });
    }
  }
);

/* =========================
   Add Entry And Analyze With AI
   POST /api/children/add-entry
========================= */

router.post(
  "/add-entry",
  checkToken,
  upload,
  async (req, res) => {
    try {
      const {
        childId,
        text,
      } = req.body;

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
            error:
              "Child not found",
          });
      }

      /*
        لو الطفل عنده دكتور Approved بالفعل،
        يتم الإبقاء على نفس الدكتور.
      */
      let assignedDoctor =
        null;

      if (child.doctorId) {
        assignedDoctor =
          await User.findOne({
            _id:
              child.doctorId,

            role:
              "doctor",

            verificationStatus:
              "approved",

            isVerified:
              true,
          });
      }

      /*
        لو الطفل قديم ومفيش له دكتور،
        أو الدكتور لم يعد متاحًا،
        يتم اختيار أقل دكتور في الحمل.
      */
      if (!assignedDoctor) {
        assignedDoctor =
          await findAvailableDoctor();

        if (!assignedDoctor) {
          return res
            .status(409)
            .json({
              success:
                false,

              message:
                "No approved doctor is currently available",
            });
        }

        child.doctorId =
          assignedDoctor._id;

        await child.save();
      }

      console.log(
        "ASSIGNED DOCTOR:",
        assignedDoctor._id.toString()
      );

      const audioFile =
        req.files?.audio?.[0];

      const imageFile =
        req.files?.file?.[0];

      const newEntry =
        await Entry.create({
          childId,

          parentId:
            req.user._id,

          text,

          audioUrl:
            audioFile
              ? audioFile.path
              : null,

          imageUrl:
            imageFile
              ? imageFile.path
              : null,
        });

      const formData =
        new FormData();

      formData.append(
        "child_id",
        childId
      );

      formData.append(
        "text",
        text || ""
      );

      if (imageFile) {
        formData.append(
          "file",
          fs.createReadStream(
            imageFile.path
          )
        );
      }

      if (audioFile) {
        formData.append(
          "audio",
          fs.createReadStream(
            audioFile.path
          )
        );
      }

      const aiResponse =
        await axios.post(
          "http://127.0.0.1:8000/predict",

          formData,

          {
            headers:
              formData.getHeaders(),

            timeout:
              30000,
          }
        );

      const updatedCase =
        await updateCaseWithAIResults(
          childId,
          assignedDoctor._id,
          aiResponse.data
        );

      console.log(
        "CREATED OR UPDATED CASE:",
        updatedCase._id.toString()
      );

      console.log(
        "CASE DOCTOR:",
        updatedCase.doctorId.toString()
      );

      const doctorNotification =
        await sendDoctorNotification({
          doctorId:
            assignedDoctor._id,

          childId,

          caseId:
            updatedCase._id,

          title:
            "New Parent Follow-up",

          message:
            `Parent added new information about ${child.name}'s recent emotional behavior.`,

          type:
            "follow_up",
        });

      console.log(
        "CREATED NOTIFICATION:",
        doctorNotification?._id?.toString()
      );

      return res
        .status(200)
        .json({
          success:
            true,

          entry:
            newEntry,

          aiResult:
            aiResponse.data,

          case:
            updatedCase,

          assignedDoctor: {
            _id:
              assignedDoctor._id,

            fullName:
              assignedDoctor.fullName ||
              "",
          },
        });
    } catch (err) {
      console.error(
        "Error in add-entry integration:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to process entry and analyze with AI",

          message:
            err?.message,
        });
    }
  }
);

/* =========================
   Get Progress Stats
   GET /api/children/progress-stats/:childId
========================= */

router.get(
  "/progress-stats/:childId",
  checkToken,
  async (req, res) => {
    try {
      const child =
        await Child.findOne({
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        }).lean();

      if (!child) {
        return res
          .status(404)
          .json({
            error:
              "Child not found",
          });
      }

      const caseData =
        await Case.findOne({
          childId:
            child._id,
        });

      if (!caseData) {
        return res
          .status(200)
          .json({
            entries: 0,
            reviewed: 0,
            insights: 0,
          });
      }

      const analysisTimeline =
        Array.isArray(
          caseData.analysisTimeline
        )
          ? caseData.analysisTimeline
          : [];

      const textAnalyses =
        Array.isArray(
          caseData.textAnalyses
        )
          ? caseData.textAnalyses
          : [];

      const stats = {
        entries:
          caseData.entriesCount ||
          0,

        reviewed:
          analysisTimeline.filter(
            (
              item
            ) =>
              item.diagnosis !==
              "تحت المتابعة"
          ).length,

        insights:
          textAnalyses.length,
      };

      return res
        .status(200)
        .json(stats);
    } catch (err) {
      console.error(
        "GET PROGRESS STATS ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch stats",

          message:
            err?.message,
        });
    }
  }
);

/* =========================
   Get Child Progress
   GET /api/children/child-progress/:childId
========================= */

router.get(
  "/child-progress/:childId",
  checkToken,
  async (req, res) => {
    try {
      const child =
        await Child.findOne({
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        }).lean();

      if (!child) {
        return res
          .status(404)
          .json({
            msg:
              "Child not found",
          });
      }

      const caseData =
        await Case.findOne({
          childId:
            child._id,
        });

      if (!caseData) {
        return res
          .status(404)
          .json({
            msg:
              "No progress data yet",
          });
      }

      const analysisTimeline =
        Array.isArray(
          caseData.analysisTimeline
        )
          ? caseData.analysisTimeline
          : [];

      const textAnalyses =
        Array.isArray(
          caseData.textAnalyses
        )
          ? caseData.textAnalyses
          : [];

      const doctorRecommendations =
        Array.isArray(
          caseData.doctorRecommendations
        )
          ? caseData.doctorRecommendations
          : [];

      return res
        .status(200)
        .json({
          summary:
            caseData.aiSummary,

          stats: {
            entries:
              caseData.entriesCount ||
              0,

            reviewed:
              analysisTimeline.filter(
                (
                  item
                ) =>
                  item.status ===
                  "reviewed"
              ).length,

            insights:
              textAnalyses.length,
          },

          trends:
            Array.isArray(
              caseData.emotionalTrend
            )
              ? caseData.emotionalTrend
              : [],

          patterns:
            Array.isArray(
              caseData.recurringPatterns
            )
              ? caseData.recurringPatterns
              : [],

          latestDoctorInsight:
            doctorRecommendations[0] ||
            null,
        });
    } catch (err) {
      console.error(
        "GET CHILD PROGRESS ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch progress",

          message:
            err?.message,
        });
    }
  }
);

/* =========================
   Get Entry Timeline
   GET /api/children/entry-timeline/:childId
========================= */

router.get(
  "/entry-timeline/:childId",
  checkToken,
  async (req, res) => {
    try {
      const child =
        await Child.findOne({
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        }).lean();

      if (!child) {
        return res
          .status(404)
          .json({
            error:
              "Child not found",
          });
      }

      const entries =
        await Entry.find({
          childId:
            child._id,

          parentId:
            req.user._id,
        }).sort({
          createdAt:
            -1,
        });

      return res
        .status(200)
        .json(entries);
    } catch (err) {
      console.error(
        "GET ENTRY TIMELINE ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch timeline",

          message:
            err?.message,
        });
    }
  }
);

/* =========================
   Get Doctor Recommendations
   GET /api/children/recommendations/:childId
========================= */

router.get(
  "/recommendations/:childId",
  checkToken,
  async (req, res) => {
    try {
      const child =
        await Child.findOne({
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        }).lean();

      if (!child) {
        return res
          .status(404)
          .json({
            error:
              "Child not found",
          });
      }

      const caseData =
        await Case.findOne({
          childId:
            child._id,
        });

      if (!caseData) {
        return res
          .status(404)
          .json({
            error:
              "No data found",
          });
      }

      return res
        .status(200)
        .json(
          Array.isArray(
            caseData.doctorRecommendations
          )
            ? caseData.doctorRecommendations
            : []
        );
    } catch (err) {
      console.error(
        "GET RECOMMENDATIONS ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Server error",

          message:
            err?.message,
        });
    }
  }
);

/* =========================
   Get Parent Notifications
   GET /api/children/my-notifications
========================= */

router.get(
  "/my-notifications",
  checkToken,
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          userId:
            req.user._id,
        }).sort({
          createdAt:
            -1,
        });

      return res
        .status(200)
        .json(
          notifications
        );
    } catch (err) {
      console.error(
        "GET NOTIFICATIONS ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch notifications",

          message:
            err?.message,
        });
    }
  }
);

/* =========================
   Mark Notification As Read
   PATCH /api/children/read/:notificationId
========================= */

router.patch(
  "/read/:notificationId",
  checkToken,
  async (req, res) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id:
              req.params
                .notificationId,

            userId:
              req.user._id,
          },

          {
            isRead:
              true,
          },

          {
            new:
              true,
          }
        );

      if (!notification) {
        return res
          .status(404)
          .json({
            error:
              "Notification not found",
          });
      }

      return res
        .status(200)
        .json({
          msg:
            "Notification marked as read",

          notification,
        });
    } catch (err) {
      console.error(
        "READ NOTIFICATION ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to update notification",

          message:
            err?.message,
        });
    }
  }
);

/* =========================
   Get Specific Case Details
   GET /api/children/case/:caseId/details
   Optional query: ?entryId=...
========================= */

router.get(
  "/case/:caseId/details",
  checkToken,
  async (req, res) => {
    try {
      const caseData =
        await Case.findById(
          req.params.caseId
        )
          .populate(
            "doctorId",
            "fullName name specialization professionalType profilePic isVerified"
          )
          .lean();

      if (!caseData) {
        return res
          .status(404)
          .json({
            message:
              "Case not found",
          });
      }

      const child =
        await Child.findOne({
          _id:
            caseData.childId,

          parentId:
            req.user._id,
        }).lean();

      if (!child) {
        return res
          .status(404)
          .json({
            message:
              "Case not found for this parent",
          });
      }

      const caseId =
        caseData._id?.toString?.() ||
        "";

      const fallbackDate =
        caseData.lastAnalysisDate ||
        caseData.createdAt ||
        new Date();

      const dominantEmotion =
        typeof caseData.dominantEmotion ===
          "string" &&
        caseData.dominantEmotion.trim()
          ? caseData.dominantEmotion
          : "Unknown";

      const confidence =
        Number(
          caseData.emotionPercentage
        ) || 0;

      const textEntries = (
        Array.isArray(
          caseData.textAnalyses
        )
          ? caseData.textAnalyses
          : []
      ).map(
        (
          entry,
          index
        ) => ({
          id:
            entry?._id?.toString?.() ||
            `text-${caseId}-${index}`,

          caseId,

          type:
            "Text Entry",

          date:
            entry?.createdAt ||
            fallbackDate,

          content:
            typeof entry?.content ===
              "string"
              ? entry.content
              : "",

          analysisResult:
            typeof entry?.analysisResult ===
              "string"
              ? entry.analysisResult
              : "",

          description:
            (
              typeof entry?.analysisResult ===
                "string" &&
              entry.analysisResult.trim()
                ? entry.analysisResult
                : ""
            ) ||
            (
              typeof entry?.content ===
                "string" &&
              entry.content.trim()
                ? entry.content
                : ""
            ) ||
            "Text analysis entry",

          emotion:
            typeof entry?.emotion ===
              "string" &&
            entry.emotion.trim()
              ? entry.emotion
              : dominantEmotion,

          confidence:
            Number(
              entry?.confidence
            ) ||
            confidence,
        })
      );

      const drawingEntries = (
        Array.isArray(
          caseData.drawings
        )
          ? caseData.drawings
          : []
      ).map(
        (
          entry,
          index
        ) => ({
          id:
            entry?._id?.toString?.() ||
            `drawing-${caseId}-${index}`,

          caseId,

          type:
            "Drawing Entry",

          date:
            entry?.createdAt ||
            fallbackDate,

          content:
            "",

          analysisResult:
            typeof entry?.analysisResult ===
              "string"
              ? entry.analysisResult
              : "",

          description:
            typeof entry?.analysisResult ===
              "string" &&
            entry.analysisResult.trim()
              ? entry.analysisResult
              : "Drawing analysis entry",

          emotion:
            typeof entry?.emotion ===
              "string" &&
            entry.emotion.trim()
              ? entry.emotion
              : dominantEmotion,

          confidence:
            Number(
              entry?.confidence
            ) ||
            confidence,

          imageUrl:
            typeof entry?.imageUrl ===
              "string"
              ? entry.imageUrl
              : "",
        })
      );

      const audioEntries = (
        Array.isArray(
          caseData.audioAnalyses
        )
          ? caseData.audioAnalyses
          : []
      ).map(
        (
          entry,
          index
        ) => ({
          id:
            entry?._id?.toString?.() ||
            `audio-${caseId}-${index}`,

          caseId,

          type:
            "Voice Entry",

          date:
            entry?.createdAt ||
            fallbackDate,

          content:
            "",

          analysisResult:
            typeof entry?.analysisResult ===
              "string"
              ? entry.analysisResult
              : "",

          description:
            (
              typeof entry?.analysisResult ===
                "string" &&
              entry.analysisResult.trim()
                ? entry.analysisResult
                : ""
            ) ||
            "Voice analysis entry",

          emotion:
            typeof entry?.emotion ===
              "string" &&
            entry.emotion.trim()
              ? entry.emotion
              : dominantEmotion,

          confidence:
            Number(
              entry?.confidence
            ) ||
            confidence,

          audioUrl:
            typeof entry?.audioUrl ===
              "string"
              ? entry.audioUrl
              : "",
        })
      );

      const entries = [
        ...textEntries,
        ...drawingEntries,
        ...audioEntries,
      ].sort(
        (
          firstEntry,
          secondEntry
        ) => {
          const firstDate =
            new Date(
              firstEntry.date
            ).getTime() ||
            0;

          const secondDate =
            new Date(
              secondEntry.date
            ).getTime() ||
            0;

          return (
            secondDate -
            firstDate
          );
        }
      );

      const requestedEntryId =
        typeof req.query.entryId ===
          "string"
          ? req.query.entryId
          : "";

      const selectedEntry =
        (
          requestedEntryId
            ? entries.find(
                (
                  entry
                ) =>
                  entry.id ===
                  requestedEntryId
              )
            : null
        ) ||
        entries[0] ||
        null;

      const doctor =
        caseData.doctorId &&
        typeof caseData.doctorId ===
          "object"
          ? {
              _id:
                caseData
                  .doctorId._id,

              fullName:
                caseData
                  .doctorId
                  .fullName ||
                caseData
                  .doctorId
                  .name ||
                "Specialist",

              specialization:
                caseData
                  .doctorId
                  .specialization ||
                caseData
                  .doctorId
                  .professionalType ||
                "",

              profilePic:
                caseData
                  .doctorId
                  .profilePic ||
                "",

              isVerified:
                Boolean(
                  caseData
                    .doctorId
                    .isVerified
                ),
            }
          : null;

      return res
        .status(200)
        .json({
          childInfo: {
            _id:
              child._id,

            name:
              child.name,

            age:
              child.age,

            gender:
              child.gender,

            notes:
              child.notes ||
              "",
          },

          caseData: {
            _id:
              caseData._id,

            status:
              caseData.status ||
              "pending",

            priority:
              caseData.priority ||
              "Low",

            childProgress:
              caseData.childProgress ||
              "no enough data yet",

            entriesCount:
              Number(
                caseData.entriesCount
              ) ||
              entries.length,

            createdAt:
              caseData.createdAt,

            lastAnalysisDate:
              caseData.lastAnalysisDate ||
              caseData.createdAt,

            dominantEmotion,

            emotionPercentage:
              confidence,

            aiDiagnosis:
              caseData.aiDiagnosis ||
              "",

            aiSummary:
              caseData.aiSummary ||
              "",

            doctorRecommendation:
              caseData.doctorRecommendation ||
              "",

            doctorRecommendations:
              Array.isArray(
                caseData.doctorRecommendations
              )
                ? caseData.doctorRecommendations
                : [],

            emotionalTrend:
              Array.isArray(
                caseData.emotionalTrend
              )
                ? caseData.emotionalTrend
                : [],

            frequentEmotions:
              Array.isArray(
                caseData.frequentEmotions
              )
                ? caseData.frequentEmotions
                : [],

            recurringPatterns:
              Array.isArray(
                caseData.recurringPatterns
              )
                ? caseData.recurringPatterns
                : [],

            analysisTimeline:
              Array.isArray(
                caseData.analysisTimeline
              )
                ? caseData.analysisTimeline
                : [],

            doctor,
          },

          selectedEntry,

          entries,
        });
    } catch (err) {
      console.error(
        "GET CASE DETAILS ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch case details",

          message:
            err?.message ||
            "Unexpected error while loading case details",
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

      const assignedDoctor =
        await findAvailableDoctor();

      if (!assignedDoctor) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "No approved doctor is currently available",
          });
      }

      const newChild =
        new Child({
          name:
            typeof name ===
              "string"
              ? name.trim()
              : name,

          age:
            Number(age),

          gender:
            typeof gender ===
              "string"
              ? gender
                  .toLowerCase()
                  .trim()
              : gender,

          notes:
            typeof notes ===
              "string"
              ? notes.trim()
              : "",

          parentId:
            req.user._id,

          doctorId:
            assignedDoctor._id,
        });

      await newChild.save();

      console.log(
        "NEW CHILD ASSIGNED DOCTOR:",
        assignedDoctor._id.toString()
      );

      return res
        .status(201)
        .json({
          message:
            "Child added successfully",

          child:
            newChild,

          assignedDoctor: {
            _id:
              assignedDoctor._id,

            fullName:
              assignedDoctor.fullName ||
              "",
          },
        });
    } catch (err) {
      console.error(
        "ADD CHILD ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            err.message,
        });
    }
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
      const child =
        await Child.findOne({
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        });

      if (!child) {
        return res
          .status(404)
          .json({
            msg:
              "Child not found",
          });
      }

      return res
        .status(200)
        .json(child);
    } catch (err) {
      console.error(
        "GET CHILD DETAILS ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to fetch child details",

          message:
            err?.message,
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
          _id:
            req.params.childId,

          parentId:
            req.user._id,
        });

      if (!child) {
        return res
          .status(404)
          .json({
            msg:
              "Child not found",
          });
      }

      await Promise.all([
        Case.deleteMany({
          childId:
            child._id,
        }),

        Entry.deleteMany({
          childId:
            child._id,

          parentId:
            req.user._id,
        }),
      ]);

      return res
        .status(200)
        .json({
          msg:
            "Child and all their data deleted successfully",
        });
    } catch (err) {
      console.error(
        "DELETE CHILD ERROR:",
        err
      );

      return res
        .status(500)
        .json({
          error:
            "Failed to delete child",

          message:
            err?.message,
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

      const updates = {};

      if (
        name !==
        undefined
      ) {
        updates.name =
          typeof name ===
            "string"
            ? name.trim()
            : name;
      }

      if (
        age !==
        undefined
      ) {
        updates.age =
          Number(age);
      }

      if (
        gender !==
        undefined
      ) {
        updates.gender =
          typeof gender ===
            "string"
            ? gender
                .toLowerCase()
                .trim()
            : gender;
      }

      if (
        notes !==
        undefined
      ) {
        updates.notes =
          typeof notes ===
            "string"
            ? notes.trim()
            : "";
      }

      if (
        Object.keys(
          updates
        ).length === 0
      ) {
        return res
          .status(400)
          .json({
            msg:
              "No child changes were provided",
          });
      }

      const updatedChild =
        await Child.findOneAndUpdate(
          {
            _id:
              req.params.childId,

            parentId:
              req.user._id,
          },

          {
            $set:
              updates,
          },

          {
            new:
              true,

            runValidators:
              true,
          }
        );

      if (!updatedChild) {
        return res
          .status(404)
          .json({
            msg:
              "Child not found",
          });
      }

      return res
        .status(200)
        .json({
          msg:
            "Child updated successfully",

          child:
            updatedChild,
        });
    } catch (err) {
      console.error(
        "UPDATE CHILD ERROR:",
        err
      );

      return res
        .status(500)
        .json({
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