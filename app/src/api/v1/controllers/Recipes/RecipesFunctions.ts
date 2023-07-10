import { Iingredients, IRecipe } from '../../interfaces/mongo/recipes';
import { Ingredients, Recipe, User } from '../../../config/mdb/index';
import mongoose from 'mongoose';
import { Response } from 'express';
import { IResponse } from '../../interfaces';

export const findByTag = async (tag: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      const recipes = await Recipe.find({ tags: { $regex: tag } })
        .populate({
          path: 'owner',
          select: '_id name first_name last_name email',
        })
        .populate({ path: 'cuisine', select: 'code name oryginalName' })
        .populate('image')
        .populate('counter');

      // .populate('counter')
      // .populate({ path: 'cuisine', select: 'code name oryginalName' })
      resolve(recipes);
    } catch (error) {
      reject(error);
    }
  });
};

export const findByOwnerName = async (Name: string): Promise<any> => {
  try {
    const users = await User.find({ first_name: { $regex: Name.toLowerCase() } });
    const recipesRes: IRecipe[] = [];
    await Promise.all(
      users.map(async (user) => {
        const id = user._id;

        const recipeSearch = await Recipe.find({ owner: id })
          .populate({
            path: 'owner',
            select: '_id name first_name last_name email',
          })
          .populate({ path: 'cuisine', select: 'code name oryginalName' })
          .populate('image')
          .populate('counter');
        if (recipeSearch.length > 0) {
          recipesRes.push(...recipeSearch);
        } else return;
      }),
    );
    return recipesRes;
  } catch (error) {
    return error;
  }
};

export const findByOwnerId = async (id: mongoose.Types.ObjectId): Promise<any> => {
  try {
    return await Recipe.find({ owner: id })
      .populate('counter')
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');
  } catch (error) {
    return error;
  }
};

export const findByRecipeName = async (Name: string): Promise<any> => {
  try {
    const recipes = await Recipe.find({ title: { $regex: Name } })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');
    return recipes;
  } catch (error) {
    return error;
  }
};

export const findByRecipeDescription = async (Name: string): Promise<any> => {
  try {
    const recipes = await Recipe.find({ description: { $regex: Name } })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');
    return recipes;
  } catch (error) {
    return error;
  }
};

export const findByRecipeCuisine = async (Cuisine: string): Promise<any> => {
  try {
    const recipesCode = await Recipe.find({
      'cuisine.code': { $regex: Cuisine },
    })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');
    const recipesName = await Recipe.find({
      'cuisine.name': { $regex: Cuisine },
    })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('counter');
    const recipesOryginalName = await Recipe.find({
      'cuisine.oryginalName': { $regex: Cuisine },
    })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');
    const recipes = [...recipesCode, ...recipesName, ...recipesOryginalName];
    const recipesRes = [...new Set(recipes)];
    return recipesRes;
  } catch (error) {
    return error;
  }
};

export const findByRecipeRecipeType = async (dishesType: string): Promise<any> => {
  try {
    const recipesByRecipeType = await Recipe.find({
      dishesType: { $regex: dishesType },
    })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('counter')
      .populate('image');

    return recipesByRecipeType;
  } catch (error) {
    return error;
  }
};

export const getIngredientsByRecipeID = async (
  recipeId: string,
): Promise<{ recipeIngredients: Iingredients[]; recipeTipIngredients: Iingredients[] }> => {
  const recipe = await Recipe.findOne({ _id: recipeId })
    .populate({
      path: 'owner',
      select: '_id name first_name last_name email',
    })
    .populate({ path: 'cuisine', select: 'code name oryginalName' })
    .populate('image')
    .populate('counter');

  const ingredients = recipe?.ingredients;
  const tipIngredients = recipe?.tipIngredients;

  return {
    recipeIngredients: ingredients || [],
    recipeTipIngredients: tipIngredients || [],
  };
};
