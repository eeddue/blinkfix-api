import { uploadMainImage } from '../../helpers/PhotosController';
import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import EstablishmentAssortmentController from '../../controllers/order/establishment.assortment';
import EstablishmentMenuRouter from './MenuRoutes';
import TablesRouter from './Tables';

let router = express.Router();
router.get('/:establishmentId', Verification.verifyToken, EstablishmentAssortmentController.getEstablishmentAssortment);

router.post(
  '/:establishmentId',
  Verification.verifyToken,
  EstablishmentAssortmentController.addEstablishmentAssortment,
);

router.put(
  '/:establishmentId/:assortmentId',
  Verification.verifyToken,
  EstablishmentAssortmentController.editEstablishmentAssortment,
);

router.delete(
  '/:establishmentId/:assortmentId',
  Verification.verifyToken,
  EstablishmentAssortmentController.deleteEstablishmentAssortment,
);

router.put(
  '/rate/:establishmentId/:assortmentId',
  Verification.verifyToken,
  EstablishmentAssortmentController.rateAssortments,
);

router.get(
  '/rate/:establishmentId/:assortmentId',
  Verification.verifyToken,
  EstablishmentAssortmentController.getEstablishmentAssortmentRate,
);

router.put('/like/:establishmentId/:assortmentId', Verification.verifyToken, EstablishmentAssortmentController.AddLike);
router.put(
  '/share/:establishmentId/:assortmentId',
  Verification.verifyToken,
  EstablishmentAssortmentController.AddShare,
);
router.put(
  '/click/:establishmentId/:assortmentId',
  Verification.verifyToken,
  EstablishmentAssortmentController.AddClick,
);

export default router;
