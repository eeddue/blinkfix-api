import { Response, Request } from 'express';
import { verify } from 'jsonwebtoken';
import { getIdfromAuth } from '../../helpers/jwthelpers';
import { convertStringToId } from '../../helpers/mongodbHelper';
import { IResponse } from '../../interfaces';
import {
  Establishment,
  EstablishmentMenu,
  EstablishmentMenuItems,
  EstablishmentMenuItemsIngredients,
  OrderCounters,
  OrderMenuItemsCounters,
  User,
} from '../../../config/mdb';
import { IMenu, IMenuItems, IMenuItemsIngredients } from '../../models/Order/menuSchemas';
import mongoose, { Mongoose } from 'mongoose';
import establishmentCategoryValidation from '../../validations/establishmentCategoryValidation';
import { IEstablishment } from '../../interfaces/mongo/establishment';
import { IGetUserAuthInfoRequest } from '../../interfaces/request.interface';
import { stripe } from './payment';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

//#region establishment menu

const addEstablishmentMenu = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const convertedId = await convertStringToId(id);
    const establishmentId = req.params.establishmentId;
    const { menuName, isOurMenuSubmenuVisible }: IMenu = req.body;

    const check = await Establishment.findById(establishmentId);
    if (check?.owner.toString() !== convertedId?.toString())
      return res.status(401).send({
        message: 'you are not an owner of this establishment',
        data: null,
        error: null,
      });

    if (check?.type !== 'restaurant' && check?.type !== 'foodtruck' && check?.type !== 'localCook') {
      return res.status(400).send({
        message: 'you cant add menu to shoop',
        data: null,
        error: null,
      });
    }
    const checkMenuName = await EstablishmentMenu.find({
      menuName: menuName,
      establishmentId: establishmentId,
    });

    if (checkMenuName?.length !== 0) {
      return res.status(403).send({
        message: 'you already have a menu with that name',
        data: null,
        error: null,
      });
    }

    const establishmentUpdateMenu = await EstablishmentMenu.create({
      menuName: menuName,
      establishmentId: establishmentId,
      isOurMenuSubmenuVisible,
      categoryVisibility: [
        { categoryName: 'bakeries', isVisible: true },
        { categoryName: 'starters', isVisible: true },
        { categoryName: 'sides', isVisible: true },
        { categoryName: 'soups', isVisible: true },
        { categoryName: 'mains', isVisible: true },
        { categoryName: 'desserts', isVisible: true },
        { categoryName: 'beverages', isVisible: true },
        { categoryName: 'alc beverages', isVisible: true },
        { categoryName: 'products', isVisible: true },
      ],
    });

    const updatedEstablishment = await Establishment.findOneAndUpdate(
      { _id: establishmentId },
      { $addToSet: { menu: new mongoose.Types.ObjectId(establishmentUpdateMenu._id) } },
      { new: true, runValidators: true },
    );
    const finalEstablishmentMenus = await EstablishmentMenu.find({
      establishmentId: updatedEstablishment?._id,
    })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'dishIngredients',
          model: 'EstablishmentMenuItemsIngredients',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'counter',
          model: 'OrderCounters',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'image',
          model: 'ImagesCommon',
        },
      });
    if (updatedEstablishment)
      return res.status(200).send({
        message: 'succesfully edited establishment',
        data: finalEstablishmentMenus,
        error: null,
      });
    else {
      await EstablishmentMenu.findByIdAndDelete(establishmentUpdateMenu._id);
      return res.status(400).send({
        message: 'bad request',
        data: null,
        error: null,
      });
    }
  } catch (error: any) {
    return res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

const editEstablishmentCategories = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const convertedId = await convertStringToId(id);
    const { menuId } = req.params;
    const { categoryVisibility, isOurMenuSubmenuVisible }: IMenu = req.body;

    if (!categoryVisibility) {
      return res.status(400).send({
        message: 'you have to provide a category visibility object',
        data: null,
        error: null,
      });
    }
    if (isOurMenuSubmenuVisible === undefined) {
      return res.status(400).send({
        message: 'you have to provide a all category visibility',
        data: null,
        error: null,
      });
    }

    const menuFromParam = await EstablishmentMenu.findById(menuId);
    const establishmentFromMenuId = menuFromParam?.establishmentId;
    const establishment = await Establishment.findById(establishmentFromMenuId);

    if (establishment?.owner.toString() !== convertedId?.toString()) {
      return res.status(403).send({
        message: 'not authorized to change menu',
        data: null,
        error: null,
      });
    }

    const returnData = await EstablishmentMenu.findByIdAndUpdate(
      menuId,
      { categoryVisibility: categoryVisibility, isOurMenuSubmenuVisible },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'dishIngredients',
          model: 'EstablishmentMenuItemsIngredients',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'counter',
          model: 'OrderCounters',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'image',
          model: 'ImagesCommon',
        },
      });

    if (returnData) {
      return res.status(200).send({
        message: 'succesfully edited establishment menu',
        data: returnData,
        error: null,
      });
    } else {
      return res.status(400).send({
        message: 'bad request',
        data: null,
        error: null,
      });
    }
  } catch (error: any) {
    res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

const editEstablishmentMenu = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const convertedId = await convertStringToId(id);
    const { menuId } = req.params;
    const { menuName, isOurMenuSubmenuVisible }: IMenu = req.body;

    const menuFromParam = await EstablishmentMenu.findById(menuId);
    const establishmentFromMenuId = menuFromParam?.establishmentId;
    const establishment = await Establishment.findById(establishmentFromMenuId);

    if (establishment?.owner.toString() !== convertedId?.toString()) {
      return res.status(403).send({
        message: 'not authorized to change menu',
        data: null,
        error: null,
      });
    }

    const returnData = await EstablishmentMenu.findByIdAndUpdate(
      menuId,
      {
        menuName: menuName,
        isOurMenuSubmenuVisible: isOurMenuSubmenuVisible,
      },
      { new: true, runValidators: true },
    )
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'dishIngredients',
          model: 'EstablishmentMenuItemsIngredients',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'counter',
          model: 'OrderCounters',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'image',
          model: 'ImagesCommon',
        },
      });

    if (returnData) {
      return res.status(200).send({
        message: 'succesfully edited establishment menu',
        data: returnData,
        error: null,
      });
    } else {
      return res.status(400).send({
        message: 'bad request',
        data: null,
        error: null,
      });
    }
  } catch (error: any) {
    res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

const deleteEstablishmentMenu = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const { menuId } = req.params;

    const menuFromParam = await EstablishmentMenu.findOne({ _id: menuId });
    const establishmentFromMenu = menuFromParam?.establishmentId;
    const establishment = await Establishment.findById(establishmentFromMenu);

    if (establishment?.owner.toString() !== id) {
      return res.status(403).send({
        message: 'not authorized to change menu',
        data: null,
        error: null,
      });
    }

    const menuIdTransformed = new mongoose.Types.ObjectId(menuId);
    await Establishment.findByIdAndUpdate(establishmentFromMenu, {
      $pull: { menu: menuIdTransformed },
    });
    await EstablishmentMenu.findByIdAndDelete(menuId);

    const returnEstablishmentMenuUpdated = await Establishment.findById(establishment?._id);

    if (returnEstablishmentMenuUpdated) {
      const returnData = await EstablishmentMenu.find({ establishmentId: establishment?._id })
        .populate({
          path: 'menuItems',
          model: 'EstablishmentMenuItems',
          populate: {
            path: 'dishIngredients',
            model: 'EstablishmentMenuItemsIngredients',
          },
        })
        .populate({
          path: 'menuItems',
          model: 'EstablishmentMenuItems',
          populate: {
            path: 'counter',
            model: 'OrderCounters',
          },
        })
        .populate({
          path: 'menuItems',
          model: 'EstablishmentMenuItems',
          populate: {
            path: 'image',
            model: 'ImagesCommon',
          },
        });
      return res.status(200).send({
        message: 'succesfully edited establishment',
        data: returnData,
        error: null,
      });
    } else
      return res.status(200).send({
        message: 'succesfully edited establishment',
        data: null,
        error: null,
      });
  } catch (error: any) {
    res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};
