const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const auth = require('../middleware/auth'); 

router.get('/dashboard-stats', auth, async (req, res) => {
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

router.get('/pending-cases', auth, async (req, res) => {
    try {
        const cases = await Case.find({ doctorId: req.user.id, status: 'pending' });
        res.json(cases);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/child-history/:childId', auth, async (req, res) => {
    try {
        const history = await Case.find({ 
            doctorId: req.user.id, 
            childId: req.params.childId 
        }).sort({ createdAt: -1 }); 
        
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/case-details/:caseId', auth, async (req, res) => {
    try {
        const caseData = await Case.findById(req.params.caseId);
        if (!caseData) {
            return res.status(404).json({ msg: 'Case not found' });
        }
        res.json(caseData);
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching case details' });
    }
});
router.put('/review-case/:caseId', auth, async (req, res) => {
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
router.get('/history', auth, async (req, res) => {
    try {
        const doctorId = req.user.id;
        const statusFilter = req.query.status; 
        
        let query = { doctorId };

      
        if (statusFilter && statusFilter !== 'All') {
            query.status = statusFilter.toLowerCase();
        }
        
      
        const cases = await Case.find(query).sort({ createdAt: -1 });
        
        res.json(cases);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});
module.exports = router;