import Notification from "../models/notification-model.js";

//* get notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find().sort({ createdAt: -1 }).populate({
      path: "from",
      select: "username fullName profilePic",
    });

    await Notification.updateMany({ to: userId }, { read: true });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//* delete notifications
export const deleteNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({ to: userId });

    res.status(200).json({ message: "Notifications deleted" });
  } catch (error) {
    console.log("Error deleting notifications", error.message);
    res.status(500).json({ message: error.message });
  }
};

//* delete single notification

export const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);

    if (!notification) return res.status(404).json({ message: "Notification not found" });

    if (notification.to.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not allowed to delete this notification" });
    }

    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.log("Error deleting notification", error.message);
    res.status(500).json({ message: error.message });
  }
};
