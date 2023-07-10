import { stripe } from '../order/payment';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { Address, ResetCode, StripePrice, User } from '../../../config/mdb/index';
import { Request } from 'express';
import { IResponse } from '../../interfaces';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import GenerateRefreshToken from '../../helpers/jwthelpers';
import redis_client from '../../../config/redis';
import { IAddress } from '../../models/Order';
import nodemailer from 'nodemailer';
import MailerController from '../../helpers/mailer';
import { templateMailResetPassword } from '../../../assets/templateemail';
import { retriveCustomer } from '../../helpers/retriveCustomer';

const testingEnv = process.env.APP_MODE;

const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';
const jwtRefreshSecret = process.env.JWT_REFRESH_KEY || 'test';
const jwtAccesTime = process.env.JWT_ACCESS_TIME || '15m';
const jwtRefreshTime = process.env.JWT_REFRESH_TIME || '5m';

const userRegister = async (req: Request, res: IResponse) => {
  // @ts-ignore
  const ip = req.ip;
  const { first_name, last_name, email, name, phone_number, password, postal_code, town, birth_year, userRole } =
    req.body;

  const { country, city, street, postcode, state, buildingnumber }: IAddress = req.body.address;

  if (!country || !city || !street || !postcode || !state || !buildingnumber) {
    return res.status(400).send({ error: null, message: 'you have to provide address', data: null });
  }

  try {
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.status(400).send({ error: null, message: 'user already exists', data: null });
    }

    const newAddress = await Address.create({
      country,
      city,
      street,
      postcode,
      state,
      buildingnumber,
    });
    if (newAddress) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const account = await stripe.accounts.create({
        type: 'standard',
      });
      const customer = await retriveCustomer(account.id, newAddress, first_name, last_name, email);
      const user = await (
        await User.create({
          first_name,
          last_name,
          email,
          name,
          phone_number,
          password: hashedPassword,
          address: [newAddress?._id],
          postal_code,
          town,
          birth_year,
          userRole,
          stripe_id: account.id,
          stripe_customer_id: customer.id,
        })
      ).populate('address');

      console.log(testingEnv);
      if (testingEnv === 'Testing') {
        await User.updateOne({ mode: 'Testing' }).exec();
      }

      if (
        user.userRole === 'Local Cook' ||
        user.userRole === 'Restaurant' ||
        user.userRole === 'Food trucks' ||
        user.userRole === 'Shop'
      ) {
        // #region create price if not exist
        const priceLocalCook = await StripePrice.findOne({ price_data: 'LocalCookPrice' });
        console.log('creating price for LocalCookPrice');
        if (!priceLocalCook) {
          const pricelc = await stripe.prices.create({
            currency: 'GBP',
            unit_amount: 250,

            product_data: {
              name: 'LocalCook subscription',
            },
          });
          await StripePrice.create({ price_data: 'LocalCookPrice', price_id: pricelc.id });
        }
        const priceRestaurant = await StripePrice.findOne({ price_data: 'RestaurantPrice' });
        console.log('creating price for RestaurantPrice');
        if (!priceRestaurant) {
          const pricer = await stripe.prices.create({
            currency: 'GBP',
            unit_amount: 600,
            product_data: {
              name: 'Restaurant subscription',
            },
          });
          await StripePrice.create({ price_data: 'RestaurantPrice', price_id: pricer.id });
        }
        const priceFoodTrucks = await StripePrice.findOne({ price_data: 'FoodTrucksPrice' });
        console.log('creating price for FoodTrucksPrice');
        if (!priceFoodTrucks) {
          const priceft = await stripe.prices.create({
            currency: 'GBP',
            unit_amount: 400,
            product_data: {
              name: 'FoodTrucks subscription',
            },
          });
          await StripePrice.create({ price_data: 'FoodTrucksPrice', price_id: priceft.id });
        }
        const priceShop = await StripePrice.findOne({ price_data: 'ShopPrice' });
        console.log('creating price for ShopPrice');
        if (!priceShop) {
          const prices = await stripe.prices.create({
            currency: 'GBP',
            unit_amount: 500,
            product_data: {
              name: 'Shop subscription',
            },
          });
          await StripePrice.create({ price_data: 'ShopPrice', price_id: prices.id });
        }

        // #endregion

        // switch (user.userRole) {
        //   case 'Local Cook':
        //     const priceLocalCook = await StripePrice.findOne({ price_data: 'LocalCookPrice' });
        //     if (!priceLocalCook) {
        //       await User.findByIdAndDelete(user._id);
        //       throw new Error('price not exist');
        //     }
        //     await stripe.subscriptions.create({
        //       customer: user.stripe_customer_id,
        //       items: [{ price: priceLocalCook.price_id }],
        //       payment_settings: {
        //         payment_method_types: ['card'],
        //         save_default_payment_method: 'on_subscription',
        //       },
        //       default_payment_method: 'card',
        //     });
        //     break;
        //   case 'Restaurant':
        //     const priceRestaurant = await StripePrice.findOne({ price_data: 'RestaurantPrice' });
        //     if (!priceRestaurant) {
        //       await User.findByIdAndDelete(user._id);
        //       throw new Error('price not exist');
        //     }
        //     await stripe.subscriptions.create({
        //       customer: user.stripe_customer_id,
        //       items: [{ price: priceRestaurant.price_id }],
        //       payment_settings: {
        //         payment_method_types: ['card'],
        //         save_default_payment_method: 'on_subscription',
        //       },
        //       default_payment_method: 'card',
        //     });
        //     break;
        //   case 'Food trucks':
        //     const priceFoodTrucks = await StripePrice.findOne({ price_data: 'FoodTrucksPrice' });
        //     if (!priceFoodTrucks) {
        //       await User.findByIdAndDelete(user._id);
        //       throw new Error('price not exist');
        //     }
        //     await stripe.subscriptions.create({
        //       customer: user.stripe_customer_id,
        //       items: [{ price: priceFoodTrucks.price_id }],
        //       payment_settings: {
        //         payment_method_types: ['card'],
        //         save_default_payment_method: 'on_subscription',
        //       },
        //       default_payment_method: 'card',
        //     });
        //     break;
        //   case 'Shop':
        //     const priceShop = await StripePrice.findOne({ price_data: 'ShopPrice' });
        //     if (!priceShop) {
        //       await User.findByIdAndDelete(user._id);
        //       throw new Error('price not exist');
        //     }
        //     await stripe.subscriptions.create({
        //       customer: user.stripe_customer_id,
        //       items: [{ price: priceShop.price_id }],
        //       payment_settings: {
        //         payment_method_types: ['card'],
        //         save_default_payment_method: 'on_subscription',
        //       },
        //       default_payment_method: 'card',
        //     });
        //     break;

        //   default:
        //     break;
        // }
      }

      if (user) {
        return res.status(200).send({ error: null, message: 'User registered successfully', data: user });
      } else {
        await Address.findByIdAndDelete(newAddress._id);
        return res.status(400).send({ error: null, message: 'you have to provide address', data: null });
      }
    } else {
      return res.status(400).send({ error: null, message: 'you have to provide address', data: null });
    }
  } catch (error: any) {
    res.status(400).send({ error: error.message, message: 'there was an error saving user', data: null });
  }
};

