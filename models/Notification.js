const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' }, // لربط الإشعار بطفل معين
    title: { type: String, required: true }, // مثل "Urgent Review Required"
    message: { type: String, required: true }, // النص التفصيلي
    type: { 
        type: String, 
        enum: ['review', 'urgent', 'follow_up', 'summary', 'reminder', 'system'], 
        required: true 
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);