// @ts-nocheck

import { Router } from 'express';
import { getRecipes, getUserRecipes } from '../controllers/recipes';
import { getUsers, updateUser } from '../controllers/users';
import { createDispute, getDisputes, sendMessage, updateDispute } from '../controllers/disputes';
import { getOrders, updateOrder } from '../controllers/orders';
import { getEmployees, getProviderEmployees } from '../controllers/employees';
import { createNotification, deleteNotification, getNotifications } from '../controllers/notifications';
import { getChat, getChats, sendChatMessages } from '../controllers/chats';
import { getAllTransactions } from '../controllers/transactions';

const router = Router();

//recipes
router.get('/recipes', getRecipes);
router.get('/recipes/:userId', getUserRecipes);

//users
router.get('/users', getUsers);
router.patch('/users/:userId', updateUser);

//disputes
router.get('/disputes', getDisputes);
router.post('/disputes', createDispute);
router.patch('/disputes/:disputeId', updateDispute);
router.patch('/disputes/:disputeId/messages', sendMessage);

//orders
router.get('/orders', getOrders);
router.patch('/orders/:orderId', updateOrder);

//employees and provider employees
router.get('/employees', getEmployees);
router.get('/employees/provider', getProviderEmployees);

//Chats
router.get('/chats', getChats);
router.get('/chats/:userId', getChat);
router.patch('/chats/:userId/messages', sendChatMessages);

//notifications
router.get('/notifications', getNotifications);
router.post('/notifications', createNotification);
router.delete('/notifications/:notificationId', deleteNotification);

//transactions
router.get('/transactions', getAllTransactions);

//contact us
router.post('/contact', async (req, res) => {
  const { email, phone, first_name, last_name } = req.body;
  try {
    //send emails
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

export { router as DashboardRouter };
