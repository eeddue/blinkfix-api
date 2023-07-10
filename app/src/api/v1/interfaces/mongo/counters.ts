import mongoose, { Schema, Types } from 'mongoose';
import { mainType } from './recipes';

export type userLSC = {};

export interface ICounterInterface extends mainType {
  relatedId: Schema.Types.ObjectId;
  numberOfClicks: number;
  numberOfShares: number;
  numberOfLikes: number;
  whoLike: Types.ObjectId[];
  whoShare: Types.ObjectId[];
}
