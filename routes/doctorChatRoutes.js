const express = require('express');
const router = express.Router();
const DoctorChat = require('../models/DoctorChat'); // الموديل الجديد اللي هنعمله
const { checkToken } = require('../middleware/authMiddleware');


router.post('/send', checkToken, async (req, res) => {
    try {
        const { doctorId, childId, text, attachmentType, attachmentId, parentId } = req.body;

       
        const pId = req.user.role === 'parent' ? req.user._id : parentId;
        const dId = req.user.role === 'doctor' ? req.user._id : doctorId;

        if (!pId || !dId || !childId) {
            return res.status(400).json({ msg: "Missing required fields" });
        }
        let chat = await DoctorChat.findOne({ parentId: pId, doctorId: dId, childId: childId });

        if (!chat) {
            chat = new DoctorChat({ parentId: pId, doctorId: dId, childId: childId, messages: [] });
        }

        const newMessage = {
            senderId: req.user._id,
            text: text || "",
            attachment: {
                type: attachmentType || 'none', // 'drawing', 'voice', or 'none'
                dataId: attachmentId || null
            }
        };

        chat.messages.push(newMessage);
        await chat.save();

        res.status(200).json({ msg: "Message sent", chat });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/my-patients', checkToken, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ msg: "Access denied. Doctors only." });
        }

        const chats = await DoctorChat.find({ doctorId: req.user._id })
            .populate('parentId', 'fullName email profilePic')
            .populate('childId', 'name age gender');

        res.status(200).json(chats);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

router.get('/:chatId', checkToken, async (req, res) => {
    try {
        const chat = await DoctorChat.findById(req.params.chatId)
            .populate('messages.senderId', 'fullName role')
            .populate('childId', 'name');

        if (!chat) return res.status(404).json({ msg: "Chat not found" });

        if (chat.parentId.toString() !== req.user._id.toString() && chat.doctorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: "Not authorized to view this chat" });
        }

        res.status(200).json(chat);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;