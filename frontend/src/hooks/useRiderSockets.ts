'use client';

import { useEffect, useState } from 'react';
import { notificationSocket } from '@/lib/sockets';

export interface DriverCounterBid {
    bidId: string;
    rideId: string;
    driverId: string;
    driverName?: string;
    driverRating?: number;
    counterFare: number;
}

import { useRideStore } from '@/store/useRideStore';

export function useRiderSockets(riderId: string, currentRideId: string | null) {
    const [counterBids, setCounterBids] = useState<DriverCounterBid[]>([]);
    const [rideStatus, setRideStatus] = useState<string>('SEARCHING');

    useEffect(() => {
        if (!riderId || !currentRideId) return;

        if (!notificationSocket.connected) {
            notificationSocket.connect();
        }

        // Join personal user room to get notifications
        notificationSocket.emit('join', { userId: riderId });

        const handleCounterBid = (data: DriverCounterBid) => {
            if (data.rideId === currentRideId) {
                setCounterBids((prev) => {
                    // Prevent duplicates
                    if (prev.some((b) => b.bidId === data.bidId)) return prev;
                    return [...prev, data];
                });
            }
        };

        const handleStatusUpdate = (data: { rideId?: string; status: string }) => {
            setRideStatus(data.status);
            useRideStore.setState((state) => {
                if (state.currentRide) {
                    return {
                        currentRide: {
                            ...state.currentRide,
                            status: data.status as any,
                        },
                    };
                }
                return state;
            });
        };

        const handleRideAccepted = (data: any) => handleStatusUpdate({ status: 'ACCEPTED', ...data });
        const handleRideArrived = (data: any) => handleStatusUpdate({ status: 'ARRIVED', ...data });
        const handleRideInProgress = (data: any) => handleStatusUpdate({ status: 'IN_PROGRESS', ...data });
        const handleRideCompleted = (data: any) => handleStatusUpdate({ status: 'COMPLETED', ...data });
        const handleRideCancelled = (data: any) => handleStatusUpdate({ status: 'CANCELLED', ...data });

        const handleRideExpired = () => {
            setRideStatus('EXPIRED');
            setCounterBids([]);
            useRideStore.setState({ currentRide: null });
        };

        notificationSocket.on('ride.counter_bid', handleCounterBid);
        notificationSocket.on('ride.accepted', handleRideAccepted);
        notificationSocket.on('ride.arrived', handleRideArrived);
        notificationSocket.on('ride.in_progress', handleRideInProgress);
        notificationSocket.on('ride.completed', handleRideCompleted);
        notificationSocket.on('ride.cancelled', handleRideCancelled);
        notificationSocket.on('ride:status_updated', handleStatusUpdate);
        notificationSocket.on('ride:expired', handleRideExpired);

        return () => {
            notificationSocket.off('ride.counter_bid', handleCounterBid);
            notificationSocket.off('ride.accepted', handleRideAccepted);
            notificationSocket.off('ride.arrived', handleRideArrived);
            notificationSocket.off('ride.in_progress', handleRideInProgress);
            notificationSocket.off('ride.completed', handleRideCompleted);
            notificationSocket.off('ride.cancelled', handleRideCancelled);
            notificationSocket.off('ride:status_updated', handleStatusUpdate);
            notificationSocket.off('ride:expired', handleRideExpired);
        };
    }, [riderId, currentRideId]);

    return { counterBids, rideStatus };
}