import prisma from '../config/db.js';
import { sendEmailReceipt } from './email.service.js';
import { getIO } from '../socket.js';



export const logNotification = async (userId, title, body, type = 'PUSH') => {
    try {
        return await prisma.notification.create({
            data: {
                userId,
                title,
                body,
                type,
            },
        });
    } catch (error) {
        console.error('Failed to persist notification:', error.message);
    }
};

export const getUserNotifications = async (userId) => {
    return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
};

export const handleRideRequested = async (data) => {
    console.log(`\n📢 [NOTIFICATION] Ride Requested for Ride ID: ${data.rideId}`);
    await logNotification(data.riderId, 'Ride Requested', 'Looking for nearby drivers.', 'PUSH');

    try {
        const io = getIO();
        const vehicleType = (data.vehicleType || 'MINI').toUpperCase();
        const targetRoom = `drivers:${vehicleType}`;

        const pickupAddress = data.pickup?.address || data.pickupAddress || 'Pickup Location';
        const dropoffAddress = data.dropoff?.address || data.dropoffAddress || 'Dropoff Location';

        const payload = {
            id: data.rideId,
            rideId: data.rideId,
            riderId: data.riderId,
            pickupAddress,
            dropoffAddress,
            vehicleType,
            offeredFare: data.offeredFare,
            calculatedFare: data.calculatedFare,
            distanceKm: data.distanceKm || 5.0,
            estimatedMins: data.durationMins || 15,
        };

        io.to(`drivers:${vehicleType}`).emit('ride.requested', payload);
        io.to(`drivers:${vehicleType.toLowerCase()}`).emit('ride.requested', payload);
        io.to('drivers:ALL').emit('ride.requested', payload);
        console.log(`[Notification Service] Emitted 'ride.requested' for ride ${data.rideId} to driver pool rooms.`);
    } catch (err) {
        console.error('Failed to emit ride.requested socket event:', err.message);
    }
};

export const handleRideAccepted = async (data) => {
    console.log(`\n📢 [NOTIFICATION] Ride Accepted for Ride ID: ${data.rideId}`);
    await logNotification(data.riderId, 'Driver Matched!', `Driver ${data.driverId} is on their way.`, 'PUSH');

    try {
        const io = getIO();
        // Emit to rider
        io.to(`user:${data.riderId}`).emit('ride.accepted', data);
        io.to(`user:${data.riderId}`).emit('ride:accepted', data);

        // Emit to driver
        if (data.driverId) {
            io.to(`user:${data.driverId}`).emit('ride.accepted', data);
            io.to(`user:${data.driverId}`).emit('ride:accepted', data);
            io.to(`user:${data.driverId}`).emit('ride.assigned', data);
        }

        // Notify driver pool to remove ride request card
        const vehicleType = (data.vehicleType || 'MINI').toUpperCase();
        io.to(`drivers:${vehicleType}`).emit('ride:removed', {
            rideId: data.rideId,
            reason: 'ACCEPTED',
        });
        io.to(`drivers:${vehicleType.toLowerCase()}`).emit('ride:removed', {
            rideId: data.rideId,
            reason: 'ACCEPTED',
        });
        io.to('drivers:ALL').emit('ride:removed', {
            rideId: data.rideId,
            reason: 'ACCEPTED',
        });
        console.log(`[Notification Service] Emitted 'ride.accepted' to rider user:${data.riderId} and driver user:${data.driverId}`);
    } catch (err) {
        console.error('Failed to emit ride.accepted socket event:', err.message);
    }
};

export const handleRideCounterBid = async (data) => {
    console.log(`\n📢 [NOTIFICATION] Driver Counter Bid for Ride ID: ${data.rideId}`);
    await logNotification(data.riderId, 'Driver Counter Offer', `Driver offered PKR ${data.counterFare}`, 'PUSH');

    try {
        const io = getIO();
        io.to(`user:${data.riderId}`).emit('ride.counter_bid', {
            bidId: data.bidId,
            rideId: data.rideId,
            driverId: data.driverId,
            counterFare: data.counterFare,
            driverName: data.driverName || 'Nearby Driver',
            driverRating: data.driverRating || 4.9,
        });
        console.log(`[Notification Service] Emitted 'ride.counter_bid' to user:${data.riderId}`);
    } catch (err) {
        console.error('Failed to emit ride.counter_bid socket event:', err.message);
    }
};

