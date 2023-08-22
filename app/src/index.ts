// @ts-nocheck

import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongodbSetup from './api/config/mdb';
import { RootRouter } from './api/v1/routes';
import { DashboardRouter } from './api/v1/dashboard/routes';
import { ErrorHandlers } from './api/v1/middlewares';
import getClient from './api/config/redis';
import createClient from './api/config/redis';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
export const io = new Server(server, {
  cors: { origin: '*' },
});
app.set('trust proxy', true);

mongodbSetup();
createClient();
const redisKeeper = async () => {
  const redisClient = await getClient();
  setInterval(async () => {
    const a = await redisClient.ping();
  }, 6000);
};

//online socket users
const onlineUsers = [];

const addUser = (userId, socketId) => {
  !onlineUsers.some((user) => user.userId === userId) && onlineUsers.push({ userId, socketId });
};

const removeUser = (socketId) => {
  return onlineUsers.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((user) => user.userId === userId);
};

//socket functions
io.on('connection', (socket) => {
  //add user to online users
  socket.on('add-online-user', (userId) => {
    addUser(userId, socket.id);
    io.emit('users', onlineUsers);
    console.log(userId);
  });

  //sending messages
  socket.on('send-message', (data) => {
    io.to(getUser(data.receiver).socketId).emit('receive-message', data);
  });

  //remove online users on disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
    // removeUser(socket.id);
    io.emit('users', onlineUsers);
  });
});

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
// app.use(upload.array(''));

app.use('/api/v1', RootRouter);
app.use('/api/v1/dashboard', DashboardRouter);
app.get('/', (req, res) => {
  res.send('Working fine');
});

redisKeeper();

app.use(ErrorHandlers.notFound);
app.use(ErrorHandlers.errorHandler);
const PORT = process.env.APP_HOST || 3003;

server.listen(PORT, () => {
  console.log(`App listening on http://localhost:${PORT} `);
});

// here trying
// ther is karol trying
