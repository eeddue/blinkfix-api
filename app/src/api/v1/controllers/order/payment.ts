import { Establishment } from '../../../config/mdb/index';
import { verify } from 'jsonwebtoken';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import IResponse from '../../interfaces/response.interface';
import Stripe from 'stripe';
import { Address, User } from '../../../config/mdb';
import StripeClient, { AccountInterface } from './PaymentController';
import fs from 'fs';
import multer from 'multer';
const imagePath = process.env.IMAGE_FILE_PATH || 'D:/newgen/bx/nodejs/blinkapi/store/images';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';
import { CountryCode, isValidPhoneNumber, parsePhoneNumber, PhoneNumber } from 'libphonenumber-js';
import { IAddress } from '../../models/Order';
import { retriveCustomer } from '../../helpers/retriveCustomer';

export const stripe = new Stripe(
  'sk_test_51KEGezEn6xUPj18MgLOP19lYqt1LKi1muyTvA3YZ14mmULqz9MgAEOlXikhED0Iw03DDHgTVWXxgt8wGtUYbGSYW00iEc4s24Z',
  { apiVersion: '2022-11-15' },
);
// TODO: add to environment

export const PaymentRoot = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  // Use an existing Customer ID if this is a returning customer.

  const { totalCosts, orderWhereId }: { totalCosts: number; currency: string; orderWhereId: string } = req.body;
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;

  if (!orderWhereId) {
    return res.json({
      error: 'User not found',
    });
  } else {
    const establishment = await Establishment.findById(orderWhereId);
    if (!establishment) {
      throw new Error('Payment destination not found');
    }
    const owner = await User.findById(establishment.owner);

    if (!owner) {
      return res.json({
        error: 'Payment destination not found',
      });
    }
    if (!owner.stripe_id) {
      throw new Error(`you cant order from ${establishment.name} yet`);
    }
    if (!owner.stripe_customer_id) {
      const ownerAddress = await Address.findById(owner.address[0]);
      if (ownerAddress) {
        const customer = await retriveCustomer(
          owner.stripe_id,
          ownerAddress,
          owner.first_name,
          owner.last_name,
          owner.email,
        );
        await owner
          .updateOne(
            {
              stripe_customer_id: customer.id,
            },
            { new: true },
          )
          .exec();
      }
    }

    const ownerWithCustomer = await User.findById(owner.id);

    const stripeCost = totalCosts * 100;
    const percentage = Math.floor(stripeCost * 0.06);
    const seller = await stripe.accounts.retrieve('acct_1M7dTQEXVXhZeWVU');
    const currency = seller.default_currency;

    try {
      console.log({ totalCosts, ownerWithCustomer, currency });
      if (!totalCosts || !ownerWithCustomer || !currency) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
        });
      } else {
        const ephemeralKey = await stripe.ephemeralKeys.create(
          { customer: ownerWithCustomer?.stripe_customer_id },
          { apiVersion: '2020-08-27' },
        );
        const paymentIntent = await stripe.paymentIntents.create({
          currency: currency.toLowerCase(),
          customer: ownerWithCustomer?.stripe_customer_id,
          amount: stripeCost,
          transfer_data: {
            amount: percentage,
            destination: seller.id,
          },
          description: 'payment for order ' + new Date().getTime(),
          automatic_payment_methods: {
            enabled: true,
          },
        });
        console.log({
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: ownerWithCustomer?.stripe_customer_id,
          publishableKey:
            'pk_test_51KEGezEn6xUPj18MtUQIUTrP4GpPySC5MLphN98WScc3sA1UV6nKSEYvVipch7l9dlNlaBiQl4AwomCmcscoXRKg00lDIcg5HP',
        });
        return res.json({
          paymentIntent: paymentIntent.client_secret,
          ephemeralKey: ephemeralKey.secret,
          customer: ownerWithCustomer?.stripe_customer_id,
          publishableKey:
            'pk_test_51KEGezEn6xUPj18MtUQIUTrP4GpPySC5MLphN98WScc3sA1UV6nKSEYvVipch7l9dlNlaBiQl4AwomCmcscoXRKg00lDIcg5HP',
        });
      }
    } catch (error: any) {
      return res.json({
        error,
      });
    }
  }
};
export const PaymentCreateConnect = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const file: Express.Multer.File = req.file;

  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;

  try {
    if (!file) {
      const { countryCode, account_number, currency, ssn_last_4, routing_number } = req.body;
      const stripeClient = new StripeClient();

      const user = await User.findById(id).populate('address');

      if (!user) {
        return res.status(400).send({ message: 'Bad token request', error: 'Bad token request', data: null });
      }
      if (user.stripe_id) {
        return res
          .status(400)
          .send({ message: 'This user already have account', error: 'This user already have account', data: null });
      }

      const address = await Address.findById(user.address[0]);
      if (!address) {
        return res.status(400).send({ message: 'Bad token request', error: 'Bad token request', data: null });
      }
      const dateofbirth = (): {
        day: number;
        month: number;
        year: number;
      } => {
        const datesplited = user.birth_year.split('-');
        const day = parseInt(datesplited[0]);
        const month = parseInt(datesplited[1]);
        const year = parseInt(datesplited[2]);
        return { day, month, year };
      };

      const establishment = await Establishment.findById(user.establishment);

      const phone = () => {
        const converted = parsePhoneNumber(user.phone_number, countryCode);
        return converted ? converted.formatInternational().toString() : user.phone_number;
      };
      const convertedPhone = phone();

      const account = await stripeClient.createAccount({
        ip: req.ip,
        country: countryCode,
        account_number,
        email: user.email,
        userAgent: req.headers['user-agent'],
        dob: dateofbirth(),
        businessType: 'individual',
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: convertedPhone,
        address: {
          city: address.city,
          country: countryCode,
          postal_code: address.postcode,
          state: address.state,
          line1: `${address.buildingnumber} ${address.street}`,
        },
        industry: 'Restaurants and nightlife',
        companyName: establishment ? establishment.name : user.name,
        site_url: `https://blinkfix.me/profile/${establishment ? establishment.name : user.name}`,
        ssn_last_4,
        routing_number,
        currency,
      });

      const updatedUser = await User.findByIdAndUpdate(id, { stripe_id: account.id }, { new: true });

      return res.json({
        updatedUser,
      });
    }
  } catch (error: any) {
    console.error(error);
    return res.json({
      error: error.message,
    });
  }
};
/**
 *
 * @param address IAddress
 * @param birthDate string dd-mm-yyyy
 * @param countryCode CountryCode
 * @param ip string
 * @param userAgent string
 * @param phoneNumebr string
 * @param email string
 * @param account_number string
 * @param currency three digits currency code
 * @param first_name string
 * @param last_name string
 * @param ssn_last_4 us only string
 * @param routing_number us only string
 * @param companyName establishment name
 * @returns Stripe.Response<Stripe.Account>
 */
