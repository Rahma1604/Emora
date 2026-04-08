const mongoose=require('mongoose');
const ChildSchema=new mongoose.Schema({
    name:{type:String,required:true},
    age:{type:Number,required:true},
    gender:{type:String,enum:['male','female'],required:true},
    parentId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
    drawings:[{ImageUrl:String,analysisResult:String,status: String,createdAt:{type:Date,default:Date.now}}]
},{timestamps:true});
module.exports=mongoose.model('Child',ChildSchema);