const express=require('express');
const router=express.Router();
const Chat=require('../models/Chat');
const {checkToken}=require('../middleware/authMiddleware');
const { uploadDrawings, uploadVoices } = require('../config/cloudinary');
const axios = require('axios');

async function getAIReply(userText) {
    try {
        const response = await axios.post('http://127.0.0.1:8000/chat', {
            message: userText 
        });
        return response.data.reply;
    } catch (error) {
        console.error("AI Chat Error:", error);
        return "أهلاً بك، أنا هنا لدعمك.. كيف يمكنني مساعدتك اليوم؟";
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
    
        let chat = await Chat.findOne({ parentId: req.user._id, childId });
        if (!chat) {
            chat = new Chat({ parentId: req.user._id, childId, messages: [] });
        }
        let fileUrl = (req.files && req.files.length > 0) ? req.files[0].path : null;
        chat.messages.push({
            sender: 'parent',
            text: text || "",
            attachment: {
                type: attachmentType === 'voice' ? 'audio' : (fileUrl ? 'image' : 'none'),
                fileUrl: fileUrl
            },
            createdAt: new Date()

        });
      const aiResponseText = await getAIReply(text || "أرسل ملفاً");


        chat.messages.push({ sender: 'ai', text: aiResponseText, createdAt: new Date() });
        await chat.save();
        
        res.status(200).json({ message: "Message sent", chat });
    } catch (err) {
        res.status(500).json({ error: "Failed to send message" });
    }
});
router.delete('/:childId', checkToken, async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({ 
            parentId: req.user._id, 
            childId: req.params.childId 
        });
        if (!chat) return res.status(404).json({ msg: "Chat not found" });
        res.status(200).json({ msg: "Chat history deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete chat" });
    }
});
router.get('/:childId', checkToken, async (req, res) => {
    try {
        const chat = await Chat.findOne({ 
            parentId: req.user._id, 
            childId: req.params.childId 
        });
        if (!chat) return res.status(200).json([]); 
        res.status(200).json(chat.messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});

module.exports=router;