import { Establishment } from '../../../config/mdb/index';
import express from 'express';
import EstablishmentMenuController from '../../controllers/order/establishmentMenu.controller';
import Verification from '../../middlewares/verifyAuthentication';
import { uploadCommonMenuItemImage } from '../../helpers/PhotosController';
let router = express.Router();
//#region menu
router.get('/get/:establishmentId', Verification.verifyToken, EstablishmentMenuController.getEstablishmentMenu);
router.post('/add/:establishmentId', Verification.verifyToken, EstablishmentMenuController.addEstablishmentMenu);
router.put('/edit/:menuId', Verification.verifyToken, EstablishmentMenuController.editEstablishmentMenu);
router.put(
  '/edit/categories/:menuId',
  Verification.verifyToken,
  EstablishmentMenuController.editEstablishmentCategories,
);
router.delete('/delete/:menuId', Verification.verifyToken, EstablishmentMenuController.deleteEstablishmentMenu);

router.post('/addItem/:menuId', Verification.verifyToken, EstablishmentMenuController.addEstablishmentMenuItem);
router.post(
  '/addItemAllergens/:itemId',
  Verification.verifyToken,
  EstablishmentMenuController.addEstablishmentMenuItemAllergens,
);
router.get(
  '/getItemAllergens/:itemId',
  Verification.verifyToken,
  EstablishmentMenuController.getEstablishmentMenuItemAllergens,
);

router.post(
  '/addPhotoToItem/:menuItemId',
  Verification.verifyToken,
  uploadCommonMenuItemImage.single('menuItem'),
  EstablishmentMenuController.addImageToMenuItem,
);

//#endregion

router.put(
  '/updateItem/:menuId/:itemId',
  Verification.verifyToken,
  EstablishmentMenuController.updateEstablishmentMenuItem,
);
router.delete(
  '/deleteItem/:menuId/:itemId',
  Verification.verifyToken,
  EstablishmentMenuController.deleteEstablishmentMenuItem,
);

export default router;
