import express from 'express';
import MyProfileRouter from './myProfile';
import InvoicesRecipes from './recipeInvoices';
import UserJobRoutes from './UserJob';
import WorkspaceRoutes from './workspace';
import OrderProfileRoutes from './orderRoutes';
import walletRoutes from './wallet';
import advertisementRoutes from './advertisement.routes';
let router = express.Router();

router.use('/', MyProfileRouter);
router.use('/invoices/recipes', InvoicesRecipes);
router.use('/job', UserJobRoutes);
router.use('/workspace', WorkspaceRoutes);
router.use('/order', OrderProfileRoutes);
router.use('/wallet', walletRoutes);
router.use('/advertisement', advertisementRoutes);

export default router;
