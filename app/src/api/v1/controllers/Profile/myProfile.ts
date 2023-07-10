import { Response } from 'express';
import { verify } from 'jsonwebtoken';
import { Address, Allergies, Cuisines, Establishment, OrderCounters, User } from '../../../config/mdb';
import { formatWorkingHours } from '../../helpers/Cuisines';
import { getIdfromAuth } from '../../helpers/jwthelpers';
import { IResponse } from '../../interfaces';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { IAddress } from '../../models/Order';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const GetMyProfileController = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  try {
    if (id && typeof id === 'string') {
      const user = await User.findById(id)
        .populate('address')
        .populate('allergies')
        .populate('documentImages')
        .populate({ path: 'jobs', populate: [] })
        .populate('images.profileImage')
        .populate('images.backgroundImage')
        .populate('establishment')
        .populate({
          path: 'jobs',
          populate: {
            path: 'workPlace',
            populate: {
              path: 'owner',
              populate: [
                { path: 'address' },
                { path: 'allergies' },
                { path: 'documentImages' },
                { path: 'jobs' },
                { path: 'images.profileImage' },
                { path: 'images.backgroundImage' },
                { path: 'establishment' },
                { path: 'establishment', populate: { path: 'cuisine' } },
                {
                  path: 'establishment',
                  populate: {
                    path: 'menu',
                    populate: {
                      path: 'menuItems',
                      model: 'EstablishmentMenuItems',
                      populate: { path: 'image', model: 'ImagesCommon' },
                    },
                  },
                },
                { path: 'establishment', populate: { path: 'reservations' } },
                { path: 'establishment', populate: { path: 'image' } },
                { path: 'establishment', populate: { path: 'assortment' } },
                { path: 'establishment', populate: { path: 'address' } },
              ],
            },
          },
        })
        .populate('establishment.cuisine')
        .populate('establishment.menu')
        .populate('establishment.reservations')
        .populate('establishment.image')
        .populate('establishment.assortment')
        .populate('establishment.owner')
        .populate('establishment.address')
        .exec();
      if (!user) {
        return res.status(404).send({
          status: 'failure',
          data: null,
          message: 'user not found',
          error: null,
        });
      }
      res.status(200).send({ status: 'success', data: user, message: '', error: null });
    } else {
      return res.status(400).send({
        status: 'failure',
        data: null,
        message: 'unexpected error',
        error: null,
      });
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
//TODO: update user data

const UploadImageToProfile = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { backgroundImage, profileImage } = req;

    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    const id = decoded.sub;
    const user = await User.findById(id)
      .populate('address')
      .populate('allergies')
      .populate('documentImages')
      .populate('jobs')
      .populate('images.profileImage')
      .populate('images.backgroundImage')
      .populate('establishment')
      .populate({ path: 'jobs', populate: { path: 'workPlace' } })
      .populate('establishment.allergies')
      .populate('establishment.cuisine')
      .populate('establishment.menu')
      .populate('establishment.reservations')
      .populate('establishment.image')
      .populate('establishment.assortment')
      .exec();

    return res.status(200).send({
      status: 'success',
      data: user?.images,
      message: 'document image added successfully',
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

const EditMyProfileController = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;

  const { first_name, last_name, email, name, phone_number, birth_year } = req.body;
  try {
    if (id && typeof id === 'string') {
      const userToUpdate = await User.findById(id);

      const user = await User.findByIdAndUpdate(
        id,
        {
          first_name: first_name ? first_name : userToUpdate?.first_name,
          last_name: last_name ? last_name : userToUpdate?.last_name,
          email: email ? email : userToUpdate?.email,
          name: name ? name : userToUpdate?.name,
          phone_number: phone_number ? phone_number : userToUpdate?.phone_number,
          birth_year: birth_year ? birth_year : userToUpdate?.birth_year,
        },
        { new: true, runValidators: true },
      )
        .populate('address')
        .populate('allergies')
        .populate('documentImages')
        .populate('jobs')
        .populate('images.profileImage')
        .populate('images.backgroundImage')
        .populate('establishment')
        .populate({ path: 'jobs', populate: { path: 'workPlace' } })
        .populate('establishment.cuisine')
        .populate('establishment.menu')
        .populate('establishment.reservations')
        .populate('establishment.image')
        .populate('establishment.assortment')
        .populate('establishment.address')
        .exec();
      if (!user) {
        return res.status(404).send({
          status: 'failure',
          data: null,
          message: 'user not found',
          error: null,
        });
      }
      res.status(200).send({ status: 'success', data: user, message: '', error: null });
    } else {
      return res.status(400).send({
        status: 'failure',
        data: null,
        message: 'unexpected error',
        error: null,
      });
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
const EditMyProfileAddressController = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;

  const { addressId, userId } = req.params;
  if (!req.body.address)
    return res.status(500).send({
      status: 'failure',
      data: null,
      message: 'no address specified',
      error: null,
    });
  const { country, city, state, street, buildingnumber, postcode }: IAddress = req.body.address;
  try {
    if (id && typeof id === 'string') {
      const address = await Address.findById(id);

      await Address.findByIdAndUpdate(
        addressId,
        {
          country: country ? country : address?.country,
          city: city ? city : address?.city,
          state: state ? state : address?.state,
          street: street ? street : address?.street,
          buildingnumber: buildingnumber ? buildingnumber : address?.buildingnumber,
          postcode: postcode ? postcode : address?.postcode,
        },
        { new: true, runValidators: true },
      );
      const userAddresses = await User.findById(userId).populate('address');
      if (!userAddresses) {
        return res.status(404).send({
          status: 'failure',
          data: null,
          message: 'user not found',
          error: null,
        });
      }
      res
        .status(200)
        .send({ status: 'success', data: userAddresses.address, message: 'address updated succesfully', error: null });
    } else {
      return res.status(400).send({
        status: 'failure',
        data: null,
        message: 'unexpected error',
        error: null,
      });
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

const GetMyEstablishmentController = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded.sub;
  try {
    if (id && typeof id === 'string') {
      const establishment = await Establishment.find({
        owner: id,
      })
        .populate('cuisine')
        .populate({
          path: 'menu',
          populate: {
            path: 'menuItems',
            populate: [
              {
                path: 'dishIngredients',
              },
              {
                path: 'allergens',
              },
              {
                path: 'counter',
              },
            ],
          },
        })

        .populate('reservations')
        .populate({ path: 'image' })
        .populate('assortment')

        .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } })
        .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } })
        .populate('address')
        .populate('tables')
        .populate('counter')
        .populate({
          path: 'workspace',
          populate: {
            path: 'employees',
            model: 'Job',
            populate: {
              path: 'workerId',
              model: 'User',
            },
          },
        })
        .exec();

      if (!establishment) {
        return res.status(404).send({
          status: 'failure',
          data: null,
          message: 'establishment not found',
          error: null,
        });
      }
      await Promise.all(
        establishment.map(async (singleEstablishment) => {
          if (!singleEstablishment.counter) {
            const orderCounter = await OrderCounters.create({ relatedId: singleEstablishment._id });
            await singleEstablishment.updateOne({ counter: orderCounter._id }, { new: true });
          }
        }),
      );
      res.status(200).send({ status: 'success', data: establishment, message: '', error: null });
    } else {
      return res.status(400).send({
        status: 'failure',
        data: null,
        message: 'unexpected error',
        error: null,
      });
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
const AddAddress = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const { country, state, city, street, buildingnumber, postcode }: Partial<IAddress> = req.body;
  console.log(req.params);
  try {
    if (!country || !state || !city || !street || !buildingnumber || !postcode) {
      throw new Error('At least one of parametres is missing');
    }
    if (id) {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      const newAddress = await Address.create({
        country,
        state,
        city,
        street,
        buildingnumber,
        postcode,
      });

      if (!newAddress) {
        throw new Error('Failed to create new address');
      }

      await user.updateOne(
        {
          $push: {
            address: newAddress._id,
          },
        },
        { new: true, runValidators: true },
      );
      console.log({ user: user.address });
      const updatedUser = await User.findById(id)
        .populate('address')
        .populate('allergies')
        .populate('documentImages')
        .populate('jobs')
        .populate('images.profileImage')
        .populate('images.backgroundImage')
        .populate('establishment')
        .populate({ path: 'jobs', populate: { path: 'workPlace' } })
        .populate('establishment.cuisine')
        .populate('establishment.menu')
        .populate('establishment.reservations')
        .populate('establishment.image')
        .populate('establishment.assortment')
        .populate('establishment.address')
        .exec();
      return res.status(200).send({
        status: 'success',
        message: 'Succesfully added new address',
        data: updatedUser,
        error: null,
      });
    }
  } catch (error: any) {
    return res.status(400).send({
      status: 'failure',
      message: 'there was an error adding address',
      data: null,
      error: error.message,
    });
  }
};

const UpdateMyEstablishmentPosition = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const { location } = req.body;
    if (!Array.isArray(location)) {
      return res.status(200).send({
        status: 'failure',
        message: 'location must be array',
        data: location,
        error: null,
      });
    }

    if (location.length !== 2) {
      return res.status(200).send({
        status: 'failure',
        message: 'location must have length of 2',
        data: null,
        error: null,
      });
    }
    const check = await Establishment.findOne({ owner: id });

    if (!check) {
      return res.status(404).send({ status: 'failure', data: null, message: 'establishment not found', error: null });
    }
    const formatedLocation = location.map((cord) => Number.parseFloat(cord));
    const establishmentUpdated = await Establishment.findByIdAndUpdate(
      check?._id,
      {
        location: { type: 'Point', coordinates: [formatedLocation[1], formatedLocation[0]] },
      },
      { new: true, runValidators: true },
    )
      .populate('cuisine')
      .populate({
        path: 'menu',
        model: 'EstablishmentMenu',
        strictPopulate: false,
        populate: { path: 'menuItems', model: 'EstablishmentMenuItems' },
      })
      .populate('reservations')
      .populate('image')
      .populate('assortment')
      .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } })

      .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } })
      .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } })
      .populate('address')
      .populate('tables')
      .populate({ path: 'counter', model: 'OrderCounters', strictPopulate: false })
      .populate({
        path: 'workspace',
        model: 'Workspace',
        populate: { path: 'establishmentId', model: 'Establishment' },
        strictPopulate: false,
      })
      .populate({
        path: 'workspace',
        populate: {
          path: 'employees',
          model: 'Job',
          populate: {
            path: 'workerId',
            model: 'User',
            populate: {
              path: 'orders',
              model: 'Order',
              strictPopulate: false,
            },
            strictPopulate: false,
          },
          strictPopulate: false,
        },
      })
      .exec();
    res.status(200).send({
      status: 'success',
      message: 'establishment updated successfully',
      data: establishmentUpdated,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 'failure',
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const UpdateMyEstablishment = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const { address, delivery, isHalal, isKosher, isVegan, location, name, openHours, cuisines } = req.body;

    const check = await Establishment.findOne({ owner: id });

    if (!check) {
      return res.status(404).send({ status: 'failure', data: null, message: 'establishment not found', error: null });
    }

    const formatedAddress = {
      city: address?.city.toLowerCase(),
      country: address?.country.toLowerCase(),
      state: address?.state.toLowerCase(),
      postcode: address?.postcode.toLowerCase(),
      street: address?.street.toLowerCase(),
      buildingnumber: address?.buildingnumber.toLowerCase(),
    };
    const cuisinesMapper = await Promise.all(
      cuisines.map(async (name: string) => {
        const cuisine = await Cuisines.findOne({ code: name });
        return cuisine?._id.toString();
      }),
    );

    const establishmentUpdated = await Establishment.findByIdAndUpdate(
      check?._id,
      {
        address: address ? formatedAddress : check?.address,
        delivery: delivery ? delivery : check?.delivery,
        isHalal: isHalal ? isHalal : check?.isHalal,
        isKosher: isKosher ? isKosher : check?.isKosher,
        isVegan: isVegan ? isVegan : check?.isVegan,
        name: name ? name.toLowerCase() : check?.name,
        openHours: openHours ? formatWorkingHours(openHours) : check?.openHours,
        ['location.coordinates']: location ? location : check?.location.coordinates,
        cuisine: cuisines ? [...cuisinesMapper] : check?.cuisine,
      },
      { new: true, runValidators: true },
    )
      .populate('cuisine')
      .populate({
        path: 'menu',
        model: 'EstablishmentMenu',
        strictPopulate: false,
        populate: { path: 'menuItems', model: 'EstablishmentMenuItems' },
      })
      .populate('reservations')
      .populate('image')
      .populate('assortment')
      .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'profileImage' } } })
      .populate({ path: 'owner', populate: { path: 'images', populate: { path: 'backgroundImage' } } })
      .populate('address')
      .populate('tables')
      .populate({ path: 'counter', model: 'OrderCounters', strictPopulate: false })
      .populate({
        path: 'workspace',
        model: 'Workspace',
        populate: { path: 'establishmentId', model: 'Establishment' },
        strictPopulate: false,
      })
      .populate({
        path: 'workspace',
        populate: {
          path: 'employees',
          model: 'Job',
          populate: {
            path: 'workerId',
            model: 'User',
            populate: {
              path: 'orders',
              model: 'Order',
              strictPopulate: false,
            },
            strictPopulate: false,
          },
          strictPopulate: false,
        },
      })
      .exec();
    res.status(200).send({
      status: 'success',
      message: 'establishment updated successfully',
      data: establishmentUpdated,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      status: 'failure',
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const UpdateMyEstablishmentWH = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const establishmentId = req.params.establishmentId;

  try {
    const { openHours } = req.body;

    const check = await Establishment.findOne({ _id: establishmentId, owner: id });

    if (!check) {
      return res.status(403).send({
        status: 'failure',
        data: null,
        message: 'You are not authorized to update this establishment',
        error: null,
      });
    }

    const establishmentUpdated = await Establishment.findByIdAndUpdate(
      establishmentId,
      { openHours },
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
      .populate('tables')
      .populate('counter')
      .populate('workspace')
      .populate('workspace.employees')
      .exec();

    res.status(200).send({
      status: 'success',
      message: 'establishment updated successfully',
      data: establishmentUpdated,
      error: null,
    });
  } catch (error) {
    res.status(500).send({
      status: 'failure',
      message: 'there was an error editing establishment',
      data: null,
      error: error,
    });
  }
};

const GetMyAllergies = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  try {
    const allergies = await Allergies.findOne({ ownerId: id });
    console.log(typeof allergies?.allergies);

    if (!allergies) {
      return res.status(400).json({ message: 'no allergy found', status: 'failure', data: null, error: null });
    }
    if (allergies && !allergies.allergies) {
      await allergies.updateOne({ $set: { allergies: [] } }, { new: true });
    }

    const allergiesResponse = await Allergies.findOne({ ownerId: id });
    return res.status(200).send({ status: 'success', data: allergiesResponse, message: '', error: null });
  } catch (error: any) {
    return res.status(500).send({
      status: 'failure',
      data: null,
      message: error.message,
      error: error,
    });
  }
};

const PostMyAllergies = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const allergy = req.body.allergy;
  if (typeof allergy !== 'number') {
    return res.status(400).send({
      status: 'failure',
      data: null,
      message: 'Allergen has to be implementation of allergen id',
      error: new Error('Allergen has to be implementation of allergen id'),
    });
  }
  try {
    const user = await User.findById(id).populate('allergies');
    if (!user) {
      return res.status(404).send({ status: 'failure', data: null, message: 'user not found', error: null });
    } else {
      const allergies = user.allergies;
      if (!allergies) {
        const newAllergiesHolder = await Allergies.create({ ownerId: id, allergies: [allergy] });
        await User.findByIdAndUpdate(id, { allergies: newAllergiesHolder._id }, { new: true, runValidators: true });

        return res.status(200).send({
          status: 'success',
          data: { newAllergiesHolder },
          message: '',
          error: null,
        });
      } else {
        const allergiesCheck = await Allergies.findOne({ ownerId: id });
        if (!allergiesCheck?.allergies.includes(allergy)) {
          const updatedAllergies = await Allergies.findOneAndUpdate(
            { ownerId: user._id },
            {
              $push: {
                allergies: allergy,
              },
            },
            {
              new: true,
              runValidators: true,
            },
          );

          return res
            .status(200)
            .send({ status: 'success', data: updatedAllergies, message: 'success adding new allergy', error: null });
        } else
          return res
            .status(400)
            .send({ status: 'failure', data: null, message: 'allergy already exists', error: null });
      }
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

const DeleteMyAllergies = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;
  const allergyName = req.params.allergyName;
  if (isNaN(parseInt(allergyName))) {
    return res.status(404).send({
      status: 'failure',
      data: null,
      message: 'allergen should implement number as of allegenId',
      error: null,
    });
  }
  try {
    const user = await User.findById(id).populate('allergies');
    if (!user) {
      return res.status(404).send({ status: 'failure', data: null, message: 'user not found', error: null });
    } else {
      const removedUserAllergies = await Allergies.findOneAndUpdate(
        { ownerId: user.id },
        {
          $pull: {
            allergies: parseInt(allergyName),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      );
      return res
        .status(200)
        .send({ status: 'success', data: removedUserAllergies, message: 'allergy deleted', error: null });
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

const UploadDocumentImage = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { documentImageFront, documentImageBack } = req;
    return res.status(200).send({
      status: 'success',
      data: { documentImageFront, documentImageBack },
      message: 'document image added successfully',
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

export default {
  GetMyProfileController,
  GetMyEstablishmentController,
  EditMyProfileController,
  UpdateMyEstablishment,
  UpdateMyEstablishmentWH,
  DeleteMyAllergies,
  PostMyAllergies,
  GetMyAllergies,
  UploadDocumentImage,
  UploadImageToProfile,
  EditMyProfileAddressController,
  UpdateMyEstablishmentPosition,
  AddAddress,
};
