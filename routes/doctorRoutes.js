const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { checkToken } = require('../middleware/authMiddleware'); 

router.get('/dashboard-stats', checkToken, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const pendingCases = await Case.countDocuments({ doctorId, status: 'pending' });
        const reviewedCases = await Case.countDocuments({ doctorId, status: 'reviewed' });
        
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newThisWeek = await Case.countDocuments({ 
            doctorId, 
            createdAt: { $gte: oneWeekAgo } 
        });
        const childrenFollowed = await Case.distinct('childId', { doctorId }).then(ids => ids.length);

        res.json({pendingCases, 
            reviewedCases, 
            newThisWeek, 
            childrenFollowed });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/pending-cases', checkToken, async (req, res) => {
    try {
       const cases = await Case.find({ doctorId: req.user.id, status: 'pending' })
            .populate('childId', 'name age'); 
        res.json(cases);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/case-details/:caseId', checkToken, async (req, res) => {
    try {
        
       const caseData = await Case.findById(req.params.caseId)
            .populate('childId', 'name age gender');
        if (!caseData) {
            return res.status(404).json({ msg: 'Case not found' });
        }
        res.json({childInfo: {
                name: caseData.childId.name,
                age: caseData.childId.age,
                gender: caseData.childId.gender
            },
            analysisHistory: {
                drawings: caseData.drawings,
                textAnalyses: caseData.textAnalyses
            },
            aiDiagnosis: caseData.aiDiagnosis,
            aiSummary: caseData.aiSummary,
            status: caseData.status,
            doctorRecommendation: caseData.doctorRecommendation
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
        })
        .populate('childId', 'name age')
        .sort({ createdAt: -1 });

        if (!latestCase) return res.status(404).json({ msg: 'No data found for this child' });

        res.json({
            childInfo: latestCase.childId,
            longTermSummary: latestCase.aiSummary, 
            currentStatus: latestCase.status,    
            emotionalTrend: latestCase.emotionalTrend,
            mostFrequentEmotions: latestCase.frequentEmotions, 
            analysisTimeline: latestCase.analysisTimeline, 
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
        const updatedCase = await Case.findByIdAndUpdate(
            req.params.caseId,
            { 
                doctorRecommendation, 
                status: 'reviewed' 
            },
            { new: true }
        );
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
                    avgTimeMinutes: { $avg: { $divide: [{ $subtract: ["$createdAt", "$createdAt"] }, 60000] } } 
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

        const emotionStats = await Case.aggregate([
            { $match: { doctorId: new mongoose.Types.ObjectId(doctorId) } },
            { $group: { _id: "$dominantEmotion", count: { $sum: 1 } } },
            { $project: { emotion: "$_id", percentage: { $multiply: [{ $divide: ["$count", { $sum: "$count" }] }, 100] } } }
        ]);
        const attentionRequired = await Case.find({ doctorId, priority: 'High', status: 'pending' })
            .populate('childId', 'name age')
            .limit(5);

        res.json({
            summary: { newCases, reviewedCases, activeCases },
            emotionStats,
            attentionRequired
        });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
module.exports = router;