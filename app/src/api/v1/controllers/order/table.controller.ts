import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Establishment, Table } from '../../../config/mdb';
import { compareEstablishmentOwner } from '../../helpers/checkEstablishmentOwner';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { ITable } from '../../models/Order/tablesSchema';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const AddTables = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;

  const { tableName, numberOfPlaces, numberOfTables, tableShape }: ITable = req.body;
  const establishmentId = req.params.establishmentId;

  try {
    if (!tableName || !numberOfPlaces || !numberOfTables || !tableShape) {
      return res.status(400).send({ data: null, message: 'not enaught data provided', error: null });
    }

    const establishmentForCheck = await Establishment.findById(establishmentId);

    if (!establishmentForCheck) {
      return res.status(400).send({
        data: null,
        message: `not valid establishmentId`,
        error: null,
      });
    }

    if (establishmentForCheck && typeof id === 'string') {
      const areYouOwnerOfEstablishment = await compareEstablishmentOwner(establishmentForCheck, id);

      if (areYouOwnerOfEstablishment) {
        const newTablesSet = await Table.create({
          tableName,
          numberOfTables,
          numberOfPlaces,
          tableShape,
          numberOfTablesAvailable: numberOfTables,
        });

        const updateEstablishment = await Establishment.findByIdAndUpdate(
          establishmentId,
          {
            $push: { tables: newTablesSet._id },
          },
          { new: true },
        ).populate('tables');
        return res.status(200).send({
          data: updateEstablishment?.tables,
          message: `succesfully created tables and updated tables for establishment ${establishmentForCheck?.name}`,
          error: null,
        });
      } else {
        return res.status(403).send({
          data: null,
          message: `you are not allowed to create tables for establishment ${establishmentForCheck?.name}`,
          error: null,
        });
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
const GetTables = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { tableName, numberOfPlaces, numberOfTables, tableShape }: ITable = req.body;
  const establishmentId = req.params.establishmentId;

  try {
    const establishment = await Establishment.findById(establishmentId).populate('tables');

    return res.status(200).send({
      data: establishment?.tables,
      message: `succesfully get tables for establishment ${establishment?.name}`,
      error: null,
    });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};
const UpdateTables = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { tableName, numberOfPlaces, numberOfTables, tableShape }: ITable = req.body;
  const { establishmentId, tableSetId } = req.params;
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  try {
    if (!tableName || !numberOfPlaces || !numberOfTables || !tableShape) {
      return res.status(400).send({ data: null, message: 'not enaught data provided', error: null });
    }

    const establishmentForCheck = await Establishment.findById(establishmentId);

    if (!establishmentForCheck) {
      return res.status(400).send({
        data: null,
        message: `not valid establishmentId`,
        error: null,
      });
    }

    if (establishmentForCheck && typeof id === 'string') {
      const areYouOwnerOfEstablishment = await compareEstablishmentOwner(establishmentForCheck, id);

      if (areYouOwnerOfEstablishment) {
        await Table.findByIdAndUpdate(tableSetId, {
          tableName,
          numberOfTables,
          numberOfPlaces,
          tableShape,
        });
        const updateEstablishment = await Establishment.findById(establishmentId).populate('tables');
        return res.status(200).send({
          data: updateEstablishment?.tables,
          message: `succesfully created tables and updated tables for establishment ${establishmentForCheck?.name}`,
          error: null,
        });
      } else {
        return res.status(403).send({
          data: null,
          message: `you are not allowed to create tables for establishment ${establishmentForCheck?.name}`,
          error: null,
        });
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
const DeleteTables = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { tableName, numberOfPlaces, numberOfTables, tableShape }: ITable = req.body;
  const { establishmentId, tableSetId } = req.params;
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  try {
    const establishmentForCheck = await Establishment.findById(establishmentId);

    if (!establishmentForCheck) {
      return res.status(400).send({
        data: null,
        message: `not valid establishmentId`,
        error: null,
      });
    }

    if (establishmentForCheck && typeof id === 'string') {
      const areYouOwnerOfEstablishment = await compareEstablishmentOwner(establishmentForCheck, id);

      if (areYouOwnerOfEstablishment) {
        await Table.findByIdAndDelete(tableSetId, {
          tableName,
          numberOfTables,
          numberOfPlaces,
          tableShape,
        });

        const updateEstablishment = await Establishment.findByIdAndUpdate(establishmentId, {
          $pull: { tables: tableSetId },
        }).populate('tables');
        return res.status(200).send({
          data: updateEstablishment?.tables,
          message: `succesfully created tables and updated tables for establishment ${establishmentForCheck?.name}`,
          error: null,
        });
      } else {
        return res.status(403).send({
          data: null,
          message: `you are not allowed to create tables for establishment ${establishmentForCheck?.name}`,
          error: null,
        });
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

export default { AddTables, GetTables, UpdateTables, DeleteTables };
