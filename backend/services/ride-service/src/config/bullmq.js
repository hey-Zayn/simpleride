import { Queue } from 'bullmq';
import { createRedisConnection } from './redis.js';

const queueConnection = createRedisConnection();
export const workerConnection = createRedisConnection();
export const biddingQueue = new Queue('bidding-lifecycle-queue', { connection: queueConnection });

export const scheduleBidExpiration = async (rideId) => biddingQueue.add('CHECK_BID_EXPIRATION', { rideId }, {
    delay: 120000,
    jobId: `expire-ride-${rideId}`,
    removeOnComplete: true,
    removeOnFail: 1000,
});

export const cancelBidExpiration = async (rideId) => {
    const job = await biddingQueue.getJob(`expire-ride-${rideId}`);
    if (job) await job.remove();
};

export const closeBullQueue = async () => {
    await biddingQueue.close();
    if (queueConnection.status !== 'end') await queueConnection.quit();
};