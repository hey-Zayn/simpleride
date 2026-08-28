import * as rideService from '../services/ride.service.js';

export const estimate = async (req, res) => {
    try {
        const { pickup, dropoff } = req.body;
        const data = await rideService.estimateRideFare(pickup, dropoff);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const createRide = async (req, res) => {
    try {
        const ride = await rideService.createRideRequest(req.user.id, req.body, req.user?.fullName);
        res.status(201).json({ success: true, message: 'Ride requested with bid', data: ride });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const acceptRideBid = async (req, res) => {
    try {
        const ride = await rideService.acceptRiderBid(req.params.id, req.user.id);
        res.status(200).json({ success: true, message: 'Rider bid accepted', data: ride });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const submitDriverCounterBid = async (req, res) => {
    try {
        const { counterFare, vehicleType, driverName } = req.body;
        const bid = await rideService.driverCounterBid(
            req.params.id,
            req.user.id,
            counterFare,
            driverName || req.user?.fullName,
            vehicleType
        );
        res.status(201).json({ success: true, message: 'Counter bid sent to rider', data: bid });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const acceptCounterBid = async (req, res) => {
    try {
        const { bidId } = req.params;
        const ride = await rideService.acceptDriverCounterBid(req.params.id, bidId, req.user.id);
        res.status(200).json({ success: true, message: 'Counter bid accepted', data: ride });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { status, otp } = req.body;
        const ride = await rideService.updateRideStatus(
            req.params.id,
            req.user.id,
            req.user.role,
            status,
            otp
        );
        res.status(200).json({ success: true, message: `Ride updated to ${status}`, data: ride });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getRide = async (req, res) => {
    try {
        const ride = await rideService.getRideById(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: ride });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const getHistory = async (req, res) => {
    try {
        const rides = await rideService.getUserRideHistory(req.user.id, req.user.role);
        res.status(200).json({ success: true, data: rides });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};