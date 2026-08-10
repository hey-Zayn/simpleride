// FIX #6: Replaced hardcoded mock data with real Redis GEOSEARCH via findNearbyDrivers()
import { findNearbyDrivers } from '../services/location.service.js';

/**
 * gRPC handler for GetNearbyDrivers — queries real Redis geo-index for live driver locations.
 */
export const getNearbyDrivers = async (call, callback) => {
    try {
        const { latitude, longitude, radius_km, vehicle_type } = call.request;

        console.log(`[gRPC] GetNearbyDrivers requested at (${latitude}, ${longitude}) within ${radius_km}km. Filter: ${vehicle_type || 'NONE'}`);

        // Query real driver locations from Redis geo-index
        const nearbyDrivers = await findNearbyDrivers(latitude, longitude, radius_km || 5.0);

        // Map Redis result shape { driverId, distanceKm, location: { lat, lng } }
        // to the proto-expected shape: { driver_id, latitude, longitude, vehicle_type, distance_km }
        const drivers = nearbyDrivers.map((d) => ({
            driver_id: d.driverId,
            latitude: d.location.lat,
            longitude: d.location.lng,
            vehicle_type: vehicle_type || 'UNSPECIFIED',
            distance_km: d.distanceKm,
        }));

        // Filter by vehicle_type if a specific type was requested
        const filteredDrivers =
            vehicle_type && vehicle_type !== 'VEHICLE_TYPE_UNSPECIFIED' && vehicle_type !== 'UNSPECIFIED'
                ? drivers.filter((d) => d.vehicle_type === vehicle_type)
                : drivers;

        console.log(`[gRPC] Returning ${filteredDrivers.length} real driver(s) from Redis.`);
        callback(null, { drivers: filteredDrivers });
    } catch (error) {
        console.error('[gRPC Error]', error);
        callback({
            code: 13, // gRPC INTERNAL error code
            message: 'Failed to fetch nearby drivers from Redis',
        });
    }
};
