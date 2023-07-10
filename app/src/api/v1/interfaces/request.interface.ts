import { Request } from 'express';
import Stripe from 'stripe';
export interface IGetUserAuthInfoRequest extends Request {
  UserData?: any; // or any other type
  token?: any;
  image?: any;
  imageFront?: any;
  imageBack?: any;
  documentImageBack?: any;
  documentImageFront?: any;
  recipeId?: string;
  info?: any;
  headers: any;
  profileImage?: any;
  backgroundImage?: any;
  menuItem?: any;
  file?: any;
  stripeImage?: { stripeFile: Stripe.Response<Stripe.File> | undefined; file: Express.Multer.File | undefined } | any;
}

export interface LoginRequestInterface {
  login: string;
  password: string;
}

export interface IFileImage {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}
