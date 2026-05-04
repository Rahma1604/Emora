const mongoose = require('mongoose');

const doctorChatSchema = new mongoose.Schema({
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
    messages: [{
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        attachment: {
            type: { type: String, enum: ['drawing', 'voice', 'none'], default: 'none' },
            dataId: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'messages.attachment.modelType'
            },
            modelType: {
                type: String,
                required: function () {
                    return this.type !== 'none';
                },
                enum: ['Drawing', 'VoiceAnalysis']
            }
        },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

doctorChatSchema.index({ parentId: 1, doctorId: 1, childId: 1 });

module.exports = mongoose.model('DoctorChat', doctorChatSchema);