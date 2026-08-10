import prisma from '../config/prisma.js';
import { publishEvent } from '../config/rabbitmq.js';
import { scheduleBidExpiration, cancelBidExpiration } from '../config/bullmq.js';
import { getNearbyDriversRPC } from '../config/grpcClient.js';
import {
    calculateDistanceInKm,
    calculatePkrFare,
    validateRiderBid,
} from '../utils/distance.utils.js';

const VALID_TRANSITIONS = {
    REQUESTED: ['SEARCHING', 'ACCEPTED', 'CANCELLED', 'EXPIRED'],
    SEARCHING: ['ACCEPTED', 'CANCELLED', 'EXPIRED'],
    ACCEPTED: ['ARRIVED', 'CANCELLED'],
    ARRIVED: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
    EXPIRED: [],
};

/**
 * Returns PKR estimates for BIKE, MINI, and COMFORT tiers.
 */
export const estimateRideFare = async (pickup, dropoff) => {
    const distanceKm = calculateDistanceInKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
    const durationMins = Math.max(1, Math.round((distanceKm / 30) * 60)); // ~30km/h average speed

    const estimates = {
        BIKE: calculatePkrFare('BIKE', distanceKm, durationMins),
        MINI: calculatePkrFare('MINI', distanceKm, durationMins),
        COMFORT: calculatePkrFare('COMFORT', distanceKm, durationMins),
    };

    return {
        distanceKm,
        durationMins,
        estimates,
    };
};

/**
 * Creates ride request with rider custom bid in PKR and fetches nearby drivers via gRPC.
 */
export const createRideRequest = async (riderId, rideData) => {
    const distanceKm = calculateDistanceInKm(
        rideData.pickupLat,
        rideData.pickupLng,
        rideData.dropoffLat,
        rideData.dropoffLng
    );
    const durationMins = Math.max(1, Math.round((distanceKm / 30) * 60));
    const calculatedFare = calculatePkrFare(rideData.vehicleType, distanceKm, durationMins);

    // Validate Rider Custom Bid Bounds (-5% to +15%)
    const bidValidation = validateRiderBid(calculatedFare, rideData.offeredFare);
    if (!bidValidation.isValid) {
        throw new Error(
            `Invalid bid! For a ${calculatedFare} PKR estimated ride, your bid must be between ${bidValidation.minBid} PKR and ${bidValidation.maxBid} PKR.`
        );
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const ride = await prisma.ride.create({
        data: {
            riderId,
            vehicleType: rideData.vehicleType,
            pickupLat: rideData.pickupLat,
            pickupLng: rideData.pickupLng,
            pickupAddress: rideData.pickupAddress,
            dropoffLat: rideData.dropoffLat,
            dropoffLng: rideData.dropoffLng,
            dropoffAddress: rideData.dropoffAddress,
            distanceKm,
            durationMins,
            calculatedFare,
            offeredFare: rideData.offeredFare,
            otp,
            status: 'SEARCHING',
        },
    });

    // Fetch nearby drivers via gRPC from location-service
    let nearbyDrivers = [];
    try {
        nearbyDrivers = await getNearbyDriversRPC({
            latitude: parseFloat(rideData.pickupLat),
            longitude: parseFloat(rideData.pickupLng),
            radius_km: 5.0, // 5 km search radius
            vehicle_type: rideData.vehicleType,
        });
        console.log(`[Ride Service] Found ${nearbyDrivers.length} nearby drivers via gRPC.`);
    } catch (error) {
        console.error('[Ride Service] gRPC Driver Search Error (Non-blocking):', error.message);
    }

    // Schedule delayed expiration job via BullMQ
    await scheduleBidExpiration(ride.id);

    // Publish event for driver dispatch including matched nearby drivers
    await publishEvent('ride.requested', {
        rideId: ride.id,
        riderId: ride.riderId,
        vehicleType: ride.vehicleType,
        pickup: { lat: ride.pickupLat, lng: ride.pickupLng, address: ride.pickupAddress },
        dropoff: { lat: ride.dropoffLat, lng: ride.dropoffLng, address: ride.dropoffAddress },
        offeredFare: ride.offeredFare,
        calculatedFare: ride.calculatedFare,
        nearbyDrivers,
    });

    return {
        ...ride,
        nearbyDrivers,
    };
};

/**
 * Driver accepts the rider's initial bid with Race Condition Guard (Atomic updateMany).
 */
export const acceptRiderBid = async (rideId, driverId) => {
    const existingRide = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!existingRide) throw new Error('Ride not found');

    // Atomic update condition: status must still be SEARCHING or REQUESTED
    const updateResult = await prisma.ride.updateMany({
        where: {
            id: rideId,
            status: { in: ['SEARCHING', 'REQUESTED'] },
        },
        data: {
            driverId,
            finalFare: existingRide.offeredFare, // Lock in initial rider bid
            status: 'ACCEPTED',
        },
    });

    // If count is 0, another driver accepted or expired concurrently
    if (updateResult.count === 0) {
        throw new Error('Too late! Another driver has already accepted this ride.');
    }

    // Fetch the updated record to publish
    const updatedRide = await prisma.ride.findUnique({ where: { id: rideId } });

    // Cancel the expiration job as the ride has been accepted
    await cancelBidExpiration(rideId);

    await publishEvent('ride.accepted', {
        rideId: updatedRide.id,
        riderId: updatedRide.riderId,
        driverId: updatedRide.driverId,
        finalFare: updatedRide.finalFare,
    });

    return updatedRide;
};

