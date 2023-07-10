import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import { UserOrders } from '../../controllers/Profile';
import { WalletController } from '../../controllers/Profile/walletController';
import { verify } from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import Recipes from '../../controllers/Recipes';
import { Recipe, RecipeCounters } from '../../../config/mdb';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

let router = express.Router();

router.post('/', Verification.verifyToken, async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const { type, amount, description, objectId } = req.body;
  if (!token) {
    return res.status(401).send({ message: 'Invalid token', error: 'you have to provide token' });
  }
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const controller = new WalletController();

  if (typeof id === 'string') {
    try {
      if (type === 'recipe') {
        const recipe = await Recipe.findById(objectId);
        if (!recipe) throw new Error(`Could not find recipe for ${objectId}`);
        const counter = await RecipeCounters.findById(recipe.counter);
        if (!counter) throw new Error(`Could not find recipe for ${objectId}`);

        const wage: number = (counter?.numberOfClicks / 1000) * 0.06;
        if (wage - recipe.alreadyPayedOut <= amount)
          throw new Error('this recipe does not have enough money to complete');

        try {
          if (typeof objectId !== 'string') throw new Error('objectId must be a string');
          const updated = await Recipe.findByIdAndUpdate(objectId, { $inc: { alreadyPayedOut: amount } });
        } catch (error: any) {
          return res.status(400).send({ message: 'unknown error', error: error.message, data: null });
        }
      }
      const wallet = await controller.addTransaction(id, type, parseFloat(amount), description);
      return res.status(200).send({ message: 'Wallet created successfully', data: wallet });
    } catch (error: any) {
      return res.status(400).send({ message: error.message, data: null });
    }
  } else {
    return res.status(400).send({ message: 'unknown error', data: null });
  }
});

export default router;
