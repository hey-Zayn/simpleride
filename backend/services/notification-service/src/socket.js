import { Server } from 'socket.io';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: { origin: '*' },
    });

    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        // Join specific user channel (Rider or Driver)
        socket.on('join', ({ userId }) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`[Socket] User ${userId} joined room user:${userId}`);
            }
        });

        // Drivers join room based on vehicle type to receive local requests
        socket.on('join_driver_pool', ({ vehicleType }) => {
            if (vehicleType) {
                socket.join(`drivers:${vehicleType}`);
                console.log(`[Socket] Driver joined pool drivers:${vehicleType}`);
            }
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};