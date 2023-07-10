import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema<any>(
  {
    title: String,
    description: String,
    to: [],
  },
  {
    timestamps: true,
  },
);

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
