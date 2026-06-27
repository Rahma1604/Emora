const Case = require("../models/Case");
const mongoose = require("mongoose");

async function updateCaseWithAIResults(childId, doctorId, aiData = {}) {
  if (!childId) {
    throw new Error("Child ID is required to update the case");
  }

  if (!doctorId) {
    throw new Error("Doctor ID is missing for this child");
  }

  if (!mongoose.Types.ObjectId.isValid(childId)) {
    throw new Error("Invalid child ID");
  }

  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new Error("Invalid doctor ID");
  }

  const childObjectId = new mongoose.Types.ObjectId(childId);
  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);

  const {
    diagnostic_result,
    text_analysis,
    analyses,
    patterns,
  } = aiData;

  const safeAnalyses = Array.isArray(analyses) ? analyses : [];

  const totalConfidence = safeAnalyses.reduce((total, analysis) => {
    const confidence = Number(analysis?.confidence);
    return total + (Number.isFinite(confidence) ? confidence : 0);
  }, 0);

  const fallbackConfidence = Number(
    text_analysis?.confidence || diagnostic_result?.confidence || 0
  );

  const averageConfidence =
    safeAnalyses.length > 0
      ? totalConfidence / safeAnalyses.length
      : fallbackConfidence;

  const normalizedConfidence = Number.isFinite(averageConfidence)
    ? Number(averageConfidence.toFixed(2))
    : 0;

  let priority = "Low";
  if (normalizedConfidence >= 75) {
    priority = "High";
  } else if (normalizedConfidence >= 40) {
    priority = "Medium";
  }

  const diagnosis = diagnostic_result?.diagnosis || "تحت المتابعة";
  const summary = text_analysis?.content || "No summary available";
  const emotion = text_analysis?.emotion || "غير محدد";

  const safePatterns = Array.isArray(patterns)
    ? patterns.filter(
        (pattern) => typeof pattern === "string" && pattern.trim()
      )
    : [];

  const currentDate = new Date();
  const weekNumber = Math.ceil(
    Date.now() / (7 * 24 * 60 * 60 * 1000)
  );

  const updatedCase = await Case.findOneAndUpdate(
    {
      childId: childObjectId,
      doctorId: doctorObjectId,
    },
    {
      $setOnInsert: {
        childId: childObjectId,
        doctorId: doctorObjectId,
        createdAt: currentDate,
      },
      $set: {
        doctorId: doctorObjectId,
        status: "pending",
        aiDiagnosis: diagnosis,
        aiSummary: summary,
        dominantEmotion: emotion,
        emotionPercentage: normalizedConfidence,
        priority,
        lastAnalysisDate: currentDate,
      },
      $inc: { entriesCount: 1 },
      $addToSet: {
        recurringPatterns: { $each: safePatterns },
      },
      $push: {
        analysisTimeline: {
          diagnosis,
          emotion,
          confidence: normalizedConfidence,
          date: currentDate,
        },
        emotionalTrend: {
          week: `W${weekNumber}`,
          emotion,
          value: normalizedConfidence,
        },
      },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  if (!updatedCase) {
    throw new Error("Case could not be created or updated");
  }

  return updatedCase;
}

module.exports = { updateCaseWithAIResults };
