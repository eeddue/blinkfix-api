import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { Establishment } from '../../config/mdb';
import { IResponse } from '../interfaces';
import { IGetUserAuthInfoRequest } from '../interfaces/request.interface';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

export const checkIfIsOwner = async (req: IGetUserAuthInfoRequest, res: IResponse, next: NextFunction) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const establishmentId = req.body.workPlace;
  try {
    const establishment = await Establishment.findById(establishmentId);
    if (establishment?.owner.toString() === id) next();
    else
      return res.status(400).send({
        status: 'failure',
        data: null,
        message: 'you are not allowed to change this data',
        error: null,
      });
  } catch (error: any) {
    return res.status(500).send({
      status: 'failure',
      data: null,
      message: error.message,
      error: error,
    });
  }
};
