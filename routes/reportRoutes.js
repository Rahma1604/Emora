/*
Hna el file da 5as bl API endpoints of reports w bi7dd shkl el reports hit3mlha save ezay gwa MongoDB 
Mn el 2khr y3ne da el mas2ol 3n el user request w tnfez process el report.
*/

const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const { checkToken } = require('../middleware/authMiddleware');

router.post('/generate', checkToken, async (req, res) => {
  try {
    const { childId, startDate, endDate } = req.body;

    if (!childId || !startDate || !endDate) {
      return res.status(400).json({
        message: 'childId, startDate, and endDate are required'
      });
    }

    if (!mongoose.isValidObjectId(childId)) {
      return res.status(400).json({
        message: 'Invalid childId'
      });
    }

    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (
      Number.isNaN(parsedStartDate.getTime()) ||
      Number.isNaN(parsedEndDate.getTime())
    ) {
      return res.status(400).json({
        message: 'Invalid date format'
      });
    }

    if (parsedStartDate > parsedEndDate) {
      return res.status(400).json({
        message: 'startDate must be before or equal to endDate'
      });
    }

    return res.status(200).json({
      message: 'Report request data is valid'
    });
  } catch (error) {
    console.error('Report validation error:', error);

    return res.status(500).json({
      message: 'Failed to validate report request'
    });
  }
});

module.exports = router;
