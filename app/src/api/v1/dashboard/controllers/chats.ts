// @ts-nocheck

import Chat from '../../models/Chat';

//get all chats
export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find().populate({
      path: 'user',
      select: '_id name images',
      populate: {
        path: 'images.profileImage',
        select: 'path',
      },
    });
    return res.status(200).json({ chats });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//get one chat
export const getChat = async (req, res) => {
  try {
    const chat = await Chat.find({ user: req.params.userId }).populate({
      path: 'user',
      select: '_id name images',
      populate: {
        path: 'images.profileImage',
        select: 'path',
      },
    });
    return res.status(200).json({ chat });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//send chat messages
export const sendChatMessages = async (req, res) => {
  const { userId } = req.params;
  const { message, user } = req.body;

  try {
    const chat = await Chat.findOne({ user: userId });
    if (!chat) {
      await Chat.create({ messages: [], user: userId });
    }
    const data = {
      message,
      user,
      createdAt: Date.now(),
    };
    await Chat.updateOne(
      { user: userId },
      {
        $push: {
          messages: data,
        },
      },
    );

    return res.status(200).json({ msg: 'Message sent successfully', message: data });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
