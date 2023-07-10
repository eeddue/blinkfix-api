import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { createLanguageService } from 'typescript';
import { Establishment, Job, Order, User, Workspace } from '../../../config/mdb';
import { checkEstablishmentOwner } from '../../helpers/checkEstablishmentOwner';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { IJob } from '../../models/Profile/job';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const SendJobRequest = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  const { startOfWork, typeOfWork, workPlace }: IJob = req.body;

  try {
    if (!typeOfWork || !workPlace) {
      return res.status(400).send({ data: null, message: 'bad request', error: null });
    }
    const newJob = await Job.create({
      workerId: id,
      startOfWork: startOfWork ? new Date(startOfWork).toUTCString() : new Date().toUTCString(),
      typeOfWork,
      workPlace,
    });
    if (newJob) {
      //update user
      await User.findByIdAndUpdate(id, {
        $push: {
          jobs: newJob._id,
        },
      });
      //update establishment
      const establishment = await Establishment.findById(workPlace);
      if (!establishment?.workspace) {
        const newWorkspace = await Workspace.create({ establishmentId: workPlace });

        await Workspace.findByIdAndUpdate(newWorkspace._id, { $push: { employees: newJob._id } });
        await Establishment.findByIdAndUpdate(workPlace, {
          workspace: newWorkspace?._id,
        });
      } else {
        const establishment = await Establishment.findById(workPlace);

        if (newJob)
          await Workspace.findByIdAndUpdate(
            establishment?.workspace,
            { $push: { employees: newJob._id } },
            { new: true, runValidators: true },
          );
        else {
          return res.status(400).send({ data: null, message: 'there was an error', error: null });
        }
      }
    } else {
      await Job.findByIdAndDelete(id);
    }
    const jobs = await Job.find({ workerId: id }).populate('workPlace');

    //TODO: send a notification

    return res.status(200).send({ data: jobs, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetMyJobs = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  try {
    const jobs = await Job.find({ workerId: id }).populate({
      path: 'workPlace',
      populate: [
        {
          path: 'owner',
          populate: [
            { path: 'address' },
            { path: 'allergies' },
            { path: 'documentImages' },
            { path: 'jobs' },
            { path: 'images.profileImage' },
            { path: 'images.backgroundImage' },
          ],
        },
        {
          path: 'cuisine',
        },
        {
          path: 'address',
        },
        {
          path: 'menu',
          populate: [
            {
              path: 'menuItems',
              populate: [
                { path: 'image' },
                { path: 'dishIngredients' },
                {
                  path: 'counter',
                },
              ],
            },
          ],
        },
        {
          path: 'assortment',
        },
        {
          path: 'tables',
        },
        {
          path: 'reservations',
        },
        {
          path: 'counter',
        },
      ],
    });
    res.status(200).send({ data: jobs, message: 'jobs found successfully', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};
const GetSingleJob = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const { jobId } = req.params;
  try {
    const jobs = await Job.findOne({ _id: jobId }).populate([
      {
        path: 'workPlace',
        populate: [
          {
            path: 'owner',
            populate: [
              { path: 'address' },
              { path: 'allergies' },
              { path: 'documentImages' },
              { path: 'jobs' },
              { path: 'images.profileImage' },
              { path: 'images.backgroundImage' },
            ],
          },
          {
            path: 'cuisine',
          },
          {
            path: 'address',
          },
          {
            path: 'menu',
            populate: [
              {
                path: 'menuItems',
                populate: [
                  { path: 'image' },
                  { path: 'dishIngredients' },
                  {
                    path: 'counter',
                  },
                ],
              },
            ],
          },
          {
            path: 'assortment',
          },
          {
            path: 'tables',
          },
          {
            path: 'reservations',
          },
          {
            path: 'counter',
          },
        ],
      },
      {
        path: 'orders',
        populate: [
          { path: 'orderBy' },
          { path: 'orderWhere' },
          { path: 'address' },
          { path: 'assignedTo', populate: { path: 'workerId' } },
          { path: 'allAssignedTo', populate: { path: 'workerId' } },
          {
            path: 'orderItems',
            populate: [
              {
                path: 'itemId',
                model: 'EstablishmentMenuItems',
                populate: [
                  {
                    path: 'dishIngredients',
                    model: 'EstablishmentMenuItemsIngredients',
                  },
                  {
                    path: 'image',
                  },
                  {
                    path: 'counter',
                  },
                  {
                    path: 'allergens',
                  },
                ],
              },
              {
                path: 'changes',
                populate: {
                  path: 'ingredientId',
                  model: 'EstablishmentMenuItemsIngredients',
                },
              },
            ],
          },
        ],
      },
    ]);
    res.status(200).send({ data: jobs, message: 'jobs found successfully', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const forwardToJobType = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { jobType } = req.params;
  const { jobId, orderId } = req.body;
  console.log({ jobId });
  try {
    if (jobType !== 'pickup') {
      const yourJob = await Job.findById(jobId);
      if (!yourJob) throw new Error('Job not Found');
      console.log({ jobType, orderId, jobId });
      const order = await Order.findById(orderId);
      if (!order) throw new Error('order not found');
      await yourJob.updateOne({ $addToSet: { orders: order._id } }, { new: true });

      const finalOrdertest = await Order.findByIdAndUpdate(
        order._id,
        {
          $addToSet: { allAssignedTo: yourJob._id },
          assignedTo: yourJob._id,
          forwardedTo: jobType,
          orderStatus: 'took by chef',
          orderUpdateDate: new Date(),
        },
        { new: true, runValidators: true },
      );

      return res.status(200).send({
        data: finalOrdertest,
        message: 'updated succesfully',
        error: null,
      });
    } else {
      const yourJob = await Job.findById(jobId);
      if (!yourJob) throw new Error('Job not Found');
      const order = await Order.findById(orderId);
      if (!order) throw new Error('order not found');
      await yourJob.updateOne({ $addToSet: { orders: order._id } }, { new: true });

      const finalOrdertest = await Order.findByIdAndUpdate(
        order._id,
        {
          $addToSet: { allAssignedTo: yourJob._id },
          assignedTo: yourJob._id,
          forwardedTo: jobType,
          orderStatus: 'finished',
          orderUpdateDate: new Date(),
        },
        { new: true, runValidators: true },
      );
      return res.status(200).send({
        data: finalOrdertest,
        message: 'updated succesfully and finished',
        error: null,
      });
    }
  } catch (error: any) {
    console.error(error);
    return res.status(400).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetOrdersForwardedToJobOption = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const { jobId, jobType } = req.params;
  try {
    if (['driver', 'waiter', 'chef'].includes(jobType)) {
      // jobType matches one of the workTypes
      console.log('jobType is a valid work type');
    } else {
      throw new Error('jobType is not valid work type');
    }

    const workInJob = await Job.findOne({ _id: jobId, typeOfWork: jobType });
    if (!workInJob) {
      throw new Error('We have troubles finding your job');
    }

    const establishment = workInJob.workPlace;

    const ordersMached = await Order.find({
      orderWhere: establishment,
      forwardedTo: jobType,
    }).populate([
      { path: 'orderBy' },
      { path: 'orderWhere' },
      { path: 'address' },
      { path: 'assignedTo', populate: { path: 'workerId' } },
      { path: 'allAssignedTo', populate: { path: 'workerId' } },
      {
        path: 'orderItems',
        populate: [
          {
            path: 'itemId',
            model: 'EstablishmentMenuItems',
            populate: [
              {
                path: 'dishIngredients',
                model: 'EstablishmentMenuItemsIngredients',
              },
              {
                path: 'image',
              },
              {
                path: 'counter',
              },
              {
                path: 'allergens',
              },
            ],
          },
          {
            path: 'changes',
            populate: {
              path: 'ingredientId',
              model: 'EstablishmentMenuItemsIngredients',
            },
          },
        ],
      },
    ]);

    return res.status(200).send({
      data: ordersMached,
      message: 'succes',
      error: null,
    });
  } catch (error: any) {
    return res.status(400).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const DeleteMyJobRequest = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const jobId = req.params.jobId;
  try {
    const jobToDelete = await Job.findOne({ _id: jobId });
    if (!jobToDelete) {
      return res.status(404).send({ data: jobToDelete, message: 'job not found', error: null });
    } else {
      if (typeof id === 'string') {
        if (jobToDelete.workerId.toString() !== id) {
          return res.status(400).send({ data: null, message: 'bad request', error: null });
        }
        if (jobToDelete.isConfirmed === true) {
          return res.status(400).send({
            data: null,
            message: 'you cant delete this job request beaucose it has been already accepted by establishment',
            error: null,
          });
        }
        await Job.findByIdAndDelete(jobToDelete._id);
        const restOfJobs = await Job.find({ workerId: id }).populate('workPlace');
        return res.status(200).send({ data: restOfJobs, message: '', error: null });
      } else {
        return res.status(400).send({ data: null, message: 'bad request', error: null });
      }
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

//establishment
const changeIsAccepted = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const jobId = req.params.jobId;
  try {
    const job = await Job.findOne({ _id: jobId });

    if (!job) {
      return res.status(400).json({
        message: 'job not found',

        data: null,
        error: null,
      });
    }
    const establishmentId = job?.workPlace;
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
    if (job?.isConfirmed === true) {
      return res.status(400).json({
        message: 'job is confirmed already',

        data: null,
        error: null,
      });
    }

    await Job.findByIdAndUpdate(
      jobId,
      { isConfirmed: true, endOfWork: null, startOfWork: new Date().toLocaleString() },
      { new: true, runValidators: true },
    );

    const jobs = await Job.find({ isConfirmed: false, isRejected: false, workPlace: job?.workPlace }).populate(
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

const changeIsAcceptedReject = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const jobId = req.params.jobId;
  try {
    const job = await Job.findOne({ _id: jobId });

    if (!job) {
      return res.status(400).json({
        message: 'job not found',

        data: null,
        error: null,
      });
    }

    if (job?.isConfirmed === true) {
      return res.status(400).json({
        message: 'job is confirmed already',

        data: null,
        error: null,
      });
    }

    await Job.findByIdAndUpdate(
      jobId,
      { isConfirmed: false, isRejected: true, endOfWork: null, startOfWork: new Date().toLocaleString() },
      { new: true, runValidators: true },
    );
    //TODO: send a notification

    const jobs = await Job.find({ isConfirmed: false, isRejected: false, workPlace: job?.workPlace }).populate(
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
//establishment

const dismissEmployee = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const jobId = req.params.jobId;
  try {
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { isConfirmed: false, endOfWork: new Date().toUTCString() },
      { new: true, runValidators: true },
    ).populate('workPlace');
    if (!updatedJob)
      return res.status(400).send({
        data: null,
        message: '',
        error: null,
      });

    //TODO: send a notification
    const jobs = await Job.find({ isConfirmed: false, isRejected: false, workPlace: updatedJob?.workPlace }).populate(
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

export default {
  SendJobRequest,
  GetMyJobs,
  GetSingleJob,
  changeIsAccepted,
  dismissEmployee,
  DeleteMyJobRequest,
  changeIsAcceptedReject,
  GetOrdersForwardedToJobOption,
  forwardToJobType,
};
