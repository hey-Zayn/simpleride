'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { DriverAvailabilityBar } from '@/components/driver/DriverAvailabilityBar';
import { ActiveTripSheet } from '@/components/driver/ActiveTripSheet';
import { DriverMapCanvas } from '@/components/driver/DriverMapCanvas';
import RideRequestToast from '@/components/driver/RideRequestToast';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useDriverLocationBroadcaster } from '@/hooks/useDriverLocationBroadcaster';
import { useDriverSockets } from '@/hooks/useDriverSockets';
import { useAuthStore } from '@/store/useAuthStore';
import { useDriverTripStore } from '@/store/useDriverTripStore';
import { getNextDriverAction } from '@/types/driver-ride';

export default function DriverDashboardPage() {
  const { user, token, updateDriverStatus } = useAuthStore();
  const trip = useDriverTripStore();
  const [otp, setOtp] = useState('');
  const isOnline = user?.driverStatus === 'ONLINE' || user?.driverStatus === 'BUSY';
  const { location: driverLocation, error: locationError } = useDriverLocation(isOnline);
  const availability = !isOnline ? 'OFFLINE' : locationError || !driverLocation ? 'CONNECTING' : 'ONLINE';
  const onRideRemoved = useCallback((rideId: string) => { if (trip.incomingRide?.id === rideId) trip.setIncomingRide(null); }, [trip]);
  const { timeLeft, dismissRequest } = useDriverSockets({ vehicleType: user?.vehicleType ?? 'MINI', isOnline, userId: user?.id ?? '', onIncomingRide: trip.setIncomingRide, onRideAssigned: trip.reconcileRide, onStatusUpdate: trip.reconcileStatus, onRideRemoved });
  useDriverLocationBroadcaster(trip.activeRide?.id ?? null, token ?? '', isOnline);
  const action = getNextDriverAction(trip.activeRide?.status ?? null, trip.activeRide ? 'ONLINE' : availability);
  const run = async (work: () => Promise<unknown>, success: string) => { try { await work(); toast.success(success); } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to complete that action.'); } };
  const pickup = trip.activeRide?.pickupLat !== undefined && trip.activeRide.pickupLng !== undefined ? { lat: trip.activeRide.pickupLat, lng: trip.activeRide.pickupLng } : null;
  const dropoff = trip.activeRide?.dropoffLat !== undefined && trip.activeRide.dropoffLng !== undefined ? { lat: trip.activeRide.dropoffLat, lng: trip.activeRide.dropoffLng } : null;
  return <main className="relative isolate h-screen w-full overflow-hidden bg-background"><DriverMapCanvas pickup={pickup} dropoff={dropoff} driverLocation={driverLocation} isOnline={isOnline} rideStatus={trip.activeRide?.status ?? 'SEARCHING'} /><DriverAvailabilityBar availability={availability} isOnline={isOnline} isSubmitting={trip.isSubmitting} onToggle={() => run(() => updateDriverStatus(isOnline ? 'OFFLINE' : 'ONLINE'), isOnline ? 'You are offline.' : 'You are online.')} />{locationError && <p className="absolute left-1/2 top-24 z-20 -translate-x-1/2 rounded-md bg-destructive/15 px-3 py-2 text-xs text-destructive">GPS: {locationError}</p>}<div className="fixed right-4 top-24 z-[60] w-[calc(100%-2rem)] max-w-sm">{isOnline && !trip.activeRide && trip.incomingRide && <RideRequestToast request={{ id: trip.incomingRide.id, rideId: trip.incomingRide.rideId, passengerName: trip.incomingRide.passengerName, passengerRating: trip.incomingRide.passengerRating, pickupAddress: trip.incomingRide.pickupAddress, dropoffAddress: trip.incomingRide.dropoffAddress, fare: trip.incomingRide.offeredFare, offeredFare: trip.incomingRide.offeredFare, distanceKm: trip.incomingRide.distanceKm, estimatedMins: trip.incomingRide.estimatedMins, expiresInSeconds: timeLeft }} pending={trip.isSubmitting} onAccept={() => { if (trip.incomingRide) run(async () => { await trip.acceptRide(trip.incomingRide!); dismissRequest(); }, 'Ride accepted.'); }} onDecline={() => { trip.setIncomingRide(null); dismissRequest(); }} onCounterOffer={(_, fare) => { if (trip.incomingRide) run(async () => { await trip.counterOffer(trip.incomingRide!, fare); dismissRequest(); }, 'Counter offer sent.'); }} />}</div><ActiveTripSheet ride={trip.activeRide} action={action} otp={otp} pending={trip.isSubmitting} onOtpChange={setOtp} onStatus={(status) => run(async () => { await trip.updateStatus(status, status === 'IN_PROGRESS' ? otp : undefined); if (status === 'IN_PROGRESS') setOtp(''); }, status === 'COMPLETED' ? 'Trip completed.' : 'Trip updated.')} onReturnToIdle={trip.clearTerminalRide} /></main>;
}