const getEstablishmentMenu = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    const { establishmentId } = req.params;

    const establishment = await Establishment.findById(establishmentId).populate('menu');

    if (!establishment) {
      return res.status(200).send({
        message: 'establishment not found',
        data: null,
        error: null,
      });
    } else {
      const returnData = await EstablishmentMenu.find({ establishmentId: establishmentId })
        .populate({
          path: 'menuItems',
          model: 'EstablishmentMenuItems',
          populate: {
            path: 'dishIngredients',
            model: 'EstablishmentMenuItemsIngredients',
          },
        })
        .populate({
          path: 'menuItems',
          model: 'EstablishmentMenuItems',
          populate: {
            path: 'counter',
            model: 'OrderCounters',
          },
        })
        .populate({
          path: 'menuItems',
          model: 'EstablishmentMenuItems',
          populate: {
            path: 'image',
            model: 'ImagesCommon',
          },
        });
      return res.status(200).send({
        message: 'succesfully edited establishment',
        data: returnData,
        error: null,
      });
    }
  } catch (error: any) {
    res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

//#endregion

//#region establishment menu item
const addEstablishmentMenuItemAllergens = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { itemId } = req.params;
    const { allergens } = req.body;

    const menuItemFromDB = await EstablishmentMenuItems.findById(itemId);
    if (!menuItemFromDB) {
      throw new Error('item not found ');
    }

    if (!menuItemFromDB.allergens) {
      await menuItemFromDB.updateOne({ allergens: [] }, { new: true, runValidators: true }).populate('dishIngredients');
    }
    //

    const updatedItem = await EstablishmentMenuItems.findByIdAndUpdate(
      itemId,
      { allergens: allergens },
      { new: true, runValidators: true },
    ).populate('dishIngredients');
    return res.status(200).send({
      message: 'success',
      data: updatedItem,
      error: null,
    });
  } catch (error: any) {
    return res.status(403).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};
