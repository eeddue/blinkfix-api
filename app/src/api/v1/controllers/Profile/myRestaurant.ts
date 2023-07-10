import { checkEstablishmentOwner, compareEstablishmentOwner } from '../../helpers/checkEstablishmentOwner';
import { verify } from 'jsonwebtoken';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { Types } from 'mongoose';
import { Establishment, Job } from '../../../config/mdb';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const getMyEstablishmentWorkership = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const establishmentId = req.params.establishmentId;

  try {
    const establishment = await Establishment.findById(establishmentId);
    if (!establishment) {
      return res.status(404).send({
        data: null,
        message: 'establishment not found',
        error: null,
      });
    }

    if (typeof id === 'string') {
      const conditionCheckOwner = await compareEstablishmentOwner(establishment, id);
      if (!conditionCheckOwner) {
        return res.status(400).send({
          data: null,
          message: 'you are not authorized to acces this data.',
          error: null,
        });
      }

      const jobSplited = await Job.aggregate([
        { $match: { workPlace: new Types.ObjectId(establishmentId), isConfirmed: true } },
        {
          $lookup: {
            from: 'users',
            as: 'worker',
            localField: 'workerId',
            foreignField: '_id',
          },
        },
        { $unwind: '$worker' },
        {
          $lookup: {
            from: 'profileimages',
            as: 'worker.images', // populate the worker field with the user data
            localField: 'worker.images.backgroundImage._id',
            foreignField: 'profileimages.images._id',
          },
        },
        {
          $lookup: {
            from: 'profileimages',
            as: 'worker.images', // populate the worker field with the user data
            localField: 'worker.images.profileImage._id',
            foreignField: 'profileimages.images._id',
          },
        },
        {
          $lookup: {
            from: 'addresses',
            as: 'worker.address', // populate the worker field with the user data
            localField: 'worker.address._id',
            foreignField: 'profileimages.addresses._id',
          },
        },

        {
          $group: {
            _id: '$typeOfWork',

            employees: { $push: '$$ROOT' },
          },
        },
      ]);

      return res.status(200).send({ data: jobSplited, message: '', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const getEmployeById = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const { establishmentId, employeeId } = req.params;

  try {
    const convertedId = new Types.ObjectId(establishmentId);
    if (typeof id === 'string') {
      const checkIfworkThere = await checkEstablishmentOwner(convertedId);
      if (checkIfworkThere?.toString() !== id) {
        return res.status(400).json({
          message: 'you are not allowed to get this informations',

          data: null,
          error: null,
        });
      }
    }

    const jobs = await Job.findById(employeeId).populate([
      {
        path: 'workerId',
        populate: [
          {
            path: 'jobs',
          },
          {
            path: 'images.profileImage',
          },
          {
            path: 'images.backgroundImage',
          },
          {
            path: 'address',
          },
        ],
      },
      { path: 'workPlace' },
      {
        path: 'orders',
        populate: [
          { path: 'assignedTo' },
          {
            path: 'orderBy',
          },
          {
            path: 'orderWhere',
          },
          {
            path: 'allAssignedTo',
          },
          {
            path: 'orderItems',
            populate: {
              path: 'itemId',
              populate: [{ path: 'dishIngredients' }, { path: 'counter' }, { path: 'allergens' }],
            },
          },
        ],
      },
    ]);

    res.status(200).send({ data: jobs, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const getEmployeesToConfirm = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const establishmentId = req.params.establishmentId;

  try {
    const convertedId = new Types.ObjectId(establishmentId);
    if (typeof id === 'string') {
      const checkIfworkThere = await checkEstablishmentOwner(convertedId);
      if (checkIfworkThere?.toString() !== id) {
        return res.status(400).json({
          message: 'you are not allowed to get this informations',

          data: null,
          error: null,
        });
      }
    }

    const jobs = await Job.find({ isConfirmed: false, isRejected: false, workPlace: establishmentId }).populate(
      'workerId',
    );

    res.status(200).send({ data: jobs, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

export default { getMyEstablishmentWorkership, getEmployeesToConfirm, getEmployeById };
