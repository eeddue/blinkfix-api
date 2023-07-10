import mongoose from 'mongoose';
import { User } from '../../config/mdb';

export const getUserRole = async (id: mongoose.Types.ObjectId | undefined) => {
  let user;
  if (id) user = await User.findById(id);
  if (user) return user?.userRole;
};
