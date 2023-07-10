import mongoose, { Schema, Types } from 'mongoose';

export type mainType = {
  id: Types.ObjectId;
};

export interface IRecipe extends mainType {
  _id?: mongoose.Schema.Types.ObjectId;
  alreadyPayedOut: number;
  image?: mongoose.Schema.Types.ObjectId;
  owner: Types.ObjectId;
  isEstablishment: boolean;
  title: string;
  description: string;
  cuisine: ICuisine;
  advancement: number;
  prepTime: string;
  cookTime: string;
  serves: number;
  isKosher: boolean;
  isVegan: boolean;
  isHalal: boolean;
  tipTitle: string;
  tipDescription: string;
  tags: string[];
  ingredients: Iingredients[];
  tipIngredients: Iingredients[];
  manual: IManualList[];
  tipManual: IManualList[];
  counter: [{ type: mongoose.Schema.Types.ObjectId; ref: 'RecipesCounters' }];
  dishesType:
    | 'Soups'
    | 'Salads'
    | 'Bakeries'
    | 'Dairy'
    | 'Mains'
    | 'Sides'
    | 'Beverages'
    | 'Pickles'
    | 'Snacks'
    | 'Occasion';
}

export interface Iingredients extends mainType {
  isTips: boolean;
  qtt: { type: Number; default: 0 };
  unit: { type: String; default: 'psc' };
  name: string;
}

export interface IManualList extends mainType {
  step: number;
  name: string;
  imageUrl?: string;
}
export interface ICuisine extends mainType {
  code: string;
  name: string;
  oryginalName: string;
}
export interface ICuisine extends mainType {
  code: string;
  name: string;
  oryginalName: string;
}
