import { Schema } from 'mongoose';
import { ICounterInterface } from '../../interfaces/mongo/counters';
import { mainType } from '../../interfaces/mongo/recipes';
import { IRating, Rating } from '../Rating/Rating.schema';
import { CounterSchema } from '../Recipes/RecipesCounter';

export interface IAssertment extends mainType {
  category:
    | 'dairy'
    | 'meat'
    | 'poultry'
    | 'vegetables'
    | 'fruits'
    | 'bakery'
    | 'frozen'
    | 'alcoholic'
    | 'beverages'
    | 'snacks'
    | 'pickles'
    | 'tobacco products';
  subCategory: string;
  productName: string;
  description: string;
  countryOfOrigin: string;
  rating: IRating;
  counter: ICounterInterface;
  price: number;
  currency: string;
}

export const AssertmentSchema: Schema = new Schema<IAssertment>({
  category: {
    type: String,
    enum: [
      'dairy',
      'meat',
      'poultry',
      'vegetables',
      'fruits',
      'bakery',
      'frozen',
      'alcoholic',
      'beverages',
      'snacks',
      'pickles',
      'tobacco products',
    ],
  },
  subCategory: { type: String, default: 'bulk' },
  productName: { type: String, required: true },
  description: { type: String, required: false },
  countryOfOrigin: { type: String, required: false },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  rating: Rating,
  counter: CounterSchema,
});
