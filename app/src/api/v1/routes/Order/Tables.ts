import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import TableController from '../../controllers/order/table.controller';
import ReservationsRoutes from './Reservations';
let router = express.Router();

/** /establishment/tables */

router.post('/:establishmentId', Verification.verifyToken, TableController.AddTables);
router.get('/:establishmentId', Verification.verifyToken, TableController.GetTables);
router.put('/:establishmentId/:tableSetId', Verification.verifyToken, TableController.UpdateTables);
router.delete('/:establishmentId/:tableSetId', Verification.verifyToken, TableController.DeleteTables);

router.use('/reservations', ReservationsRoutes);

export default router;
