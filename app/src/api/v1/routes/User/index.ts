import express from 'express';

import { UserController } from '../../controllers';
import counterRouter from './counterrouter';
import Verification from '../../middlewares/verifyAuthentication';
import MailerController from '../../helpers/mailer';
import { templateMailResetPassword } from '../../../assets/templateemail';
import { getAccountBalance, stripe } from '../../controllers/order/payment';

let router = express.Router();

router.post('/login', UserController.UserLogin);
router.post('/register', UserController.userRegister);
router.post('/token', Verification.verifyRefreshToken, UserController.GetAccessToken);

router.post('/logout');

router.use('/counter', counterRouter);

router.get('/logout', Verification.verifyToken, UserController.Logout);

router.post('/resetrequest', UserController.ResetPassword);
router.post('/resetresponse', UserController.changePassword);
router.get('/stripe/:stripeAccountId', async (req, res) => {
  try {
    const { stripeAccountId } = req.params;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: 'https://example.com/reauth',
      return_url: 'https://example.com/return',
      type: 'account_onboarding',
    });
    return res.send({ data: accountLink });
  } catch (error: any) {
    return res.send({ error: error.message });
  }
});

export default router;
