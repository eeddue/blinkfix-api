import { mainType } from '../../interfaces/mongo/recipes';
import mongoose, { Schema, Types } from 'mongoose';

export interface IWorkspaceSchema extends mainType {
  establishmentId: Types.ObjectId;
  employees: Types.ObjectId[];
  orders: Types.ObjectId[];
  issues: Types.ObjectId[];
}

export const WorkspaceSchema: Schema = new Schema<IWorkspaceSchema>({
  establishmentId: { type: Schema.Types.ObjectId, required: true, ref: 'Establishment' },
  employees: [{ type: mongoose.Types.ObjectId, ref: 'Job' }],
  //TODO: add references to orders and issues
  orders: [{ type: mongoose.Types.ObjectId }],
  issues: [{ type: mongoose.Types.ObjectId }],
});
