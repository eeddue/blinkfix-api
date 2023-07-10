import mongoose, { Schema } from 'mongoose';
import { IShoppingList } from '../../interfaces/mongo/shoppingList';

export const ShoppingListSchem: Schema = new Schema<IShoppingList>(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, required: true },
    recipeId: { type: mongoose.Schema.Types.ObjectId },
    ingredients: [
      {
        isDone: { type: Boolean, default: false },
        qtt: { type: Number, default: 0 },
        unit: { type: String, default: 'psc' },
        name: { type: String, required: true },
      },
    ],
    tipIngredients: [
      {
        isDone: { type: Boolean, default: false },
        qtt: { type: Number, default: 0 },
        unit: { type: String, default: 'psc' },
        name: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);
