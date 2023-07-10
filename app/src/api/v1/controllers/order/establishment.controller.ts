import { getListOfCuisinesFiltered } from '../../helpers/Cuisines/getListOfAllCuisines';
import { Response, Request } from 'express';
import { getIdfromAuth } from '../../helpers/jwthelpers';
import { convertStringToId } from '../../helpers/mongodbHelper';
import { getUserRole } from '../../helpers/users';
import { IResponse } from '../../interfaces';
import { IEstablishment } from '../../interfaces/mongo/establishment';
import { formatWorkingHours } from '../../helpers/Cuisines';
import {
  Address,
  Cuisines,
  Establishment,
  Order,
  OrderCounters,
  OrderMenuItemsCounters,
  User,
} from '../../../config/mdb';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { stripe } from './payment';
import { Types } from 'mongoose';
import axios from 'axios';
import { verify } from 'jsonwebtoken';
const apiKey = process.env.GOOGLE_API_KEY;
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const addEstablishment = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  const userRole = await getUserRole(convertedId);
  try {
    const {
      address,
      delivery,
      isHalal,
      isKosher,
      isVegan,

      name,
      openHours,
      pictureBack,
      pictureFront,
      cuisineNames,
      vatNumber,
    } = req.body;

    const checkEstabLen = await Establishment.countDocuments({ owner: id });
    if (checkEstabLen !== 0)
      return res.status(403).send({
        message: `You already have ${checkEstabLen} Establishments`,
        data: null,
        error: null,
      });

    if (userRole === 'End User') {
      return res.status(403).send({
        message: `your role ${userRole} dont allow you to create establishment, you have to upgrade your plan first`,
        data: null,
        error: null,
      });
    }
    const newCuisines = cuisineNames.map((name: string) => name.toLowerCase());

    const cuisines = await Cuisines.find({ code: { $in: newCuisines } });
    const formatedAddress = {
      city: address?.city.toLowerCase(),
      country: address?.country.toLowerCase(),
      state: address?.state.toLowerCase(),
      postcode: address?.postcode.toLowerCase(),
      street: address?.street.toLowerCase(),
      buildingnumber: address?.buildingnumber.toLowerCase(),
    };

    const addressString =
      formatedAddress.country +
      ' ' +
      formatedAddress.state +
      ' ' +
      formatedAddress.city +
      ' ' +
      formatedAddress.postcode +
      ' ' +
      formatedAddress.street +
      ' ' +
      formatedAddress.buildingnumber;
    const location = await GetLocation(addressString);
    if (!location) throw new Error('problem with location');
    if (!vatNumber) {
      return res.status(403).send({
        message: `You have to provide a vat number`,
        data: null,
        error: null,
      });
    }
    const newAddress = await Address.create(formatedAddress);
    const estabType = (
      userRole: 'Food trucks' | 'Restaurant' | 'Local Cook' | 'Shop' | 'Student' | undefined,
    ): 'shop' | 'restaurant' | 'foodtruck' | 'localCook' | undefined => {
      if (userRole === 'Food trucks') return 'foodtruck';
      else if (userRole === 'Restaurant') return 'restaurant';
      else if (userRole === 'Local Cook') return 'localCook';
      else if (userRole === 'Shop') return 'shop';
      else if (userRole === 'Student') return 'localCook';
    };
    const newEstablishment = await Establishment.create({
      type: estabType(userRole),
      address: newAddress._id,
      delivery,
      isHalal,
      isKosher,
      isVegan,
      location: location && { coordinates: [location.lat, location.lng] },
      name: name.toLowerCase(),
      openHours: formatWorkingHours(openHours),
      pictureBack,
      pictureFront,
      owner: convertedId,
      cuisine: cuisines,
      vatNumber,
    });

    const orderCounter = await OrderCounters.create({ relatedId: newEstablishment?._id });

    const safedEstablishment = await Establishment.findOneAndUpdate(
      { _id: newEstablishment._id },
      { counter: orderCounter?._id },
      { new: true },
    )
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

    await User.findByIdAndUpdate(id, { $push: { establishment: newEstablishment?._id } }, { new: true });

    res.status(200).send({
      message: 'succesfully added establishment',
      data: safedEstablishment,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: 'there was an error creating establishment',
      data: null,
      error: error,
    });
  }
};

