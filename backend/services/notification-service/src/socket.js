import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createRedisClient } from './config/redis.js';
import { corsOptions } from './config/cors.js';

let io;
let pubClient;
let subClient;
export const initSocket = (httpServer) => {
    io = new Server(httpServer, { cors: corsOptions, transports: ['websocket', 'polling'] });
    pubClient = createRedisClient();
    subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));
    io.on('connection', (socket) => {
        socket.on('join', ({ userId }) => { if (userId) socket.join(`user:${userId}`); });
        socket.on('join_driver_pool', ({ vehicleType }) => { if (vehicleType) socket.join(`drivers:${vehicleType}`); });
    });
    return io;
};
export const closeSocket = async () => {
    if (io) await new Promise((resolve) => io.close(resolve));
    if (pubClient && pubClient.status !== 'end') await pubClient.quit();
    if (subClient && subClient.status !== 'end') await subClient.quit();
};
export const getIO = () => { if (!io) throw new Error('Socket.io has not been initialized'); return io; };