const UserLogin = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { login, password } = req.body;
  try {
    const user = await User.findOne({ email: login });

    if (!user) {
      return res.status(404).send({ data: null, message: 'user not found', error: null });
    }
    const compare = await bcrypt.compare(password, user.password);
    if (compare === false) {
      return res.status(403).send({ data: null, message: 'Wrong password', error: null });
    } else {
      const access_token = sign({ sub: user._id }, jwtSecret, {
        expiresIn: jwtAccesTime,
      });

      req.UserData = user;
      req.token = access_token;

      const refreshToken = await GenerateRefreshToken(user._id);

      return res.status(200).json({
        message: 'User successfully signed in',
        error: null,
        data: { access_token, refresh_token: refreshToken },
      });
    }
  } catch (error: any) {
    return res.status(401).send({ data: null, message: error.message, error: error });
  }
};

const Logout = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const user_id = req.body.sub;
  const token = req.body.token;

  // remove the refresh token
  await (await redis_client()).del(user_id.toString());

  // blacklist current access token
  await (await redis_client()).set('BL_' + user_id.toString(), token);

  return res.status(200).json({ message: 'succesfully logged out.', data: null, error: null });
};

const GetAccessToken = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const user_id = req.UserData.sub;
    const access_token = sign({ sub: user_id }, jwtSecret, {
      expiresIn: jwtAccesTime,
    });
    const refresh_token = await GenerateRefreshToken(user_id);
    return res.json({ message: 'success', data: { access_token, refresh_token }, error: null });
  } catch (error: any) {
    return res.status(400).json({ message: error.message, data: null, error: JSON.stringify(error) });
  }
};

