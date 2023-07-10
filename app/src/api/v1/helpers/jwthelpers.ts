import jwt, { verify } from 'jsonwebtoken';
import redis_client from '../../config/redis';
import { Schema, Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'test';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_KEY || 'test';
const jwtRefreshTime = process.env.JWT_REFRESH_TIME || '1d';

async function GenerateRefreshToken(user_id: Types.ObjectId) {
  try {
    const client = await redis_client();
    const refresh_token = jwt.sign({ sub: user_id }, JWT_REFRESH_SECRET, {
      expiresIn: jwtRefreshTime,
    });

    await client.set(user_id.toString(), JSON.stringify({ token: refresh_token }));
    return refresh_token;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export const getIdfromAuth = async (auth: string | undefined) => {
  const token = auth?.split(' ')[1];
  if (token) return verify(token, JWT_SECRET).sub?.toString();
  else throw new Error(`Invalid token`);
};

export default GenerateRefreshToken;