const editEstablishmentVatNumber = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);

  const establishmentId = req.params.establishmentId;
  try {
    const { taxPercentage } = req.body;
    if (typeof taxPercentage !== 'number') {
      throw new Error('tax percentage must be number');
    }

    const owner = await User.findById(convertedId);
    if (!owner) {
      return res.status(400).send({
        message: 'Not valid owner ',
        data: null,
        error: null,
      });
    } else {
      const establishment = await Establishment.findByIdAndUpdate(
        establishmentId,
        { taxPercentage: taxPercentage },
        { new: true, runValidators: true },
      )
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

      if (!establishment) {
        throw new Error('not found this establishment');
      }
      return res.status(200).send({
        message: 'succesfully edited establishment',
        data: establishment,
        error: null,
      });
    }
  } catch (error: any) {
    return res.status(500).send({
      message: error.message,
      data: null,
      error: JSON.stringify(error),
    });
  }
};
const editEstablishment = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  const userRole = await getUserRole(convertedId);

  const establishmentId = req.params.establishmentId;
  try {
    const {
      type,
      address,
      delivery,
      isHalal,
      isKosher,
      isVegan,
      location,
      name,
      pictureBack,
      pictureFront,
      cuisineNames,
      currency,
      vatNumber,
      accountNumber,
    } = req.body;

    const owner = await User.findById(convertedId);
    if (!owner) {
      return res.status(400).send({
        message: 'Not valid owner ',
        data: null,
        error: null,
      });
    } else {
      if (vatNumber && accountNumber) {
        if (address) {
          const account = stripe.accounts
            .create({
              type: 'standard',
              country: 'US',
              email: 'john@example.com',
            })
            .then((account) => {
              return account;
            })
            .catch((error) => {
              throw new Error(`Error creating account: ${error.message}`);
            });

          return res.status(200).json({ data: account });
        }
      }
    }

    // const cuisines = await Promise.all(
    //   cuisineNames.map(async (name: string) => {
    //     const cuisine = await Cuisines.findOne({ code: name });
    //     return cuisine?._id;
    //   }),
    // );
    // const check = await Establishment.findById(establishmentId);
    // if (check?.owner.toString() !== convertedId?.toString())
    //   return res.status(401).send({
    //     message: 'you are not an owner of this establishment',
    //     data: null,
    //     error: null,
    //   });

    // const addressId = check?.address;

    // const formatedAddress = {
    //   city: address?.city.toLowerCase(),
    //   country: address?.country.toLowerCase(),
    //   state: address?.state.toLowerCase(),
    //   postcode: address?.postcode.toLowerCase(),
    //   street: address?.street.toLowerCase(),
    //   buildingnumber: address?.buildingnumber.toLowerCase(),
    // };

    // await Address.findByIdAndUpdate(addressId, formatedAddress);
    // await Establishment.findByIdAndUpdate(establishmentId, {
    //   type: type,
    //   delivery,
    //   isHalal,
    //   isKosher,
    //   isVegan,
    //   location: { coordinates: [location.latitude, location.longatitude] },
    //   name: name.toLowerCase(),
    //   pictureBack,
    //   pictureFront,
    //   owner: convertedId,
    //   cuisine: cuisines,
    //   currency: currency.toLowerCase(),
    // }).catch((err) => {
    //   return res.status(500).send({
    //     message: 'there was an error editing establishment',
    //     data: null,
    //     error: err,
    //   });
    // });
    // const newEstablishment = await Establishment.findById(establishmentId)
    //   .populate('cuisine')
    //   .populate('menu')
    //   .populate('reservations')
    //   .populate('image')
    //   .populate('assortment')
    //   .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } })
    //   .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } })
    //   .populate('address')
    //   .populate('counter')
    //   .exec();
    res.status(200).send({
      message: 'succesfully edited establishment',
      // data: newEstablishment,
      error: null,
    });
  } catch (error) {
    res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const GetLikedOnesEstablishment = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const id = verify(token, jwtSecret)?.sub;

  const likedCounters = await OrderCounters.find({ whoLike: { $in: [id] } });
  const likedEstablishmentsId = likedCounters?.map((counter) => counter.relatedId);
  const likedEstablishment = await Establishment.find({ _id: { $in: likedEstablishmentsId } })
    .populate('cuisine') //
    .populate({
      path: 'menu',
      populate: {
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: { path: 'dishIngredients', model: 'EstablishmentMenuItemsIngredients' },
      },
    }) //
    .populate({
      path: 'menu',
      populate: {
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: { path: 'image', model: 'ImagesCommon' },
      },
    }) //
    .populate('reservations') //
    .populate('image') //
    .populate('assortment') //
    .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } }) //
    .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } }) //
    .populate('address')
    .populate('counter')
    .exec();
  // const likedEstablishment = await RecipeCounters.find({ whoLike: { $in: [id] } }).

  return res.status(200).send({
    data: likedEstablishment,
    message: 'found successfully',
    error: null,
  });
};

