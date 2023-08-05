import { createClient } from 'redis';
import * as redis from 'redis';

const redisConnectionString = process.env.REDIS_CONNECTION_STRING;

// connect to redis
const nodeEnv = process.env.NODE_ENV || null;
let host = '';
if (nodeEnv === 'development') {
  host = 'localhost';
} else {
  host = 'blink_redis';
}
const redisuri = process.env.REDIS_CONNECTION_STRING;
const getClient = async () => {
  const redis_client = redis.createClient({
    url: redisuri,
  });

  await redis_client.connect();
  redis_client.on('error', (err) => console.log('Redis Client Error /n', err));
  setInterval(() => {
    redis_client.ping();
  }, 30000);

  redis_client.on('connect', () => console.log('redis connected: '));

  return redis_client;
};
export default getClient;
