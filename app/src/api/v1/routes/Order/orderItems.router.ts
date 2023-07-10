import express from 'express';
import { OrderController } from '../../controllers/order';
import Verification from '../../middlewares/verifyAuthentication';
let router = express.Router();

router.put('/:orderId', Verification.verifyToken, OrderController.EditOrderAddNewOrderItem);
router.put('/:orderId/:itemId', Verification.verifyToken, OrderController.EditOrderEditOrderItem);
router.delete('/:orderId/:itemId', Verification.verifyToken, OrderController.EditOrderDeleteOrderItem);
export default router;
