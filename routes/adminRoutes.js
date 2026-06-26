const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { checkToken, isAdmin } = require('../middleware/authMiddleware'); // تأكدي من وجود middleware للـ Admin


const allDocumentsVerified = (docs) => {
    return Object.values(docs).every(value => value === true);
};

router.get('/pending-doctors', checkToken, isAdmin, async (req, res) => {
    try {
        const pendingDoctors = await User.find({ 
            role: 'doctor', 
            verificationStatus: 'pending' 
        }).select('-password');
        res.json(pendingDoctors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/doctors/:id/approve', checkToken, isAdmin, async (req, res) => {
    try {
        const doctor = await User.findById(req.params.id);
        
        if (!doctor) return res.status(404).json({ msg: "الطبيب غير موجود" });

        if (!allDocumentsVerified(doctor.documentsVerification.toObject())) {
            return res.status(400).json({ 
                msg: "لا يمكن قبول الطبيب، هناك مستندات لم يتم التحقق منها بعد!" 
            });
        }
        doctor.verificationStatus = 'approved';
        doctor.isVerified = true;
        doctor.approvedAt = new Date();
        await doctor.save();

        res.json({ msg: "تم قبول الطبيب بنجاح", doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/doctors/:id/reject', checkToken, isAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        const doctor = await User.findByIdAndUpdate(
            req.params.id,
            { 
                verificationStatus: 'rejected',
                isVerified: false,
                rejectionReason: reason || "No specific reason provided"
            },
            { new: true }
        );
        res.json({ msg: "Doctor rejected", doctor });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/doctors/:id/verify-document', checkToken, isAdmin, async (req, res) => {
    try {
        const { docType, isVerified, note } = req.body; 
        const updateFields = {
            [`documentsVerification.${docType}`]: isVerified,
            [`documentNotes.${docType}`]: note || ""
        };
        
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        );

        res.json({ 
            msg: "تم تحديث حالة المستند والملاحظة", 
            docs: updatedUser.documentsVerification,
            notes: updatedUser.documentNotes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/my-documents-status', checkToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            verification: user.documentsVerification,
            notes: user.documentNotes,
            rejectionReason: user.rejectionReason // السبب العام إذا تم رفض الطلب ككل
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;