'use client';

import { useEffect } from 'react';
import { locationSocket, connectLocationSocket } from '@/lib/sockets';

import Cookies from 'js-cookie';

export function useDriverLocationBroadcaster(
    rideId: string | null,
    token: string,
    isOnline: boolean
) {
    useEffect(() => {
        if (!isOnline) return;

        const activeToken = token || Cookies.get('token') || 'driver_socket_auth';
        // Connect locationSocket with JWT authorization token
        connectLocationSocket(activeToken);

        // Join ride location room if on an active trip
        if (rideId) {
            locationSocket.emit('join_ride_room', { rideId });
        }

        // Stream GPS coordinates from browser Geolocation API
        const broadcastPosition = (pos: GeolocationPosition) => {
            const { latitude, longitude } = pos.coords;
            locationSocket.emit('update_location', {
                lat: latitude,
                lng: longitude,
                ...(rideId ? { rideId } : {}),
            });
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                broadcastPosition,
                (err) => console.warn('[GPS initial Warning]', err.message),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
            );

            const watchId = navigator.geolocation.watchPosition(
                broadcastPosition,
                (err) => console.warn('[GPS stream Warning]', err.message),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );

            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        }
    }, [rideId, token, isOnline]);
}