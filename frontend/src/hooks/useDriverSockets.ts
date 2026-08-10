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

    useEffect(() => {
        if (!isOnline || !userId) {
            if (notificationSocket.connected) notificationSocket.disconnect();
            dismissRequest();
            return;
        }

        if (!notificationSocket.connected) {
            notificationSocket.connect();
        }

        // Join personal room and vehicle pool room
        notificationSocket.emit('join', { userId });
        notificationSocket.emit('join_driver_pool', { vehicleType: vehicleType.toUpperCase() });

        // Listeners
        const handleNewRide = (data: IncomingRideRequest) => {
            const normalizedData: IncomingRideRequest = {
                ...data,
                id: data.id || data.rideId || 'ride_unknown',
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

        notificationSocket.on('ride.requested', handleNewRide);
        notificationSocket.on('ride:removed', handleRideRemoved);
        notificationSocket.on('ride:expired', handleRideRemoved);

        return () => {
            notificationSocket.off('ride.requested', handleNewRide);
            notificationSocket.off('ride:removed', handleRideRemoved);
            notificationSocket.off('ride:expired', handleRideRemoved);
            clearTimer();
        };
    }, [isOnline, vehicleType, userId, startCountdown, dismissRequest, clearTimer]);

    return { activeRequest, timeLeft, dismissRequest, clearRequest: dismissRequest };
}