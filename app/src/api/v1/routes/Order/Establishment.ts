import { EstablishmentAssortment } from '../../../config/mdb/index';
import { uploadMainImage } from '../../helpers/PhotosController';
import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import EstablishmentController from '../../controllers/order/establishment.controller';
import EstablishmentMenuRouter from './MenuRoutes';
import EstablishmentAssortmentRouter from './AssortmentRoute';
import TablesRouter from './Tables';

let router = express.Router();

/** /establishment */
router.get('/favourites', Verification.verifyToken, EstablishmentController.GetLikedOnesEstablishment);

router.get('/get/:establishmentId', Verification.verifyToken, EstablishmentController.getEstablishment);
router.delete('/delete/:establishmentId', Verification.verifyToken, EstablishmentController.deleteEstablishment);
router.post('/add', Verification.verifyToken, EstablishmentController.addEstablishment);
router.put('/edit/:establishmentId', Verification.verifyToken, EstablishmentController.editEstablishment);
router.put('/editVat/:establishmentId', Verification.verifyToken, EstablishmentController.editEstablishmentVatNumber);
router.put(
  '/edit/address/:establishmentId',
  Verification.verifyToken,
  EstablishmentController.editEstablishmentAddress,
);
router.put('/workingHours/edit/:establishmentId', Verification.verifyToken, EstablishmentController.editEstablishment);
router.get('/find/', Verification.verifyToken, EstablishmentController.filterEstablisshment);

router.get('/address/:addressString', Verification.verifyToken, EstablishmentController.getLatLongByAddress);

router.post(
  '/addImage/:establishmentId',
  Verification.verifyToken,
  uploadMainImage.fields([
    {
      name: 'imageMain',
      maxCount: 1,
    },
    {
      name: 'imageBack',
      maxCount: 1,
    },
  ]),
  EstablishmentController.AddPhotoToEstablishmentMain,
);

router.use('/menu', EstablishmentMenuRouter);
router.use('/assortment', EstablishmentAssortmentRouter);
router.use('/tables', TablesRouter);

export default router;
