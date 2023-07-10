import express from 'express';
import { OrderController } from '../../controllers/order';
import {
  getAccountBalance,
  PaymentCreateConnect,
  PaymentRoot,
  uploadStripeImage,
} from '../../controllers/order/payment';
import Verification from '../../middlewares/verifyAuthentication';
import multer from 'multer';
let router = express.Router();

router.post('/payment-sheet', Verification.verifyToken, PaymentRoot);

router.post('/addstripe', Verification.verifyToken, PaymentCreateConnect);
router.post('/getBalance', Verification.verifyToken, getAccountBalance);

export default router;
