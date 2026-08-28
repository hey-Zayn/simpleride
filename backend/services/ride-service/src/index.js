import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';
import { connectRabbitMQ, closeRabbitMQ } from './config/rabbitmq.js';
import { closeBullQueue } from './config/bullmq.js';
import { closeBiddingWorker } from './workers/bidding.worker.js';

const PORT = Number(process.env.PORT || 4004);
let server;
let shuttingDown = false;
const startServer = async () => {
    await connectRabbitMQ();
    server = app.listen(PORT, () => console.log(`Ride Service listening on port ${PORT}`));
};
startServer().catch((error) => { console.error('Ride service failed to start:', error); process.exit(1); });
const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; draining ride service.`);
    if (!server) process.exit(1);
    server.close(async () => {
        await Promise.allSettled([closeBiddingWorker(), closeBullQueue(), closeRabbitMQ(), prisma.$disconnect()]);
        process.exit(0);
    });
    setTimeout(() => process.exit(1), Number(process.env.SHUTDOWN_TIMEOUT_MS || 55000)).unref();
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));