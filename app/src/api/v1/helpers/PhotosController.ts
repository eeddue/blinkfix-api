import { Documents, ProfileImage, EstablishmentMenuItems, ImagesCommon } from '../../config/mdb/index';
import { Request } from 'express';
import { verify } from 'jsonwebtoken';
import multer from 'multer';
import { Establishment, Recipe, User } from '../../config/mdb';
const imagePath = process.env.IMAGE_FILE_PATH || 'D:/newgen/bx/nodejs/blinkapi/store/images';
import { ImageEstablishment } from '../../config/mdb';
import { IGetUserAuthInfoRequest } from '../interfaces/request.interface';
const jwtSecret = process.env.JWT_ACCESS_SECRET || 'test';

const storageMainImage = multer.diskStorage({
  destination: imagePath,

  filename: async function (req: any, file, cb) {
    console.log(file);
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    const id = decoded.sub;
    const establishmentId = req.params.establishmentId;

    let filename: string | undefined;

    if (file.fieldname === 'imageMain') {
      let image: any;
      filename = 'main_' + establishmentId + '.png';
      const establishment = await Establishment.findById(establishmentId);
      if (establishment) {
        const establishmentImageCheck = await ImageEstablishment.findOne({
          establishmentId: establishmentId,
          isMainImage: true,
        });

        if (!establishmentImageCheck) {
          image = await ImageEstablishment.create({
            path: filename,
            establishmentId: establishment._id,
            isMainImage: true,
          });
          await Establishment.findOneAndUpdate(
            establishment._id,
            {
              $push: { image: image._id },
            },
            { new: true },
          );
        } else {
          image = await ImageEstablishment.findByIdAndUpdate(establishmentImageCheck._id, {
            path: filename,
            establishmentId: establishment._id,
            isMainImage: true,
          });
        }
      }
      req.imageFront = { ...file, image };
    }
    if (file.fieldname === 'imageBack') {
      let image: any;

      filename = 'back_' + establishmentId + '.png';
      const establishment = await Establishment.findById(establishmentId);
      if (establishment) {
        const establishmentImageCheck = await ImageEstablishment.findOne({
          establishmentId: establishmentId,
          isMainImage: false,
        });

        if (!establishmentImageCheck) {
          image = await ImageEstablishment.create({
            path: filename,
            establishmentId: establishment._id,
            isMainImage: false,
          });
          await Establishment.findOneAndUpdate(
            establishment._id,
            {
              $push: { image: image._id },
            },
            { new: true },
          );
        } else {
          image = await ImageEstablishment.findByIdAndUpdate(
            establishmentImageCheck._id,
            {
              path: filename,
              establishmentId: establishment._id,
              isMainImage: true,
            },
            { new: true },
          );
        }
        req.imageBack = { ...file, image };
      }
    }
    if (file.fieldname === 'documentImageFront') {
      let image: any;

      const token = req.headers.authorization.split(' ')[1];
      const decoded = verify(token, jwtSecret);
      const id = decoded.sub;
      console.log(id);
      filename = 'documentFront_' + id + '.png';
      const user = await User.findById(id);
      if (!user) {
        return cb(new Error('bad request'), '');
      } else {
        const document = await Documents.findOne({ ownerId: id, isFrontImage: true });
        if (!document) {
          image = await Documents.create({ ownerId: id, isFrontImage: true, path: filename });
          await User.findByIdAndUpdate(id, {
            $push: {
              documentImages: image._id,
            },
          });
        } else {
          image = await Documents.findOneAndUpdate(
            { ownerId: id, isFrontImage: true },
            {
              path: filename,
              isFrontImage: true,
            },
          );
        }
      }
      req.documentImageFront = { ...file, image };
    }

    if (file.fieldname === 'documentImageBack') {
      let image: any;

      const token = req.headers.authorization.split(' ')[1];
      const decoded = verify(token, jwtSecret);
      const id = decoded.sub;
      console.log(id);
      filename = 'documentBack_' + id + '.png';
      const user = await User.findById(id);
      if (!user) {
        return cb(new Error('bad request'), '');
      } else {
        const document = await Documents.findOne({ ownerId: id, isFrontImage: false });
        if (!document) {
          image = await Documents.create({ ownerId: id, isFrontImage: false, path: filename });
          await User.findByIdAndUpdate(id, {
            $push: {
              documentImages: image._id,
            },
          });
        } else {
          image = await Documents.findOneAndUpdate(
            { ownerId: id, isFrontImage: false },
            {
              path: filename,
              isFrontImage: false,
            },
          );
        }
      }
      req.documentImageBack = { ...file, image };
    }

    if (filename) {
      cb(null, filename);
    } else {
      cb(new Error('bad request'), '');
    }
  },
});
const storageProfileDocumentImage = multer.diskStorage({
  destination: imagePath + '/documents/',
  filename: async function (req: any, file, cb) {
    console.log(file);
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    const id = decoded.sub;

    let filename: string | undefined;
    ////////////////////////////////////////////////////////////////
    try {
      if (file.fieldname === 'documentImageFront') {
        let image: any;

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verify(token, jwtSecret);
        const id = decoded.sub;
        filename = 'documentFront_' + id + '.png';
        const user = await User.findById(id);
        if (!user) {
          return cb(new Error('bad request'), '');
        } else {
          const document = await Documents.findOne({ ownerId: id, isFrontImage: true });
          if (!document) {
            image = await Documents.create({ ownerId: id, isFrontImage: true, path: '/documents/' + filename });
            await User.findByIdAndUpdate(id, {
              $push: {
                documentImages: image._id,
              },
            });
          } else {
            image = await Documents.findOneAndUpdate(
              { ownerId: id, isFrontImage: true },
              {
                path: '/documents/' + filename,
                isFrontImage: true,
              },
              { new: true },
            );
          }
        }
        req.documentImageFront = { ...file, image };
      }

      if (file.fieldname === 'documentImageBack') {
        let image: any;

        const token = req.headers.authorization.split(' ')[1];
        const decoded = verify(token, jwtSecret);
        const id = decoded.sub;
        console.log(id);
        filename = 'documentBack_' + id + '.png';
        const user = await User.findById(id);
        if (!user) {
          return cb(new Error('bad request'), '');
        } else {
          const document = await Documents.findOne({ ownerId: id, isFrontImage: false });
          if (!document) {
            image = await Documents.create({ ownerId: id, isFrontImage: false, path: '/documents/' + filename });
            await User.findByIdAndUpdate(id, {
              $push: {
                documentImages: image._id,
              },
            });
          } else {
            image = await Documents.findOneAndUpdate(
              { ownerId: id, isFrontImage: false },
              {
                path: '/documents/' + filename,
                isFrontImage: false,
              },
            );
          }
        }
        req.documentImageBack = { ...file, image };
      }
    } catch (error) {
      console.log(error);
    }
    ////////////////////////////////////////////////////////////////

    if (filename) {
      cb(null, filename);
    } else {
      cb(new Error('bad request'), '');
    }
    ``;
  },
});

