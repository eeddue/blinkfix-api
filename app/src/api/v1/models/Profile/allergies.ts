import mongoose, { Schema, Types } from 'mongoose';

export interface IAllergies {
  ownerId: Types.ObjectId;
  allergies: number[];
}

export const AllergiesSchema: Schema = new Schema<IAllergies>({
  ownerId: { type: mongoose.Schema.Types.ObjectId },
  allergies: { type: [{ type: Number }], default: [] },
});