const editEstablishmentAddress = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  const establishmentId = req.params.establishmentId;
  try {
    const { city, country, state, postcode, street, buildingnumber } = req.body;

    const establishmentCheck = await Establishment.findOne({ _id: establishmentId, owner: id });
    if (!establishmentCheck) {
      return res.status(403).send({
        message: 'You are not allowed to change this establishment',
        data: null,
        error: null,
      });
    }

    const addressId = establishmentCheck?.address;

    const formatedAddress = {
      city: city.toLowerCase(),
      country: country.toLowerCase(),
      state: state.toLowerCase(),
      postcode: postcode.toLowerCase(),
      street: street.toLowerCase(),
      buildingnumber: buildingnumber.toLowerCase(),
    };

    await Address.findByIdAndUpdate(addressId, formatedAddress);

    const addressString =
      formatedAddress.country +
      ' ' +
      formatedAddress.state +
      ' ' +
      formatedAddress.city +
      ' ' +
      formatedAddress.postcode +
      ' ' +
      formatedAddress.street +
      ' ' +
      formatedAddress.buildingnumber;
    const location = await GetLocation(addressString);

    const newEstablishment = await Establishment.findByIdAndUpdate(
      establishmentId,
      {
        location: location && { coordinates: [location.lng, location.lat] },
      },
      { new: true },
    )
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
    res.status(200).send({
      message: 'succesfully edited establishment',
      data: newEstablishment,
      error: null,
    });
  } catch (error) {
    res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const getEstablishment = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);

  const establishmentId = req.params.establishmentId;
  try {
    await Establishment.findById(establishmentId).catch((err) => {
      return res.status(500).send({
        message: 'there was an error editing establishment',
        data: null,
        error: err,
      });
    });
    const EstablishmentById = await Establishment.findById(establishmentId)
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
    return res.status(200).send({
      message: 'succesfully edited establishment',
      data: EstablishmentById,
      error: null,
    });
  } catch (error) {
    res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};
