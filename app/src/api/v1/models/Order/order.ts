import { mainType } from '../../interfaces/mongo/recipes';
import { Schema, Types } from 'mongoose';
import { AddressesSchema, IAddress } from '.';

export interface ISingleChange {
  ingredientId: Types.ObjectId;
  qtt: number;
}

export interface IOrderItems extends mainType {
  itemId: Types.ObjectId;
  changes?: ISingleChange[];
}

export interface IOrderRequest extends mainType {
  address: IAddress;
  orderWhere: Types.ObjectId;
  orderItems: IOrderItems[];
  isPickup: boolean;
  isWaiter?: boolean;
}
export interface IOrder extends mainType {
  orderDate: Date;
  orderUpdateDate: Date;
  orderBy: Types.ObjectId;
  orderWhere: Types.ObjectId;
  orderItems: IOrderItems[];
  isCompleted: boolean;
  address: Types.ObjectId;
  assignedTo: Types.ObjectId;
  allAssignedTo: Types.ObjectId[];
  forwardedTo: 'waiter' | 'driver' | 'chef' | 'pickup';

  paymentType: Types.ObjectId;
  totalAmount: number;
  currency: string;
  transaction: Types.ObjectId;
  orderStatus:
    | 'placed'
    | 'canceled'
    | 'took by chef'
    | 'took by waiter'
    | 'took by driver'
    | 'finished'
    | 'confirmed'
    | 'delivered';
  isPickup: boolean;
}

export const OrderItemSchema: Schema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'EstablishmentMenuItems' },
  changes: [
    {
      ingredientId: { type: Schema.Types.ObjectId, ref: 'EstablishmentMenuItemsIngredients' },

      qtt: { type: Number, required: true, message: 'you must provide a quantity of changed item' },
    },
  ],
});

export const OrderSchema: Schema = new Schema<IOrder>({
  orderDate: { type: Date, default: new Date() },
  orderUpdateDate: { type: Date, default: new Date() },
  orderBy: { type: Schema.Types.ObjectId, ref: 'User' },
  orderWhere: { type: Schema.Types.ObjectId, ref: 'Establishment' },
  orderStatus: {
    type: String,
    enum: ['placed', 'paid', 'canceled', 'confirmed', 'took by chef', 'took by waiter', 'took by driver', 'finished'],
    default: 'placed',
  },
  orderItems: [OrderItemSchema],
  isCompleted: { type: Boolean, default: false },
  address: { type: Schema.Types.ObjectId, ref: 'Address' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Job' },
  allAssignedTo: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  totalAmount: { type: Number },
  currency: { type: String },
  isPickup: { type: Boolean, default: false },
  forwardedTo: { type: String, enum: ['waiter', 'driver', 'chef', 'pickup'] },

  // TODO: work this out

  paymentType: { type: Schema.Types.ObjectId },
  transaction: { type: Schema.Types.ObjectId },
});
OrderSchema.plugin(require('mongoose-autopopulate'));
