// @ts-nocheck

import { Recipe } from '../../../config/mdb';

//recipes
export const getRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');
    return res.status(200).json({ recipes });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

//get user specific recipes
export const getUserRecipes = async (req, res) => {
  const { userId } = req.params;
  try {
    const recipes = await Recipe.find({ owner: userId })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');

    return res.status(200).json({ recipes });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
