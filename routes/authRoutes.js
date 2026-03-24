const express=require('express');
const router=express.Router();
const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const nodemailer=require('nodemailer');

const transporter=nodemailer.createTransport({
    service:'gmail',auth:{
        user:'202227086@std.sci.cu.edu.eg',
        pass:process.env.Email_PASS
    }
})

router.post('/register',async(req,res)=>{
    try{
       const{fullName,email,password,confirmPassword,role}=req.body;
       const cleanEmail=email.trim().toLowerCase();
       const emailReal=/^[a-zA-Z0-9._%+-]+@(gmail|yahoo|icloud)\.com$/;
       if(!emailReal.test(cleanEmail)){
        return res.status(400).json({msg:"please use right email"})
       }
       if(password!==confirmPassword){
        return res.status(400).json({msg:"Pass don't match"})
    }
       const salt=await bcrypt.genSalt(10);
       const hashedPassword=await bcrypt.hash(password,salt);
       const vCode=Math.floor(1000+Math.random()*9000).toString();

const mailOptions={
    from:'"Emora App"<202227086@std.sci.cu.edu.eg>',
    to:cleanEmail,
    subject:'Verification Code - Emora App',
    text:`Hi ${fullName}, your verification code is :${vCode}`
}
await transporter.sendMail(mailOptions);

       const newUser=new User({
        fullName,email:
        cleanEmail,password:hashedPassword,role,verificationCode:vCode
       });
       await newUser.save();
       res.status(201).json({message:'User registered. Please verify your email.'});
    }catch(err){
       res.status(500).json({error:err.message}) 
    }
});
router.post('/verify',async(req,res)=>{
    try{
    const{email,code}=req.body;
    const user=await User.findOne({email});
    if(!user)
        return res.status(404).json({msg:"User Not found"});
    if(user.verificationCode===code){
        user.isVerified=true;
        user.verificationCode=undefined;
        await user.save();
        res.status(200).json({msg:"Account Verified successfully"});
    }
    else{
        res.status(400).json({msg:"Invalid verification code"});
    }
}catch(err){
        res.status(500).json({error:"Verification failed"});
    }
});
router.post('/login',async(req,res)=>{
    try{
        const{email,password}=req.body;
        const user=await User.findOne({email});
        if (!user) 
            return res.status(400).json({msg:"Not found"});
        if(!user.isVerified)
            return res.status(400).json({msg:"user not found"})
        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch)
            return res.status(400).json({msg:"Wrong password"});
        const token=jwt.sign({id:user._id},'secret123',{expiresIn:'1d'});
        res.json({token,user:{name:user.fullName,email:user.email}});
    }catch(err){
        res.status(500).json({error:"Login failed"})
    }
});
module.exports=router;