/**
 * Driver counters the rider's bid with a custom fare offer.
 */
export const driverCounterBid = async (rideId, driverId, counterFare) => {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) throw new Error('Ride not found');
    if (ride.status !== 'SEARCHING') throw new Error('Ride is not accepting bids');

    const bid = await prisma.bid.create({
        data: {
            rideId,
            driverId,
            counterFare,
            status: 'PENDING',
        },
    });

    await publishEvent('ride.counter_bid', {
        bidId: bid.id,
        rideId: ride.id,
        riderId: ride.riderId,
        driverId,
        counterFare,
    });

    return bid;
};

/**
 * Rider accepts a driver's counter-offer (Atomic Transaction Guard).
 */
export const acceptDriverCounterBid = async (rideId, bidId, riderId) => {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new Error('Ride not found');
    if (ride.riderId !== riderId) throw new Error('Unauthorized action');

    const targetBid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!targetBid || targetBid.rideId !== rideId) throw new Error('Invalid counter bid');

    // Transaction ensures ride status update and bid resolution happen atomically
    const [updateResult] = await prisma.$transaction([
        prisma.ride.updateMany({
            where: {
                id: rideId,
                status: 'SEARCHING', // Must still be searching
            },
            data: {
                driverId: targetBid.driverId,
                finalFare: targetBid.counterFare,
                status: 'ACCEPTED',
            },
        }),
        prisma.bid.update({
            where: { id: bidId },
            data: { status: 'ACCEPTED' },
        }),
        prisma.bid.updateMany({
            where: { rideId, id: { not: bidId } },
            data: { status: 'REJECTED' },
        }),
    ]);

    if (updateResult.count === 0) {
        throw new Error('This ride is no longer available for acceptance.');
    }

    const updatedRide = await prisma.ride.findUnique({ where: { id: rideId } });

    // Cancel the expiration job as the ride has been accepted
    await cancelBidExpiration(rideId);

    await publishEvent('ride.accepted', {
        rideId: updatedRide.id,
        riderId: updatedRide.riderId,
        driverId: updatedRide.driverId,
        finalFare: updatedRide.finalFare,
    });

    return updatedRide;
};

/**
 * Handles state transitions (ARRIVED, IN_PROGRESS with OTP verification, COMPLETED, CANCELLED).
 */
export const updateRideStatus = async (rideId, userId, userRole, newStatus, inputOtp = null) => {
    const ride = await prisma.ride.findUnique({ where: { id: rideId } });

    if (!ride) throw new Error('Ride not found');

    const allowedNextStates = VALID_TRANSITIONS[ride.status] || [];
    if (!allowedNextStates.includes(newStatus)) {
        throw new Error(`Cannot transition ride from '${ride.status}' to '${newStatus}'`);
    }

    if (newStatus === 'CANCELLED') {
        if (ride.riderId !== userId && ride.driverId !== userId) {
            throw new Error('Not authorized to cancel this ride');
        }
        // Cancel the expiration job if the ride is cancelled
        await cancelBidExpiration(rideId);
    } else {
        if (ride.driverId !== userId) {
            throw new Error('Only the assigned driver can update trip status');
        }
    }

    // --- SECURE OTP VERIFICATION FOR TRIP START ---
    if (newStatus === 'IN_PROGRESS') {
        if (!inputOtp) {
            throw new Error('4-digit verification OTP is required to start the trip');
        }
        if (String(ride.otp).trim() !== String(inputOtp).trim()) {
            throw new Error('Invalid verification OTP. Please ask the rider for the correct 4-digit code');
        }
    }

    const updatedRide = await prisma.ride.update({
        where: { id: rideId },
        data: {
            status: newStatus,
        },
    });

    await publishEvent(`ride.${newStatus.toLowerCase()}`, {
        rideId: updatedRide.id,
        riderId: updatedRide.riderId,
        driverId: updatedRide.driverId,
        status: newStatus,
    });

    return updatedRide;
};

export const getRideById = async (rideId, userId) => {
    const ride = await prisma.ride.findUnique({
        where: { id: rideId },
        include: { bids: true },
    });
    if (!ride) throw new Error('Ride not found');

    if (ride.riderId !== userId && ride.driverId !== userId) {
        throw new Error('Unauthorized access');
    }

    return ride;
};

export const getUserRideHistory = async (userId, role) => {
    const whereClause = role === 'DRIVER' ? { driverId: userId } : { riderId: userId };
    return await prisma.ride.findMany({
        where: whereClause,
        include: { bids: true },
        orderBy: { createdAt: 'desc' },
    });
};