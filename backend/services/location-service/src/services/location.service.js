// src/services/location.service.js
import redis from '../config/redis.js';

const DRIVERS_GEO_KEY = 'drivers:locations';

/**
 * Updates a driver's live coordinates in Redis Geo Index.
 */
export const updateDriverLocation = async (driverId, lat, lng) => {
    // GEOADD drivers:locations <longitude> <latitude> <member_id>
    await redis.geoadd(DRIVERS_GEO_KEY, lng, lat, driverId);

    // Set an expiration key to automatically clean up inactive drivers after 5 minutes
    await redis.set(`driver:active:${driverId}`, 'online', 'EX', 300);

    return { driverId, lat, lng, timestamp: new Date() };
};

/**
 * Removes a driver's location when going offline.
 */
export const removeDriverLocation = async (driverId) => {
    await redis.zrem(DRIVERS_GEO_KEY, driverId);
    await redis.del(`driver:active:${driverId}`);
    return true;
};

/**
 * Finds all active drivers within a specified radius (in kilometers).
 */
export const findNearbyDrivers = async (lat, lng, radiusKm = 5.0) => {
    // GEOSEARCH drivers:locations FROMLONLAT <lng> <lat> BYRADIUS <radius> km WITHDIST WITHCOORD
    const results = await redis.geosearch(
        DRIVERS_GEO_KEY,
        'FROMLONLAT',
        lng,
        lat,
        'BYRADIUS',
        radiusKm,
        'km',
        'WITHDIST',
        'WITHCOORD',
        'ASC' // Sort closest first
    );

    // Format array response into structured objects
    return results.map(([driverId, distance, coords]) => ({
        driverId,
        distanceKm: parseFloat(distance),
        location: {
            lng: parseFloat(coords[0]),
            lat: parseFloat(coords[1]),
        },
    }));
};