
const Notification = require('../models/NotificationP');
async function sendNotification({ userId, childId, title, message, type }) {
    try {
        const newNotification = new Notification({
            userId, // معرف الأب (يجب جلبه من بيانات الطفل)
            childId,
            title,
            message,
            type
        });
        await newNotification.save();
        console.log("Notification saved successfully");
    } catch (err) {
        console.error("Error saving notification:", err);
    }
}

module.exports = { sendNotification };