// src/controllers/location.controller.js
import * as locationService from '../services/location.service.js';

export const updateLocation = async (req, res) => {
    try {
        const { lat, lng } = req.body;
        if (lat === undefined || lng === undefined) {
            return res.status(400).json({ success: false, message: 'Latitude and longitude are required' });
        }

        const data = await locationService.updateDriverLocation(req.user.id, lat, lng);
        res.status(200).json({ success: true, message: 'Location updated successfully', data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const goOffline = async (req, res) => {
    try {
        await locationService.removeDriverLocation(req.user.id);
        res.status(200).json({ success: true, message: 'Driver marked offline' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getNearby = async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ success: false, message: 'lat and lng query params are required' });
        }

        const radiusKm = radius ? parseFloat(radius) : 5.0;
        const drivers = await locationService.findNearbyDrivers(parseFloat(lat), parseFloat(lng), radiusKm);

        res.status(200).json({ success: true, data: drivers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};