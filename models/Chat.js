const mongoose=require('mongoose');
const chatSchema=new mongoose.Schema({
    parentId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},    
    childId:{type:mongoose.Schema.Types.ObjectId,ref:'Child',required:true},
    messages:[{sender:{type:String,enum:['parent','ai'],required:true},text:String,
    attachment: {
            type: { type: String, enum: ['image', 'audio', 'none'], default: 'none' },
             fileUrl: { type: String, default: null }
        },
    createdAt:{type:Date,default:Date.now}}]
});
module.exports=mongoose.model('Chat',chatSchema);