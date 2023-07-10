import mongoose, { PopulatedDoc } from 'mongoose';
import { IMenu } from '../../models/Order/menuSchemas';
import { ICounterInterface } from './counters';
import { mainType } from './recipes';

export interface ILocalization {
  latitude: string;
  longatitude: string;
}

export interface IOpenHours {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  hours: {
    open: string;
    close: string;
  };
}

export interface IAddress {
  country: string;
  city: string;
  street: string;
  postcode: string;
  state: string;
  buildingnumber: string;
}

export interface IDelivery {
  isDelivery: boolean;
  isPickup: boolean;
}

export interface IEstablishment extends mainType {
  type: 'shop' | 'restaurant' | 'foodtruck' | 'localCook';
  name: string;
  owner: mongoose.Schema.Types.ObjectId;
  cuisine: mongoose.Schema.Types.ObjectId[];
  location: {
    type: { type: 'Point' };
    coordinates: number[];
  };
  openHours: IOpenHours[];
  address: mongoose.Schema.Types.ObjectId;
  isVegan: boolean;
  isHalal: boolean;
  isKosher: boolean;
  delivery: IDelivery;
  tables: mongoose.Types.ObjectId[];
  reservations: mongoose.Types.ObjectId[];
  image: mongoose.Types.ObjectId[];
  menu: mongoose.Types.ObjectId[];
  assortment: mongoose.Types.ObjectId[];
  workspace: mongoose.Types.ObjectId;
  counter: mongoose.Types.ObjectId;
  vatNumber: string;
  taxPercentage: number;
}
