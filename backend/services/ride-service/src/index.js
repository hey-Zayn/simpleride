// src/index.js
import 'dotenv/config';
import app from './app.js';
import prisma from './config/prisma.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import './workers/bidding.worker.js';
import './config/bullmq.js';

const PORT = process.env.PORT || 4004;

const startServer = async () => {
    await connectRabbitMQ();

    const server = app.listen(PORT, () => {
        console.log(`✔ Ride Service is running on port ${process.env.PORT}`);
    });

    const gracefulShutdown = async (signal) => {
        console.log(`Received ${signal}. Shutting down cleanly...`);
        server.close(async () => {
            await prisma.$disconnect();
            console.log('Server and Prisma connection closed.');
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

startServer();