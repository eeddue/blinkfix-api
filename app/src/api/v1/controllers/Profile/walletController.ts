import mongoose, { Schema, Document } from 'mongoose';
import { stripe } from '../order/payment';

export interface Wallet extends Document {
  balance: {
    availableBalance: number;
    pendingBalance: number;
  };
  transactions: Array<{
    type: string;
    amount: number;
    description: string;
    transferAt: Date;
  }>;
  user: Schema.Types.ObjectId;
  currency: string;
}

const walletSchema: Schema = new Schema({
  balance: {
    availableBalance: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
  },
  transactions: {
    type: [
      {
        type: { type: String, required: true },
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        transferAt: {
          type: Date,
        },
      },
    ],
    default: [],
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  currency: { type: String, required: true },
});

export const Wallet = mongoose.model<Wallet>('Wallet', walletSchema);

export class WalletController {
  private walletModel: typeof Wallet = Wallet;
  constructor() {}

  async createWallet(user: string, currency: string) {
    const yourwallet = await this.walletModel.findOne({ user });
    if (yourwallet) {
      throw new Error('your wallet already exists');
    }
    const wallet = new this.walletModel({ user, currency });
    return wallet.save();
  }

  async getAccount(stripeId?: string) {
    try {
      if (!stripeId) {
        return {
          availableBalance: 0,
          pendingBalance: 0,
        };
      } else {
        const account = await stripe.accounts.retrieve({
          stripeAccount: `${stripeId}`,
        });
        const currentlyDue = account.requirements?.currently_due?.length;
        if (currentlyDue) {
          let currentlyDueString = account.requirements?.currently_due
            ?.map((single) => single.replace('_', ' ').replace('.', ' '))
            .join(', ');
          throw new Error('your account is suspended due to lack of ' + currentlyDueString);
        }
        return account;
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
    //
  }
  async getBalance(stripeId?: string) {
    if (!stripeId) {
      return {
        availableBalance: 0,
        pendingBalance: 0,
      };
    } else {
      const accountBalance = await stripe.balance.retrieve({
        stripeAccount: `${stripeId}`,
      });

      return {
        availableBalance: accountBalance.available[0].amount,
        pendingBalance: accountBalance.pending[0].amount,
      };
    }
    //
  }
  async getTransactions(stripeId?: string) {
    if (!stripeId) {
      return [];
    } else {
      let allTransactions = [];
      let hasMore = true;
      let startingAfter;

      while (hasMore) {
        const transactions = await stripe.balanceTransactions.list(
          {
            limit: 100,
          },
          { stripeAccount: stripeId },
        );

        allTransactions.push(...transactions.data);

        hasMore = transactions.has_more;
        startingAfter = transactions.data[transactions.data.length - 1].id;
      }

      return allTransactions;
    }
    //
  }

  async getWallet(user: string) {
    try {
      return this.walletModel.findOne({ user }).exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
  async updateWalletBalance(
    user: string,
    balance: {
      availableBalance: number;
      pendingBalance: number;
    },
  ) {
    try {
      return this.walletModel.findOneAndUpdate({ user, balance }).exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async updateWallet(user: string, currency: string) {
    try {
      return this.walletModel.findOneAndUpdate({ user }, { currency: currency.toUpperCase() }, { new: true }).exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async deleteWallet(user: string) {
    try {
      const wallet = await this.walletModel.findOne({ user });
      if (!wallet) throw new Error(`Wallet not found`);
      return this.walletModel.findOneAndDelete({ user }).exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  async addTransaction(user: string, type: string, amount: number, description: string) {
    try {
      const check = await this.walletModel.findOne({ user });

      const wallet = await this.walletModel
        .findOneAndUpdate(
          { user },
          { $inc: { balance: amount }, $push: { transactions: { type, amount, description, transferAt: new Date() } } },
          { new: true, runValidators: true },
        )
        .exec();
      if (!wallet) {
        throw new Error(`Wallet not found`);
      }

      return wallet.save();
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  }
}

export default Wallet;