const getEstablishmentMenuItemAllergens = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { itemId } = req.params;

    const menuItemFromDB = await EstablishmentMenuItems.findById(itemId).populate('dishIngredients');
    if (!menuItemFromDB) {
      throw new Error('item not found ');
    }

    if (!menuItemFromDB.allergens) {
      await menuItemFromDB.updateOne({ allergens: [] }, { new: true, runValidators: true }).populate('dishIngredients');
    }
    //

    const updatedItem = await EstablishmentMenuItems.findById(itemId).populate('dishIngredients');
    return res.status(200).send({
      message: 'success',
      data: updatedItem,
      error: null,
    });
  } catch (error: any) {
    return res.status(403).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

const addEstablishmentMenuItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;

  try {
    //#region
    const { menuId } = req.params;

    const establishmentMenu = await EstablishmentMenu.findById(menuId);
    const establishmentId = establishmentMenu?.establishmentId;

    const establishmentFromDB = await Establishment.findById(establishmentId);
    const owenrOfEstablishment = await User.findById(establishmentFromDB?.owner);
    const stripeId = owenrOfEstablishment?.stripe_id;
    if (!stripeId) {
      //
      return res.status(400).send({
        message: 'You have to provide bank details first',
        data: null,
        error: null,
      });
    }
    const stripeDetails = await stripe.accounts.retrieve(stripeId);
    if (!establishmentFromDB) {
      return res.status(400).send({
        message: 'there is no establishment like this',
        data: null,
        error: null,
      });
    }
    if (establishmentFromDB?.owner.toString() !== id) {
      return res.status(403).send({
        message: 'not authorized to change menu',
        data: null,
        error: null,
      });
    }

    //#endregion

    const { dishName, dishDescription, price, isDishForDelivery, category, spiceness, isVegan, isKosher, isHalal } =
      req.body;

    if (
      !dishName ||
      !dishDescription ||
      !price ||
      !isDishForDelivery ||
      !spiceness ||
      isVegan === undefined ||
      isKosher === undefined ||
      isHalal === undefined
    ) {
      return res.status(403).send({
        message: 'Not enaught data provided for creating new product',
        data: null,
        error: null,
      });
    }
    establishmentCategoryValidation(establishmentFromDB?.type, category);

    const newItemInMenu = await EstablishmentMenuItems.create({
      establishmentId: establishmentFromDB?._id,
      dishName,
      dishDescription,
      price,
      currency: stripeDetails.default_currency ? stripeDetails.default_currency : '',
      isDishForDelivery: isDishForDelivery,
      category,
      spiceness,
      isVegan,
      isKosher,
      isHalal,
    });

    if (!newItemInMenu) {
      return res.status(400).send({
        message: 'bad request',
        data: null,
        error: null,
      });
    }

    const dishIngredients: IMenuItemsIngredients[] = req.body.dishIngredients;

    if (!dishIngredients) {
      return res.status(403).send({
        message: 'Not enaught data provided for creating new product',
        data: null,
        error: null,
      });
    }
    await Promise.all(
      dishIngredients.map(async (product) => {
        const ingredient = await EstablishmentMenuItemsIngredients.create(product);
        await EstablishmentMenuItems.findByIdAndUpdate(newItemInMenu?._id, {
          $push: { dishIngredients: ingredient._id },
        });
      }),
    );

    await EstablishmentMenu.findOneAndUpdate(
      {
        _id: menuId,
      },
      { $addToSet: { menuItems: newItemInMenu._id }, establishmentId: establishmentId },
      { new: true, runValidators: true },
    );

    const finalEstablishmentMenus = await EstablishmentMenu.find({ establishmentId: establishmentId })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'dishIngredients',
          model: 'EstablishmentMenuItemsIngredients',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'counter',
          model: 'OrderCounters',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'image',
          model: 'ImagesCommon',
        },
      });

    return res.status(200).send({
      message: 'succesfully added establishment menu item',
      data: { allItems: finalEstablishmentMenus, newItemId: newItemInMenu._id },
      error: null,
    });
  } catch (error: any) {
    res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

const updateEstablishmentMenuItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = verify(token, jwtSecret);
  const id = decoded?.sub;

  const { menuId, itemId } = req.params;
  const { dishName, dishDescription, price, currency, isDishForDelivery, category } = req.body;

  try {
    const establishmentMenu = await EstablishmentMenu.findById(menuId);
    if (!establishmentMenu) {
      return res.status(404).send({
        message: 'establishment menu not found',
        data: null,
        error: null,
      });
    }
    const establishment = await Establishment.findById(establishmentMenu.establishmentId);
    if (!establishment) {
      return res.status(404).send({
        message: 'establishment not found',
        data: null,
        error: null,
      });
    }
    if (establishment?.owner.toString() !== id) {
      return res.status(403).send({ data: null, message: ' you are not allowed to change this data', error: null });
    }

    const updatedMenuItem = await EstablishmentMenuItems.findByIdAndUpdate(
      itemId,
      {
        establishmentId: establishment._id,
        dishName,
        dishDescription,
        price,
        currency,
        isDishForDelivery,
        category,
      },
      { new: true, runValidators: true },
    );

    const currentIngredients = updatedMenuItem?.dishIngredients;
    if (currentIngredients)
      await EstablishmentMenuItemsIngredients.deleteMany().where('dishIngredients').in(currentIngredients);

    const dishIngredients: IMenuItemsIngredients[] = req.body.dishIngredients;

    await EstablishmentMenuItems.findByIdAndUpdate(itemId, { $set: { dishIngredients: [] } });

    if (!dishIngredients) {
      return res.status(403).send({
        message: 'Not enaught data provided for creating new product',
        data: null,
        error: null,
      });
    }

    await Promise.all(
      dishIngredients.map(async (product) => {
        const ingredient = await EstablishmentMenuItemsIngredients.create(product);
        await EstablishmentMenuItems.findByIdAndUpdate(updatedMenuItem?._id, {
          $push: { dishIngredients: ingredient._id },
        });
      }),
    );

    await EstablishmentMenu.findOneAndUpdate(
      {
        _id: menuId,
      },
      { $addToSet: { menuItems: updatedMenuItem?._id } },
      { new: true, runValidators: true },
    );

    const finalEstablishmentMenus = await EstablishmentMenu.find({ establishmentId: establishment?._id })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'dishIngredients',
          model: 'EstablishmentMenuItemsIngredients',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'counter',
          model: 'OrderCounters',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'image',
          model: 'ImagesCommon',
        },
      });

    return res.status(200).send({
      message: 'succesfully edited establishment menu item',
      data: finalEstablishmentMenus,
      error: null,
    });
  } catch (error: any) {
    res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

const deleteEstablishmentMenuItem = async (req: Request, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);

  try {
    //#region
    const convertedId = await convertStringToId(id);
    const { menuId, itemId } = req.params;

    const estabMenuFromMenuId = await EstablishmentMenu.findById(menuId);
    const establishmentMenuOwner = estabMenuFromMenuId?.establishmentId;
    const establishmentFromDB = await Establishment.findById(establishmentMenuOwner);
    if (establishmentFromDB?.owner.toString() !== convertedId?.toString()) {
      return res.status(403).send({
        message: 'not authorized to change menu',
        data: null,
        error: null,
      });
    }

    //#endregion

    const ingredientsFromMenu = await EstablishmentMenuItems.findById(itemId);

    const currentIngredients = ingredientsFromMenu?.dishIngredients;

    if (currentIngredients) {
      await EstablishmentMenuItemsIngredients.deleteMany({ _id: { $in: currentIngredients } });
    }

    await EstablishmentMenuItems.findByIdAndDelete(itemId);
    await EstablishmentMenu.findByIdAndUpdate(
      menuId,
      {
        $pull: { menuItems: { _id: itemId } },
      },
      { new: true, runValidators: true },
    ).populate('menuItems');

    const finalEstablishmentMenus = await EstablishmentMenu.find({
      establishmentId: establishmentFromDB?._id,
    })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'dishIngredients',
          model: 'EstablishmentMenuItemsIngredients',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'counter',
          model: 'OrderCounters',
        },
      })
      .populate({
        path: 'menuItems',
        model: 'EstablishmentMenuItems',
        populate: {
          path: 'image',
          model: 'ImagesCommon',
        },
      });
    return res.status(200).send({
      message: 'succesfully deleted establishment menu item',
      data: finalEstablishmentMenus,
      error: null,
    });
  } catch (error: any) {
    return res.status(500).send({
      message: error.message,
      data: null,
      error: error,
    });
  }
};

const addImageToMenuItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { menuItem } = req;
    return res.status(200).send({
      status: 'success',
      data: menuItem,
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
const addImageToRecipe = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const { menuItem } = req;
    return res.status(200).send({
      status: 'success',
      data: menuItem,
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

//#endregion

//#region likes to menu items
const AddLikeToMenuItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  try {
    const { menuItemId } = req.params;
    const establishmentMenuItem = await EstablishmentMenuItems.findById(menuItemId);

    if (!establishmentMenuItem) {
      return res.status(404).send({
        data: null,
        message: 'menu item not found',
        error: null,
      });
    } else {
      if (establishmentMenuItem && !establishmentMenuItem?.counter) {
        const newEstablishmentCounter = await OrderMenuItemsCounters.create({});
        await EstablishmentMenuItems.findByIdAndUpdate(establishmentMenuItem._id, {
          counter: newEstablishmentCounter._id,
        });
      }

      const updatedEstablishmentCounter = await EstablishmentMenuItems.findById(menuItemId);
      const counterFromDb = await OrderMenuItemsCounters.findById(updatedEstablishmentCounter?.counter);

      const checkIfYouLikeThisEstablishment = counterFromDb?.whoLike.some((list) => list.toString() === id);
      if (counterFromDb) {
        const whoLike = counterFromDb.whoLike;
        if (checkIfYouLikeThisEstablishment === false && counterFromDb) {
          //
          if (convertedId)
            await OrderMenuItemsCounters.findByIdAndUpdate(
              counterFromDb?._id,
              {
                relatedId: establishmentMenuItem._id,
                $inc: { numberOfLikes: 1 },
                whoLike: [...whoLike, id],
              },
              { new: true },
            );
          //
        } else {
          if (counterFromDb) {
            const deletedUserFromLikes = whoLike.filter((user) => user.toString() !== id);
            await OrderMenuItemsCounters.findByIdAndUpdate(
              counterFromDb?._id,
              {
                relatedId: establishmentMenuItem._id,
                $inc: { numberOfLikes: -1 },
                whoLike: deletedUserFromLikes,
              },
              { new: true },
            );
          }
        }
      }
      const establishmentMenuItemres = await EstablishmentMenuItems.findById(menuItemId).populate([
        {
          path: 'category',
        },
        {
          path: 'dishIngredients',
        },
        {
          path: 'counter',
        },
        {
          path: 'image',
        },
      ]);

      res.status(200).send({
        data: establishmentMenuItemres,
        message: 'Like added successfully',
        error: null,
      });
    }
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to menu item',
      error: error,
    });
  }
};

export const GetLikedMenuItems = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  try {
    const auth = req.headers.authorization;
    const id = await getIdfromAuth(auth);
    const convertedId = await convertStringToId(id);

    const likedCounters = await OrderMenuItemsCounters.find({ whoLike: { $in: [id] } });
    const likedMenuItemsId = likedCounters?.map((counter) => counter.relatedId);
    const likedEstablishment = await EstablishmentMenuItems.find({ _id: { $in: likedMenuItemsId } }).populate([
      { path: 'dishIngredients' },
      { path: 'counter' },
    ]);
    return res.status(200).send({
      data: likedEstablishment,
      message: 'succesfully get list',
      error: null,
    });
  } catch (error: any) {
    return res.status(400).send({
      data: null,
      message: error.message,
      error: JSON.stringify(error),
    });
  }
};

