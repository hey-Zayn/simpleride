'use client';

import { useEffect } from 'react';
import { locationSocket, connectLocationSocket } from '@/lib/sockets';

export function useDriverLocationBroadcaster(
    rideId: string | null,
    token: string,
    isOnline: boolean
) {
    useEffect(() => {
        if (!token || !isOnline) return;

        // Connect locationSocket with JWT authorization token
        connectLocationSocket(token);

        // Join ride location room if on an active trip
        if (rideId) {
            locationSocket.emit('join_ride_room', { rideId });
        }

        // Stream GPS coordinates from browser Geolocation API
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                locationSocket.emit('update_location', {
                    lat: latitude,
                    lng: longitude,
                    ...(rideId ? { rideId } : {}),
                });
            },
            (err) => console.error('[GPS Error]', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [rideId, token, isOnline]);
}