import 'dotenv/config';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI;
if (!redisUrl) {
    throw new Error('REDIS_URL is required. Use a rediss:// URL for managed TLS Redis.');
}

export const createRedisClient = () => new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
});

const redis = createRedisClient();
redis.on('connect', () => console.log('Connected to Redis (Location Service)'));
redis.on('error', (error) => console.error('Redis connection error:', error.message));

export const closeRedis = async () => {
    if (redis.status !== 'end') await redis.quit();
};

export default redis;