import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import MyProfileController from '../../controllers/Profile/myProfile';
import InvoicesRecipesController from '../../controllers/Profile/invoices';
import { uploadMainImage } from '../../helpers/PhotosController';

let router = express.Router();

router.get('/', Verification.verifyToken, InvoicesRecipesController.getInvoicesRecipes);

export default router;
