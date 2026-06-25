/*
Hna el file da 5as bl API endpoints of reports w bi7dd shkl el reports hit3mlha save ezay gwa MongoDB 
Mn el 2khr y3ne da el mas2ol 3n el user request w tnfez process el report.
*/

const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");

const { checkToken } = require("../middleware/authMiddleware");
const Child = require("../models/Child");
const Case = require("../models/Case");
const Analysis = require("../models/Analysis");
const Report = require("../models/Report");

const router = express.Router();

const AI_REPORT_URL =
  process.env.AI_REPORT_URL || "http://127.0.0.1:8000/generate-report";

const ALLOWED_MODALITIES = ["text", "image", "voice"];

const ALLOWED_EMOTIONS = [
  "angry",
  "disgust",
  "fear",
  "happy",
  "neutral",
  "sad",
  "surprise",
  "unknown",
];

const ALLOWED_OVERALL_STATUSES = [
  "stable",
  "improving",
  "needs_attention",
  "insufficient_data",
];

const parseReportDate = (value, useEndOfDay = false) => {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      useEndOfDay ? 23 : 0,
      useEndOfDay ? 59 : 0,
      useEndOfDay ? 59 : 0,
      useEndOfDay ? 999 : 0,
    ),
  );

  const isValidDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isValidDate ? date : null;
};

const normalizeModality = (value) => {
  let modality = String(value || "")
    .trim()
    .toLowerCase();

  if (modality === "audio") {
    modality = "voice";
  }

  return ALLOWED_MODALITIES.includes(modality) ? modality : null;
};

const normalizeEmotion = (value) => {
  const emotion = String(value || "unknown")
    .trim()
    .toLowerCase();

  return ALLOWED_EMOTIONS.includes(emotion) ? emotion : "unknown";
};

const normalizeConfidence = (value) => {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(100, Math.max(0, confidence));
};

