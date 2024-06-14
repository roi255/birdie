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

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
