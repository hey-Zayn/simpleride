'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import { connectLocationSocket, locationSocket } from '@/lib/sockets';

export function useDriverLocationBroadcaster(rideId: string | null, token: string, isOnline: boolean) {
  useEffect(() => {
    if (!isOnline) return;
    const activeToken = token || Cookies.get('token');
    if (!activeToken || !navigator.geolocation) return;
    connectLocationSocket(activeToken);
    if (rideId) locationSocket.emit('join_ride_room', { rideId });
    const broadcast = (position: GeolocationPosition) => locationSocket.emit('update_location', { lat: position.coords.latitude, lng: position.coords.longitude, ...(rideId ? { rideId } : {}) });
    const watchId = navigator.geolocation.watchPosition(broadcast, () => undefined, { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 });
    return () => { navigator.geolocation.clearWatch(watchId); if (rideId) locationSocket.emit('leave_ride_room', { rideId }); };
  }, [isOnline, rideId, token]);
}