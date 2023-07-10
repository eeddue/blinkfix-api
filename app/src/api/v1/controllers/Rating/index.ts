import { Establishment } from '../../../config/mdb/index';
import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Rating } from '../../../config/mdb';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { IRating, IRatingEstablishment } from '../../models/Rating/Rating.schema';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const AddNewRate = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const { chefRating, driverRating, overallRating, waiterRating } = req.body;
  const establishmentId = req.params.establishmentId;
  try {
    const check = await Rating.findOne({ establishment: new mongoose.Types.ObjectId(establishmentId) });
    const defaultRating = { one: 0, two: 0, three: 0, four: 0, five: 0 };

    if (check === null) {
      await Rating.create({
        establishmentId,
        chefRating: defaultRating,
        driverRating: defaultRating,
        overallRating: defaultRating,
        waiterRating: defaultRating,
        Establishment: new mongoose.Types.ObjectId(establishmentId),
      });
    }
    const getQuery = (rating: number, name: string) => {
      switch (rating) {
        case 1:
          return { [name + '.one']: 1 };
        case 2:
          return { [name + '.two']: 1 };
        case 3:
          return { [name + '.three']: 1 };
        case 4:
          return { [name + '.four']: 1 };
        case 5:
          return { [name + '.five']: 1 };

        default:
          return {};
      }
    };

    if (chefRating) {
      await Rating.findOneAndUpdate(
        { establishment: new mongoose.Types.ObjectId(establishmentId) },
        { $inc: getQuery(Number.parseInt(chefRating), 'chefRating') },
      );
    }
    if (waiterRating) {
      await Rating.findOneAndUpdate(
        { establishment: new mongoose.Types.ObjectId(establishmentId) },
        { $inc: getQuery(Number.parseInt(waiterRating), 'waiterRating') },
      );
    }
    if (driverRating) {
      await Rating.findOneAndUpdate(
        { establishment: new mongoose.Types.ObjectId(establishmentId) },
        { $inc: getQuery(Number.parseInt(driverRating), 'driverRating') },
      );
    }
    if (overallRating) {
      await Rating.findOneAndUpdate(
        { establishment: new mongoose.Types.ObjectId(establishmentId) },
        { $inc: getQuery(Number.parseInt(overallRating), 'overallRating') },
      );
    }

    const updatedRating = await Rating.findOne({ establishment: new mongoose.Types.ObjectId(establishmentId) });
    if (!updatedRating) {
      return res
        .status(404)
        .send({ status: 'failure', data: null, message: 'No rating found for establishment', error: null });
    } else {
      const finalRating = {
        overallRating: convertRatingToTotal(updatedRating.overallRating),
        waiterRating: convertRatingToTotal(updatedRating.waiterRating),
        driverRating: convertRatingToTotal(updatedRating.driverRating),
        chefRating: convertRatingToTotal(updatedRating.chefRating),
      };

      return res.status(200).send({ status: 'success', data: finalRating, message: '', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      status: 'failure',
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetRating = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  try {
    const establishmentId = req.params.establishmentId;

    const establishmentRating = await Rating.findOne({ establishment: new mongoose.Types.ObjectId(establishmentId) });

    if (!establishmentRating) {
      return res
        .status(404)
        .send({ status: 'failure', data: null, message: 'No rating found for establishment', error: null });
    } else {
      const finalRating = {
        overallRating: convertRatingToTotal(establishmentRating?.overallRating),
        waiterRating: convertRatingToTotal(establishmentRating?.waiterRating),
        driverRating: convertRatingToTotal(establishmentRating?.driverRating),
        chefRating: convertRatingToTotal(establishmentRating?.chefRating),
      };

      return res.status(200).send({ status: 'success', data: finalRating, message: '', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      status: 'failure',
      data: null,
      message: error.message,
      error: error,
    });
  }
};

export default {
  AddNewRate,
  GetRating,
};

export const convertRatingToTotal = (rating: IRating): number => {
  let ratingTotal = 0;
  const rating1 = rating.one;
  const rating2 = rating.two;
  const rating3 = rating.three;
  const rating4 = rating.four;
  const rating5 = rating.five;

  ratingTotal = rating1 * 1 + rating2 * 2 + rating3 * 3 + rating4 * 4 + rating5 * 5;
  const averageRating = ratingTotal / (rating1 + rating2 + rating3 + rating4 + rating5);
  return Math.round((averageRating + Number.EPSILON) * 10) / 10;
};
