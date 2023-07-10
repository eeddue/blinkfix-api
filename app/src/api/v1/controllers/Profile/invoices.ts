import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import { ObjectId } from 'mongoose';
import { RecipeCounters, Recipe } from '../../../config/mdb';
import { IResponse } from '../../interfaces';
import { IRecipe } from '../../interfaces/mongo/recipes';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const getInvoicesRecipes = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;

  try {
    const myRecipes = await Recipe.find({
      owner: id,
    }).populate('image');
    const countersIds: IRecipe[] = myRecipes.map((recipes) => recipes);
    const counters = await Promise.all(
      countersIds.map(async (recipe) => {
        const count = await RecipeCounters.findById(recipe.counter);

        const wagePerK = 0.06;
        if (count && typeof count.numberOfClicks === 'number') {
          const alreadyPaid = recipe.alreadyPayedOut;
          const newWage = (count?.numberOfClicks / 1000) * wagePerK;
          const counterExtender = {
            recipe: recipe,
            wagePerK: wagePerK,
            wage: newWage - alreadyPaid,
            numberOfClicks: count?.numberOfClicks,
            numberOfShares: count?.numberOfShares,
            numberOflikes: count?.numberOfLikes,
            whoLike: count?.whoLike,
            whoShare: count?.whoShare,
          };
          //TODO: add to account balance
          return counterExtender;
        }
      }),
    );

    res.status(200).send({ data: counters, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

export default { getInvoicesRecipes };
