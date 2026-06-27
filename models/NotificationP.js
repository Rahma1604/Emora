const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // معرف الأب
    childId: { type: mongoose.Schema.Types.ObjectId, ref: 'Child' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['analysis_ready', 'doctor_review', 'progress', 'reminder', 'system'], required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('NotificationP', NotificationSchema);