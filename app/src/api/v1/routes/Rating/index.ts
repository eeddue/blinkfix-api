import express from 'express';
import RatingController from '../../controllers/Rating';
import Verification from '../../middlewares/verifyAuthentication';
let router = express.Router();

router.post('/:establishmentId', Verification.verifyToken, RatingController.AddNewRate);
router.get('/:establishmentId', Verification.verifyToken, RatingController.GetRating);

export default router;
