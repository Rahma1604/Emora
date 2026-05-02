const doctorChatSchema = new mongoose.Schema({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        attachment: {
            type: { type: String, enum: ['drawing', 'voice', 'none'], default: 'none' },
            dataId: mongoose.Schema.Types.ObjectId 
        },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });
module.exports = mongoose.model('DoctorChat', doctorChatSchema);