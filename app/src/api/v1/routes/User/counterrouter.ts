import express from 'express';
import establishmentController from '../../controllers/order/establishment.controller';
import establishmentMenuController from '../../controllers/order/establishmentMenu.controller';

import Verification from '../../middlewares/verifyAuthentication';

let router = express.Router();

router.post('/addLikeToEstablishment/:establishmentId', Verification.verifyToken, establishmentController.AddLike);
router.post('/addShareToEstablishment/:establishmentId', Verification.verifyToken, establishmentController.AddShare);
router.post('/addClickToEstablishment/:establishmentId', Verification.verifyToken, establishmentController.AddClick);

router.get('/menuItemsStatistic', Verification.verifyToken, establishmentMenuController.GetLikedMenuItems);
router.post(
  '/addLikeToEstablishmentMenuItem/:menuItemId',
  Verification.verifyToken,
  establishmentMenuController.AddLikeToMenuItem,
);
router.post(
  '/addShareToEstablishmentMenuItem/:menuItemId',
  Verification.verifyToken,
  establishmentMenuController.AddShareToMenuItem,
);
router.post('/addClickToEstablishmentMenuItem/:menuItemId', Verification.verifyToken, establishmentController.AddClick);

export default router;
