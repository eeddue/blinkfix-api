import mongoose, { Schema, Types } from 'mongoose';
import { mainType } from '../../interfaces/mongo/recipes';

export interface IJob extends mainType {
  typeOfWork: 'driver' | 'waiter' | 'chef';
  workPlace: Types.ObjectId;
  workerId: Types.ObjectId;
  startOfWork: Date;
  endOfWork: Date;
  isConfirmed: boolean;
  isRejected: boolean;
  orders: Types.ObjectId[];
  workerStatus: string;
}

export const JobSchema: Schema = new Schema<IJob>({
  typeOfWork: {
    type: String,
    enum: ['driver', 'waiter', 'chef'],
    required: true,
  },
  workerId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  workPlace: { type: Schema.Types.ObjectId, required: true, ref: 'Establishment' },
  startOfWork: { type: Date, default: null },
  endOfWork: { type: Date, default: null },
  isRejected: { type: Boolean, default: false },
  isConfirmed: { type: Boolean, default: false },
  orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  workerStatus: {
    type: String,
    default: 'free',
    enum: [
      'free',
      'off',
      'driver at restaurant',
      'Order sent to chef',
      'Order Served',
      'Order recived',
      'Order redy to pick up',
    ],
  },
});

JobSchema.plugin(require('mongoose-autopopulate'));
