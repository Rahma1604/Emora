const express=require('express');
const router=express.Router();
const Chat=require('../models/Chat');
const Child = require('../models/Child');
const {checkToken}=require('../middleware/authMiddleware');
const { uploadDrawings, uploadVoices } = require('../config/cloudinary');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { sendNotification } = require('../services/notificationService');

async function getAIReply(userText, file, attachmentType) {
    try {
    
        const formData = new FormData();
        formData.append('text', userText || "");
        
        // إرسال الملف (صورة أو صوت) للـ Python API ليقوم بتحليله
        if (file) {
            formData.append(attachmentType === 'voice' ? 'audio' : 'file', fs.createReadStream(file.path));
        }

        const response = await axios.post('http://127.0.0.1:8000/predict', formData, {
            headers: formData.getHeaders()
        });
 return response.data.diagnostic_result?.diagnosis || "تحليل الملف يشير إلى أهمية المتابعة، هل تودين معرفة المزيد؟";
    } catch (error) {
        console.error("AI Chat Analysis Error:", error);
        return "عذراً، لم أستطع تحليل الملف حالياً، سأكون هنا للدعم العام.";
    }
}

const chatUpload = (req, res, next) => {
    const type = req.query.type;
    if (type === 'voice') {
        return uploadVoices.any()(req, res, next);
    } else {
        return uploadDrawings.any()(req, res, next);
    }
};
router.post('/send', checkToken, chatUpload, async (req, res) => {
    try {
        const { childId, text, attachmentType } = req.body;
        const file = req.files ? req.files[0] : null;

const child = await Child.findOne({ _id: childId, parentId: req.user._id });
        if (!child) {
            return res.status(404).json({ error: "Child not found or unauthorized access" });
        }

        let chat = await Chat.findOne({ parentId: req.user._id, childId });
        if (!chat) {
            chat = new Chat({ parentId: req.user._id, childId, messages: [] });
        }
 const aiResponseText = await getAIReply(text, file, attachmentType);
 chat.messages.push({
            sender: 'parent',
            text: text || "",
            attachment: {
                type: attachmentType === 'voice' ? 'audio' : (file ? 'image' : 'none'),
                fileUrl: file ? file.path : null // هنا يتم تخزين رابط Cloudinary
            },
            createdAt: new Date()
        });

        // 3. إضافة رد الـ AI التشخيصي
        chat.messages.push({ sender: 'ai', text: aiResponseText, createdAt: new Date() });
        await chat.save();
    
        const isUrgent = aiResponseText.includes("أهمية المتابعة") || aiResponseText.includes("عاجل");
        
        if (isUrgent) {
            // جلب الـ doctorId المرتبط بملف الطفل لتوجيه الإشعار له
            const childData = await Child.findById(childId).populate('doctorId');
            if (childData && childData.doctorId) {
                await sendNotification({
                    doctorId: childData.doctorId._id,
                    childId: childId,
                    title: "Parent Chat Alert",
                    message: `Parent has a concern regarding ${childData.name}. Please check the latest chat.`,
                    type: 'urgent'
                });
            }
        }

        res.status(200).json({ message: "Message sent", chat });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send message" });
    }
});

module.exports=router;