const ResetPassword = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const email = req.body.email;

    if (!email) {
      return res.status(401).send({ message: 'not valid email', data: null, error: null });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error(`User ${req.body.email} does not exist`);
    }

    function generateRandomNumber() {
      return Math.floor(Math.random() * 1000000).toString();
    }
    let randomNumber = generateRandomNumber();
    if (randomNumber.length === 5) {
      randomNumber += '0';
    }
    const newRequest = await ResetCode.create({
      resetCode: randomNumber,
      userId: user._id,
      createdAt: new Date(),
    });

    const mailer = new MailerController();
    if (user) {
      await mailer.sendEmail({
        to: user.email.toString(),
        subject: 'Reset Password request',
        html: templateMailResetPassword(randomNumber, user.first_name),
        attachments: [
          {
            filename: 'BLINKFIX.png',
            path: 'app/src/api/assets/BLINKFIX.png',
            cid: 'logoImage@blink@fix.me', //same cid value as in the html img src
          },
        ],
      });
    }

    return res.status(200).send({ message: 'reset email send', data: newRequest, error: null });
  } catch (error: any) {
    return res.status(400).send({ message: error.message, data: null, error: error });
  }
};
const changePassword = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { resetCode, password, confirmPassword } = req.body;

    if (!resetCode) {
      throw new Error('not valid resetCode');
    }

    const resetCodeFromDb = await ResetCode.findOne({ resetCode });
    if (!resetCodeFromDb) {
      throw new Error(`resetCodeFromDb ${req.body.email} does not exist`);
    }

    if (confirmPassword !== password) {
      throw new Error('Passwrds have to match');
    }
    if (typeof password === 'string') {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.findByIdAndUpdate(resetCodeFromDb.userId, {
        password: hashedPassword,
      });

      const mailer = new MailerController();
      if (user) {
        const mail = await mailer.sendEmail({
          to: user.email.toString(),
          subject: 'test email ',
          html: templateMailResetPassword('randomNumber', user.first_name),
          attachments: [
            {
              filename: 'BLINKFIX.png',
              path: 'app/src/api/assets/BLINKFIX.png',
              cid: 'logoImage@blink@fix.me', //same cid value as in the html img src
            },
          ],
        });
      }

      await ResetCode.findOneAndDelete({ resetCode });
      return res.status(200).send({ message: 'Password changed successfully', data: null, error: null });
    } else {
      throw new Error('Unknown error');
    }
  } catch (error: any) {
    return res.status(400).send({ message: error.message, data: null, error: error });
  }
};

export default {
  userRegister,
  UserLogin,
  Logout,
  GetAccessToken,
  ResetPassword,
  changePassword,
};

export const countryObject = [
  { country: 'Austria', code: 'AT' },
  { country: 'Belgium', code: 'BE' },
  { country: 'Bulgaria', code: 'BG' },
  { country: 'Croatia', code: 'HR' },
  { country: 'Cyprus', code: 'CY' },
  { country: 'CzechRepublic', code: 'CZ' },
  { country: 'Denmark', code: 'DK' },
  { country: 'Estonia', code: 'EE' },
  { country: 'Finland', code: 'FI' },
  { country: 'France', code: 'FR' },
  { country: 'Germany', code: 'DE' },
  { country: 'Greece', code: 'EL' },
  { country: 'Hungary', code: 'HU' },
  { country: 'Ireland', code: 'IE' },
  { country: 'Italy', code: 'IT' },
  { country: 'Latvia', code: 'LV' },
  { country: 'Lithuania', code: 'LT' },
  { country: 'Luxembourg', code: 'LU' },
  { country: 'Malta', code: 'MT' },
  { country: 'Netherlands', code: 'NL' },
  { country: 'Poland', code: 'PL' },
  { country: 'Portugal', code: 'PT' },
  { country: 'Romania', code: 'RO' },
  { country: 'Slovakia', code: 'SK' },
  { country: 'Slovenia', code: 'SI' },
  { country: 'Spain', code: 'ES' },
  { country: 'Sweden', code: 'SE' },
  { country: 'NorthernIreland', code: 'XI' },
];

interface Dict<T> {
  [key: string]: T | undefined;
}
