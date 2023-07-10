import express from 'express';
import { Advertisement } from '../../controllers/Profile/advertisement/Advertisement.controller';
import Verification from '../../middlewares/verifyAuthentication';

let router = express.Router();

router.get('/', Verification.verifyToken, (req, res) => {
  const advertisement = new Advertisement();
  advertisement.greate();
  res.send('succes');
});

export default router;
