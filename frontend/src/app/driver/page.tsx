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

  const { activeRequest, timeLeft, dismissRequest } = useDriverSockets(vehicleType, isOnline, driverId);

  // 3. Active Ride State & OTP Input State
  const [acceptedRide, setAcceptedRide] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 4. Live GPS Streaming (broadcasts idle coordinates when online, or trip coordinates during active trip)
  const jwtToken = token || '';
  useDriverLocationBroadcaster(
    acceptedRide?.id || null,
    jwtToken,
    isOnline
  );

  const handleAcceptRequest = async (req: any) => {
    try {
      const res = await api.patch(`/ride/api/rides/${req.id}/accept`);
      const rideData = res.data.data || res.data;
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
    try {
      await api.post(`/ride/api/rides/${req.id}/counter`, { counterFare });
      toast.success(`Counter offer of PKR ${counterFare} sent to rider!`);
      dismissRequest();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not send counter offer.';
      toast.error(msg);
    }
  };

  const handleUpdateRideStatus = async (newStatus: string, otpPayload: string | null = null) => {
    if (!acceptedRide?.id) return;
    setIsSubmitting(true);
    try {
      const payload: any = { status: newStatus };
      if (otpPayload) payload.otp = otpPayload;

      const res = await api.patch(`/ride/api/rides/${acceptedRide.id}/status`, payload);
      const updatedRide = res.data.data || res.data;

      if (newStatus === 'COMPLETED') {
        toast.success('Ride completed successfully! Trip finalized.');
        setAcceptedRide(null);
        setOtpInput('');
      } else {
        setAcceptedRide(updatedRide);
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
    if (acceptedRide?.id) {
      try {
        await api.patch(`/ride/api/rides/${acceptedRide.id}/status`, { status: 'CANCELLED' });
        toast.error('Ride cancelled.');
      } catch (err) {
        console.error('Cancel error:', err);
      }
    }
    setAcceptedRide(null);
    setOtpInput('');
  };

  return (
    <div className="flex flex-col w-full h-full overflow-y-auto transition-all duration-500 ease-in-out">
      
      {/* Map View */}
      <div 
        className={`w-full relative transition-all duration-500 ease-in-out shrink-0 ${
          acceptedRide ? 'h-[45vh] lg:h-[55vh]' : 'h-full'
        }`}
      >
        <RideMap
          pickup={acceptedRide ? { lat: acceptedRide.pickupLat || 31.5102, lng: acceptedRide.pickupLng || 74.3441 } : null}
          dropoff={acceptedRide ? { lat: acceptedRide.dropoffLat || 31.4705, lng: acceptedRide.dropoffLng || 74.4101 } : null}
          driverLocation={driverLocation}
          showDriverMarker={true}
        />

        {/* Real-Time Incoming Ride Request Toast Overlay */}
        {!acceptedRide && activeRequest && (
          <div className="absolute bottom-6 right-6 z-20 w-full max-w-sm pointer-events-auto">
            <RideRequestToast
              request={{
                id: activeRequest.id || activeRequest.rideId || 'ride_request',
                pickupAddress: activeRequest.pickupAddress,
                dropoffAddress: activeRequest.dropoffAddress,
                passengerName: activeRequest.passengerName || 'Rider',
                passengerRating: activeRequest.passengerRating || 4.8,
                fare: activeRequest.offeredFare,
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

      {/* Active Trip Drawer Content */}
      {acceptedRide && (
        <div className="w-full bg-zinc-950 border-t border-zinc-800 p-6 flex flex-col gap-6 animate-in slide-in-from-bottom duration-500">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleCancelRide}
                className="text-zinc-400 hover:text-white transition-colors p-1"
                title="Cancel Ride"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Avatar className="h-12 w-12 border border-zinc-700">
                <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop" />
                <AvatarFallback className="bg-zinc-800 text-zinc-200 font-bold">RM</AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-display text-white tracking-tight">
                    {acceptedRide.passengerName || 'Rider'}
                  </h2>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px] font-mono">
                    ★ 4.9
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#C1F11D]" /> Status: <span className="font-bold text-white uppercase">{acceptedRide.status}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleCancelRide} variant="outline" className="border-rose-900/50 bg-rose-950/30 text-rose-400 hover:bg-rose-900/50 text-xs">
                <XCircle className="w-4 h-4 mr-1.5" /> Cancel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Trip Route</span>
              <div className="space-y-3 font-medium">
                <div className="flex items-start gap-2 text-zinc-200">
                  <MapPin className="w-4 h-4 text-[#C1F11D] shrink-0 mt-0.5" />
                  <p className="leading-snug">{acceptedRide.pickupAddress}</p>
                </div>
                <div className="flex items-start gap-2 text-zinc-400">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="leading-snug">{acceptedRide.dropoffAddress}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">Agreed Fare</span>
              <span className="text-emerald-400 font-mono font-bold text-base">
                PKR {acceptedRide.offeredFare || acceptedRide.fare || acceptedRide.finalFare}
              </span>
            </div>

            {/* Lifecycle Action Buttons */}
            <div className="flex flex-col justify-center gap-2">
              {acceptedRide.status === 'ACCEPTED' && (
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleUpdateRideStatus('ARRIVED')}
                  className="bg-[#C1F11D] hover:bg-[#b2e212] text-[#141414] font-bold text-xs rounded-sm py-2.5"
                >
                  Mark Arrived at Pickup
                </Button>
              )}

              {acceptedRide.status === 'ARRIVED' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Enter 4-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="bg-zinc-900 border border-zinc-700 text-white font-mono text-center text-sm py-1.5 rounded-sm outline-none focus:border-[#C1F11D]"
                  />
                  <Button
                    disabled={isSubmitting || otpInput.length < 4}
                    onClick={() => handleUpdateRideStatus('IN_PROGRESS', otpInput)}
                    className="bg-[#C1F11D] hover:bg-[#b2e212] text-[#141414] font-bold text-xs rounded-sm py-2"
                  >
                    Start Trip
                  </Button>
                </div>
              )}

              {acceptedRide.status === 'IN_PROGRESS' && (
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleUpdateRideStatus('COMPLETED')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-sm py-2.5"
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