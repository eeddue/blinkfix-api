import mongoose from 'mongoose';

export interface IRating {
  one: number;
  two: number;
  three: number;
  four: number;
  five: number;
}
export interface IRatingEstablishment {
  overallRating: IRating;
  chefRating: IRating;
  waiterRating: IRating;
  driverRating: IRating;
  estabblishment: { type: mongoose.Types.ObjectId; ref: 'Establishment' };
}

export const Rating: mongoose.Schema = new mongoose.Schema<IRating>({
  one: { type: Number, default: 0 },
  two: { type: Number, default: 0 },
  three: { type: Number, default: 0 },
  four: { type: Number, default: 0 },
  five: { type: Number, default: 0 },
});

export const RatingEstablishment: mongoose.Schema = new mongoose.Schema<IRatingEstablishment>({
  overallRating: Rating,
  chefRating: Rating,
  waiterRating: Rating,
  driverRating: Rating,
});
