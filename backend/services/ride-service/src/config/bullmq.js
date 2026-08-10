import { Queue } from 'bullmq';
import { Worker } from 'bullmq';
import prisma from './prisma.js';          // Sibling in src/config/
import { publishEvent } from './rabbitmq.js'; // Sibling in src/config/


const redisConnection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
};

export const biddingQueue = new Queue('bidding-lifecycle-queue', {
    connection: redisConnection,
});

/**
 * Schedule a job to expire searching rides if no driver accepts within 2 minutes.
 * Fires the CHECK_BID_EXPIRATION job after a 120,000ms (2 min) delay.
 */
export const scheduleBidExpiration = async (rideId) => {
    await biddingQueue.add(
        'CHECK_BID_EXPIRATION',
        { rideId },
        {
            delay: 120000, // 2 minutes
            jobId: `expire-ride-${rideId}`,
            removeOnComplete: true,
        }
    );
};

export const cancelBidExpiration = async (rideId) => {
    const jobId = `expire-ride-${rideId}`;
    const job = await biddingQueue.getJob(jobId);

    if (job) {
        await job.remove();
        console.log(`[BullMQ Queue] Successfully canceled expiration job for Ride ID: ${rideId}`);
    } else {
        console.log(`[BullMQ Queue] No pending expiration job found for Ride ID: ${rideId}`);
    }
};