const express=require('express');
const router=express.Router();
const Chat=require('../models/Chat');
const Child = require('../models/Child');
const {checkToken}=require('../middleware/authMiddleware');

router.post('/send',checkToken,async(req,res)=>{
    try{
        const {childId,text,attachmentType,attachmentId}=req.body;
        let chat=await Chat.findOne({parentId: req.user._id, childId});
        if(!chat){
            chat=new Chat({parentId:req.user._id,childId,message:[]});
    }
    let fileUrl = null;
        if (attachmentType && attachmentId) {
            const child = await Child.findById(childId);
            if (child) {
                if (attachmentType === 'drawing') {
                    const drawing = child.drawings.id(attachmentId);
                    fileUrl = drawing ? drawing.ImageUrl : null;
                } else if (attachmentType === 'voice') {
                    const voice = child.voiceNotes.id(attachmentId);
                    fileUrl = voice ? voice.voiceUrl : null;
                }
            }
        }
        const parentMsg = {
            sender: 'parent',
            text: text || "",
            attachment: {
                type: attachmentType || 'none',
                dataId: attachmentId || null
            }
        };
        chat.messages.push(parentMsg);
        let aiResponseText = "أنا أحلل رسالتك الآن...";
        if (attachmentType === 'drawing') aiResponseText = "لقد استلمت الرسمة، أحلل الآن المشاعر والألوان فيها...";
        if (attachmentType === 'voice') aiResponseText = "أسمع التسجيل الصوتي بتركيز، سأعطيك تحليلي فوراً...";
chat.messages.push({
            sender: 'ai',
            text: aiResponseText
        });

    await chat.save();
    res.status(200).json({message:"Message sent successfully",chat});
    }catch(err){
        res.status(500).json({error:"Failed to send message"});
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

        if (!chat) {
            return res.status(200).json([]); 
        }

        res.status(200).json(chat.messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});
module.exports=router;