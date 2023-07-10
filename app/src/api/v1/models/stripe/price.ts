import mongoose, { Schema } from 'mongoose';

export interface IStripePrice {
  price_data: string;
  price_id: string;
}

export const StripePriceModel = new Schema<IStripePrice>(
  {
    price_id: { type: 'String', required: true },
    price_data: { type: 'String', required: true },
  },
  { timestamps: true },
);
