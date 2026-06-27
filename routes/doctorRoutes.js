const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const { checkToken } = require('../middleware/authMiddleware'); 
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { sendNotification:sendParentNotification } = require('../services/notificationPService');


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
            .populate('childId', 'name') // جلب الاسم فقط
            .sort({ createdAt: -1 })
            .limit(5); // جلب أحدث 5 حالات فقط كما هو واضح في الصورة

        const formattedCases = cases.map(c => ({
            _id: c._id,
            childName: c.childId.name,
            childId: c.childId._id, // أو الـ ID الذي يظهر في الصورة
            status: c.status,
            summary: c.aiDiagnosis || "No summary available", // هنا يظهر الملخص الصغير
            type: c.dominantEmotion || "General" // هنا يظهر نوع المؤشر (مثل Anxiety Indicators)
        }));
        
        res.json(formattedCases);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.get('/recent-activity', checkToken, async (req, res) => {
    try {
        const doctorId = req.user.id;
        
        // نجلب آخر 5 حالات تم التعامل معها
        const recentCases = await Case.find({ doctorId })
            .sort({ lastAnalysisDate: -1 })
            .limit(5);

        const activityLog = recentCases.map(c => {
            let activity = "";
            let time = c.lastAnalysisDate;
            
            // المنطق الذكي للنشاط:
            if (c.status === 'reviewed') {
                activity = "تم إرسال رد الطبيب";
            } else if (c.analysisTimeline && c.analysisTimeline.length > 0) {
                activity = "تم رفع تحليل جديد";
            }
            
            return { activity, time };
        });

        res.json(activityLog);
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
                },
           progressStatus: {
                label: caseData.childProgress, // "Improving"
                description: "Showing gradual improvement, but still needs monitoring." // يمكن جعلها ديناميكية لاحقاً
            },
            entriesInfo: {
                totalEntries: caseData.entriesCount,
                lastAnalysisDate: caseData.lastAnalysisDate
            },
            currentAnalysis: {
                text: caseData.textAnalyses && caseData.textAnalyses.length > 0 
                      ? caseData.textAnalyses[caseData.textAnalyses.length - 1].content 
                      : "لا يوجد تحليل نصي متاح حالياً."
            },
            emotionData: {
                emotion: caseData.dominantEmotion, // "Anxiety"
                percentage: caseData.emotionPercentage, // "75%"
                keywords: ["School", "Fear", "Sleep", "Stress"] // هذه يجب استخراجها من الـ patterns في الـ Schema
            },
            aiSummary: caseData.aiSummary,
            status: caseData.status,
            doctorRecommendation: caseData.doctorRecommendation || ""
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
           childProgress: latestCase.childProgress,
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
        // 1. تحديث الحالة
        const updatedCase = await Case.findByIdAndUpdate(
            req.params.caseId,
            { doctorRecommendation, status: 'reviewed' },
            { new: true }
        ).populate('childId'); // قمنا بعمل populate لجلب بيانات الطفل

        // 2. إرسال إشعار للأب تلقائياً
         await sendParentNotification({
    userId: updatedCase.childId.parentId, 
    childId: updatedCase.childId._id,
    title: "Analysis Reviewed",
    message: `Dr. ${req.user.name} has reviewed your child's case.`,
    type: 'doctor_review'
});

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
                    avgTimeMinutes: { $avg: { $divide: [{ $subtract: [new Date(), "$createdAt"] }, 60000] } } 
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

// 1. جلب الإشعارات (مع خيار التصفية بين الكل وغير المقروء)
router.get('/notifications', checkToken, async (req, res) => {
    try {
        const { unreadOnly } = req.query;
        let query = { doctorId: req.user.id };
        if (unreadOnly === 'true') query.isRead = false;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 }); // الترتيب من الأحدث للأقدم

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 2. تحديث الكل إلى "مقروء" (زر Mark all as read في الصور)
router.put('/notifications/mark-all-read', checkToken, async (req, res) => {
    try {
        await Notification.updateMany({ doctorId: req.user.id, isRead: false }, { isRead: true });
        res.json({ message: "All notifications marked as read." });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});
module.exports = router;