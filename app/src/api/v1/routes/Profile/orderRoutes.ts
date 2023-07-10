import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import MyProfileController from '../../controllers/Profile/myProfile';
import InvoicesRecipesController from '../../controllers/Profile/invoices';
import { uploadMainImage } from '../../helpers/PhotosController';
import { UserOrders } from '../../controllers/Profile';

let router = express.Router();

router.get('/', Verification.verifyToken, UserOrders.GetMyOrders);
router.use('/advertisement', Verification.verifyToken, UserOrders.GetMyOrders);

export default router;
