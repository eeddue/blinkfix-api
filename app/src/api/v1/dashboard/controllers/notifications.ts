// @ts-nocheck

import Notification from '../../models/Notification';

//create notification
export const createNotification = async (req, res) => {
  try {
    let notification;
    if (req.body.to.includes('Everyone')) {
      notification = await Notification.create({ ...req.body, to: 'Everyone' });
    } else {
      notification = await Notification.create(req.body);
    }
    return res.status(200).json({ msg: 'Notification sent.', notification });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//get notifications
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//update notification
export const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await Notification.findByIdAndDelete(notificationId);
    return res.status(200).json({ msg: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//get user notifications
export const getUserNotifications = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) return res.sendStatus(404);

    const notifications = await Notification.find({ to: { $in: [userId] } });
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
