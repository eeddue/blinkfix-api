import { ICounterInterface } from '../../interfaces/mongo/counters';
import mongoose, { Schema } from 'mongoose';
import { IEstablishment } from '../../interfaces/mongo/establishment';
import { mainType } from '../../interfaces/mongo/recipes';
import { ImagesSchema, ImagesSchemaEstablishment, ingredientsSchema } from '../Recipes/Recipes';
import { IMenu, MenuSchema } from './menuSchemas';
import { OrderCounters } from '../../../config/mdb';

const OpenHoursSchema: Schema = new Schema({
  day: {
    type: String,

    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  hours: {
    open: { type: String, required: true },
    close: { type: String, required: true },
  },
});

export interface IAddress extends mainType {
  country: string;
  city: string;
  street: string;
  postcode: string;
  state: string;
  buildingnumber: string;
}

export const AddressesSchema: Schema = new Schema<IAddress>({
  country: { type: String, required: true },
  city: { type: String, required: true },
  street: { type: String, required: true },
  postcode: { type: String, required: true },
  state: { type: String, required: true },
  buildingnumber: { type: String, required: true },
});

const DeliveryServiceSchema: Schema = new Schema({
  isDelivery: { type: Boolean, default: false },
  isPickup: { type: Boolean, default: false },
});

const geoSchema: Schema = new Schema({
  type: {
    type: String,
    default: 'Point',
  },
  coordinates: {
    type: [Number],
  },
});

export const EstablishmentSchema: Schema = new Schema<IEstablishment>({
  type: { type: String, enum: ['shop', 'restaurant', 'foodtruck', 'localCook'] },
  name: {
    type: String,
    required: true,
  },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    type: geoSchema,
    index: '2dsphere',
  },
  cuisine: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cuisines', required: true }],
  openHours: [OpenHoursSchema],
  address: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  isVegan: { type: Boolean, default: false },
  isHalal: { type: Boolean, default: false },
  isKosher: { type: Boolean, default: false },
  delivery: DeliveryServiceSchema,

  menu: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EstablishmentMenu',
    },
  ],
  assortment: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EstablishmentAssortment' }],
  tables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table' }],
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }],
  image: [{ type: ImagesSchemaEstablishment }],
  workspace: { type: Schema.Types.ObjectId, ref: 'Workspace' },
  counter: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderCounters' },
  vatNumber: { type: String, required: true },
  taxPercentage: { type: Number },
});
