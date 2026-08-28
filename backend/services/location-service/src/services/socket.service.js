import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { updateDriverLocation } from './location.service.js';
import { createRedisClient } from '../config/redis.js';
import { corsOptions } from '../config/cors.js';

let io = null;
let pubClient = null;
let subClient = null;

export const initSocket = (server) => {
    io = new Server(server, {
        path: process.env.LOCATION_SOCKET_PATH || '/socket.io',
        cors: corsOptions,
        transports: ['websocket', 'polling'],
    });
    pubClient = createRedisClient();
    subClient = pubClient.duplicate();
    io.adapter(createAdapter(pubClient, subClient));

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token) return next(new Error('Authentication token missing'));
        try {
            socket.user = jwt.verify(token, process.env.JWT_SECRET);
            return next();
        } catch {
            return next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[SOCKET CONNECTED] User ID: ${socket.user.id} | Socket ID: ${socket.id}`);
        socket.on('join_ride_room', ({ rideId }) => {
            if (!rideId) return;
            const roomName = `ride_${rideId}`;
            socket.join(roomName);
            socket.emit('room_joined', { success: true, room: roomName });
        });
        socket.on('update_location', async ({ lat, lng, rideId }) => {
            try {
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                await updateDriverLocation(socket.user.id, lat, lng);
                if (rideId) {
                    io.to(`ride_${rideId}`).emit('driver_location_updated', {
                        driverId: socket.user.id, lat, lng, timestamp: new Date().toISOString(),
                    });
                }
            } catch (error) {
                console.error('Socket location update error:', error.message);
            }
        });
    });
    return io;
};

export const closeSocket = async () => {
    if (io) await new Promise((resolve) => io.close(resolve));
    if (pubClient && pubClient.status !== 'end') await pubClient.quit();
    if (subClient && subClient.status !== 'end') await subClient.quit();
};
export const getIO = () => { if (!io) throw new Error('Socket.io not initialized'); return io; };