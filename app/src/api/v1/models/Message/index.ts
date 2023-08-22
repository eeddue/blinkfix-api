//@ts-no-check

import mongoose, { Schema } from 'mongoose';

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    chatId: String,
    message: String,
  },
  {
    timestamps: true,
  },
);

const Message = mongoose.model('Message', MessageSchema);
export default Message;
