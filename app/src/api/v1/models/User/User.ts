import { mainType } from '../../interfaces/mongo/recipes';
import mongoose, { Schema, Types } from 'mongoose';
import { IAddress } from '../Order';

export interface IUser extends mainType {
  first_name: string;
  last_name: string;
  email: string;
  name: string;
  password: string;
  phone_number: string;
  address: Types.ObjectId[];
  birth_year: string;
  userRole: 'End User' | 'Student' | 'Local Cook' | 'Restaurant' | 'Food trucks' | 'Shop';
  allergies: Types.ObjectId;
  documentImages: Types.ObjectId[];
  jobs: Types.ObjectId[];
  images: {
    backgroundImage: Types.ObjectId;
    profileImage: Types.ObjectId;
  };
  establishment?: Types.ObjectId[];
  stripe_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  mode?: 'Testing';
  banned: boolean;
}

export const UserSchema = new Schema<IUser>({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  phone_number: { type: String, required: true },
  address: [{ type: Types.ObjectId, ref: 'Address' }],
  birth_year: { type: String, required: true },
  userRole: {
    type: String,
    enum: ['End User', 'Student', 'Local Cook', 'Restaurant', 'Food trucks', 'Shop'],
    requred: true,
  },
  allergies: { type: Schema.Types.ObjectId, ref: 'Allergies' },
  documentImages: [{ type: Types.ObjectId, ref: 'Documents' }],
  jobs: [{ type: Types.ObjectId, ref: 'Job' }],
  images: {
    backgroundImage: { type: Types.ObjectId, ref: 'ProfileImage' },
    profileImage: { type: Types.ObjectId, ref: 'ProfileImage' },
  },
  establishment: [{ type: Types.ObjectId, ref: 'Establishment' }],
  stripe_id: { type: String },
  stripe_subscription_id: { type: String },
  stripe_customer_id: { type: String },
  mode: { type: String },
  banned: {
    type: Boolean,
    default: false,
  },
});
UserSchema.plugin(require('mongoose-autopopulate'));

export const resetCodeSchema = new Schema({
  resetCode: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  userId: {
    type: Types.ObjectId,
    ref: 'User',

    required: true,
  },
});

resetCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 }); // 900 seconds = 15 minutes
