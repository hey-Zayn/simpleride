import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;
if (!redisUrl) throw new Error('REDIS_URL is required for Socket.IO scaling.');
export const createRedisClient = () => new Redis(redisUrl, { maxRetriesPerRequest: null, enableReadyCheck: true });