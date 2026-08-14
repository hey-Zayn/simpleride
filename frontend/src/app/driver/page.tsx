'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useDriverSockets } from '@/hooks/useDriverSockets';
import { useDriverLocationBroadcaster } from '@/hooks/useDriverLocationBroadcaster';
import RideRequestToast from '@/components/driver/RideRequestToast';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, Navigation, Phone, Settings, XCircle, MapPin, User, Car, Clock, ArrowLeft 
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/useAuthStore';

const RideMap = dynamic(() => import('@/components/map/RideMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-500 font-display">
      Loading Map Engine...
    </div>
  ),
});

import api from '@/lib/axios';

export default function DriverDashboardPage() {
  const { user, token } = useAuthStore();

  // 1. Get Driver GPS location
  const { location: driverLocation, error: locationError } = useDriverLocation(true);

  // 2. Real-Time Socket Connection for Incoming Dispatches
  const driverId = user?.id || ''; 
  const vehicleType = user?.vehicleType || 'MINI'; 
  const isOnline = user?.driverStatus === 'ONLINE' || true;

  const { activeRequest, assignedRide, setAssignedRide, timeLeft, dismissRequest } = useDriverSockets(vehicleType, isOnline, driverId);

  // 3. Active Ride State & OTP Input State
  const [acceptedRide, setAcceptedRide] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentTrip = acceptedRide || assignedRide;

  // 4. Live GPS Streaming (broadcasts idle coordinates when online, or trip coordinates during active trip)
  const jwtToken = token || '';
  useDriverLocationBroadcaster(
    currentTrip?.id || null,
    jwtToken,
    isOnline
  );

  const handleAcceptRequest = async (req: any) => {
    const targetRideId = req.rideId || req.id;
    try {
      const res = await api.patch(`/ride/api/rides/${targetRideId}/accept`);
      const backendData = res.data.data || res.data;
      const rideData = {
        ...(req || {}),
        ...(backendData || {}),
        passengerName: req.passengerName || backendData.passengerName || 'Rider',
        pickupAddress: req.pickupAddress || backendData.pickupAddress || 'Pickup Location',
        dropoffAddress: req.dropoffAddress || backendData.dropoffAddress || 'Drop-off Destination',
        pickupLat: req.pickupLat || backendData.pickupLat || 31.5102,
        pickupLng: req.pickupLng || backendData.pickupLng || 74.3441,
        dropoffLat: req.dropoffLat || backendData.dropoffLat || 31.4705,
        dropoffLng: req.dropoffLng || backendData.dropoffLng || 74.4101,
      };
      setAcceptedRide(rideData);
      dismissRequest();
      toast.success(`Ride accepted for ${req.passengerName || 'Passenger'}!`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Could not accept ride.';
      toast.error(msg);
      dismissRequest();
    }
  };

  const handleCounterOffer = async (req: any, counterFare: number) => {
    const targetRideId = req.rideId || req.id;
    try {
      await api.post(`/ride/api/rides/${targetRideId}/counter`, { counterFare });
      toast.success(`Counter offer of PKR ${counterFare} sent to rider!`);
      dismissRequest();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not send counter offer.';
      toast.error(msg);
    }
  };

  const handleUpdateRideStatus = async (newStatus: string, otpPayload: string | null = null) => {
    if (!currentTrip?.id) return;
    setIsSubmitting(true);
    try {
      const payload: any = { status: newStatus };
      if (otpPayload) payload.otp = otpPayload;

      const res = await api.patch(`/ride/api/rides/${currentTrip.id}/status`, payload);
      const updatedRide = res.data.data || res.data;

      if (newStatus === 'COMPLETED') {
        toast.success('Ride completed successfully! Trip finalized.');
        setAcceptedRide(null);
        setAssignedRide(null);
        setOtpInput('');
      } else {
        setAcceptedRide((prev: any) => ({ ...(prev || {}), ...(updatedRide || {}), status: newStatus }));
        toast.success(`Trip status updated to ${newStatus.replace('_', ' ')}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update trip status';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRide = async () => {
    if (currentTrip?.id) {
      try {
        await api.patch(`/ride/api/rides/${currentTrip.id}/status`, { status: 'CANCELLED' });
        toast.error('Ride cancelled.');
      } catch (err) {
        console.error('Cancel error:', err);
      }
    }
    setAcceptedRide(null);
    setAssignedRide(null);
    setOtpInput('');
  };

  const pickupCoords = currentTrip ? {
    lat: Number(currentTrip.pickupLat ?? currentTrip.pickup?.lat ?? 31.5102),
    lng: Number(currentTrip.pickupLng ?? currentTrip.pickup?.lng ?? 74.3441),
  } : null;

  const dropoffCoords = currentTrip ? {
    lat: Number(currentTrip.dropoffLat ?? currentTrip.dropoff?.lat ?? 31.4705),
    lng: Number(currentTrip.dropoffLng ?? currentTrip.dropoff?.lng ?? 74.4101),
  } : null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-950 font-sans">
      
      {/* Map View Full Bleed */}
      <div className="absolute inset-0 z-0">
        <RideMap
          pickup={pickupCoords}
          dropoff={dropoffCoords}
          driverLocation={driverLocation}
          showDriverMarker={true}
          rideStatus={currentTrip?.status || 'SEARCHING'}
        />

        {/* Real-Time Incoming Ride Request Toast Overlay (Fixed top-20 right-4 z-[9999] floating above Leaflet map) */}
        {!currentTrip && activeRequest && (
          <div className="fixed top-20 right-4 z-[9999] w-full max-w-sm pointer-events-auto px-3 sm:px-0">
            <RideRequestToast
              request={{
                id: activeRequest.id || activeRequest.rideId || 'ride_request',
                rideId: activeRequest.rideId || activeRequest.id,
                pickupAddress: activeRequest.pickupAddress,
                dropoffAddress: activeRequest.dropoffAddress,
                passengerName: activeRequest.passengerName || 'Rider',
                passengerRating: activeRequest.passengerRating || 4.8,
                fare: activeRequest.offeredFare,
                offeredFare: activeRequest.offeredFare,
                distanceKm: activeRequest.distanceKm,
                estimatedMins: activeRequest.estimatedMins,
                expiresInSeconds: timeLeft,
              }}
              onAccept={() => handleAcceptRequest(activeRequest)}
              onDecline={() => dismissRequest()}
              onCounterOffer={(req, fare) => handleCounterOffer(req, fare)}
            />
          </div>
        )}

        {locationError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs px-3 py-1.5 rounded-sm shadow-md">
            GPS Warning: {locationError}
          </div>
        )}
      </div>

      {/* Full-Width Bottom Active Trip Panel Overlay */}
      {currentTrip && (
        <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 p-5 sm:p-6 flex flex-col gap-5 max-h-[85vh] md:max-h-[55vh] overflow-y-auto font-sans pointer-events-auto animate-in slide-in-from-bottom duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3.5 border-b border-zinc-800/80">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCancelRide}
                className="text-zinc-400 hover:text-white transition-colors p-1"
                title="Cancel Ride"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Avatar className="h-11 w-11 border border-zinc-700">
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop" />
                <AvatarFallback className="bg-zinc-800 text-zinc-200 font-bold">RM</AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display text-white tracking-tight">
                    {currentTrip.passengerName || 'Rider'}
                  </h2>
                  <Badge variant="outline" className="border-zinc-700 text-amber-400 text-[10px] font-mono">
                    ★ 4.9
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F47920]" /> Status: <span className="font-bold text-white uppercase">{currentTrip.status}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleCancelRide} variant="outline" className="border-rose-900/50 bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 text-xs">
                <XCircle className="w-4 h-4 mr-1.5" /> Cancel Ride
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Trip Route</span>
              <div className="space-y-2.5 font-medium bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-start gap-2.5 text-zinc-200">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">{currentTrip.pickupAddress}</p>
                </div>
                <div className="flex items-start gap-2.5 text-zinc-300">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">{currentTrip.dropoffAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-1 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
              <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">Agreed Fare</span>
              <span className="text-[#F47920] font-mono font-black text-xl">
                PKR {(currentTrip.offeredFare || currentTrip.fare || currentTrip.finalFare || 0).toLocaleString()}
              </span>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex flex-col justify-center gap-2">
              {currentTrip.status === 'ACCEPTED' && (
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleUpdateRideStatus('ARRIVED')}
                  className="bg-[#F47920] hover:bg-[#e06810] text-white font-bold text-xs rounded-lg py-3 shadow-lg shadow-[#F47920]/20"
                >
                  Mark Arrived at Pickup
                </Button>
              )}

              {currentTrip.status === 'ARRIVED' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                    <span>Ask Rider for 4-Digit OTP</span>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white font-mono text-center font-bold text-base py-2 rounded-lg outline-none focus:border-[#F47920]"
                  />
                  <Button
                    disabled={isSubmitting || otpInput.length < 4}
                    onClick={() => handleUpdateRideStatus('IN_PROGRESS', otpInput)}
                    className="bg-[#F47920] hover:bg-[#e06810] text-white font-bold text-xs rounded-lg py-2.5 shadow-lg shadow-[#F47920]/20"
                  >
                    Start Trip
                  </Button>
                </div>
              )}

              {currentTrip.status === 'IN_PROGRESS' && (
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleUpdateRideStatus('COMPLETED')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg py-3 shadow-lg shadow-emerald-600/20"
                >
                  Complete Trip
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}