const getFavouritesEstablishment = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const counters = await OrderCounters.find({
      whoLike: { $in: [id] },
    });

    return res.status(200).send({
      message: 'succesfully edited establishment',
      data: counters,
      error: null,
    });
  } catch (error) {
    res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const GetFavouritesMenuItems = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const counters = await OrderMenuItemsCounters.find({
      whoLike: { $in: [id] },
    });

    return res.status(200).send({
      message: 'succesfully edited establishment',
      data: counters,
      error: null,
    });
  } catch (error) {
    res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const deleteEstablishment = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  const establishmentId = req.params.establishmentId;
  try {
    const check = await Establishment.findById(establishmentId);
    if (check?.owner.toString() !== id) {
      return res.status(403).send({
        message: 'you are not an owner of this establishment',
        data: null,
        error: null,
      });
    }
    const EstablishmentById = await Establishment.findByIdAndDelete(establishmentId);
    res.status(200).send({
      message: 'succesfully deleted establishment',
      data: establishmentId,
      error: null,
    });
  } catch (error) {
    res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const editEstablishmentWorkingHours = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  const userRole = await getUserRole(convertedId);

  const establishmentId = req.params.establishmentId;
  try {
    const { openHours }: IEstablishment = req.body;

    if (userRole === 'End User' || userRole === 'Student') {
      return res.status(401).send({
        message: `your role ${userRole} dont allow you to create establishment, you have to upgrade your plan first`,
        data: null,
        error: null,
      });
    }

    const check = await Establishment.findById(establishmentId);
    if (check?.owner.toString() !== convertedId?.toString())
      return res.status(401).send({
        message: 'you are not an owner of this establishment',
        data: null,
        error: null,
      });
    await Establishment.findByIdAndUpdate(establishmentId, {
      openHours: formatWorkingHours(openHours),
    });
    const newEstablishment = await Establishment.findById(establishmentId)
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
    res.status(200).send({
      message: 'succesfully edited establishment',
      data: newEstablishment,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const filterEstablisshment = async (req: Request, res: IResponse) => {
  const {
    _id,
    city, //
    country, //
    cuisine, //
    buildingnumber, //
    postcode, //
    street, //
    state, //
    isHalal, //
    isVegan, //
    isKosher, //
    type, //
    lat, //
    long, //
    distance = 5, //
  } = req.query;

  try {
    let cuisinesId;
    if (cuisine) {
      cuisinesId = await getListOfCuisinesFiltered(cuisine.toString());
    }

    if (typeof lat === 'string' && typeof long === 'string') {
      let calculatedDistance = 0;
      if (distance && typeof distance === 'string') calculatedDistance = parseFloat(distance) * 1000;
      else calculatedDistance = 5000;

      let matchObject: {
        type?: string;
        isKosher?: string;
        isHalal?: string;
        isVegan?: string;
        cuisine?: string;
        _id?: Types.ObjectId;
      } = {};
      if (type && typeof type === 'string') matchObject['type'] = type;
      if (isKosher && typeof isKosher === 'string') matchObject['isKosher'] = isKosher;
      if (isHalal && typeof isHalal === 'string') matchObject['isHalal'] = isHalal;
      if (isVegan && typeof isVegan === 'string') matchObject['isVegan'] = isVegan;
      if (cuisine && typeof cuisine === 'string') matchObject['cuisine'] = cuisine;
      if (_id && typeof _id === 'string') matchObject['_id'] = new Types.ObjectId(_id);

      const near = await Establishment.aggregate([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [parseFloat(long), parseFloat(lat)] },
            key: 'location',
            distanceField: 'dist.calculated',
            maxDistance: distance ? calculatedDistance : 5000,
            minDistance: 0,
            spherical: true,
          },
        },
        {
          $match: matchObject,
        },
        // { $limit: 5 },
      ]);
      const allIds = near.map((item) => item._id);

      const establishmentFound = await Establishment.find({
        _id: { $in: allIds },
      })
        .populate('cuisine') //
        .populate({
          path: 'menu',
          populate: {
            path: 'menuItems',
            model: 'EstablishmentMenuItems',
            populate: { path: 'dishIngredients', model: 'EstablishmentMenuItemsIngredients' },
          },
        }) //
        .populate({
          path: 'menu',
          populate: {
            path: 'menuItems',
            model: 'EstablishmentMenuItems',
            populate: { path: 'image', model: 'ImagesCommon' },
          },
        }) //
        .populate('reservations') //
        .populate('image') //
        .populate('assortment') //
        .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } }) //
        .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } }) //
        .populate('address')
        .populate('counter')
        .exec();

      return res.status(200).send({
        message: 'geou near found establishment',
        data: establishmentFound,
        error: null,
      });
    } else {
      const establishmentFound = await Establishment.find({
        type: type ? type : { $exists: true },
        isKosher: isKosher ? isKosher : { $exists: true },
        isHalal: isHalal ? isHalal : { $exists: true },
        isVegan: isVegan ? isVegan : { $exists: true },
        cuisine: cuisine ? { $in: cuisinesId } : { $exists: true },
        'addres.city': city ? city : { $exists: true },
        'addres.country': country ? country : { $exists: true },
        'addres.street': street ? street : { $exists: true },
        'addres.postcode': postcode ? postcode : { $exists: true },
        'addres.buildingnumber': buildingnumber ? buildingnumber : { $exists: true },
        _id: _id ? _id : { $exists: true },
      })
        .populate('cuisine') //
        .populate({
          path: 'menu',
          populate: {
            path: 'menuItems',
            model: 'EstablishmentMenuItems',
            populate: { path: 'dishIngredients', model: 'EstablishmentMenuItemsIngredients' },
          },
        }) //
        .populate({
          path: 'menu',
          populate: {
            path: 'menuItems',
            model: 'EstablishmentMenuItems',
            populate: { path: 'image', model: 'ImagesCommon' },
          },
        }) //
        .populate('reservations') //
        .populate('image') //
        .populate('assortment') //
        .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } }) //
        .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } }) //
        .populate('address')
        .populate('counter')
        .exec();

      return res.status(200).send({
        message: 'succesfully found establishment',
        data: establishmentFound,
        error: null,
      });
    }
  } catch (error) {
    return res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const addMenuItemList = async (req: Request, res: IResponse) => {
  try {
  } catch (error) {
    return res.status(500).send({
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const AddPhotoToEstablishmentMain = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const files = req.imageFront;
    const filesBack = req.imageBack;
    if (!files && !filesBack) return res.status(400).send({ data: null, message: 'image added', error: null });
    res.status(200).send({ data: { files, filesBack }, message: 'Image added successfully', error: null });
  } catch (error) {
    return res.status(500).send({ data: null, message: 'there was an error while adding the recipe', error: error });
  }
};

const AddLike = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  try {
    // /////////////////////////////////////////////////////
    const { establishmentId } = req.params;
    const establishment = await Establishment.findById(establishmentId);

    if (!establishment) {
      return res.status(404).send({
        data: null,
        message: 'Establishment not found',
        error: null,
      });
    } else {
      if (!establishment.counter) {
        const newEstablishmentCounter = await OrderCounters.create({ relatedId: establishment._id });
        await Establishment.findByIdAndUpdate(establishment._id, {
          counter: newEstablishmentCounter._id,
          relatedId: establishment._id,
        });
      }
      const counterFromDb = await OrderCounters.findById(establishment.counter);

      const checkIfYouLikeThisEstablishment = counterFromDb?.whoLike.some((list) => list.toString() === id);
      if (counterFromDb) {
        const whoLike = counterFromDb.whoLike;
        if (checkIfYouLikeThisEstablishment === false && counterFromDb) {
          //
          if (convertedId)
            await OrderCounters.findByIdAndUpdate(
              counterFromDb?._id,
              {
                relatedId: establishment._id,
                $inc: { numberOfLikes: 1 },
                whoLike: [...whoLike, id],
              },
              { new: true },
            );
          //
        } else {
          if (counterFromDb) {
            const deletedUserFromLikes = whoLike.filter((user) => user.toString() !== id);
            await OrderCounters.findByIdAndUpdate(
              counterFromDb?._id,
              {
                relatedId: establishment._id,
                $inc: { numberOfLikes: -1 },
                whoLike: deletedUserFromLikes,
              },
              { new: true },
            );
          }
        }
      }

      const newEstablishment = await Establishment.findById(establishmentId)
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

      res.status(200).send({
        data: newEstablishment,
        message: 'Like added successfully',
        error: null,
      });
    }
  } catch (error: any) {
    console.error(error.message);
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the establishment',
      error: error,
    });
  }
};

