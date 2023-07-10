// @ts-nocheck

import Notification from '../../models/Notification';

//create dispute
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

//get disputes
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find();
    return res.status(200).json({ notifications });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//update dispute
export const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await Notification.findByIdAndDelete(notificationId);
    return res.status(200).json({ msg: 'Deleted successfully' });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
