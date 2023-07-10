import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import { Establishment, EstablishmentAssortment } from '../../../config/mdb';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { IAssertment } from '../../models/Order/assortmentSchema';
import { convertRatingToTotal } from '../Rating';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

//core
const addEstablishmentAssortment = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const initialCounter = {
    numberOfClicks: 0,
    numberOfShares: 0,
    numberOfLikes: 0,
    whoLike: [],
    whoShare: [],
  };
  const initialRate = {
    one: 0,
    two: 0,
    three: 0,
    four: 0,
    five: 0,
  };
  const token = req.headers.authorization.split(' ')[1];
  const { productName, description, category, price, currency, countryOfOrigin, subCategory }: IAssertment = req.body;
  const establishmentId = req.params.establishmentId;

  try {
    const decoded = verify(token, jwtSecret);
    const id = decoded?.sub;

    const establishment = await Establishment.findById(establishmentId);
    if (!establishment) {
      return res.status(400).send({
        data: null,
        message: 'establishment not found',
        error: null,
      });
    }
    if (id && typeof id === 'string') {
      if (establishment?.owner.toString() !== id.toString()) {
        return res.status(400).send({
          data: null,
          message: 'you are not allowed to edit this establishment',
          error: null,
        });
      }
      //
    }
    if (establishment?.type !== 'shop') {
      return res.status(400).send({
        data: null,
        message: 'you cant add assortment to establishment different than shop',
        error: null,
      });
    }
    const newAssortment = await EstablishmentAssortment.create({
      productName,
      description,
      category,
      countryOfOrigin,
      price,
      currency,
      subCategory,
      rating: initialRate,
      counter: initialCounter,
    });

    const updateEstablishment = await Establishment.findByIdAndUpdate(
      establishmentId,
      {
        $push: { assortment: newAssortment._id },
      },
      { new: true, runValidators: true },
    ).populate('assortment');

    res.status(200).send({
      data: updateEstablishment?.assortment,
      message: 'establishment assortment added successfully',
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

const deleteEstablishmentAssortment = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const { establishmentId, assortmentId } = req.params;

  try {
    const decoded = verify(token, jwtSecret);
    const id = decoded?.sub;

    const establishment = await Establishment.findById(establishmentId);
    if (!establishment) {
      return res.status(400).send({
        data: null,
        message: 'establishment not found',
        error: null,
      });
    }
    if (id && typeof id === 'string') {
      if (establishment?.owner.toString() !== id.toString()) {
        return res.status(400).send({
          data: null,
          message: 'you are not allowed to edit this establishment',
          error: null,
        });
      }
      //
    }
    if (establishment?.type !== 'shop') {
      return res.status(400).send({
        data: null,
        message: 'you cant add assortment to establishment different than shop',
        error: null,
      });
    }
    await EstablishmentAssortment.findByIdAndDelete(assortmentId);
    const updatedEstablishment = await Establishment.findByIdAndUpdate(
      establishmentId,
      {
        $pull: {
          assortment: assortmentId,
        },
      },
      { new: true },
    ).populate('assortment');

    res.status(200).send({
      data: updatedEstablishment?.assortment,
      message: 'establishment assortment deleted successfully',
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

const editEstablishmentAssortment = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const { productName, description, category, countryOfOrigin, subCategory, price, currency }: IAssertment = req.body;
  const { establishmentId, assortmentId } = req.params;

  try {
    const decoded = verify(token, jwtSecret);
    const id = decoded?.sub;

    const establishment = await Establishment.findById(establishmentId);
    if (!establishment) {
      return res.status(400).send({
        data: null,
        message: 'establishment not found',
        error: null,
      });
    }
    if (id && typeof id === 'string') {
      if (establishment?.owner.toString() !== id.toString()) {
        return res.status(400).send({
          data: null,
          message: 'you are not allowed to edit this establishment',
          error: null,
        });
      }
      //
    }
    if (establishment?.type !== 'shop') {
      return res.status(400).send({
        data: null,
        message: 'you cant add assortment to establishment different than shop',
        error: null,
      });
    }
    const newAssortment = await EstablishmentAssortment.findByIdAndUpdate(
      assortmentId,
      {
        productName,
        description,
        category,
        countryOfOrigin,
        subCategory,
        price,
        currency,
      },
      { new: true, runValidators: true },
    );

    res.status(200).send({
      data: newAssortment,
      message: 'establishment assortment updated successfully',
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

const getEstablishmentAssortment = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];

  const { establishmentId } = req.params;

  try {
    const decoded = verify(token, jwtSecret);
    const id = decoded?.sub;

    const establishment = await Establishment.findById(establishmentId).populate('assortment');
    if (!establishment) {
      return res.status(400).send({
        data: null,
        message: 'establishment not found',
        error: null,
      });
    }
    if (id && typeof id === 'string') {
      if (establishment?.owner.toString() !== id.toString()) {
        return res.status(400).send({
          data: null,
          message: 'you are not allowed to edit this establishment',
          error: null,
        });
      }
      //
    }

    res.status(200).send({
      data: establishment.assortment,
      message: 'establishment assortment updated successfully',
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

//rating
const rateAssortments = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const { establishmentId, assortmentId } = req.params;
  const rating = req.body.rating;
  if (!rating) {
    return res.status(400).send({
      data: null,
      message: 'bad request',
      error: null,
    });
  }

  try {
    const check = await Establishment.findById(establishmentId);

    if (!check) {
      return res.status(400).send({
        data: null,
        message: 'establishment not found',
        error: null,
      });
    }

    const getQuery = (rating: number) => {
      switch (rating) {
        case 1:
          return { ['rating.one']: 1 };
        case 2:
          return { ['rating.two']: 1 };
        case 3:
          return { ['rating.three']: 1 };
        case 4:
          return { ['rating.four']: 1 };
        case 5:
          return { ['rating.five']: 1 };

        default:
          return {};
      }
    };
    const newEstablishmentRate = await EstablishmentAssortment.findByIdAndUpdate(
      assortmentId,
      { $inc: getQuery(rating) },
      { new: true },
    );

    if (newEstablishmentRate) {
      const finalRating = convertRatingToTotal(newEstablishmentRate?.rating);
      return res.status(200).send({ data: finalRating, message: 'final Rating', error: null });
    } else {
      return res.status(400).send({ data: null, message: 'something went wrong', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};
const getEstablishmentAssortmentRate = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const { establishmentId, assortmentId } = req.params;
  try {
    const check = await Establishment.findById(establishmentId)
      .populate('cuisine')
      .populate('menu')
      .populate('reservations')
      .populate('image')
      .populate('assortment')
      .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } })
      .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } })
      .populate('address')
      .populate('counter')
      .exec();

    if (!check) {
      return res.status(400).send({
        data: null,
        message: 'establishment not found',
        error: null,
      });
    }

    const newEstablishmentRate = await EstablishmentAssortment.findById(assortmentId);

    if (newEstablishmentRate) {
      const finalRating = convertRatingToTotal(newEstablishmentRate?.rating);
      return res.status(200).send({ data: finalRating, message: 'final Rating', error: null });
    } else {
      return res.status(400).send({ data: null, message: 'something went wrong', error: null });
    }
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: error.message,
      error: error,
    });
  }
};

//likes

const AddLike = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { establishmentId, assortmentId } = req.params;
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  try {
    const id = decoded.sub?.toString();

    const assortment = await EstablishmentAssortment.findById(assortmentId);

    if (!assortment) {
      return res.status(404).send({
        data: null,
        message: 'Assortment not found',
        error: null,
      });
    } else {
      const establishmentAssortmentWithLike = await EstablishmentAssortment.findOne({
        _id: assortmentId,
        ['counter.whoLike']: id,
      });

      const whoLike = [...assortment.counter.whoLike];
      const removedUserIds = whoLike.filter((singleId) => singleId.toString() !== id);
      if (establishmentAssortmentWithLike) {
        await EstablishmentAssortment.findByIdAndUpdate(assortment._id, {
          ['counter.whoLike']: removedUserIds,
          $inc: { 'counter.numberOfLikes': -1 },
        });
      } else {
        await EstablishmentAssortment.findByIdAndUpdate(assortment._id, {
          $inc: { 'counter.numberOfLikes': 1 },
          ['counter.whoLike']: [...whoLike, id],
        });
      }
    }

    const resCounter = await EstablishmentAssortment.findById(assortmentId);

    res.status(200).send({ data: resCounter, message: 'Like added successfully', error: null });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the recipe',
      error: error,
    });
  }
};

const AddShare = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { establishmentId, assortmentId } = req.params;
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  try {
    const id = decoded.sub?.toString();

    const assortment = await EstablishmentAssortment.findById(assortmentId);

    if (!assortment) {
      return res.status(404).send({
        data: null,
        message: 'Assortment not found',
        error: null,
      });
    } else {
      const establishmentAssortmentWithShare = await EstablishmentAssortment.findOne({
        _id: assortmentId,
        ['counter.whoShare']: id,
      });

      const whoShare = [...assortment.counter.whoShare];
      if (establishmentAssortmentWithShare) {
        await EstablishmentAssortment.findByIdAndUpdate(assortment._id, {
          $inc: { 'counter.numberOfShares': 1 },
        });
      } else {
        await EstablishmentAssortment.findByIdAndUpdate(assortment._id, {
          $inc: { 'counter.numberOfShares': 1 },
          ['counter.whoShare']: [...whoShare, id],
        });
      }
    }

    const resCounter = await EstablishmentAssortment.findById(assortmentId);

    res.status(200).send({ data: resCounter, message: 'Like added successfully', error: null });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the recipe',
      error: error,
    });
  }
};
const AddClick = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const { assortmentId } = req.params;
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  try {
    const assortment = await EstablishmentAssortment.findById(assortmentId);

    if (!assortment) {
      return res.status(404).send({
        data: null,
        message: 'Assortment not found',
        error: null,
      });
    } else {
      await EstablishmentAssortment.findByIdAndUpdate(assortment._id, {
        $inc: { 'counter.numberOfClicks': 1 },
      });
    }

    const resCounter = await EstablishmentAssortment.findById(assortmentId);

    res.status(200).send({ data: resCounter, message: 'Like added successfully', error: null });
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the recipe',
      error: error,
    });
  }
};

export default {
  addEstablishmentAssortment,
  editEstablishmentAssortment,
  getEstablishmentAssortment,
  deleteEstablishmentAssortment,
  rateAssortments,
  getEstablishmentAssortmentRate,
  AddLike,
  AddShare,
  AddClick,
};
