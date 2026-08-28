'use client';

import { useEffect, useState } from 'react';
import { notificationSocket } from '@/lib/sockets';

export interface DriverCounterBid {
    bidId: string;
    rideId: string;
    driverId: string;
    driverName?: string;
    driverRating?: number;
    vehicleType?: string;
    counterFare: number;
}

import { useRideStore } from '@/store/useRideStore';

export function useRiderSockets(riderId: string, currentRideId: string | null) {
    const [counterBids, setCounterBids] = useState<DriverCounterBid[]>([]);
    const [rideStatus, setRideStatus] = useState<string>('SEARCHING');

    const dismissCounterBid = (bidId: string) => {
        setCounterBids((prev) => prev.filter((b) => b.bidId !== bidId));
    };

    useEffect(() => {
        if (!riderId || !currentRideId) {
            setCounterBids([]);
            return;
        }

        if (!notificationSocket.connected) {
            notificationSocket.connect();
        }

        // Join personal user room to get notifications
        notificationSocket.emit('join', { userId: riderId });

        const handleCounterBid = (data: DriverCounterBid) => {
            if (!currentRideId || String(data.rideId) === String(currentRideId)) {
                setCounterBids((prev) => {
                    // Prevent duplicates
                    if (prev.some((b) => b.bidId === data.bidId)) return prev;
                    return [...prev, data];
                });
            }
        };

        const handleStatusUpdate = (data: { rideId?: string; status: string; driver?: any; otp?: string; finalFare?: number; [key: string]: any }) => {
            setRideStatus(data.status);
            if (data.status === 'ACCEPTED') {
                setCounterBids([]);
            }
            useRideStore.setState((state) => {
                if (state.currentRide) {
                    return {
                        currentRide: {
                            ...state.currentRide,
                            ...data,
                            id: data.rideId || state.currentRide.id,
                            status: data.status as any,
                            otp: data.otp || state.currentRide.otp,
                            fare: data.finalFare || data.fare || state.currentRide.fare,
                        },
                    };
                }
                return state;
            });
        };

        const handleRideAccepted = (data: any) => {
            setCounterBids([]);
            handleStatusUpdate({ status: 'ACCEPTED', ...data });
        };
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

    return { counterBids, rideStatus, dismissCounterBid };
}