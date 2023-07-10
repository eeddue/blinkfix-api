import { IShoppingList } from '../../interfaces/mongo/shoppingList';
import { getListOfCuisinesFiltered } from '../../helpers/Cuisines/getListOfAllCuisines';
import { decode, verify } from 'jsonwebtoken';
import { Recipe, Cuisines, Ingredients, ShoppingList, RecipeCounters } from '../../../config/mdb/index';
import { Response } from 'express';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';

import {
  findByOwnerId,
  findByOwnerName,
  findByRecipeCuisine,
  findByRecipeDescription,
  findByRecipeName,
  findByRecipeRecipeType,
  findByTag,
  getIngredientsByRecipeID,
} from './RecipesFunctions';
import mongoose, { Mongoose, MongooseError, Schema } from 'mongoose';
import { populateRecipe } from '../../helpers/mongodbHelper';
import { IRecipe } from '../../interfaces/mongo/recipes';

const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const AddRecipe = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const newRecipeFromBody = req.body;

  try {
    const token = req.headers.authorization.split(' ')[1];
    const id = verify(token, jwtSecret)?.sub;
    const {
      title,
      description,
      cuisineCode,
      isKosher,
      isVegan,
      isHalal,
      dishesType,
      spiceness,
      ingredientsList,
      isEstablishment,
      advancement,
      prepTime,
      cookTime,
      serves,
      manualList,
      tipTitle,
      tipDescription,
      tipIngredientsList,
      tipManualList,
      tags,
    } = newRecipeFromBody;

    const cuisine = await Cuisines.findOne({ code: cuisineCode });
    if (!cuisine) {
      return res.status(200).json({
        message: `wrong cuisine spellings: ${cuisine}`,
        data: null,
        error: null,
      });
    }
    const recipeCounter = await RecipeCounters.create({});
    const newRecipe = await Recipe.create({
      owner: id,
      isEstablishment,
      title,
      description,
      dishesType,
      isKosher,
      isVegan,
      isHalal,
      spiceness,
      advancement,
      prepTime,
      cookTime,
      serves,
      manual: manualList,
      tags,
      ingredients: ingredientsList,
      cuisine: cuisine._id,
      tipTitle,
      tipDescription,
      tipIngredients: tipIngredientsList,
      tipManual: tipManualList,
      counter: recipeCounter._id,
    });

    await recipeCounter.updateOne({ relatedId: newRecipe._id });

    const recipeReturn = await populateRecipe(newRecipe);

    return res.status(200).send({
      data: recipeReturn,
      message: 'Recipe added successfully',
      error: null,
      lastRecipeAdded: newRecipe._id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error });
  }
};
const DeleteRecipe = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const recipeId = req.params.recipeId;

  try {
    const token = req.headers.authorization.split(' ')[1];
    const id = verify(token, jwtSecret)?.sub;

    const recipeToDelete = await Recipe.findOne({ _id: recipeId, owner: id });
    if (!recipeToDelete) {
      return res.status(403).send({ data: null, message: 'there is no recipe to delete', error: null });
    }
    await Recipe.findByIdAndDelete(recipeToDelete);
    const restRecipes = await Recipe.find({ owner: id })
      .populate('counter')
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');

    return res.status(200).send({
      data: restRecipes,
      message: 'Recipe deketed successfully',
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error });
  }
};
const UpdateRecipe = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const newRecipeFromBody = req.body;
  const recipeId = req.params.recipeId;

  try {
    const token = req.headers.authorization.split(' ')[1];
    const id = await verify(token, jwtSecret)?.sub;
    const {
      title,
      description,
      cuisineCode,
      isKosher,
      isVegan,
      isHalal,
      dishesType,
      spiceness,
      ingredientsList,
      isEstablishment,
      advancement,
      prepTime,
      cookTime,
      serves,
      manualList,
      tipTitle,
      tipDescription,
      tipIngredientsList,
      tipManualList,
      tags,
    } = newRecipeFromBody;

    const cuisine = await Cuisines.findOne({ code: cuisineCode });
    if (!cuisine) {
      return res.status(400).json({
        message: `wrong cuisine spellings: ${cuisine}`,
        data: null,
        error: null,
      });
    }

    const updateRecipe = await Recipe.findByIdAndUpdate(
      { _id: recipeId },
      {
        owner: id,
        isEstablishment,
        title,
        description,
        dishesType,
        isKosher,
        isVegan,
        isHalal,
        spiceness,
        advancement,
        prepTime,
        cookTime,
        serves,
        manual: manualList,
        tags,
        ingredients: ingredientsList,
        cuisine: cuisine,
        tipTitle,
        tipDescription,
        tipIngredients: tipIngredientsList,
        tipManual: tipManualList,
      },
      {
        new: true,
        runValidators: true,
      },
    );
    const recipeReturn = await populateRecipe(updateRecipe);
    return res.status(200).send({ data: recipeReturn, message: 'Recipe updated successfully', error: null });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error });
  }
};

