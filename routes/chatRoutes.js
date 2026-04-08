const express=require('express');
const router=express.Router();
const Chat=require('../models/Chat');
const {checkToken}=require('../middleware/authMiddleware');

router.post('/send',checkToken,async(req,res)=>{
    try{
        const {childId,text}=req.body;
        if(!text){
            return res.status(400).json({msg:"Message text is required"});
        }
        let chat=await Chat.findOne({parentId: req.user._id, childId});
        if(!chat){
            chat=new Chat({parentId:req.user._id,childId,message:[]});
    }
    chat.messages.push({sender:'parent',text:text});
    chat.messages.push({sender:'ai',text:"This is a response from AI"});
    await chat.save();
    res.status(200).json({message:"Message sent successfully",chat});
    }catch(err){
        res.status(500).json({error:"Failed to send message"});
    }
});
module.exports=router;