const createStripeAccount = async (
  address: IAddress,
  birthDate: string,
  countryCode: CountryCode,
  ip: string,
  userAgent: any,
  phoneNumebr: string,
  email: string,
  account_number: string,
  currency: string,
  first_name: string,
  last_name: string,
  ssn_last_4?: string,
  routing_number?: string,
  companyName?: string,
) => {
  try {
    let company_name = '';
    if (!companyName) {
      company_name = `${first_name} ${last_name}`;
    } else company_name = companyName;
    const dateofbirth = (): {
      day: number;
      month: number;
      year: number;
    } => {
      const datesplited = birthDate.split('-');
      const day = parseInt(datesplited[0]);
      const month = parseInt(datesplited[1]);
      const year = parseInt(datesplited[2]);
      return { day, month, year };
    };

    const phone = () => {
      const converted = parsePhoneNumber(phoneNumebr, countryCode);
      return converted ? converted.formatInternational().toString() : phoneNumebr;
    };
    const convertedPhone = phone();
    const stripeClient = new StripeClient();

    const account = await stripeClient.createAccount({
      ip,
      country: countryCode,
      account_number,
      email: email,
      userAgent,
      dob: dateofbirth(),
      businessType: 'individual',
      first_name: first_name,
      last_name: last_name,
      phone_number: convertedPhone,
      address: {
        city: address.city,
        country: countryCode,
        postal_code: address.postcode,
        state: address.state,
        line1: `${address.buildingnumber} ${address.street}`,
      },
      industry: 'Restaurants and nightlife',
      companyName: company_name,
      site_url: `https://blinkfix.me/profile/${company_name}`,
      ssn_last_4: ssn_last_4 ? ssn_last_4 : '',
      routing_number,
      currency,
    });

    return account;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

const createStripeFile = async (file: Express.Multer.File) => {
  const date = new Date();

  const fileStripe = await stripe.files.create({
    purpose: 'account_requirement',
    file: {
      data: fs.readFileSync(file.path),
      name: `${date.getDate()}.png`,
      type: file.mimetype,
    },
  });

  return fileStripe;
};

var StripeDocumentImage = multer.diskStorage({
  destination: imagePath + '/stripe/',
  filename: async function (req: IGetUserAuthInfoRequest, file, cb) {
    try {
      let filename: string | undefined;
      ////////////////////////////////////////////////////////////////
      try {
        if (file.fieldname === 'file') {
          const date = new Date();
          filename = 'stripe_' + date.getDate() + date.getTime() + '.png';

          req.stripeImage = file;
        }
      } catch (error) {
        console.error(error);
        cb(new Error(JSON.stringify(error)), '');
      }

      ////////////////////////////////////////////////////////////////
      if (filename) {
        cb(null, filename);
      } else {
        cb(new Error('bad request'), '');
      }
    } catch (error) {
      console.error(error);
      cb(new Error(JSON.stringify(error)), '');
    }
  },
});

export const getAccountBalance = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const stripeId = user.stripe_id;
    console.log(stripeId);
    if (!stripeId) {
      return res.status(200).send({
        data: {
          availableBalance: 0,
          pendingBalance: 0,
        },
        message: 'balance not found returned 0 ' + stripeId,
        error: null,
      });
    } else {
      const accountBalance = await stripe.balance.retrieve({
        stripeAccount: `${stripeId}`,
      });

      console.log('Available balance:', accountBalance.available[0].amount);
      console.log('Pending balance:', accountBalance.pending[0].amount);

      return res.status(200).send({
        data: {
          availableBalance: accountBalance.available[0].amount,
          pendingBalance: accountBalance.pending[0].amount,
        },
        message: 'balance found successfully',
        error: null,
      });
    }
  } catch (error: any) {
    return res.status(400).send({
      data: null,
      message: error.message,
      error: null,
    });
  }
};

export var uploadStripeImage = multer({ storage: StripeDocumentImage });