const storageProfileImage = multer.diskStorage({
  destination: imagePath + '/profile/',
  filename: async function (req: IGetUserAuthInfoRequest, file, cb) {
    console.log(file);
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    const id = decoded.sub;

    let filename: string | undefined;
    ////////////////////////////////////////////////////////////////
    try {
      if (file.fieldname === 'profileImageProfile') {
        let image: any;
        filename = 'profileMain_' + id + '.png';

        const user = await User.findById(id);

        if (user) {
          const profileImageCheck = await ProfileImage.findOne({
            ownerId: id,
            isImageBackground: false,
          });

          if (!profileImageCheck) {
            image = await ProfileImage.create({
              path: '/profile/' + filename,
              ownerId: user._id,
              isImageBackground: false,
            });

            await User.findByIdAndUpdate(
              user._id,
              {
                'images.profileImage': image._id,
              },
              { new: true },
            );
          } else {
            image = await ProfileImage.findByIdAndUpdate(
              profileImageCheck._id,
              {
                path: '/profile/' + filename,
                isImageBackground: false,
              },
              { new: true, runValidators: true },
            );
          }
        }
        req.profileImage = image;
        console.log(req.profileImage);
      }
    } catch (error) {
      console.log(error);
    }
    ////////////////////////////////////////////////////////////////
    try {
      if (file.fieldname === 'profileImageBackground') {
        let image: any;
        filename = 'profileBackground_' + id + '.png';

        const user = await User.findById(id);
        if (user) {
          const profileImageCheck = await ProfileImage.findOne({
            ownerId: id,
            isImageBackground: true,
          });

          if (!profileImageCheck) {
            image = await ProfileImage.create({
              path: '/profile/' + filename,
              ownerId: user._id,
              isImageBackground: true,
            });
            console.log({ image });
            await User.findByIdAndUpdate(
              user._id,
              {
                'images.backgroundImage': image._id,
              },
              { new: true },
            );
          } else {
            image = await ProfileImage.findByIdAndUpdate(
              profileImageCheck._id,
              {
                path: '/profile/' + filename,
                isImageBackground: true,
              },
              { new: true, runValidators: true },
            );
            await User.findByIdAndUpdate(
              user._id,
              {
                'images.backgroundImage': image._id,
              },
              { new: true },
            );
          }
        }
        req.backgroundImage = image;
        console.log(req.backgroundImage);
      }
    } catch (error) {
      console.log(error);
    }
    ////////////////////////////////////////////////////////////////
    if (filename) {
      cb(null, filename);
    } else {
      cb(new Error('bad request'), '');
    }
  },
});
const storageCommonImage = multer.diskStorage({
  destination: imagePath + '/common/',
  filename: async function (req: IGetUserAuthInfoRequest, file, cb) {
    console.log(file);
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    const id = decoded.sub;
    const itemId = req.params.menuItemId;
    const recipeId = req.params.recipeId;

    let filename: string | undefined;
    ////////////////////////////////////////////////////////////////
    try {
      if (file.fieldname === 'menuItem') {
        let image: any;
        filename = 'menuItem_' + itemId + '.png';

        const menuItem = await EstablishmentMenuItems.findById(itemId);
        if (!menuItem) {
          return cb(new Error(`Could not find menu item with id ${itemId} !`), '');
        } else {
          const menuItemImageCheck = await ImagesCommon.findOne({
            relatedId: itemId,
          });
          console.log({ menuItemImageCheck });

          if (!menuItem.image) {
            console.log('adding new image');
            image = await ImagesCommon.create({
              path: '/common/' + filename,
              relatedId: itemId,
            });

            await EstablishmentMenuItems.findByIdAndUpdate(
              menuItem._id,
              {
                image: image._id,
              },
              { new: true },
            );
          } else {
            console.log('update existing image');
            image = await ImagesCommon.findByIdAndUpdate(
              menuItem.image,
              {
                path: '/common/' + filename,
                relatedId: itemId,
              },
              { new: true, runValidators: true },
            );
          }
        }
        console.log(image);
        req.menuItem = image;
      }
    } catch (error) {
      cb(new Error(JSON.stringify(error)), '');
    }

    ////////////////////////////////////////////////////////////////
    if (filename) {
      cb(null, filename);
    } else {
      cb(new Error('bad request'), '');
    }
  },
});
const storageCommonRecipesImage = multer.diskStorage({
  destination: imagePath + '/recipes/',
  filename: async function (req: IGetUserAuthInfoRequest, file, cb) {
    console.log(file);
    const token = req.headers.authorization.split(' ')[1];
    const decoded = verify(token, jwtSecret);
    const id = decoded.sub;
    const itemId = req.params.menuItemId;
    const recipeId = req.params.recipeId;

    let filename: string | undefined;
    ////////////////////////////////////////////////////////////////
    try {
      if (file.fieldname === 'recipeItem') {
        let image: any;
        filename = 'recipeItem_' + recipeId + '.png';

        const recipeItem = await Recipe.findById(recipeId);
        if (!recipeItem) {
          return cb(new Error(`Could not find menu item with id ${recipeId} !`), '');
        } else {
          if (!recipeItem.image) {
            image = await ImagesCommon.create({
              path: '/recipes/' + filename,
              relatedId: recipeId,
            });

            await Recipe.findByIdAndUpdate(
              recipeItem._id,
              {
                image: image._id,
              },
              { new: true },
            );
          } else {
            image = await ImagesCommon.findByIdAndUpdate(
              recipeItem.image,
              {
                path: '/recipes/' + filename,
                relatedId: recipeId,
              },
              { new: true, runValidators: true },
            );
          }
        }
        req.menuItem = image;
      }
    } catch (error) {
      cb(new Error(JSON.stringify(error)), '');
    }

    ////////////////////////////////////////////////////////////////
    if (filename) {
      cb(null, filename);
    } else {
      cb(new Error('bad request'), '');
    }
  },
});

export var uploadMainImage = multer({ storage: storageMainImage });
export var uploadProfileImage = multer({ storage: storageProfileImage });
export var uploadProfileDocumentImage = multer({ storage: storageProfileDocumentImage });
export var uploadCommonMenuItemImage = multer({ storage: storageCommonImage });
export var uploadCommonRecipesImage = multer({ storage: storageCommonRecipesImage });
