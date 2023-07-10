import mongoose, { Schema } from 'mongoose';

export interface IReservation {
  reservationStartDate: Date;
  reservationEndDate: Date;
  table: mongoose.Types.ObjectId;
  ref: 'Table';
  reservationFor: mongoose.Types.ObjectId;
  reservationUpdatedAt: Date;
  reservationStatus: 'reservation made' | 'confirmed' | 'running late' | 'arrived' | 'cancelled' | 'no-show';
}
export const reservationSchema: Schema = new Schema({
  reservationStartDate: { type: Date, required: true },
  reservationEndDate: { type: Date, required: true },
  table: { type: mongoose.Types.ObjectId, ref: 'Table' },
  reservationFor: { type: mongoose.Types.ObjectId, ref: 'User' },
  reservationCreatedAt: { type: Date, default: Date.now() },
  reservationUpdatedAt: { type: Date, default: Date.now() },
  reservationStatus: {
    type: String,
    enum: ['reservation made', 'confirmed', 'running late', 'arrived', 'cancelled', 'no-shows'],
    default: 'reservation made',
  },
  reason: { type: String },
});
