import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import ReservationController from '../../controllers/order/reservations.controller';
let router = express.Router();

router.get('/get', Verification.verifyToken, ReservationController.GetReservationForUser);
router.post('/:establishmentId', Verification.verifyToken, ReservationController.AddReservation);
router.put('/:reservationId', Verification.verifyToken, ReservationController.CancelReservation);

/** for establishment */

router.get('/get/:establishmentId', Verification.verifyToken, ReservationController.GetReservation);
router.put('/update/:reservationId', Verification.verifyToken, ReservationController.changeReservationStatus);

export default router;
