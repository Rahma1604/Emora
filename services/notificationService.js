const Notification = require("../models/Notification");

const sendNotification = async (data = {}) => {
  try {
    const {
      doctorId,
      childId,
      caseId,
      title,
      message,
      type,
    } = data;

    if (!doctorId) {
      throw new Error("Doctor ID is required to create a notification");
    }

    if (!childId) {
      throw new Error("Child ID is required to create a notification");
    }

    if (!title || !message) {
      throw new Error("Notification title and message are required");
    }

    if (!type) {
      throw new Error("Notification type is required");
    }

    const newNotification = await Notification.create({
      doctorId,
      childId,
      caseId: caseId || null,
      title,
      message,
      type,
    });

    if (global.io && doctorId) {
      global.io
        .to(doctorId.toString())
        .emit("new-notification", newNotification);
    }

    return newNotification;
  } catch (error) {
    console.error("Error creating doctor notification:", error);
    throw error;
  }
};

module.exports = { sendNotification };
