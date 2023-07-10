import express from 'express';
import { UserJob } from '../../controllers/Profile';
import { checkIfIsOwner } from '../../middlewares/ProfileMiddlewere';
import Verification from '../../middlewares/verifyAuthentication';
let router = express.Router();

router.get('/', Verification.verifyToken, UserJob.GetMyJobs);
router.get('/getById/:jobId', Verification.verifyToken, UserJob.GetSingleJob);
router.get('/forwardedTo/:jobType/:jobId', Verification.verifyToken, UserJob.GetOrdersForwardedToJobOption);
router.post('/forwardTo/:jobType', Verification.verifyToken, UserJob.forwardToJobType);

router.post('/', Verification.verifyToken, UserJob.SendJobRequest);
router.put('/accept/:jobId', Verification.verifyToken, UserJob.changeIsAccepted);
router.put('/dismiss/:jobId', Verification.verifyToken, UserJob.dismissEmployee);
router.put('/reject/:jobId', Verification.verifyToken, UserJob.changeIsAcceptedReject);
router.delete('/:jobId', Verification.verifyToken, UserJob.DeleteMyJobRequest);

export default router;
