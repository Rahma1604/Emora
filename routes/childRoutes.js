const express=require('express');
const router=express.Router();
const Child=require('../models/Child');
const {checkToken}=require('../middleware/authMiddleware');

router.get('/:childId', checkToken, async (req, res) => {
    try {
        const child = await Child.findOne({ _id: req.params.childId, parentId: req.user._id });
        if (!child) return res.status(404).json({ msg: "Child not found" });
        res.status(200).json(child);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch child details" });
    }
});
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

router.get('/all', checkToken, async (req, res) => {
    try {
        const children = await Child.find({ parentId: req.user._id });
        res.status(200).json(children);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch children", message: err.message });
    }
});
module.exports=router;
