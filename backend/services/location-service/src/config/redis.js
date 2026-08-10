// src/config/redis.js
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URI, {
    maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
    console.log('✔ Connected to Redis (Location Service)');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

export default redis;