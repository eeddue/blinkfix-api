import express from 'express';
import { CuisineController } from '../../controllers/order';
import Verification from '../../middlewares/verifyAuthentication';
import EstablishmentRouter from './Establishment';
import PaymentRoute from './PaymentRoutes';
import OrderRouter from './order';
let router = express.Router();

router.get('/allCuisines', Verification.verifyToken, CuisineController.allCuisines);
router.get('/allCuisines/:cuisine', Verification.verifyToken, CuisineController.allCuisinesFiltered);
router.use('/establishment', EstablishmentRouter);
router.use('/', OrderRouter);
router.use('/payment', PaymentRoute);

export default router;
