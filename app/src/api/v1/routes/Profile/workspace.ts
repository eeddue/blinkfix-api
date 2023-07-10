import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import workspaceController from '../../controllers/Profile/workspace';
import RestaurantController from '../../controllers/Profile/myRestaurant';
import { checkIfIsOwner } from '../../middlewares/ProfileMiddlewere';
let router = express.Router();

// router.get('/', Verification.verifyToken, checkIfIsOwner, workspaceController.GetMyEmployees);
router.get('/:establishmentId', Verification.verifyToken, RestaurantController.getMyEstablishmentWorkership);
router.get('/:establishmentId/:employeeId', Verification.verifyToken, RestaurantController.getEmployeById);
router.get(
  '/employeesToConfirm/:establishmentId',
  Verification.verifyToken,
  RestaurantController.getEmployeesToConfirm,
);

export default router;
