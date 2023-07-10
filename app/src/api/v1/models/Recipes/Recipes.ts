import mongoose, { Schema, Types } from 'mongoose';
import { Iingredients } from '../../interfaces/mongo/recipes';

const prepCookeTimeValidation = new RegExp('^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$');

/**
 * @swagger
 * definitions:
 *   RecipesSchema:
 *     properties:
 *       birth_year:
 *         type: Date
 *         description: user birthday [yyyy-MM-dd]
 *         required: true
 *       userRole:
 *         type: string
 *         enum: [ End User, Student, Local Cook, Restuarant, Food trucks, Shop ]
 */

export const ImagesSchema: Schema = new mongoose.Schema({
  path: { type: 'string', required: true },
  manualStepId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManualStep' },
});

export interface IImagesSchemaEstablishment {
  path: string;
  establishmentId: mongoose.Types.ObjectId;
  isMainImage: boolean;
}
export interface IImagesSchemaCommon {
  path: string;
  relatedId: mongoose.Types.ObjectId;
}

export const ImagesSchemaEstablishment: Schema = new mongoose.Schema<IImagesSchemaEstablishment>({
  path: { type: 'string', required: true },
  establishmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Establishment' },
  isMainImage: { type: Boolean, default: false },
});

export const ImagesSchemaCommon: Schema = new mongoose.Schema<IImagesSchemaCommon>({
  path: { type: 'string', required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId, ref: 'EstablishmentMenuItems' },
});

export const ingredientsSchema: Schema = new Schema({
  qtt: { type: Number, default: 0 },
  unit: { type: String, default: 'psc' },
  name: { type: String, required: true },
});

export const CuisinesSchema: Schema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  oryginalName: { type: String, required: true },
});

export const ManualStep: Schema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
});

export const RecipesSchema: Schema = new mongoose.Schema({
  alreadyPayedOut: { type: Number, default: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: { type: mongoose.Schema.Types.ObjectId, ref: 'ImagesCommon' },

  isEstablishment: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, required: true },
  cuisine: { type: mongoose.Schema.Types.ObjectId, ref: 'Cuisines' },
  advancement: { type: Number, enum: [1, 2, 3, 4, 5], required: true },
  prepTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v: any) {
        return prepCookeTimeValidation.test(v);
      },
      message: (props: any) => `${props.value} is not a prep time format. Please use HH:MM fotmat!`,
    },
  },
  cookTime: {
    type: String,
    required: true,
    validate: {
      validator: function (v: any) {
        return prepCookeTimeValidation.test(v);
      },
      message: (props: any) => `${props.value} is not a prep time format. Please use HH:MM fotmat!`,
    },
  },
  serves: { type: Number, required: true },
  isKosher: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  isHalal: { type: Boolean, default: false },
  dishesType: {
    type: String,
    enum: ['Soups', 'Salads', 'Bakeries', 'Dairy', 'Mains', 'Sides', 'Beverages', 'Pickles', 'Snacks', 'Occasion'],
    requred: true,
  },
  spicenes: {
    type: String,
    enum: ['extra hot', 'Hot', 'Mild', 'normal'],
    requred: true,
  },
  ingredients: [ingredientsSchema],
  manual: [ManualStep],
  tipTitle: { type: String },
  tipDescription: { type: String },
  tipIngredients: [ingredientsSchema],
  tipManual: [ManualStep],
  tags: {
    type: [String],
    requred: true,
  },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: 'RecipesCounters' },
});
