import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import { UserOrders } from '../../controllers/Profile';
import { WalletController } from '../../controllers/Profile/walletController';
import { verify } from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';
import foundsRoutes from './wallet.founds';
import StripeClient from '../../controllers/order/PaymentController';
import { User } from '../../../config/mdb';

let router = express.Router();

router.post('/', Verification.verifyToken, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(400).send({ message: 'Invalid token', error: 'you have to provide token' });
  }
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const controller = new WalletController();
  const stripeClient = new StripeClient();

  if (typeof id === 'string') {
    try {
      const user = await User.findById(id);
      if (user && !user.stripe_id) {
        throw new Error('Please provide your bank account information first');
      }
      if (user && user.stripe_id) {
        const account = await stripeClient.retriveAccount(user.stripe_id);
        //
        if (!account) {
          throw new Error('Please provide your bank account information first');
        }
        const wallet = await controller.createWallet(id, account.default_currency ? account.default_currency : 'GBP');
        return res.status(200).send({ message: 'Wallet created successfully', data: wallet });
      } else return res.status(404).send({ message: 'unknown error', data: null, error: 'unknown error' });
    } catch (error: any) {
      return res.status(400).send({ message: error.message, data: null });
    }
  }
});

router.put('/', Verification.verifyToken, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(400).send({ message: 'Invalid token', error: 'you have to provide token' });
  }
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const user = await User.findById(id);
  if (!user) {
    return res.status(400).send({ message: 'user not found', data: null });
  }
  const stripeId = user?.stripe_id;
  const walletController = new WalletController();
  const balance = await walletController.getBalance(stripeId);
  await walletController.updateWalletBalance(user._id.toString(), balance);
  const { currency }: { currency: string } = req.body;

  if (typeof currency === 'string' && typeof id === 'string') {
    try {
      const wallet = await walletController.updateWallet(id, currency);
      return res.status(200).send({ message: 'Wallet edited successfully', data: wallet });
    } catch (error: any) {
      return res.status(400).send({ message: error.message, data: null });
    }
  }
});

router.get('/', Verification.verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(400).send({ message: 'Invalid token', error: 'you have to provide token' });
    }
    const decoded = verify(token, jwtSecret);
    const id = decoded?.sub;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({ message: 'user not found', data: null });
    }
    const stripeId = user?.stripe_id;
    const walletController = new WalletController();
    const stripeAccount = await walletController.getAccount(stripeId);
    console.log(stripeAccount);
    if (!stripeAccount) {
      throw new Error('Account not found');
    }

    const balance = await walletController.getBalance(stripeId);
    await walletController.updateWalletBalance(user._id.toString(), balance);

    if (typeof id === 'string') {
      const yourWallet = await walletController.getWallet(id);
      if (!yourWallet) {
        return res.status(404).send({ message: 'Wallet not found', data: null });
      }
      return res.status(200).send({ message: 'Wallet successfully found', data: yourWallet });
    }
  } catch (error: any) {
    return res.status(400).send({ message: error.message, data: null });
  }
});
router.get('/transactions', Verification.verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(400).send({ message: 'Invalid token', error: 'you have to provide token' });
    }
    const decoded = verify(token, jwtSecret);
    const id = decoded?.sub;
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).send({ message: 'user not found', data: null });
    }
    const stripeId = user?.stripe_id;
    const walletController = new WalletController();
    const balance = await walletController.getBalance(stripeId);
    await walletController.updateWalletBalance(user._id.toString(), balance);

    if (typeof id === 'string') {
      const yourWallet = await walletController.getWallet(id);
      if (!yourWallet) {
        return res.status(404).send({ message: 'Wallet not found', data: null });
      }
      const transactions = await walletController.getTransactions(stripeId);
      return res.status(200).send({ message: 'Wallet successfully found', data: { yourWallet, transactions } });
    }
  } catch (error: any) {
    return res.status(400).send({ message: error.message, data: null });
  }
});
router.delete('/', Verification.verifyToken, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(400).send({ message: 'Invalid token', error: 'you have to provide token' });
  }
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const walletController = new WalletController();
  try {
    if (typeof id === 'string') {
      const yourWallet = await walletController.deleteWallet(id);
      return res.status(200).send({ message: 'Wallet deleted successfully', data: yourWallet });
    }
  } catch (error: any) {
    return res.status(400).send({ message: error.message, data: null });
  }
});

router.use('/founds', foundsRoutes);

export default router;
