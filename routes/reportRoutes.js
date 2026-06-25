/*
Hna el file da 5as bl API endpoints of reports w bi7dd shkl el reports hit3mlha save ezay gwa MongoDB 
Mn el 2khr y3ne da el mas2ol 3n el user request w tnfez process el report.
*/

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const { checkToken } = require("../middleware/authMiddleware");
const Child = require("../models/Child");
const Case = require("../models/Case");
const Analysis = require("../models/Analysis");

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

    let hasChildAccess = false;
    let linkedCase = null;

    if (req.user.role === "parent") {
      hasChildAccess =
        child.parentId && child.parentId.toString() === req.user._id.toString();
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
      .sort({ createdAt: 1 })
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

    analyses.forEach((analysis) => {
      let modality = String(analysis.modality || "")
        .trim()
        .toLowerCase();

      if (modality === "audio") {
        modality = "voice";
      }

      if (Object.prototype.hasOwnProperty.call(modalityCounts, modality)) {
        modalityCounts[modality] += 1;
      }

      const receivedEmotion = String(analysis.emotion || "unknown")
        .trim()
        .toLowerCase();

      const emotion = Object.prototype.hasOwnProperty.call(
        emotionCounts,
        receivedEmotion,
      )
        ? receivedEmotion
        : "unknown";

      emotionCounts[emotion] += 1;

      const confidence = Number(analysis.confidence);

      if (Number.isFinite(confidence)) {
        totalConfidence += Math.min(100, Math.max(0, confidence));
      }

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
    });

    const averageConfidence = Number(
      (totalConfidence / analyses.length).toFixed(2),
    );

    const sortedEmotions = Object.entries(emotionCounts).sort(
      (firstEmotion, secondEmotion) => {
        return secondEmotion[1] - firstEmotion[1];
      },
    );

    let dominantEmotion = "unknown";

    if (sortedEmotions[0][1] > 0) {
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

    analyses.forEach((analysis) => {
      const modality = String(analysis.modality || "").toLowerCase();

      if (Object.prototype.hasOwnProperty.call(modalityCounts, modality)) {
        modalityCounts[modality] += 1;
      }

      const receivedEmotion = String(
        analysis.emotion || "unknown",
      ).toLowerCase();

      const emotion = Object.prototype.hasOwnProperty.call(
        emotionCounts,
        receivedEmotion,
      )
        ? receivedEmotion
        : "unknown";

      emotionCounts[emotion] += 1;

      const confidence = Number(analysis.confidence);

      if (Number.isFinite(confidence)) {
        totalConfidence += Math.min(100, Math.max(0, confidence));
      }

      if (analysis.isReliable === true) {
        reliableCount += 1;
      } else {
        unreliableCount += 1;
      }

      const contexts = Array.isArray(analysis.contexts)
        ? analysis.contexts
        : [];

      contexts.forEach((context) => {
        const normalizedContext = String(context || "")
          .trim()
          .toLowerCase();

        if (normalizedContext) {
          patternCounts[normalizedContext] =
            (patternCounts[normalizedContext] || 0) + 1;
        }
      });
    });

    const averageConfidence = Number(
      (totalConfidence / analyses.length).toFixed(2),
    );

    const sortedEmotions = Object.entries(emotionCounts).sort(
      (firstEmotion, secondEmotion) => {
        return secondEmotion[1] - firstEmotion[1];
      },
    );

    let dominantEmotion = "unknown";

    if (sortedEmotions[0][1] > 0) {
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

    return res.status(200).json({
      message: "Analyses retrieved successfully",
      childName: reportIdentity.childName,
      childId: reportIdentity.childId,
      parentId: reportIdentity.parentId,
      caseId: reportIdentity.caseId,
      doctorId: reportIdentity.doctorId,
      doctorName: reportIdentity.doctorName,
      analysisCount: analyses.length,
      period: {
        startDate: startOfPeriod,
        endDate: endOfPeriod,
      },
      statistics,
    });
  } catch (error) {
    console.error("Report request error:", error);

    return res.status(500).json({
      message: "Failed to process report request",
    });
  }
});

module.exports = router;