const AddShareToMenuItem = async (req: IGetUserAuthInfoRequest, res: IResponse) => {
  const auth = req.headers.authorization;
  const id = await getIdfromAuth(auth);
  const convertedId = await convertStringToId(id);
  try {
    const { menuItemId } = req.params;
    const establishmentMenuItem = await EstablishmentMenuItems.findById(menuItemId);

    if (!establishmentMenuItem) {
      return res.status(404).send({
        data: null,
        message: 'menu item not found',
        error: null,
      });
    } else {
      if (!establishmentMenuItem.counter) {
        const newEstablishmentCounter = await OrderCounters.create({});
        await EstablishmentMenuItems.findByIdAndUpdate(establishmentMenuItem._id, {
          counter: newEstablishmentCounter._id,
        });
      }

      const updatedEstablishmentCounter = await EstablishmentMenuItems.findById(menuItemId);
      const counterFromDb = await OrderCounters.findById(updatedEstablishmentCounter?.counter);

      const checkIfYouLikeThisEstablishment = counterFromDb?.whoShare.some((list) => list.toString() === id);
      if (counterFromDb) {
        const whoShare = counterFromDb.whoLike;
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
      const counterFromDbres = await OrderCounters.findById(counterFromDb?._id);

      res.status(200).send({
        data: { establishmentMenuItemId: establishmentMenuItem._id, counterFromDbres },
        message: 'Like added successfully',
        error: null,
      });
    }
  } catch (error) {
    return res.status(500).send({
      data: null,
      message: 'there was an error while giveing like to the menu item',
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
//#endregion

export default {
  addEstablishmentMenu,
  editEstablishmentMenu,
  addEstablishmentMenuItem,
  addEstablishmentMenuItemAllergens,
  getEstablishmentMenuItemAllergens,
  deleteEstablishmentMenuItem,
  updateEstablishmentMenuItem,
  deleteEstablishmentMenu,
  getEstablishmentMenu,
  editEstablishmentCategories,
  AddLikeToMenuItem,
  AddShareToMenuItem,
  addImageToMenuItem,
  addImageToRecipe,
  GetLikedMenuItems,
};
