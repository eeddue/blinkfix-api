import { Job, User, Workspace } from '../../../config/mdb/index';
import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const GetMyEmployees = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const { workPlace } = req.body;

  try {
    const workspaces = await Workspace.findOne({ establishmentId: workPlace }).populate('employees');

    if (!workspaces) {
      return res.status(404).send({ data: null, message: 'workspace not found', error: null });
    } else {
      const jobs = await Promise.all(
        workspaces.employees.map(async (singleWorkspace) => {
          const response = await Job.findById(singleWorkspace);
          let userData;
          if (response) {
            const employee = await User.findById(response?.workerId);
            userData = {
              emp_firstName: employee?.first_name,
              emp_lastName: employee?.last_name,
            };
          }

          return {
            typeOfWork: response?.typeOfWork,
            startOfWork: response?.startOfWork,
            endOfWork: response?.endOfWork,
            isConfirmed: response?.isConfirmed,
            workerId: response?.workerId,
            workerName: userData?.emp_firstName,
            workerLastName: userData?.emp_lastName,
            workPlace: response?.workPlace,
          };
        }),
      );
      return res.status(200).send({ data: jobs, message: '', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetEstablishmentOrders = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  try {
    res.status(200).send({ data: null, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

export default {
  GetMyEmployees,
};
