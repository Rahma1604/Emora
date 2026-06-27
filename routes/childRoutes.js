const express = require('express');
const router = express.Router();
const Child = require('../models/Child');
const axios = require('axios');

const Notification = require('../models/NotificationP');

const FormData = require('form-data');
const fs = require('fs');
const Entry = require('../models/entry');
// في أعلى ملف الـ router الخاص بالأهل
const { updateCaseWithAIResults } = require('../services/caseService');
const { sendNotification: sendDoctorNotification } = require('../services/notificationService');
const { checkToken } = require('../middleware/authMiddleware');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' }).fields([
    { name: 'file', maxCount: 1 }, 
    { name: 'audio', maxCount: 1 }
]);



router.get('/all', checkToken, async (req, res) => {
    try {
        const children = await Child.find({ parentId: req.user._id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch children", message: err.message });
    }
});

router.get('/:childId', checkToken, async (req, res) => {
    try {
        const child = await Child.findOne({ _id: req.params.childId, parentId: req.user._id });
        if (!child) return res.status(404).json({ msg: "Child not found" });
        res.status(200).json(child);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch child details" });
    }
});

router.post('/add', checkToken, async (req, res) => {
    try {
        const { name, age, gender } = req.body;
        const newChild = new Child({ name, age, gender, parentId: req.user._id });
        await newChild.save();
        res.status(201).json({ message: 'Child added successfully', child: newChild });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:childId', checkToken, async (req, res) => {
    try {
        const child = await Child.findOneAndDelete({ _id: req.params.childId, parentId: req.user._id });
        if (!child) return res.status(404).json({ msg: "Child not found" });
        res.status(200).json({ msg: "Child and all their data deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete child" });
    }
});

router.put('/:childId', checkToken, async (req, res) => {
    try {
        const { name, age, gender } = req.body;
        const updatedChild = await Child.findOneAndUpdate(
            { _id: req.params.childId, parentId: req.user._id },
            { $set: { name, age, gender } },
            { new: true }
        );
        if (!updatedChild) return res.status(404).json({ msg: "Child not found" });
        res.status(200).json({ msg: "Child updated successfully", child: updatedChild });
    } catch (err) {
        res.status(500).json({ error: "Failed to update child" });
    }
});
router.post('/add-entry', checkToken, upload, async (req, res) => {
    try {
        const { childId, text } = req.body;
        
        const child = await Child.findById(childId);
        if (!child) return res.status(404).json({ error: "Child not found" });

        // 1. حفظ المدخلات في قاعدة البيانات (كما فعلتِ)
        const newEntry = await Entry.create({
            childId,
            parentId: req.user.id,
            text,
            audioUrl: req.files.audio ? req.files.audio[0].path : null,
            imageUrl: req.files.file ? req.files.file[0].path : null
        });

        // 2. تجهيز البيانات للـ AI
        const formData = new FormData();
        formData.append('child_id', childId);
        formData.append('text', text || "");
        if (req.files.file) formData.append('file', fs.createReadStream(req.files.file[0].path));
        if (req.files.audio) formData.append('audio', fs.createReadStream(req.files.audio[0].path));

        // 3. إرسال الطلب للـ AI Engine
        const aiResponse = await axios.post('http://127.0.0.1:8000/predict', formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });

        // 4. هنا نقوم بتحديث الـ Case بناءً على النتيجة (بنفس منطق الـ analyzeController)
        // يمكنك استدعاء دالة معالجة النتائج التي كتبناها سابقاً لتحديث الـ Case
       
        const updatedCase = await updateCaseWithAIResults(childId, child.doctorId, aiResponse.data);
        // 5. إبلاغ الطبيب بوجود مدخل جديد (New Parent Follow-up)
        // نستدعي دالة الإشعارات التي كتبناها مسبقاً
        await sendDoctorNotification({
    doctorId: child.doctorId, 
    childId: childId,
            title: "New Parent Follow-up",
            message: `Parent added new information about ${childId}'s recent emotional behavior.`,
            type: 'follow_up'
        });

        res.json({ success: true, entry: newEntry, aiResult: aiResponse.data, case:updatedCase });
    } catch (err) {
        console.error("Error in add-entry integration:", err);
        res.status(500).json({ error: 'Failed to process entry and analyze with AI' });
    }
});
router.get('/progress-stats/:childId', checkToken, async (req, res) => {
    try {
        const caseData = await Case.findOne({ childId: req.params.childId });
        
        if (!caseData) {
            return res.json({ entries: 0, reviewed: 0, insights: 0 });
        }

        // حساب القيم بناءً على البيانات الموجودة في الـ Case
        const stats = {
            entries: caseData.entriesCount || 0, // إجمالي المدخلات
            
            // عدد المدخلات التي تمت مراجعتها من الطبيب 
            // (نبحث في الـ analysisTimeline عن الحالات التي قيمتها الطبيب)
            reviewed: caseData.analysisTimeline.filter(item => item.diagnosis !== "تحت المتابعة").length,
            
            // عدد الرؤى (يمكن اعتبارها عدد التحليلات النصية أو مجموع التقارير)
            insights: caseData.textAnalyses ? caseData.textAnalyses.length : 0
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
router.get('/child-progress/:childId', checkToken, async (req, res) => {
    try {
        const caseData = await Case.findOne({ childId: req.params.childId })
            .populate('doctorRecommendations'); // لجلب توصيات الطبيب

        if (!caseData) return res.status(404).json({ msg: "No progress data yet" });

        res.json({
            summary: caseData.aiSummary, // الـ Long-term Summary
            stats: {
                entries: caseData.entriesCount,
                reviewed: caseData.analysisTimeline.filter(a => a.status === 'reviewed').length,
                insights: caseData.textAnalyses.length
            },
            trends: caseData.emotionalTrend, // لعمل الـ Chart
            patterns: caseData.recurringPatterns, // "School anxiety", "Sleep routine"
            latestDoctorInsight: caseData.doctorRecommendations[0] // أحدث توصية من الدكتور
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch progress" });
    }
});
router.get('/entry-timeline/:childId', checkToken, async (req, res) => {
    try {
        const entries = await Entry.find({ childId: req.params.childId })
            .sort({ createdAt: -1 }); // الترتيب من الأحدث للأقدم
            
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch timeline" });
    }
});
router.get('/recommendations/:childId', checkToken, async (req, res) => {
    try {
        const caseData = await Case.findOne({ childId: req.params.childId });
        if (!caseData) return res.status(404).json({ error: "No data found" });
        
        res.json(caseData.doctorRecommendations);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/my-notifications', checkToken, async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 }); // الترتيب من الأحدث للأقدم
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});
router.patch('/read/:notificationId', checkToken, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
        res.status(200).json({ msg: "Notification marked as read" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update notification" });
    }
});

module.exports = router;