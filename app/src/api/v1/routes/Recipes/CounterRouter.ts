import express from 'express';

import CounterController from '../../controllers/Recipes/CounterController';
import Middleweres from '../../middlewares/verifyAuthentication';
let RecipeCounterRouter = express.Router();

RecipeCounterRouter.post('/addLike/:recipeId', Middleweres.verifyToken, CounterController.AddLike);
RecipeCounterRouter.post('/addShare/:recipeId', Middleweres.verifyToken, CounterController.AddShare);
RecipeCounterRouter.post('/addClick/:recipeId', Middleweres.verifyToken, CounterController.AddClick);

export default RecipeCounterRouter;