const AddPhotoToRecpe = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const files = req.files;
  try {
    const id = req.body.recipeId;

    res.status(200).send({ data: { id, files }, message: 'Image added successfully', error: null });
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error: error });
  }
};

const getByTag = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const tag = req.params.tag;
    const filteredRecipesByTag = await findByTag(tag);
    const filteredRecipesByOwner = await findByOwnerName(tag);
    const filteredByRecipeName = await findByRecipeName(tag);
    const filteredByRecipeDescription = await findByRecipeDescription(tag);
    const filteredByRecipeCuisine = await findByRecipeCuisine(tag);
    const filteredByRecipeDinnerType = await findByRecipeRecipeType(tag);

    const filteredRecipes = {
      filteredRecipesByTag,
      filteredRecipesByOwner,
      filteredByRecipeName,
      filteredByRecipeDescription,
      filteredByRecipeCuisine,
      filteredByRecipeDinnerType,
    };

    res.status(200).send({
      data: filteredRecipes,
      message: 'recipes found',
      error: null,
    });
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error: error });
  }
};
const getMyRecipes = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const category = req.query.category;
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    const id = decoded.sub?.toString();
    if (id === undefined) {
      return res.status(401).send({ error: 'Invalid token', message: 'not valid token, cant find user', data: null });
    } else {
      const myRecipesWithTag =
        category &&
        (await Recipe.find({ owner: id, dishesType: category })
          .populate('counter')
          .populate({
            path: 'owner',
            select: '_id name first_name last_name email',
          })
          .populate({ path: 'cuisine', select: 'code name oryginalName' })
          .populate('image')
          .populate('counter'));
      const myRecipes = await findByOwnerId(new mongoose.Types.ObjectId(id));
      res.status(200).send({ data: category ? myRecipesWithTag : myRecipes, message: 'recipes found', error: null });
    }
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error: error });
  }
};
const GetRecipes = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { category, cuisine } = req.query;
    if (typeof cuisine === 'string' && !category) {
      const findCuisine = await getListOfCuisinesFiltered(cuisine);
      const specificCuisine = findCuisine[0];

      const allRecipes = await Recipe.find()
        .populate('counter')
        .populate({
          path: 'owner',
          select: '_id name first_name last_name email',
        })
        .populate({ path: 'cuisine', select: 'code name oryginalName' })
        .populate('counter')
        .populate('image');

      const filteredRecipes = allRecipes.filter((recipe) => recipe.cuisine.name === specificCuisine.name);
      return res.status(200).send({ data: filteredRecipes, message: 'recipes found', error: null });
    }
    if (typeof category === 'string' && !cuisine) {
      const allRecipes = await Recipe.find({ dishesType: category })
        .populate('counter')
        .populate({
          path: 'owner',
          select: '_id name first_name last_name email',
        })
        .populate({ path: 'cuisine', select: 'code name oryginalName' })
        .populate('image')
        .populate('counter');

      return res.status(200).send({ data: allRecipes, message: 'recipes found', error: null });
    }
    if (typeof category === 'string' && typeof cuisine === 'string') {
      const findCuisine = await getListOfCuisinesFiltered(cuisine);
      const specificCuisine = findCuisine[0];

      const allRecipes = await Recipe.find()
        .populate('counter')
        .populate({
          path: 'owner',
          select: '_id name first_name last_name email',
        })
        .populate({ path: 'cuisine', select: 'code name oryginalName' })
        .populate('image')
        .populate('counter');

      const filteredRecipes = allRecipes.filter((recipe) => recipe.cuisine.name === specificCuisine.name);
      const filteredByCategory = filteredRecipes.filter((recipe) => recipe.dishesType === category);

      return res.status(200).send({ data: filteredByCategory, message: 'recipes found', error: null });
    }
    const allRecipes = await Recipe.find({})
      .populate('counter')
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');
    return res.status(200).send({ data: allRecipes, message: 'recipes found', error: null });
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error: error });
  }
};

const getRecipesIngredients = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const recipeId = req.params.recipeId;
    const ingredients = await getIngredientsByRecipeID(recipeId);

    res.status(200).send({ data: ingredients, message: 'ingredients list got successfully', error: null });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while getting ingredients list',
      error: error,
    });
  }
};

