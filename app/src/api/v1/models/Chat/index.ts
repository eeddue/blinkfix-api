import mongoose, { Schema } from 'mongoose';

const ChatSchema = new Schema<any>(
  {
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    messages: Array,
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;
