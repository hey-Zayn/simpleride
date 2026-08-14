'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { notificationSocket } from '@/lib/sockets';

export interface IncomingRideRequest {
    id: string;
    rideId?: string;
    riderId: string;
    passengerName?: string;
    passengerRating?: number;
    pickupAddress: string;
    dropoffAddress: string;
    pickupLat?: number;
    pickupLng?: number;
    dropoffLat?: number;
    dropoffLng?: number;
    vehicleType: string;
    offeredFare: number;
    distanceKm?: number;
    estimatedMins?: number;
}

export function useDriverSockets(vehicleType: string, isOnline: boolean, userId: string) {
    const [activeRequest, setActiveRequest] = useState<IncomingRideRequest | null>(null);
    const [timeLeft, setTimeLeft] = useState<number>(120);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const dismissRequest = useCallback(() => {
        clearTimer();
        setActiveRequest(null);
        setTimeLeft(120);
    }, [clearTimer]);

    const startCountdown = useCallback(() => {
        clearTimer();
        setTimeLeft(120);

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearTimer();
                    setActiveRequest(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [clearTimer]);

    const [assignedRide, setAssignedRide] = useState<any | null>(null);

    useEffect(() => {
        if (!isOnline) {
            if (notificationSocket.connected) notificationSocket.disconnect();
            dismissRequest();
            return;
        }

        if (!notificationSocket.connected) {
            notificationSocket.connect();
        }

        const joinRooms = () => {
            if (userId) {
                notificationSocket.emit('join', { userId });
            }
            const vType = (vehicleType || 'MINI').toUpperCase();
            notificationSocket.emit('join_driver_pool', { vehicleType: vType });
            notificationSocket.emit('join_driver_pool', { vehicleType: vType.toLowerCase() });
            notificationSocket.emit('join_driver_pool', { vehicleType: 'ALL' });
        };

        joinRooms();

        // Listeners
        const handleNewRide = (data: IncomingRideRequest) => {
            const rideId = data.rideId || data.id;
            const normalizedData: IncomingRideRequest = {
                ...data,
                id: rideId,
                rideId: rideId,
            };
            setActiveRequest(normalizedData);
            startCountdown();
        };

        const handleRideRemoved = (data: { rideId: string; reason?: string }) => {
            setActiveRequest((prev) => {
                if (prev?.id === data.rideId || prev?.rideId === data.rideId) {
                    dismissRequest();
                    return null;
                }
                return prev;
            });
        };

        const handleRideAssigned = (data: any) => {
            dismissRequest();
            setAssignedRide((prev: any) => ({
                ...(prev || {}),
                ...data,
                id: data.rideId || data.id,
                status: data.status || 'ACCEPTED',
            }));
        };

        const handleStatusUpdate = (data: { rideId?: string; status: string }) => {
            setAssignedRide((prev: any) => {
                if (!prev) return prev;
                if (data.rideId && prev.id !== data.rideId) return prev;
                return {
                    ...prev,
                    status: data.status,
                };
            });
        };

        notificationSocket.on('connect', joinRooms);
        notificationSocket.on('ride.requested', handleNewRide);
        notificationSocket.on('ride:removed', handleRideRemoved);
        notificationSocket.on('ride:expired', handleRideRemoved);
        notificationSocket.on('ride.accepted', handleRideAssigned);
        notificationSocket.on('ride:accepted', handleRideAssigned);
        notificationSocket.on('ride.assigned', handleRideAssigned);
        notificationSocket.on('ride:status_updated', handleStatusUpdate);

        return () => {
            notificationSocket.off('connect', joinRooms);
            notificationSocket.off('ride.requested', handleNewRide);
            notificationSocket.off('ride:removed', handleRideRemoved);
            notificationSocket.off('ride:expired', handleRideRemoved);
            notificationSocket.off('ride.accepted', handleRideAssigned);
            notificationSocket.off('ride:accepted', handleRideAssigned);
            notificationSocket.off('ride.assigned', handleRideAssigned);
            notificationSocket.off('ride:status_updated', handleStatusUpdate);
            clearTimer();
        };
    }, [isOnline, vehicleType, userId, startCountdown, dismissRequest, clearTimer]);

    return { activeRequest, assignedRide, setAssignedRide, timeLeft, dismissRequest, clearRequest: dismissRequest };
}