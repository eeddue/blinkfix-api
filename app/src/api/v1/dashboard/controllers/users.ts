// @ts-nocheck

import { User } from '../../../config/mdb';

//get all users
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate({ path: 'address', populate: [] }).select('-password');

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//get and update specific user
export const updateUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByIdAndUpdate(userId, req.body, { new: true });
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
