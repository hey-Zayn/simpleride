// src/services/socket.service.js
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { updateDriverLocation } from './location.service.js';

let io = null;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    // Socket Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication token missing'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
            socket.user = decoded; // Contains { id, role, email }
            next();
        } catch (err) {
            next(new Error('Invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`[SOCKET CONNECTED] User ID: ${socket.user.id} | Role: ${socket.user.role} | Socket ID: ${socket.id}`);

        // Rider or Family Member joins trip room for tracking
        socket.on('join_ride_room', ({ rideId }) => {
            const roomName = `ride_${rideId}`;
            socket.join(roomName);
            console.log(`User ${socket.user.id} joined room: ${roomName}`);
            socket.emit('room_joined', { success: true, room: roomName });
        });

        // Driver streams live location
        socket.on('update_location', async (data) => {
            try {
                const { lat, lng, rideId } = data;
                if (lat === undefined || lng === undefined) return;

                // 1. Save/Refresh location in Redis (Resets 5-minute TTL)
                await updateDriverLocation(socket.user.id, lat, lng);

                // 2. If driver is on an active ride, broadcast coordinates to ride room (Rider/Family)
                if (rideId) {
                    io.to(`ride_${rideId}`).emit('driver_location_updated', {
                        driverId: socket.user.id,
                        lat,
                        lng,
                        timestamp: new Date().toISOString(),
                    });
                }
            } catch (error) {
                console.error('Socket location update error:', error.message);
            }
        });

        // Handle Disconnect
        socket.on('disconnect', () => {
            console.log(`[SOCKET DISCONNECTED] Socket ID: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};