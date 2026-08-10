'use client';

import { useEffect, useState } from 'react';
import { locationSocket, connectLocationSocket } from '@/lib/sockets';

export function useRiderGpsTracker(rideId: string | null, token: string) {
    const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!rideId || !token) return;

        connectLocationSocket(token);
        locationSocket.emit('join_ride_room', { rideId });

        const handleLocationUpdate = (data: { driverId: string; lat: number; lng: number }) => {
            setDriverCoords({ lat: data.lat, lng: data.lng });
        };

        locationSocket.on('driver_location_updated', handleLocationUpdate);

        return () => {
            locationSocket.off('driver_location_updated', handleLocationUpdate);
        };
    }, [rideId, token]);

    return { driverCoords };
}