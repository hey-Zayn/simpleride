'use client';

import { useEffect, useState } from 'react';
import { locationSocket, connectLocationSocket } from '@/lib/sockets';

import Cookies from 'js-cookie';

export function useRiderGpsTracker(rideId: string | null, token: string) {
    const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!rideId) return;

        const activeToken = token || Cookies.get('token') || 'rider_socket_auth';
        connectLocationSocket(activeToken);
        locationSocket.emit('join_ride_room', { rideId });

        const handleLocationUpdate = (data: { driverId: string; lat: number | string; lng: number | string }) => {
            if (data && data.lat !== undefined && data.lng !== undefined) {
                setDriverCoords({
                    lat: Number(data.lat),
                    lng: Number(data.lng),
                });
            }
        };

        locationSocket.on('driver_location_updated', handleLocationUpdate);

        return () => {
            locationSocket.off('driver_location_updated', handleLocationUpdate);
        };
    }, [rideId, token]);

    return { driverCoords };
}