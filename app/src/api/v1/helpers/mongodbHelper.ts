import mongoose from 'mongoose';
import { IRecipe } from '../interfaces/mongo/recipes';

export const populateRecipe = async (
  recipe:
    | (mongoose.Document<unknown, any, IRecipe> &
        IRecipe & {
          _id: mongoose.Types.ObjectId;
        })
    | null,
) => {
  let returnRecipe;
  if (recipe) {
    returnRecipe = await (
      await (
        await (
          await recipe.populate('counter')
        ).populate({ path: 'owner', select: '_id name first_name last_name email' })
      ).populate({ path: 'cuisine', select: 'code name oryginalName' })
    ).populate('image');
  }
  return returnRecipe;
};

export const convertStringToId = async (id: string | undefined) => {
  if (id) return new mongoose.Types.ObjectId(id);
};
