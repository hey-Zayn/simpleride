import { Worker } from 'bullmq';
import prisma from '../config/prisma.js';
import { publishEvent } from '../config/rabbitmq.js';
import { workerConnection } from '../config/bullmq.js';

export const biddingWorker = new Worker('bidding-lifecycle-queue', async (job) => {
    if (job.name !== 'CHECK_BID_EXPIRATION') return;
    const ride = await prisma.ride.findUnique({ where: { id: job.data.rideId } });
    if (!ride || !['SEARCHING', 'REQUESTED'].includes(ride.status)) return;
    const expiredRide = await prisma.ride.update({ where: { id: ride.id }, data: { status: 'EXPIRED' } });
    await publishEvent('ride.expired', { rideId: expiredRide.id, riderId: expiredRide.riderId, vehicleType: expiredRide.vehicleType, status: 'EXPIRED' });
}, { connection: workerConnection, concurrency: Number(process.env.BULLMQ_CONCURRENCY || 10) });

biddingWorker.on('failed', (job, error) => console.error(`BullMQ job ${job?.id} failed:`, error));
biddingWorker.on('error', (error) => console.error('BullMQ worker connection error:', error));
export const closeBiddingWorker = async () => {
    await biddingWorker.close();
    if (workerConnection.status !== 'end') await workerConnection.quit();
};