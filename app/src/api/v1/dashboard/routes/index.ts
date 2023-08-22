/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import { Router } from 'express';
import { getRecipes, getUserRecipes } from '../controllers/recipes';
import { getUsers, updateUser } from '../controllers/users';
import { createDispute, getDisputes, sendMessage, updateDispute } from '../controllers/disputes';
import { getOrders, updateOrder } from '../controllers/orders';
import { getEmployees, getProviderEmployees } from '../controllers/employees';
import {
  createNotification,
  deleteNotification,
  getNotifications,
  getUserNotifications,
} from '../controllers/notifications';
import { getChat, getChats, sendChatMessages } from '../controllers/chats';
import { getAllTransactions } from '../controllers/transactions';
import { GetChatMessages, GetUserChats, SendMessage } from '../controllers/messages';
import MailerController from '../../helpers/mailer';

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
router.get('/notifications/:userId', getUserNotifications);
router.delete('/notifications/:notificationId', deleteNotification);

//transactions
router.get('/transactions', getAllTransactions);

//messages
router.get('/messages/:chatId', GetChatMessages);
router.get('/messages/chats/:userId', GetUserChats);
router.post('/messages', SendMessage);

//contact us
router.post('/contact', async (req, res) => {
  const { email, phone, first_name, last_name, type } = req.body;
  const mailer = new MailerController();

  try {
    if (type === 'billing') {
      // billing@blinkfix.me

      await mailer.sendEmail({
        from: email,
        to: 'billing@blinkfix.me',
        subject: 'BILLING ISSUE',
        html: `
        <p>Email : ${email} \n</>
        <p>Phone : ${phone} \n</>
        <p>First Name : ${first_name} \n</>
        <p>Last Name : ${last_name} \n</>
        `,
        attachments: [
          {
            filename: 'BLINKFIX.png',
            path: 'app/src/api/assets/BLINKFIX.png',
            cid: 'logoImage@blink@fix.me', //same cid value as in the html img src
          },
        ],
      });
    } else if (type === 'support') {
      // support@blinkfix.me
      await mailer.sendEmail({
        from: email,
        to: 'support@blinkfix.me',
        subject: 'BILLING ISSUE',
        html: `
        <p>Email : ${email} \n</>
        <p>Phone : ${phone} \n</>
        <p>First Name : ${first_name} \n</>
        <p>Last Name : ${last_name} \n</>
        `,
        attachments: [
          {
            filename: 'BLINKFIX.png',
            path: 'app/src/api/assets/BLINKFIX.png',
            cid: 'logoImage@blink@fix.me', //same cid value as in the html img src
          },
        ],
      });
    } else {
      // mm@blinkfix.me
      await mailer.sendEmail({
        from: email,
        to: 'mm@blinkfix.me',
        subject: 'BILLING ISSUE',
        html: `
        <p>Email : ${email} \n</>
        <p>Phone : ${phone} \n</>
        <p>First Name : ${first_name} \n</>
        <p>Last Name : ${last_name} \n</>
        `,
        attachments: [
          {
            filename: 'BLINKFIX.png',
            path: 'app/src/api/assets/BLINKFIX.png',
            cid: 'logoImage@blink@fix.me', //same cid value as in the html img src
          },
        ],
      });
    }
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
});

export { router as DashboardRouter };
