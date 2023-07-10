import { Schema } from 'mongoose';
import { mainType } from '../../interfaces/mongo/recipes';

export interface IDocument extends mainType {
  path: string;
  ownerId: Schema.Types.ObjectId;
  isFrontImage: boolean;
}

export const DocumentSchema: Schema = new Schema<IDocument>({
  path: { type: 'string', required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  isFrontImage: { type: Boolean, default: false },
});