const createShoppingList = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const ownerId = await verify(token, jwtSecret)?.sub;
    const recipeId = req.params.recipeId;
    const recipeIngredients = await req.body.recipeIngredients;
    const recipeTipIngredients = await req.body.recipeTipIngredients;

    const newShoppingList = await ShoppingList.create({
      owner: ownerId,
      recipeId: recipeId,
      ingredients: recipeIngredients,
      tipIngredients: recipeTipIngredients,
    });

    res.status(200).send({ data: newShoppingList, message: 'ShoppingList created successfully', error: null });
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while creating the recipe', error: error });
  }
};
const createShoppingListNotForRecipe = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const ownerId = await verify(token, jwtSecret)?.sub;
    const ingredients = await req.body.ingredients;

    const newShoppingList = await ShoppingList.create({
      owner: ownerId,
      ingredients: ingredients,
    });

    res.status(200).send({ data: newShoppingList, message: 'ShoppingList created successfully', error: null });
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while creating the recipe', error: error });
  }
};

const updateShoppingList = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const shoppingListId = req.params.shoppingListId;
    const recipeIngredients = req.body.recipeIngredients;
    const recipeTipIngredients = req.body.recipeTipIngredients;

    const shoppingList = await ShoppingList.findOne({ _id: shoppingListId });

    await ShoppingList.findOneAndUpdate(
      { _id: shoppingList?._id },
      { $set: { owner: shoppingList?.owner, ingredients: recipeIngredients, tipIngredients: recipeTipIngredients } },
      { new: true, runValidators: true },
    );
    const updatedShoppingList = await ShoppingList.findOne({ _id: shoppingListId });

    res.status(200).send({
      data: updatedShoppingList,
      message: 'ShoppingList updated  successfully',
      error: null,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ data: null, message: 'there was an error while updateting the recipe', error: error });
  }
};

const getShoppingLists = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const ownerId = verify(token, jwtSecret)?.sub;

    if (ownerId && typeof ownerId === 'string') {
      const agregatedShoppingList = await getAggregatedShoppingList(ownerId);

      return res.status(200).send({
        data: agregatedShoppingList,
        message: 'bad request',
        error: null,
      });
    }
    return res.status(401).send({
      data: null,
      message: 'bad request',
      error: null,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ data: null, message: 'there was an error while creating the recipe', error: JSON.stringify(error) });
  }
};

const deleteShoppingList = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const listId = req.params.shoppingListId;
  const token = req.headers.authorization.split(' ')[1];
  const ownerId = verify(token, jwtSecret)?.sub;

  try {
    await ShoppingList.findOneAndDelete({ _id: new mongoose.Types.ObjectId(listId) });

    if (ownerId) {
      const agregatedShoppingList = await getAggregatedShoppingList(ownerId.toString());
      return res.status(200).send({
        data: agregatedShoppingList,
        message: 'ShoppingList deleted successfully',
        error: null,
      });
    } else {
      return res
        .status(400)
        .send({ data: null, message: 'there was an error while deleteing the recipe', error: null });
    }
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while deleteing the recipe', error: error });
  }
};

const GetLikedOnesRecipes = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const id = verify(token, jwtSecret)?.sub;

  const likedCounters = await RecipeCounters.find({ whoLike: { $in: [id] } });
  const likedRecipesId = likedCounters?.map((counter) => counter.relatedId);
  const likedRecipes = await Recipe.find({ _id: { $in: likedRecipesId } }).populate([
    {
      path: 'counter',
    },
    {
      path: 'owner',
      select: '_id name first_name last_name email',
    },
    {
      path: 'cuisine',
      select: 'code name oryginalName',
    },
    {
      path: 'image',
    },
    {
      path: 'counter',
    },
  ]);
  // const likedRecipes = await RecipeCounters.find({ whoLike: { $in: [id] } }).

  return res.status(200).send({
    data: likedRecipes,
    message: 'found successfully',
    error: null,
  });
};

export default {
  AddRecipe,
  GetRecipes,
  AddPhotoToRecpe,
  getByTag,
  getRecipesIngredients,
  createShoppingList,
  createShoppingListNotForRecipe,
  updateShoppingList,
  deleteShoppingList, //
  getMyRecipes,
  UpdateRecipe,
  getShoppingLists, //
  DeleteRecipe, //
  GetLikedOnesRecipes, //
};

async function getAggregatedShoppingList(ownerId: string) {
  try {
    const agregatedShoppingList = await ShoppingList.find({ owner: ownerId });

    const recipesIds = agregatedShoppingList
      .filter((shoppingList) => shoppingList.recipeId !== undefined)
      .map((shoppingList) => shoppingList.recipeId);

    const recipes = await Recipe.find({ _id: { $in: recipesIds } })
      .populate({
        path: 'owner',
        select: '_id name first_name last_name email',
      })
      .populate({ path: 'cuisine', select: 'code name oryginalName' })
      .populate('image')
      .populate('counter');

    const res = agregatedShoppingList.map((shoppingList) => {
      const recipe = recipes.filter((recipe) => recipe._id.toString() === shoppingList.recipeId?.toString());
      return { shoppingList: shoppingList, recipe: recipe[0] };
    });

    return res;
  } catch (error: any) {
    console.error(error);
    throw new Error(error.message);
  }
}