router.post("/generate", checkToken, async (req, res) => {
  try {
    const { childId, startDate, endDate } = req.body;

    if (!childId || !startDate || !endDate) {
      return res.status(400).json({
        message: "childId, startDate, and endDate are required",
      });
    }

    if (!mongoose.isValidObjectId(childId)) {
      return res.status(400).json({
        message: "Invalid childId",
      });
    }

    const startOfPeriod = parseReportDate(startDate);

    const endOfPeriod = parseReportDate(endDate, true);

    if (!startOfPeriod || !endOfPeriod) {
      return res.status(400).json({
        message: "Dates must use the YYYY-MM-DD format",
      });
    }

    if (startOfPeriod > endOfPeriod) {
      return res.status(400).json({
        message: "startDate must be before or equal to endDate",
      });
    }

    const child = await Child.findById(childId);

    if (!child) {
      return res.status(404).json({
        message: "Child not found",
      });
    }

    if (!child.parentId) {
      return res.status(422).json({
        message: "Child parent information is missing",
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
        message: "You are not authorized to access this child report",
      });
    }

    let reportCase = linkedCase;

    if (!reportCase) {
      reportCase = await Case.findOne({
        childId: child._id,
      })
        .sort({
          updatedAt: -1,
          createdAt: -1,
        })
        .populate("doctorId", "fullName name firstName lastName");
    } else {
      await reportCase.populate("doctorId", "fullName name firstName lastName");
    }

    const doctor = reportCase?.doctorId || null;

    const combinedDoctorName = [doctor?.firstName, doctor?.lastName]
      .filter(Boolean)
      .join(" ");

    const doctorName =
      doctor?.fullName || doctor?.name || combinedDoctorName || "Not assigned";

    const childName =
      child.name || child.childName || child.fullName || "Unknown";

    const reportIdentity = {
      childName,
      childId: child._id,
      parentId: child.parentId,
      caseId: reportCase?._id || null,
      doctorId: doctor?._id || null,
      doctorName,
    };

    const analyses = await Analysis.find({
      childId: child._id,
      createdAt: {
        $gte: startOfPeriod,
        $lte: endOfPeriod,
      },
    })
      .sort({
        createdAt: 1,
      })
      .lean();

    if (analyses.length === 0) {
      return res.status(404).json({
        message: "No analyses found for the selected period",
      });
    }

    const modalityCounts = {
      text: 0,
      image: 0,
      voice: 0,
    };

    const emotionCounts = {
      angry: 0,
      disgust: 0,
      fear: 0,
      happy: 0,
      neutral: 0,
      sad: 0,
      surprise: 0,
      unknown: 0,
    };

    let totalConfidence = 0;
    let reliableCount = 0;
    let unreliableCount = 0;

    const patternCounts = {};

    const analysesForReport = [];

    for (const analysis of analyses) {
      const modality = normalizeModality(analysis.modality);

      if (!modality) {
        return res.status(422).json({
          message: "Stored analysis contains an unsupported modality",
        });
      }

      const emotion = normalizeEmotion(analysis.emotion);

      const confidence = normalizeConfidence(analysis.confidence);

      modalityCounts[modality] += 1;
      emotionCounts[emotion] += 1;
      totalConfidence += confidence;

      if (analysis.isReliable === true) {
        reliableCount += 1;
      } else {
        unreliableCount += 1;
      }

      const contexts = Array.isArray(analysis.contexts)
        ? analysis.contexts
        : [];

      const uniqueContexts = new Set(
        contexts
          .map((context) =>
            String(context || "")
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean),
      );

      uniqueContexts.forEach((context) => {
        patternCounts[context] = (patternCounts[context] || 0) + 1;
      });

      analysesForReport.push({
        modality,
        emotion,
        confidence,
        content: analysis.content || "",
        contexts: Array.from(uniqueContexts),
        isReliable: analysis.isReliable === true,
        createdAt: analysis.createdAt,
      });
    }

    const averageConfidence = Number(
      (totalConfidence / analyses.length).toFixed(2),
    );

    const sortedEmotions = Object.entries(emotionCounts).sort(
      (firstEmotion, secondEmotion) => {
        return secondEmotion[1] - firstEmotion[1];
      },
    );

    let dominantEmotion = "unknown";

    if (sortedEmotions.length > 0 && sortedEmotions[0][1] > 0) {
      const highestEmotionCount = sortedEmotions[0][1];

      const mostFrequentEmotions = sortedEmotions.filter(
        ([, count]) => count === highestEmotionCount,
      );

      dominantEmotion =
        mostFrequentEmotions.length === 1
          ? mostFrequentEmotions[0][0]
          : "mixed";
    }

    const recurringPatterns = Object.entries(patternCounts)
      .filter(([, count]) => count > 1)
      .sort((firstPattern, secondPattern) => {
        return secondPattern[1] - firstPattern[1];
      })
      .map(([pattern]) => pattern);

    const statistics = {
      modalityCounts,
      emotionCounts,
      dominantEmotion,
      averageConfidence,
      reliableCount,
      unreliableCount,
      recurringPatterns,
    };

    const reportRequestData = {
      requestedByRole: req.user.role,
      child: {
        childName: reportIdentity.childName,
        childId: reportIdentity.childId.toString(),
        parentId: reportIdentity.parentId.toString(),
        doctorName: reportIdentity.doctorName,
        doctorId: reportIdentity.doctorId
          ? reportIdentity.doctorId.toString()
          : null,
        caseId: reportIdentity.caseId ? reportIdentity.caseId.toString() : null,
      },
      period: {
        startDate: startOfPeriod,
        endDate: endOfPeriod,
      },
      analysisCount: analyses.length,
      statistics,
      analyses: analysesForReport,
    };

    let generatedReport;

    try {
      const aiResponse = await axios.post(AI_REPORT_URL, reportRequestData, {
        timeout: 120000,
        headers: {
          "Content-Type": "application/json",
        },
      });

      generatedReport = aiResponse.data;
    } catch (aiError) {
      console.error(
        "AI report service error:",
        aiError.response?.data || aiError.message,
      );

      if (aiError.code === "ECONNABORTED") {
        return res.status(504).json({
          message: "AI report service request timed out",
        });
      }

      if (!aiError.response) {
        return res.status(503).json({
          message: "AI report service is currently unavailable",
        });
      }

      return res.status(502).json({
        message: "AI report service failed to generate the report",
      });
    }

    const hasValidGeneratedReport =
      generatedReport &&
      typeof generatedReport.summary === "string" &&
      generatedReport.summary.trim().length > 0 &&
      typeof generatedReport.report === "string" &&
      generatedReport.report.trim().length > 0 &&
      Array.isArray(generatedReport.recommendations) &&
      typeof generatedReport.overallStatus === "string";

    if (!hasValidGeneratedReport) {
      return res.status(502).json({
        message: "AI report service returned an invalid response",
      });
    }

    const overallStatus = generatedReport.overallStatus.trim().toLowerCase();

    if (!ALLOWED_OVERALL_STATUSES.includes(overallStatus)) {
      return res.status(502).json({
        message: "AI report service returned an invalid status",
      });
    }

    const recommendations = generatedReport.recommendations
      .filter(
        (recommendation) =>
          typeof recommendation === "string" &&
          recommendation.trim().length > 0,
      )
      .map((recommendation) => recommendation.trim());

    const savedReport = await Report.create({
      childId: reportIdentity.childId,
      childName: reportIdentity.childName,
      parentId: reportIdentity.parentId,
      caseId: reportIdentity.caseId,
      doctorId: reportIdentity.doctorId,
      doctorName: reportIdentity.doctorName,
      requestedBy: req.user._id,
      requestedByRole: req.user.role,
      startDate: startOfPeriod,
      endDate: endOfPeriod,
      analysisCount: analyses.length,
      statistics,
      summary: generatedReport.summary.trim(),
      report: generatedReport.report.trim(),
      recommendations,
      overallStatus,
    });

    return res.status(201).json({
      message: "Report generated and saved successfully",
      report: savedReport,
    });
  } catch (error) {
    console.error("Report request error:", error);

    return res.status(500).json({
      message: "Failed to process report request",
    });
  }
});

router.get("/child/:childId", checkToken, async (req, res) => {
  try {
    const { childId } = req.params;

    if (!mongoose.isValidObjectId(childId)) {
      return res.status(400).json({
        message: "Invalid childId",
      });
    }

    const child = await Child.findById(childId).select("parentId");

    if (!child) {
      return res.status(404).json({
        message: "Child not found",
      });
    }

    let hasChildAccess = false;

    if (req.user.role === "parent") {
      hasChildAccess =
        child.parentId && child.parentId.toString() === req.user._id.toString();
    }

    if (req.user.role === "doctor") {
      const linkedCase = await Case.exists({
        childId: child._id,
        doctorId: req.user._id,
      });

      hasChildAccess = Boolean(linkedCase);
    }

    if (!hasChildAccess) {
      return res.status(403).json({
        message: "You are not authorized to access these reports",
      });
    }

    const reports = await Report.find({
      childId: child._id,
      requestedBy: req.user._id,
      requestedByRole: req.user.role,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      message: "Child reports retrieved successfully",
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Child reports retrieval error:", error);

    return res.status(500).json({
      message: "Failed to retrieve child reports",
    });
  }
});

module.exports = router;
