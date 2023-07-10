import { mainType } from './recipes';
import mongoose, { Types } from 'mongoose';

export interface IngredientOnShoppingList {
  isDone: boolean;
  qtt: { type: Number; default: 0 };
  unit: { type: String; default: 'psc' };
  name: string;
}

export interface IShoppingList extends mainType {
  owner: { type: Types.ObjectId; ref: 'User' };
  recipeId: { type: mongoose.Schema.Types.ObjectId; ref: 'Recipe' };
  ingredients: IngredientOnShoppingList[];
  tipIngredients: IngredientOnShoppingList[];
}