const AddShare = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  try {
    const { establishmentId } = req.params;
    const establishment = await Establishment.findById(establishmentId);

    if (!establishment) {
      return res.status(404).send({
        data: null,
        message: 'Establishment not found',
        error: null,
      });
    } else {
      if (!establishment.counter) {
        const newEstablishmentCounter = await OrderCounters.create({});
        await Establishment.findByIdAndUpdate(establishment._id, { counter: newEstablishmentCounter._id });
      }
      const counterFromDb = await OrderCounters.findById(establishment.counter);

      const checkIfYouLikeThisEstablishment = counterFromDb?.whoShare.some((list) => list.toString() === id);
      if (counterFromDb) {
        const whoShare = counterFromDb.whoShare;
        if (checkIfYouLikeThisEstablishment === false && counterFromDb) {
          //
          if (convertedId)
            await OrderCounters.findByIdAndUpdate(counterFromDb?._id, {
              $inc: { numberOfShares: 1 },
              whoShare: [...whoShare, id],
            });
          //
        } else {
          if (counterFromDb) {
            await OrderCounters.findByIdAndUpdate(counterFromDb?._id, {
              $inc: { numberOfShares: 1 },
            });
          }
        }
      }
      const counterFromDbres = await OrderCounters.findById(establishment.counter);

      res.status(200).send({
        data: { establishmentId: establishment._id, counterFromDbres },
        message: 'Like added successfully',
        error: null,
      });
    }
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the establishment',
      error: error,
    });
  }
};
const AddClick = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  try {
    const { establishmentId } = req.params;
    const establishment = await Establishment.findById(establishmentId);

    if (!establishment) {
      return res.status(404).send({
        data: null,
        message: 'Establishment not found',
        error: null,
      });
    } else {
      if (!establishment.counter) {
        const newEstablishmentCounter = await OrderCounters.create({});
        await Establishment.findByIdAndUpdate(establishment._id, { counter: newEstablishmentCounter._id });
      }
      const counterFromDb = await OrderCounters.findById(establishment.counter);

      if (counterFromDb && counterFromDb && convertedId) {
        await OrderCounters.findByIdAndUpdate(counterFromDb?._id, {
          $inc: { numberOfClicks: 1 },
        });
      }
      const counterFromDbres = await OrderCounters.findById(establishment.counter);

      res.status(200).send({
        data: { establishmentId: establishment._id, counterFromDbres },
        message: 'Like added successfully',
        error: null,
      });
    }
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the establishment',
      error: error,
    });
  }
};
const getLatLongByAddress = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  try {
    const { addressString } = req.params;

    const geolocation = await GetLocation(addressString);

    return res.status(200).send({
      data: geolocation,
      message: 'message',
      error: null,
    });
  } catch (error: any) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the establishment',
      error: error.message,
    });
  }
};

