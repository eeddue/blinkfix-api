import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../config/mdb';
import getClient from '../../config/redis';
import { stripe } from '../controllers/order/payment';
import { IResponse } from '../interfaces';
import { IGetUserAuthInfoRequest } from '../interfaces/request.interface';

const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';
const jwtSecretRefresh = process.env.JWT_REFRESH_KEY || 'test';

async function verifyToken(req: IGetUserAuthInfoRequest, res: IResponse, next: NextFunction) {
  try {
    const redis_client = await getClient();
    // Bearer tokenstring
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(403).send({ message: 'unauthorized', error: null, data: null });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret);

    if (!decoded) res.status(403).send({ message: 'unauthorized', error: null, data: null });

    // varify blacklisted access token.
    const data = await redis_client.get('BL_' + decoded.sub?.toString());

    if (data === token) {
      return res.status(401).json({ message: 'blacklisted token.', error: null, data: null });
    }
    // res.cookie('token', token);
    next();
  } catch (error: any) {
    console.error(error);
    return res.status(401).json({ message: 'Your session is not valid.', error: error, data: null });
  }
}

async function verifyRefreshToken(req: IGetUserAuthInfoRequest, res: IResponse, next: NextFunction) {
  const token = req.body.token;

  if (token === null) return res.status(401).json({ message: 'Invalid request.', error: null, data: null });

  try {
    const redis_client = await getClient();

    const decoded = jwt.verify(token, jwtSecretRefresh);
    req.UserData = decoded;
    const sub = decoded.sub?.toString();

    // verify if token is in store or not
    const data = await redis_client.get(sub || '');

    if (data === null)
      return res.status(401).json({ message: 'Invalid request. Token is not in store.', data: null, error: null });
    if (JSON.parse(data).token != token)
      return res.status(401).json({ message: 'Invalid request. Token is not same in store.', error: null, data: null });

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Your session is not valid.', data: null, error: error });
  }
}
async function verifySubscription(req: IGetUserAuthInfoRequest, res: IResponse, next: NextFunction) {
  const token = req.body.token;

  if (!token) return res.status(401).json({ message: 'Invalid request.', error: null, data: null });
  const decoded = jwt.verify(token, jwtSecretRefresh);
  req.UserData = decoded;
  const id = decoded.sub?.toString();
  try {
    const user = await User.findById(id);

    if (!user || !user.stripe_id) {
      if (user?.mode === 'Testing') {
        console.log('stripe verification failed');
      } else {
        throw new Error('stripe verification failed');
      }
      await stripe.subscriptions.list({ customer: user.stripe_id });
    }

    next();
  } catch (error) {
    return res.status(400).json({ message: 'Your session is not valid.', data: null, error: error });
  }
}

export default {
  verifyToken,
  verifyRefreshToken,
};
