import { ShoppingListSchem } from '../../v1/models/Recipes/ShoppingList';
import { ICounterInterface } from '../../v1/interfaces/mongo/counters';
import { IShoppingList } from '../../v1/interfaces/mongo/shoppingList';
import { ICuisine, IManualList, IRecipe } from '../../v1/interfaces/mongo/recipes';
import {
  CuisinesSchema,
  ingredientsSchema,
  RecipesSchema,
  ImagesSchema,
  ManualStep,
  ImagesSchemaEstablishment,
  IImagesSchemaCommon,
  ImagesSchemaCommon,
} from '../../v1/models/Recipes/Recipes';
import staticCuisines from '../../v1/staticFile/cuisines.json';
import { IUser, resetCodeSchema, UserSchema } from '../../v1/models/User/User';
import mongoose, { Model } from 'mongoose';
import { Iingredients } from '../../v1/interfaces/mongo/recipes';
import { CounterSchema, NewCounterSchema } from '../../v1/models/Recipes/RecipesCounter';
import { AddressesSchema, EstablishmentSchema, IAddress } from '../../v1/models/Order';
import { IEstablishment } from '../../v1/interfaces/mongo/establishment';
import {
  IMenu,
  IMenuItems,
  IMenuItemsIngredients,
  MenuItemsIngredientsSchema,
  MenuItemsSchema,
  MenuSchema,
} from '../../v1/models/Order/menuSchemas';
import { IStripePrice, StripePriceModel } from '../../v1/models/stripe/price';
import { IRatingEstablishment, RatingEstablishment } from '../../v1/models/Rating/Rating.schema';
import { ITable, TableSchema } from '../../v1/models/Order/tablesSchema';
import { IReservation, reservationSchema } from '../../v1/models/Order/reservationSchema';
import { AssertmentSchema } from '../../v1/models/Order/assortmentSchema';
import { AllergiesSchema, IAllergies } from '../../v1/models/Profile/allergies';
import { DocumentSchema } from '../../v1/models/Profile/documentImageSchema';
import { IJob, JobSchema } from '../../v1/models/Profile/job';
import { IWorkspaceSchema, WorkspaceSchema } from '../../v1/models/Profile/workspace';
import { IOrder, OrderSchema } from '../../v1/models/Order/order';
import { IProfileImage, ProfileImageSchema } from '../../v1/models/Profile/ProfileImage';
import '../../v1/controllers/Profile/walletController';

async function main() {
  try {
    const nodeEnv = process.env.NODE_ENV || null;
    let host: string = '';
    const mongoConnectionString = process.env.MONGO_CONNECTION_STRING ? process.env.MONGO_CONNECTION_STRING : '';

    const mongouri = process.env.MONGO_CONNECTION_STRING ? process.env.MONGO_CONNECTION_STRING : '';

    if (nodeEnv === 'development') {
      host = 'localhost';
      await mongoose
        .connect(`mongodb://localhost:27017/blinkfix`)
        .then(() => {
          console.log('success connectiong to mongoose database');
        })
        .catch((error) => {
          if (error) console.log(error);
        });
    } else {
      host = 'blink_mongo';
      await mongoose
        .connect(mongoConnectionString)
        .then(() => {
          console.log('success connectiong to mongoose database');
        })
        .catch((error) => {
          if (error) console.log(error);
        });
    }

    mongoose.connection.db.collection('Cuisines').count((err, count) => {
      if (err) {
        console.dir(err);
      }
      if (count === 0) {
        console.log('No Found Records.');
        setStaticCuisines();
      } else {
        console.log('Found Records : ' + count);
      }
    });
  } catch (error) {
    console.error(error);
  }
}

const setStaticCuisines = async () => {
  const allCuisines = await Cuisines.find({});
  if (allCuisines.length === 0) {
    staticCuisines.map((element: { CodeURL: string; NameEnglish: string; NameNative: string }) => {
      const newCuisine = new Cuisines({
        code: element.CodeURL.toLowerCase(),
        name: element.NameEnglish.toLowerCase(),
        oryginalName: element.NameNative.toLowerCase(),
      });
      newCuisine.save();
    });
  }
};
export const User = mongoose.model<IUser>('User', UserSchema);
export const StripePrice = mongoose.model<IStripePrice>('StripePrice', StripePriceModel);
export const ResetCode = mongoose.model('ResetCode', resetCodeSchema);

export const Allergies = mongoose.model<IAllergies>('Allergies', AllergiesSchema);

export const ProfileImage = mongoose.model<IProfileImage>('ProfileImage', ProfileImageSchema);

export const Address = mongoose.model<IAddress>('Address', AddressesSchema);
export const Job = mongoose.model<IJob>('Job', JobSchema);
export const Documents = mongoose.model('Documents', DocumentSchema);
export const Ingredients = mongoose.model('Ingredients', ingredientsSchema);
export const Recipe = mongoose.model<IRecipe>('Recipes', RecipesSchema);
export const ShoppingList = mongoose.model<IShoppingList>('ShoppingList', ShoppingListSchem);
export const Cuisines = mongoose.model<ICuisine>('Cuisines', CuisinesSchema);
export const Manual = mongoose.model<IManualList>('Manual', ManualStep);
export const Images = mongoose.model<Iingredients>('Images', ImagesSchema);

export const RecipeCounters = mongoose.model<ICounterInterface>('RecipesCounters', CounterSchema);

export const OrderCounters = mongoose.model<ICounterInterface>('OrderCounters', NewCounterSchema);
export const OrderMenuItemsCounters = mongoose.model<ICounterInterface>('OrderMenuItemsCounters', NewCounterSchema);
OrderCounters.deleteMany({});

export const Establishment = mongoose.model<IEstablishment>('Establishment', EstablishmentSchema);
export const EstablishmentMenu = mongoose.model<IMenu>('EstablishmentMenu', MenuSchema);

export const EstablishmentMenuItems = mongoose.model<IMenuItems>('EstablishmentMenuItems', MenuItemsSchema);
export const ImagesCommon = mongoose.model<IImagesSchemaCommon>('ImagesCommon', ImagesSchemaCommon);

export const Workspace = mongoose.model<IWorkspaceSchema>('Workspace', WorkspaceSchema);

export const EstablishmentMenuItemsIngredients = mongoose.model<IMenuItemsIngredients>(
  'EstablishmentMenuItemsIngredients',
  MenuItemsIngredientsSchema,
);
export const EstablishmentAssortment = mongoose.model('EstablishmentAssortment', AssertmentSchema);

export const Rating = mongoose.model<IRatingEstablishment>('Rating', RatingEstablishment);
export const Table = mongoose.model<ITable>('Table', TableSchema);
export const Reservation = mongoose.model<IReservation>('Reservation', reservationSchema);
export const ImageEstablishment = mongoose.model('ImagesEstablishment', ImagesSchemaEstablishment);

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
export default main;
