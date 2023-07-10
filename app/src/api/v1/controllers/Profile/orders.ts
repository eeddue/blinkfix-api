import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import { User, Order } from '../../../config/mdb';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const GetMyOrders = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  try {
    if (typeof id !== 'string') {
      return res.status(400).send({
        data: null,
        message: 'bad request',
        error: null,
      });
    }
    const myOrders = await getOrders(id);
    res.status(200).send({ data: myOrders, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

async function getOrders(id: string) {
  const user = await User.findById(id);
  if (!user) throw new Error('user not found');

  return await Order.find({ orderBy: id })
    .populate({
      path: 'orderItems',
      populate: {
        path: 'itemId',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'dishIngredients',
          model: 'EstablishmentMenuItemsIngredients',
        },
      },
    })
    .populate({
      path: 'orderItems',
      populate: {
        path: 'changes',
        populate: {
          path: 'ingredientId',
          model: 'EstablishmentMenuItemsIngredients',
        },
      },
    });
}

export default {
  GetMyOrders,
};
