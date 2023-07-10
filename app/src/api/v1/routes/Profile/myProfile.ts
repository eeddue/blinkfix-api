import express from 'express';
import Verification from '../../middlewares/verifyAuthentication';
import MyProfileController from '../../controllers/Profile/myProfile';
import { uploadMainImage, uploadProfileDocumentImage, uploadProfileImage } from '../../helpers/PhotosController';

let router = express.Router();

router.get('/', Verification.verifyToken, MyProfileController.GetMyProfileController);
router.put('/', Verification.verifyToken, MyProfileController.EditMyProfileController);
router.delete('/allergies/:allergyName', Verification.verifyToken, MyProfileController.DeleteMyAllergies);
router.get('/establishment', Verification.verifyToken, MyProfileController.GetMyEstablishmentController);
router.put('/establishment', Verification.verifyToken, MyProfileController.UpdateMyEstablishment);
router.put('/establishment/position', Verification.verifyToken, MyProfileController.UpdateMyEstablishmentPosition);
router.put(
  '/establishment/workingHours/:establishmentId',
  Verification.verifyToken,
  MyProfileController.UpdateMyEstablishmentWH,
);
router.put('/address/:userId/:addressId', Verification.verifyToken, MyProfileController.EditMyProfileAddressController);
router.get('/allergies', Verification.verifyToken, MyProfileController.GetMyAllergies);
router.post('/allergies', Verification.verifyToken, MyProfileController.PostMyAllergies);
router.post('/address', Verification.verifyToken, MyProfileController.AddAddress);

router.post(
  '/document',
  Verification.verifyToken,
  uploadProfileDocumentImage.fields([
    {
      name: 'documentImageFront',
      maxCount: 1,
    },
    {
      name: 'documentImageBack',
      maxCount: 1,
    },
  ]),
  MyProfileController.UploadDocumentImage,
);
router.post(
  '/profileImage',
  Verification.verifyToken,
  uploadProfileImage.fields([
    {
      name: 'profileImageProfile',
      maxCount: 1,
    },
    {
      name: 'profileImageBackground',
      maxCount: 1,
    },
  ]),
  MyProfileController.UploadImageToProfile,
);

export default router;
