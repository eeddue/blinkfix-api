import Stripe from 'stripe';
import { countryObject } from '../User/index';
import { stripe } from './payment';

export interface AccountInterface {
  country: string;
  currency: string;
  account_number: string;
  email: string;
  ip: string;
  userAgent?: string;
  businessType: Stripe.AccountCreateParams.BusinessType;
  address?: Stripe.AddressParam;
  dob: Stripe.Emptyable<Stripe.AccountCreateParams.Individual.Dob>;
  first_name: string;
  last_name: string;
  phone_number: string;
  industry: string;
  site_url: string;
  companyName: string;
  routing_number?: string;
  ssn_last_4: string;
  verificationDocument?: string | undefined;
}

class StripeClient {
  /**
   * class to handle requests for stripe client
   */

  private _StripeEnv: 'development' | 'production';
  public get StripeEnv(): 'development' | 'production' {
    return this._StripeEnv;
  }
  public set StripeEnv(v: 'development' | 'production') {
    this._StripeEnv = v;
  }

  constructor() {
    this._StripeEnv = process.env.STRIPE_ENV === 'development' ? 'development' : 'production';
  }

  async retriveAccount(stripeId: string): Promise<Stripe.Response<Stripe.Account>> {
    return await stripe.accounts.retrieve(stripeId);
  }

  /**
   * create new stripe account
   */
  async createAccount({
    country,
    account_number,
    email,
    currency,
    ip,
    address,
    dob,
    first_name,
    last_name,
    phone_number,
    routing_number,
    ssn_last_4,
    site_url,
  }: AccountInterface): Promise<Stripe.Response<Stripe.Account>> {
    const date = new Date();
    const unixTimestamp = Math.floor(date.getTime() / 1000);

    try {
      const account = await stripe.accounts.create({
        type: 'custom',
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        tos_acceptance: {
          ip: ip,
          date: unixTimestamp,
        },
        business_type: 'individual',
        individual: {
          address,
          dob,
          first_name,
          last_name,
          email,
          phone: phone_number,
          ssn_last_4,
        },
        external_account: {
          object: 'bank_account',
          country,
          currency,
          account_number,
          routing_number,
        },
        business_profile: {
          url: site_url.split(' ').join(''),
          mcc: '5812',
          support_address: address,
        },
        default_currency: currency,
      });
      return account;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
export default StripeClient;
