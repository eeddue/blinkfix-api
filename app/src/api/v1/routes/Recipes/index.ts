import express from 'express';
import { RecipeController } from '../../controllers';
import RecipeCounterRouter from './CounterRouter';
import Verification from '../../middlewares/verifyAuthentication';
import { uploadCommonMenuItemImage, uploadCommonRecipesImage } from '../../helpers/PhotosController';
import establishmentMenuController from '../../controllers/order/establishmentMenu.controller';
let router = express.Router();

router.post('/recipe', Verification.verifyToken, RecipeController.AddRecipe);
router.get('/recipes', Verification.verifyToken, RecipeController.GetRecipes);
router.get('/recipe/liked', Verification.verifyToken, RecipeController.GetLikedOnesRecipes);
router.put('/recipe/:recipeId', Verification.verifyToken, RecipeController.UpdateRecipe);
router.delete('/recipe/:recipeId', Verification.verifyToken, RecipeController.DeleteRecipe);

router.get('/findByTag/:tag', Verification.verifyToken, RecipeController.getByTag);
router.get('/findMyRecipes', Verification.verifyToken, RecipeController.getMyRecipes);
router.get('/shoppingLists', Verification.verifyToken, RecipeController.getShoppingLists);
router.post('/shoppingList', Verification.verifyToken, RecipeController.createShoppingListNotForRecipe);
router.post('/shoppingList/:recipeId', Verification.verifyToken, RecipeController.createShoppingList);
router.post(
  '/addPhotoToRecipe/:recipeId',
  Verification.verifyToken,
  uploadCommonRecipesImage.single('recipeItem'),
  establishmentMenuController.addImageToMenuItem,
);

router.delete('/shoppingList/:shoppingListId', Verification.verifyToken, RecipeController.deleteShoppingList);
router.put('/shoppingList/:shoppingListId', Verification.verifyToken, RecipeController.updateShoppingList);

/**
 * Recipe counter
 */

router.use('/counter', RecipeCounterRouter);

export default router;
