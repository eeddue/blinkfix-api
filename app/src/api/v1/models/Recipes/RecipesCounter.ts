import mongoose, { Schema, Types } from 'mongoose';
import { ICounterInterface } from '../../interfaces/mongo/counters';
import { mainType } from '../../interfaces/mongo/recipes';

export const CounterSchema: Schema = new Schema<ICounterInterface>({
  relatedId: { type: Schema.Types.ObjectId, ref: 'Recipes' },
  numberOfClicks: { type: Number, default: 0 },
  numberOfLikes: { type: Number, default: 0 },
  numberOfShares: { type: Number, default: 0 },
  whoLike: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  whoShare: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
});

export const NewCounterSchema: Schema = new Schema<ICounterInterface>({
  numberOfClicks: { type: Number, default: 0 },
  numberOfLikes: { type: Number, default: 0 },
  numberOfShares: { type: Number, default: 0 },
  relatedId: { type: Schema.Types.ObjectId, ref: 'Establishment' },
  whoLike: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  whoShare: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
});
