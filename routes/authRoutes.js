const express=require('express');
const router=express.Router();
const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const nodemailer=require('nodemailer');
const { uploadProfile } = require('../config/cloudinary');
const {checkToken}=require('../middleware/authMiddleware')
const transporter=nodemailer.createTransport({
    service:'gmail',auth:{
        user:'202227086@std.sci.cu.edu.eg',
        pass:process.env.Email_PASS
    }
})

router.post('/register',async(req,res)=>{
    try{
       const{fullName,email,password,confirmPassword,role}=req.body;
       const cleanEmail=email.trim();
       const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.status(400).json({ msg: "Email already exists! Please use another email or login." });
        }
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
        const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'1d'});
        res.json({token,user:{name:user.fullName,email:user.email}});
    }catch(err){
        res.status(500).json({error:"Login failed"})
    }
});
router.get('/profile',checkToken,async(req,res)=>{
    try{
        res.json(req.user);
    }
    catch(error){
        res.status(500).send('Server Error')
    }
})
router.put('/update-profile',checkToken,uploadProfile.single('profilePic'),async(req,res)=>{
    try{
        const {fullName}=req.body;
        const updates={};
        if(fullName) updates.fullName=fullName;
        if(req.file) updates.profilePic=req.file.path;
        const updatedUser=await User.findByIdAndUpdate(req.user._id,{$set:updates},{new:true}).select('-password');
       res.json({ msg: "Profile updated successfully", user: updatedUser });
    } catch (err) {
        console.log("Error Detail:", err);
        res.status(500).json({ error: err.message || err});
    }
});
router.post('/resend-code', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ msg: "Please provide an email" });
        const user = await User.findOne({ email: email.trim() });
        if (!user) { 
            return res.status(404).json({ msg: "User not found with this email" });
        }
        if (user.isVerified) {
            return res.status(400).json({ msg: "Your account is already verified. Please login." });
        }
        const vCode = Math.floor(1000 + Math.random() * 9000).toString();
        user.verificationCode = vCode;
        await user.save();
        const mailOptions = {
            from: '"Emora App"<202227086@std.sci.cu.edu.eg>',
            to: user.email,
            subject: 'New Verification Code - Emora App',
            text: `Your new verification code is: ${vCode}`
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ msg: "A new code has been sent to your email" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email: email.trim()});

        if (!user) return res.status(404).json({ msg: "Email not found" });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        user.resetPasswordToken = otp;
        user.resetPasswordExpires = Date.now() + 600000; 
        await user.save();

        const mailOptions = {
            from: '"Emora App"<202227086@std.sci.cu.edu.eg>',
            to: user.email,
            subject: 'Password Reset Code - Emora App',
            text: `Your password reset code is: ${otp}. It expires in 10 minutes.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ msg: "OTP sent to your email" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ 
            email, 
            resetPasswordToken: otp,
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) return res.status(400).json({ msg: "Invalid or expired OTP" });

        res.status(200).json({ msg: "OTP verified successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ msg: "User not found" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ msg: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports=router;