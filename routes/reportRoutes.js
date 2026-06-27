/*
- Hna el file da 5as bl API endpoints of reports w bi7dd shkl el reports hit3mlha save ezay gwa MongoDB 
Mn el 2khr y3ne da el mas2ol 3n el user request w tnfez process el report.
- Gbna el child w el case w n3ml validation enhom mazboten mn na7yt kul 7aga b2a.
- Gbna lul el analyses bta3t child mo3ain f fatra zmania mo3ina ely el user 25tarha.
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

const AI_REPORT_URL = process.env.AI_REPORT_URL || "http://127.0.0.1:8000/generate-report";

const ALLOWED_MODALITIES = ["text", "image", "voice"];
const ALLOWED_EMOTIONS = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise", "unknown"];
const ALLOWED_OVERALL_STATUSES = ["stable", "improving", "needs_attention", "insufficient_data"];

// دالة موحدة لتنسيق التاريخ (تقبل YYYY-MM-DD)
const parseReportDate = (value, useEndOfDay = false) => {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day, useEndOfDay ? 23 : 0, useEndOfDay ? 59 : 0, useEndOfDay ? 59 : 0, useEndOfDay ? 999 : 0));
  
  const isValidDate = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isValidDate ? date : null;
};

const normalizeModality = (value) => {
  let modality = String(value || "").trim().toLowerCase();
  if (modality === "audio") modality = "voice";
  return ALLOWED_MODALITIES.includes(modality) ? modality : null;
};

const normalizeEmotion = (value) => {
  const emotion = String(value || "unknown").trim().toLowerCase();
  return ALLOWED_EMOTIONS.includes(emotion) ? emotion : "unknown";
};

const normalizeConfidence = (value) => {
  const confidence = Number(value);
  return !Number.isFinite(confidence) ? 0 : Math.min(100, Math.max(0, confidence));
};

/* =========================
   Generate Report
   POST /api/reports/generate
========================= */
router.post("/generate", checkToken, async (req, res) => {
  try {
    const { childId, startDate, endDate } = req.body;

    if (!childId || !startDate || !endDate) {
      return res.status(400).json({ message: "childId, startDate, and endDate are required" });
    }

    const startOfPeriod = parseReportDate(startDate);
    const endOfPeriod = parseReportDate(endDate, true);

    if (!startOfPeriod || !endOfPeriod) {
      return res.status(400).json({ message: "Dates must use the YYYY-MM-DD format" });
    }

    if (startOfPeriod > endOfPeriod) {
      return res.status(400).json({ message: "startDate must be before or equal to endDate" });
    }

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ message: "Child not found" });

    // التحقق من الصلاحيات
    let hasChildAccess = false;
    let linkedCase = null;

    if (req.user.role === "parent") {
      hasChildAccess = child.parentId?.toString() === req.user._id.toString();
    } else if (req.user.role === "doctor") {
      linkedCase = await Case.findOne({ childId: child._id, doctorId: req.user._id });
      hasChildAccess = Boolean(linkedCase);
    }

    if (!hasChildAccess) return res.status(403).json({ message: "Unauthorized" });

    // جلب بيانات الحالة والطبيب
    let reportCase = linkedCase || await Case.findOne({ childId: child._id }).sort({ createdAt: -1 }).populate("doctorId", "fullName name firstName lastName");
    if (reportCase && !reportCase.doctorId) await reportCase.populate("doctorId", "fullName name firstName lastName");

    const doctor = reportCase?.doctorId;
    const reportIdentity = {
      childName: child.name || "Unknown",
      childId: child._id,
      parentId: child.parentId,
      caseId: reportCase?._id || null,
      doctorId: doctor?._id || null,
      doctorName: doctor?.fullName || doctor?.name || "Not assigned",
    };

    const analyses = await Analysis.find({
      childId: child._id,
      createdAt: { $gte: startOfPeriod, $lte: endOfPeriod },
    }).sort({ createdAt: 1 }).lean();

    if (analyses.length === 0) return res.status(404).json({ message: "No analyses found for period" });

    // معالجة الإحصائيات
    const modalityCounts = { text: 0, image: 0, voice: 0 };
    const emotionCounts = { angry: 0, disgust: 0, fear: 0, happy: 0, neutral: 0, sad: 0, surprise: 0, unknown: 0 };
    let totalConfidence = 0, reliableCount = 0, unreliableCount = 0;
    const patternCounts = {};
    const analysesForReport = [];

    analyses.forEach(analysis => {
      const modality = normalizeModality(analysis.modality);
      const emotion = normalizeEmotion(analysis.emotion);
      const confidence = normalizeConfidence(analysis.confidence);

      modalityCounts[modality]++;
      emotionCounts[emotion]++;
      totalConfidence += confidence;
      if (analysis.isReliable) reliableCount++; else unreliableCount++;

      (analysis.contexts || []).forEach(ctx => {
        const cleanCtx = String(ctx || "").trim().toLowerCase();
        if (cleanCtx) patternCounts[cleanCtx] = (patternCounts[cleanCtx] || 0) + 1;
      });

      analysesForReport.push({ modality, emotion, confidence, content: analysis.content || "", createdAt: analysis.createdAt });
    });

    // حساب العاطفة المهيمنة والأنماط
    const sortedEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);
    const dominantEmotion = sortedEmotions[0][1] > 0 ? sortedEmotions[0][0] : "unknown";
    const recurringPatterns = Object.entries(patternCounts).filter(([, c]) => c > 1).map(([p]) => p);

    const statistics = { modalityCounts, emotionCounts, dominantEmotion, averageConfidence: Number((totalConfidence / analyses.length).toFixed(2)), reliableCount, unreliableCount, recurringPatterns };

    // طلب التقرير من خدمة AI
    const aiResponse = await axios.post(AI_REPORT_URL, {
      child: reportIdentity,
      statistics,
      analyses: analysesForReport
    }, { timeout: 120000 });

    const generatedReport = aiResponse.data;
    
    // حفظ التقرير في MongoDB
    const savedReport = await Report.create({
      ...reportIdentity,
      requestedBy: req.user._id,
      requestedByRole: req.user.role,
      startDate: startOfPeriod,
      endDate: endOfPeriod,
      analysisCount: analyses.length,
      statistics,
      summary: generatedReport.summary,
      report: generatedReport.report,
      recommendations: generatedReport.recommendations,
      overallStatus: generatedReport.overallStatus
    });

    return res.status(201).json({ message: "Report generated successfully", report: savedReport });
  } catch (error) {
    console.error("Report Generation Error:", error);
    res.status(500).json({ message: "Failed to process report request" });
  }
});
/* =========================
   Get Single Report
   GET /api/reports/:reportId
========================= */
router.get("/:reportId", checkToken, async (req, res) => {
  try {
    const { reportId } = req.params;

    // 1. جلب التقرير والتحقق من وجوده
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // 2. التحقق من الصلاحيات (Authorization)
    let hasAccess = false;

    if (req.user.role === "parent") {
      // الأب يرى تقارير طفله فقط
      hasAccess = report.parentId.toString() === req.user._id.toString();
    } else if (req.user.role === "doctor") {
      // الطبيب يرى التقارير الخاصة بحالته فقط
      // نتحقق إذا كان الطبيب هو المرتبط بهذا التقرير
      hasAccess = report.doctorId?.toString() === req.user._id.toString();
    }

    if (!hasAccess) {
      return res.status(403).json({ 
        message: "غير مصرح لك بالوصول إلى هذا التقرير" 
      });
    }

    // 3. إرجاع التقرير في حال نجاح التحقق
    return res.status(200).json({
      success: true,
      report
    });

  } catch (error) {
    console.error("Get Report Error:", error);
    return res.status(500).json({ message: "Server error while fetching report" });
  }
});
module.exports = router;