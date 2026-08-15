'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationSocket } from '@/lib/sockets';
import { IncomingRideRequest, incomingRideRequestSchema, normalizeDriverRide, rideRemovalSchema, rideStatusUpdateSchema } from '@/types/driver-ride';

interface DriverSocketOptions {
  vehicleType: string;
  isOnline: boolean;
  userId: string;
  onIncomingRide: (ride: IncomingRideRequest) => void;
  onRideAssigned: (payload: unknown) => void;
  onStatusUpdate: (rideId: string, status: ReturnType<typeof rideStatusUpdateSchema.parse>['status']) => void;
  onRideRemoved: (rideId: string) => void;
}

export function useDriverSockets({ vehicleType, isOnline, userId, onIncomingRide, onRideAssigned, onStatusUpdate, onRideRemoved }: DriverSocketOptions) {
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clearTimer = useCallback(() => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }, []);
  const dismissRequest = useCallback(() => { clearTimer(); setTimeLeft(120); }, [clearTimer]);

  useEffect(() => {
    if (!isOnline) { if (notificationSocket.connected) notificationSocket.disconnect(); clearTimer(); return; }
    const joinRooms = () => {
      if (userId) notificationSocket.emit('join', { userId });
      const type = (vehicleType || 'MINI').toUpperCase();
      notificationSocket.emit('join_driver_pool', { vehicleType: type });
      notificationSocket.emit('join_driver_pool', { vehicleType: type.toLowerCase() });
      notificationSocket.emit('join_driver_pool', { vehicleType: 'ALL' });
    };
    if (!notificationSocket.connected) notificationSocket.connect();
    joinRooms();
    const startCountdown = () => { dismissRequest(); timerRef.current = setInterval(() => setTimeLeft((previous) => { if (previous <= 1) { dismissRequest(); return 0; } return previous - 1; }), 1000); };
    const handleNewRide = (payload: unknown) => {
      const normalized = normalizeDriverRide(payload, 'SEARCHING');
      if (!normalized) return;
      const request = incomingRideRequestSchema.safeParse(normalized);
      if (!request.success) return;
      onIncomingRide(request.data); startCountdown();
    };
    const handleRemoved = (payload: unknown) => { const result = rideRemovalSchema.safeParse(payload); if (result.success) { onRideRemoved(result.data.rideId); dismissRequest(); } };
    const handleAssigned = (payload: unknown) => { if (normalizeDriverRide(payload, 'ACCEPTED')) { onRideAssigned(payload); dismissRequest(); } };
    const handleStatus = (payload: unknown) => { const result = rideStatusUpdateSchema.safeParse(payload); if (result.success) onStatusUpdate(result.data.rideId, result.data.status); };
    notificationSocket.on('connect', joinRooms); notificationSocket.on('ride.requested', handleNewRide); notificationSocket.on('ride:removed', handleRemoved); notificationSocket.on('ride:expired', handleRemoved); notificationSocket.on('ride.accepted', handleAssigned); notificationSocket.on('ride:accepted', handleAssigned); notificationSocket.on('ride.assigned', handleAssigned); notificationSocket.on('ride:status_updated', handleStatus);
    return () => { notificationSocket.off('connect', joinRooms); notificationSocket.off('ride.requested', handleNewRide); notificationSocket.off('ride:removed', handleRemoved); notificationSocket.off('ride:expired', handleRemoved); notificationSocket.off('ride.accepted', handleAssigned); notificationSocket.off('ride:accepted', handleAssigned); notificationSocket.off('ride.assigned', handleAssigned); notificationSocket.off('ride:status_updated', handleStatus); clearTimer(); };
  }, [clearTimer, dismissRequest, isOnline, onIncomingRide, onRideAssigned, onRideRemoved, onStatusUpdate, userId, vehicleType]);

  return { timeLeft, dismissRequest };
}

