import mongoose, { Schema, Types } from 'mongoose';

export interface IProfileImage {
  ownerId: Types.ObjectId;
  isImageBackground: boolean;
  path: string;
}

export const ProfileImageSchema: Schema = new Schema<IProfileImage>({
  ownerId: { type: mongoose.Schema.Types.ObjectId },
  path: { type: String },
  isImageBackground: { type: Boolean },
});
