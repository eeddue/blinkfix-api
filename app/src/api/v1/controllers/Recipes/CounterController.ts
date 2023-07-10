import { verify } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Recipe, RecipeCounters } from '../../../config/mdb';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const AddLike = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const recipeId = req.params.recipeId;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    if (!decoded.sub || typeof decoded.sub !== 'string') {
      throw new Error(`Invalid authorization`);
    }
    const userId = new mongoose.Types.ObjectId(decoded.sub);

    if (!userId) {
      return res.status(500).send({
        data: null,
        message: 'there was an error while giving like to the recipe',
        error: 'bad token provided',
      });
    }
    const recipe = await Recipe.findById(recipeId);
    const counter = await RecipeCounters.findById(recipe?.counter);

    if (!counter?.relatedId) {
      await counter?.updateOne({ relatedId: recipeId }, { new: true });
    }

    if (!counter) {
      await RecipeCounters.create({ relatedId: recipeId, numberOfLikes: 1, whoLike: [userId] });
    } else {
      if (counter.whoLike.includes(userId)) {
        await RecipeCounters.findByIdAndUpdate(
          counter?._id,
          {
            $pull: { whoLike: userId },
            $inc: { numberOfLikes: -1 },
          },
          { new: true },
        );
      } else {
        await RecipeCounters.findByIdAndUpdate(
          counter?._id,
          { $push: { whoLike: userId }, $inc: { numberOfLikes: 1 } },
          {
            new: true,
          },
        );
      }
    }

    const updateRecipe = await Recipe.findById(recipeId)
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');

    res.status(200).send({ data: updateRecipe, message: 'Like added successfully', error: null });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giving like to the recipe',
      error: error,
    });
  }
};
const AddShare = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const recipeId = req.params.recipeId;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    if (!decoded.sub || typeof decoded.sub !== 'string') {
      throw new Error(`Invalid authorization`);
    }
    const userId = new mongoose.Types.ObjectId(decoded.sub);

    if (!userId) {
      return res.status(500).send({
        data: null,
        message: 'there was an error while giving like to the recipe',
        error: 'bad token provided',
      });
    }
    const counter = await RecipeCounters.findOne({ relatedId: recipeId });

    if (!counter) {
      await RecipeCounters.create({ relatedId: recipeId, numberOfShares: 1, whoShare: [userId] });
    } else {
      if (counter.whoShare.includes(userId)) {
        await RecipeCounters.updateOne({ relatedId: recipeId }, { $inc: { numberOfShares: 1 } });
      } else {
        await RecipeCounters.updateOne(
          { relatedId: recipeId },
          { $push: { whoShare: userId }, $inc: { numberOfShares: 1 } },
        );
      }
    }

    const updatedCounter = await RecipeCounters.findOne({ relatedId: recipeId });

    res.status(200).send({ data: updatedCounter, message: 'Like added successfully', error: null });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the recipe',
      error: error,
    });
  }
};

const AddClick = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const recipeId = req.params.recipeId;
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    if (!decoded.sub || typeof decoded.sub !== 'string') {
      throw new Error(`Invalid authorization`);
    }
    const userId = new mongoose.Types.ObjectId(decoded.sub);

    if (!userId) {
      return res.status(500).send({
        data: null,
        message: 'there was an error while giving like to the recipe',
        error: 'bad token provided',
      });
    }
    const counter = await RecipeCounters.findOne({ relatedId: recipeId });

    if (!counter) {
      await RecipeCounters.create({ relatedId: recipeId, numberOfClicks: 1 });
    } else {
      await RecipeCounters.updateOne({ relatedId: recipeId }, { $inc: { numberOfClicks: 1 } });
    }

    const updatedCounter = await RecipeCounters.findOne({ relatedId: recipeId });

    res.status(200).send({ data: updatedCounter, message: 'Like added successfully', error: null });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the recipe',
      error: error,
    });
  }
};

export default {
  AddLike,
  AddShare,
  AddClick,
};
