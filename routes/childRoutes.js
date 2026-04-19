const express=require('express');
const router=express.Router();
const Child=require('../models/Child');
const {checkToken}=require('../middleware/authMiddleware');
const {uploadDrawings}=require('../config/cloudinary');

router.post('/add',checkToken,async(req,res)=>{
    try{
        const {name,age,gender}=req.body;
        const newChild=new Child({name,age,gender,parentId:req.user._id});
        await newChild.save();
        res.status(201).json({message:'Child added successfully',child:newChild});
    }catch(err){
        res.status(500).json({error:err.message})
    }
});
router.post('/:childId/drawings',checkToken,uploadDrawings.single('drawing'),async(req,res)=>{
    try{
        const {childId}=req.params;
        if(!req.file){
            return res.status(400).json({msg:"No drawing uploaded"});
        }
            const child=await Child.findOne({_id:childId,parentId:req.user._id});
            if(!child){
                return res.status(404).json({msg:"Child not found"});
            }
            const drawing={ImageUrl:req.file.path,analysisResult:"",status:"pending",createdAt:new Date()};
        
            child.drawings.push(drawing);
            await child.save();
            res.status(201).json({message:"Drawing added successfully",drawing:child.drawings[child.drawings.length-1]});
    }catch(err){
        res.status(500).json({error:"Failed to upload drawing"});
    }
});
router.get('/all', checkToken, async (req, res) => {
    try {
        const children = await Child.find({ parentId: req.user._id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch children", message: err.message });
    }
});
module.exports=router;
