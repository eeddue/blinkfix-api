import mongoose, { Schema, Types } from 'mongoose';
import { Establishment, Job, Workspace } from '../../config/mdb';
import { IEstablishment } from '../interfaces/mongo/establishment';
import { convertStringToId } from './mongodbHelper';

export const compareEstablishmentOwner = async (establishment: IEstablishment, owner: string) => {
  const establishmentOwner = establishment.owner;
  if (establishmentOwner.toString() === owner) return true;
  else return false;
};

export const checkEstablishmentOwner = async (EstablishmentId: mongoose.Types.ObjectId) => {
  const establishment = await Establishment.findById(EstablishmentId);
  if (establishment) {
    return establishment.owner;
  }
};

export const checkEstablishmentWorkers = async (establishmentId: mongoose.Types.ObjectId) => {
  const establishment = await Establishment.findById(establishmentId);
  if (establishment) {
    return establishment.workspace;
  } else {
    return undefined;
  }
};

export const checkIfUserWorkThere = async (userId: string, establishmentId: mongoose.Types.ObjectId) => {
  const convertedId = new Schema.Types.ObjectId(userId);
  const ownerId = await checkEstablishmentOwner(establishmentId);
  const ifIsOwner: boolean = ownerId === convertedId;
  const allWorkers = await Establishment.findById(establishmentId).populate({
    path: 'workspace',
    model: 'Workspace',
    populate: 'employees',
  });
  const workspace = allWorkers?.workspace;

  const employees = await getEmployeesFromWorkspace(workspace);
  if (employees) {
    const ifEmployeeWorkThere = await Promise.all(
      employees?.map((employee) => {
        if (employee?.toString() === userId) return true;
        else return false;
      }),
    );

    const conditionForEmployee = ifEmployeeWorkThere.includes(true);
    if (conditionForEmployee === true || ifIsOwner === true) return true;
    else return false;
  } else return false;
};

async function getEmployeesFromWorkspace(workspace: Types.ObjectId | undefined) {
  if (!workspace) throw new Error('workspace not found.');
  else {
    const workspaceMDB = await Workspace.findById(workspace);
    if (!workspaceMDB) return null;
    else {
      const wspc = workspaceMDB?.employees;
      if (wspc) {
        const employeeList = await Promise.all(
          wspc.map(async (jobId) => {
            const job = await Job.findById(jobId);
            return job?.workerId;
          }),
        );
        return employeeList;
      } else {
        return null;
      }
    }
  }
}
