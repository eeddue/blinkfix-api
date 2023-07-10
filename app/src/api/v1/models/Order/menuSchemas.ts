import mongoose, { Schema, Types } from 'mongoose';
import { mainType } from '../../interfaces/mongo/recipes';

export interface IMenuItemsIngredients extends mainType {
  qtt: number;
  unit: string;
  name: string;
  isIngredientVisible: boolean;
  isIngredientEditable: boolean;
  pricePerIngredient: number;
}

export const MenuItemsIngredientsSchema = new Schema<IMenuItemsIngredients>({
  qtt: { type: Number, default: 0, min: [0, 'cant add less than zero of ingredient'] },
  pricePerIngredient: { type: Number, default: 0, min: [0, 'price must be higher '] },
  unit: { type: String, default: 'psc' },
  name: { type: String, required: true },
  isIngredientVisible: { type: Boolean, default: true },
  isIngredientEditable: { type: Boolean, default: true },
});
export interface IVisibility extends mainType {
  categoryName: string;
  isVisible: boolean;
}

export const MenuSchemaVisibility: Schema = new Schema<IVisibility>({
  categoryName: {
    type: String,
    enum: ['bakeries', 'starters', 'sides', 'soups', 'mains', 'desserts', 'beverages', 'alc beverages', 'products'],
  },
  isVisible: { type: Boolean, default: true },
});

export interface IMenuItems extends mainType {
  establishmentId: Types.ObjectId;
  dishName: string;
  category: any;
  isDishForDelivery: boolean;
  price: number;
  currency: string;
  dishDescription: string;
  dishIngredients: Types.ObjectId[];
  spiceness: string;
  isHalal: false;
  isKosher: boolean;
  isVegan: boolean;
  counter: Types.ObjectId;
  image: Types.ObjectId;
  allergens: number[];
}

export const MenuItemsSchema = new Schema<IMenuItems>({
  establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment' },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderMenuItemsCounters' },
  image: { type: mongoose.Schema.Types.ObjectId, ref: 'ImagesCommon' },
  dishName: {
    type: String,
    required: true,
  },
  isDishForDelivery: { type: Boolean, default: true },
  price: { type: Number, required: true },
  currency: { type: String, required: true },
  dishDescription: { type: String, required: true },
  dishIngredients: [{ type: Schema.Types.ObjectId, ref: 'EstablishmentMenuItemsIngredients' }],
  spiceness: { type: String, enum: ['extra hot', 'Hot', 'Mild', 'normal'], required: true },
  isVegan: { type: Boolean, required: true },
  isKosher: { type: Boolean, required: true },
  isHalal: { type: Boolean, required: true },
  category: {
    type: String,
    enum: [
      'bakeries',
      'starters',
      'sides',
      'soups',
      'mains',
      'desserts',
      'beverages',
      'alc beverages',
      'products',
      'dairy',
      'meat',
      'poultry',
      'vegetables',
      'fruits',
      'bakery',
      'frozen',
      'alcoholic',
      'snacks',
      'pickles',
      'tabacco',
      'bulk',
    ],
  },
  allergens: { type: [{ type: Number }], default: [] },
});

export interface IMenu {
  menuName: String;
  menuItems: Types.ObjectId[];
  establishmentId: Types.ObjectId;
  isOurMenuSubmenuVisible: boolean;
  categoryVisibility: IVisibility[];
}

export const MenuSchema: Schema = new Schema<IMenu>({
  menuName: { type: String, required: true },
  establishmentId: { type: Schema.Types.ObjectId, ref: 'Establishment' },
  isOurMenuSubmenuVisible: { type: Boolean, default: true },
  menuItems: [{ type: Schema.Types.ObjectId, ref: 'EstablishmentMenuItems', required: true }],
  categoryVisibility: [
    {
      type: MenuSchemaVisibility,
      default: [
        { categoryName: 'bakeries', isVisible: true },
        { categoryName: 'starters', isVisible: true },
        { categoryName: 'sides', isVisible: true },
        { categoryName: 'soups', isVisible: true },
        { categoryName: 'mains', isVisible: true },
        { categoryName: 'desserts', isVisible: true },
        { categoryName: 'beverages', isVisible: true },
        { categoryName: 'alc beverages', isVisible: true },
        { categoryName: 'products', isVisible: true },
      ],
    },
  ],
});
