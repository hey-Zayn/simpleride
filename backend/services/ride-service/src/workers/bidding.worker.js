import { Worker } from 'bullmq';
import prisma from '../config/prisma.js';
import { publishEvent } from '../config/rabbitmq.js';

const redisConnection = {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
};

console.log(`[BullMQ Worker] Initialized and listening on Redis at ${redisConnection.host}:${redisConnection.port}`);

export const biddingWorker = new Worker(
    'bidding-lifecycle-queue',
    async (job) => {
        console.log(`[BullMQ Worker] Executing delayed job ${job.id} for Ride ID: ${job.data.rideId}`);

        if (job.name === 'CHECK_BID_EXPIRATION') {
            const { rideId } = job.data;

            const ride = await prisma.ride.findUnique({ where: { id: rideId } });

            if (ride && (ride.status === 'SEARCHING' || ride.status === 'REQUESTED')) {
                const expiredRide = await prisma.ride.update({
                    where: { id: rideId },
                    data: { status: 'EXPIRED' },
                });

                console.log(`[BullMQ Worker] Ride ${rideId} successfully marked EXPIRED.`);

                await publishEvent('ride.expired', {
                    rideId: expiredRide.id,
                    riderId: expiredRide.riderId,
                    vehicleType: expiredRide.vehicleType, // FIX #2: include vehicleType so notification-service routes ride:removed to correct driver pool room
                    status: 'EXPIRED',
                });
            } else {
                console.log(`[BullMQ Worker] Ride ${rideId} is already in state '${ride?.status}'. Expiration skipped.`);
            }
        }
    },
    { connection: redisConnection }
);

biddingWorker.on('completed', (job) => {
    console.log(`[BullMQ Event] Job ${job.id} completed.`);
});

biddingWorker.on('failed', (job, err) => {
    console.error(`[BullMQ Event] Job ${job?.id} failed with error:`, err);
});

biddingWorker.on('error', (err) => {
    console.error('[BullMQ Event] Worker connection error:', err);
});