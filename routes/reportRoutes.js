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
        child.parentId &&
        child.parentId.toString() === req.user._id.toString();
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

    return res.status(200).json({
      message: "Analyses retrieved successfully",
      childId: child._id,
      caseId: linkedCase?._id || null,
      analysisCount: analyses.length,
      period: {
        startDate: startOfPeriod,
        endDate: endOfPeriod,
      },
    });
  } catch (error) {
    console.error("Report request error:", error);

    return res.status(500).json({
      message: "Failed to process report request",
    });
  }
});

module.exports = router;