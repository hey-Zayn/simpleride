import dotenv from 'dotenv';
import app from './app.js';
import prisma from './config/prisma.js';

dotenv.config();
const PORT = Number(process.env.PORT || 4001);
const server = app.listen(PORT, () => console.log(`Auth Service listening on port ${PORT}`));
let shuttingDown = false;
const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; draining auth service.`);
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), Number(process.env.SHUTDOWN_TIMEOUT_MS || 55000)).unref();
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));