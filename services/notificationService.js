const Notification = require('../models/Notification');
const sendNotification = async (data) => {
    try {
        const newNotification = await Notification.create({
            doctorId: data.doctorId,
            childId: data.childId,
            title: data.title,
            message: data.message,
            type: data.type
        });
      // هنا يتم الإرسال الفوري عبر Socket.io
        if (global.io) {
            // نستخدم .toString() لضمان مطابقة الـ ID للـ Room المشترك فيها الطبيب
            global.io.to(data.doctorId.toString()).emit('new-notification', newNotification);
        }
        return newNotification;
    } catch (err) {
        console.error("Error creating notification:", err);
    }
};

module.exports = { sendNotification };