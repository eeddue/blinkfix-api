import { reservationSchema } from '../../models/Order/reservationSchema';
import { compareEstablishmentOwner } from '../../helpers/checkEstablishmentOwner';
import { Establishment, Reservation, Table } from '../../../config/mdb/index';
import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import mongoose from 'mongoose';
import { IReservation } from '../../models/Order/reservationSchema';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const AddReservation = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  const { establishmentId } = req.params;
  const { reservationStartDate, reservationEndDate, table }: IReservation = req.body;
  let reservationFor = req.params.reservationFor;

  try {
    if (!reservationStartDate || !reservationEndDate || !table) {
      return res.status(400).send({ message: 'Invalid reservationData', data: null, error: null });
    }

    const establishment = await Establishment.findById(establishmentId);
    if (establishment && typeof id === 'string') {
      const areYouOwner = await compareEstablishmentOwner(establishment, id);
      if (!areYouOwner) {
        return res.status(403).send({
          data: null,
          message: 'you are not allowed to see reservations',
          error: 'you are not allowed to see reservations',
        });
      }

      const reservationsCount = await Reservation.find({
        $or: [
          { reservationStartDate: reservationStartDate, reservationEndDate: reservationEndDate, table: table },

          { reservationStartDate: { $lte: reservationEndDate, $gt: reservationStartDate }, table: table },

          { reservationEndDate: { $lt: reservationStartDate, $gte: reservationEndDate }, table: table },
        ],
      }).count();

      const tableFromDb = await Table.findById(table);
      if (!tableFromDb) {
        return res.status(400).send({
          data: null,
          message: 'Not valid table id',
          error: null,
        });
      }
      const tablesAvailable = tableFromDb?.numberOfTables;

      if (reservationsCount < tablesAvailable) {
        const newReservation = await Reservation.create({
          reservationStartDate: reservationStartDate,
          reservationEndDate: reservationEndDate,
          table: table,
          reservationFor: reservationFor ? reservationFor : id,
        });

        await Establishment.findByIdAndUpdate(
          establishmentId,
          {
            $push: { reservations: newReservation._id },
          },
          { new: true },
        );

        return res.status(200).send({
          data: newReservation,
          message: '',
          error: null,
        });
      } else {
        return res.status(400).send({
          data: null,
          message: 'reservation in this time period is not available',
          error: null,
        });
      }
    } else {
      return res.status(404).send({ data: null, message: 'Establisment notFound', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetReservation = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  const { establishmentId } = req.params;
  try {
    const establishment = await Establishment.findById(establishmentId);
    if (establishment && typeof id === 'string') {
      const areYouOwner = await compareEstablishmentOwner(establishment, id);
      if (!areYouOwner) {
        return res.status(403).send({
          data: null,
          message: 'you are not allowed to see reservations',
          error: 'you are not allowed to see reservations',
        });
      }
      const returnReservations = await establishment.populate('reservations');
      return res.status(200).send({
        data: returnReservations.reservations,
        message: 'reservation placed successfully',
        error: null,
      });
    } else {
      return res.status(404).send({ data: null, message: 'Establisment notFound', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const GetReservationForUser = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  try {
    const reservations = await Reservation.find({ reservationFor: id });
    if (reservations.length === 0) {
      return res.status(404).send({
        data: null,
        message: 'No reservation found',
        error: null,
      });
    }
    return res.status(200).send({
      data: reservations,
      message: 'reservation placed successfully',
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

const CancelReservation = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  const reservationId = req.params.reservationId;
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return res.status(404).send({ data: null, message: 'reservation notFound', error: null });
  }

  if (reservation.reservationStatus === 'cancelled')
    return res.status(400).send({ data: null, message: 'reservation already cancelled', error: null });

  if (reservation.reservationFor.toString() === id) {
    const updatedReservation = await Reservation.findByIdAndUpdate(
      reservationId,
      { reservationStatus: 'cancelled' },
      { new: true },
    );
    return res.status(200).send({
      data: updatedReservation,
      message: 'reservation canceled successfully',
      error: null,
    });
  } else {
    return res
      .status(400)
      .send({ data: null, message: 'you are not allowed to cancel this reservations', error: null });
  }
};

const changeReservationStatus = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  const reservationId = req.params.reservationId;
  const { status, reason } = req.body;

  try {
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).send({ data: null, message: 'reservation notFound', error: null });
    }

    const establishment = await Establishment.findOne({
      owner: id,
      reservations: reservation._id,
    });

    if (!establishment) {
      return res.status(400).send({
        data: null,
        message: 'you are not allowed to update this reservations',
        error: null,
      });
    } else {
      if (!status) {
        return res.status(400).send({
          data: null,
          message: 'you have to sent us new status for reservation',
          error: null,
        });
      }
      const updatedReservation = await Reservation.findByIdAndUpdate(
        reservation._id,
        {
          reservationStatus: status,
          reason: reason && reason,
        },
        { new: true, runValidators: true },
      );
      return res.status(200).send({
        data: updatedReservation,
        message: 'reservation updated successfully',
        error: null,
      });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

export default {
  AddReservation,
  GetReservation,
  CancelReservation,
  changeReservationStatus,
  GetReservationForUser,
};
