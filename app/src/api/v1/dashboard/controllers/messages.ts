//@ts-nocheck

import Message from '../../models/Message';

export const SendMessage = async (req, res) => {
  try {
    const { message, sender, receiver, chatId } = req.body;
    if (!message || !sender || !receiver || !chatId) return res.sendStatus(404);

    const msg = await Message.create(req.body);
    return res.status(201).json({ message: msg });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const GetUserChats = async (req, res) => {
  const { userId } = req.params;
  try {
    if (!userId) return res.sendStatus(404);

    const messages = await Message.find({ $or: [{ sender: userId }, { receiver: userId }] }, { createdAt: -1 })
      .populate('sender', '_id username profileImage')
      .populate('receiver', '_id username profileImage');

    const groupedMessages = messages.reduce((groups, message) => {
      const chatId = message.chatId;
      if (!groups[chatId] || groups[chatId].createdAt < message.createdAt) {
        groups[chatId] = message;
      }
      return groups;
    }, {});

    const chats = Object.values(groupedMessages);

    return res.status(201).json({ chats });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const GetChatMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    if (!chatId) return res.sendStatus(404);

    const messages = await Message.find({ chatId });
    return res.status(200).json({ messages });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
