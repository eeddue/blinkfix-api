import express from 'express';
import { OrderController } from '../../controllers/order';
import { UserJob } from '../../controllers/Profile';
import Verification from '../../middlewares/verifyAuthentication';
import itemRoutes from './orderItems.router';

let router = express.Router();

router.get('/confirm/:orderWhere', Verification.verifyToken, OrderController.GetOrdersToConfirm);
router.get('/listmy', Verification.verifyToken, OrderController.GetMyOrders);
router.get('/establishment', Verification.verifyToken, OrderController.GetEstablishmentOrders);
router.get('/bestsellers/:establishmentId', Verification.verifyToken, OrderController.GetEstablishmentBestSellers);

router.post('/addOrder', Verification.verifyToken, OrderController.UserAddOrder);
router.post('/forwardTo/:jobType', Verification.verifyToken, UserJob.forwardToJobType);
router.put('/cancel/:orderId', Verification.verifyToken, OrderController.UpdateOrderStateCancel);
router.put('/:orderId', Verification.verifyToken, OrderController.UpdateOrderState);

router.use('/item', itemRoutes);

export default router;