export const handleRideArrived = async (data) => {
    console.log(`\n📢 [NOTIFICATION] Driver Arrived for Ride ID: ${data.rideId}`);
    await logNotification(data.riderId, 'Driver Arrived', 'Your driver has arrived at the pickup location.', 'PUSH');

    try {
        const io = getIO();
        io.to(`user:${data.riderId}`).emit('ride.arrived', data);
        io.to(`user:${data.riderId}`).emit('ride:status_updated', { rideId: data.rideId, status: 'ARRIVED' });
        if (data.driverId) {
            io.to(`user:${data.driverId}`).emit('ride:status_updated', { rideId: data.rideId, status: 'ARRIVED' });
        }
    } catch (err) {
        console.error('Failed to emit ride.arrived socket event:', err.message);
    }
};

export const handleRideInProgress = async (data) => {
    console.log(`\n📢 [NOTIFICATION] Trip Started for Ride ID: ${data.rideId}`);
    await logNotification(data.riderId, 'Trip Started', 'Your trip is now in progress. Have a safe journey!', 'PUSH');

    try {
        const io = getIO();
        io.to(`user:${data.riderId}`).emit('ride.in_progress', data);
        io.to(`user:${data.riderId}`).emit('ride:status_updated', { rideId: data.rideId, status: 'IN_PROGRESS' });
        if (data.driverId) {
            io.to(`user:${data.driverId}`).emit('ride:status_updated', { rideId: data.rideId, status: 'IN_PROGRESS' });
        }
    } catch (err) {
        console.error('Failed to emit ride.in_progress socket event:', err.message);
    }
};

export const handleRideCompleted = async (data) => {
    console.log(`\n📢 [NOTIFICATION] Ride Completed for Ride ID: ${data.rideId}`);
    await logNotification(data.riderId, 'Ride Completed', `Your ride is finished. Total fare: PKR ${data.fare}`, 'PUSH');

    try {
        const io = getIO();
        io.to(`user:${data.riderId}`).emit('ride.completed', data);
        io.to(`user:${data.riderId}`).emit('ride:status_updated', { rideId: data.rideId, status: 'COMPLETED' });
        if (data.driverId) {
            io.to(`user:${data.driverId}`).emit('ride:status_updated', { rideId: data.rideId, status: 'COMPLETED' });
        }
    } catch (err) {
        console.error('Failed to emit ride.completed socket event:', err.message);
    }

    // Trigger Gmail Receipt
    await sendEmailReceipt(data);
};

export const handleRideCancelled = async (data) => {
    console.log(`\n📢 [NOTIFICATION] Ride Cancelled for Ride ID: ${data.rideId}`);
    await logNotification(
        data.riderId,
        'Ride Cancelled',
        `Your ride request was cancelled. Reason: ${data.reason || 'Trip cancelled by user.'}`,
        'PUSH'
    );

    try {
        const io = getIO();
        io.to(`user:${data.riderId}`).emit('ride:cancelled', data);
        io.to(`user:${data.riderId}`).emit('ride.cancelled', data);
        if (data.driverId) {
            io.to(`user:${data.driverId}`).emit('ride:cancelled', data);
            io.to(`user:${data.driverId}`).emit('ride.cancelled', data);
        }
    } catch (err) {
        console.error('Failed to emit ride:cancelled socket event:', err.message);
    }
};

export const handleRideExpired = async (data) => {
    const io = getIO();
    if (!io) {
        console.error('[Notification Service] Socket.io not initialized, skipping ride.expired event');
        return;
    }
    const { rideId, riderId, vehicleType } = data;

    console.log(`[Notification Service] Handling ride.expired for Ride ID: ${rideId}`);

    // 1. Send expiration notice to the rider
    io.to(`user:${riderId}`).emit('ride:expired', {
        rideId,
        message: 'Ride search timed out. No drivers accepted in time.',
        status: 'EXPIRED',
    });

    // 2. Clear the ride card from driver bid lists
    const targetRoom = vehicleType ? `drivers:${vehicleType.toUpperCase()}` : 'drivers:ALL';
    io.to(targetRoom).emit('ride:removed', {
        rideId,
        reason: 'EXPIRED',
    });
};