export default {
  getLatLongByAddress,
  addEstablishment,
  getEstablishment,
  editEstablishment,
  deleteEstablishment,
  editEstablishmentWorkingHours,
  filterEstablisshment,
  addMenuItemList,
  AddPhotoToEstablishmentMain,
  editEstablishmentAddress,
  AddLike,
  AddShare,
  AddClick,
  GetFavouritesMenuItems,
  getFavouritesEstablishment,
  GetLikedOnesEstablishment,
  editEstablishmentVatNumber,
};

async function GetLocation(AddressString: string): Promise<{ lat: string; lng: string } | undefined> {
  if (typeof AddressString === 'string') {
    const replecedString = replacePolishLetters(AddressString);
    console.log(replecedString);

    const apiUrl: string = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      replecedString,
    )}&key=${apiKey}`;

    const test = await axios
      .get(apiUrl)
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.log(error.response.data);
        throw new Error('Error retrieving data');
      });

    const geolocation = test.results[0].geometry.location;
    return geolocation;
  }
}

function replacePolishLetters(strings: string) {
  const polishLetters = /[ąćęłńóśźż]/g; // Regular expression for Polish letters
  const replacements = {
    ą: 'a',
    ć: 'c',
    ę: 'e',
    ł: 'l',
    ń: 'n',
    ó: 'o',
    ś: 's',
    ź: 'z',
    ż: 'z',
  }; // Object with replacement characters for each Polish letter

  // Loop through each string in the array and replace all Polish letters with the corresponding replacement character
  return [...strings]
    .map((string: string) => {
      // @ts-ignore
      return string.replace(polishLetters, (match) => replacements[match]);
    })
    .join('')
    .replace('/', ' ');
}
