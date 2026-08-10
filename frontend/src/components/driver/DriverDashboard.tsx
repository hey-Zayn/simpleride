'use client';

import { useState } from 'react';
import RideMap from '@/components/map/RideMap'; // Your existing RideMap component
import { useDriverLocation } from '@/hooks/useDriverLocation';
import RideRequestToast, { RideRequest } from './RideRequestToast';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Power, Navigation, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const ICON_STROKE = 1.75;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const { location: driverLocation, error: locationError } = useDriverLocation(isOnline);
  
  // Incoming ride request state
  const [activeRequest, setActiveRequest] = useState<RideRequest | null>(null);
  const [acceptedRide, setAcceptedRide] = useState<RideRequest | null>(null);

  // Toggle Driver Online / Offline
  const handleToggleOnline = (checked: boolean) => {
    setIsOnline(checked);
    if (checked) {
      toast.success('You are online. Waiting for ride requests...');
      
      // Simulated Incoming Ride Request after 3 seconds for demo
      setTimeout(() => {
        setActiveRequest({
          id: 'req_202',
          passengerName: 'Zainab Ahmed',
          passengerRating: 4.9,
          pickupAddress: 'Liberty Market, Gulberg III, Lahore',
          dropoffAddress: 'Allama Iqbal International Airport',
          fare: 1250,
          distanceKm: 3.1,
          estimatedMins: 10,
          expiresInSeconds: 25,
        });
      }, 3000);
    } else {
      setActiveRequest(null);
      setAcceptedRide(null);
      toast.info('You are offline.');
    }
  };

  const handleAcceptRequest = (req: RideRequest) => {
    setAcceptedRide(req);
    setActiveRequest(null);
    toast.success(`Accepted! Route to ${req.passengerName}'s pickup point updated on map.`);
  };

  const handleDeclineRequest = (id: string) => {
    setActiveRequest(null);
    toast.info('Ride request declined.');
  };

  // Determine pickup/dropoff coordinates to pass into the existing RideMap
  // Note: Replace hardcoded fallback coordinates with your geocoded coords from request payload if available
  const pickupCoords = activeRequest || acceptedRide 
    ? { lat: 31.5204, lng: 74.3587 } // Example: Liberty Market
    : null;

  const dropoffCoords = acceptedRide 
    ? { lat: 31.5216, lng: 74.4036 } // Example: Airport
    : null;

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      {/* 1. MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <RideMap
          pickup={pickupCoords}
          dropoff={dropoffCoords}
          driverLocation={driverLocation}
          showDriverMarker={isOnline}
        />
      </div>

      {/* 2. OVERLAY CONTROLS LAYER */}
      <div className="relative z-10 w-full h-full pointer-events-none p-4 flex flex-col justify-between">
        
        {/* Top Control Bar */}
        <div className="pointer-events-auto flex items-center justify-between bg-white/95 backdrop-blur-md p-3.5 rounded-sm border border-black/10 shadow-lg max-w-md mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                }`}
              />
              {isOnline && (
                <div className="absolute w-5 h-5 rounded-full bg-emerald-500/30 animate-ping" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold font-display text-[#141414]">
                {isOnline ? 'Online & Searching' : 'You are Offline'}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">
                {isOnline
                  ? driverLocation
                    ? `GPS Active (${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)})`
                    : 'Acquiring GPS Signal...'
                  : 'Toggle switch to start receiving rides'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <Power className={`w-4 h-4 ${isOnline ? 'text-emerald-600' : 'text-gray-400'}`} />
            <Switch checked={isOnline} onCheckedChange={handleToggleOnline} />
          </div>
        </div>

        {/* Location Error Warning */}
        {locationError && isOnline && (
          <div className="pointer-events-auto max-w-md mx-auto w-full bg-rose-50 border border-rose-200 p-2.5 rounded-sm text-xs text-rose-700 font-medium">
            GPS Warning: {locationError}. Please enable location services.
          </div>
        )}

        {/* Active Trip Banner (Shown after accepting) */}
        {acceptedRide && (
          <div className="pointer-events-auto max-w-sm ml-auto bg-[#141414] text-white p-4 rounded-sm shadow-2xl border border-black space-y-2">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#C1F11D]">
                Active Trip
              </span>
              <span className="text-xs font-mono font-bold text-gray-300">
                PKR {acceptedRide.fare.toLocaleString()}
              </span>
            </div>
            <p className="text-xs font-display font-bold">
              Navigating to Pickup: {acceptedRide.passengerName}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {acceptedRide.pickupAddress}
            </p>
            <Button
              type="button"
              onClick={() => {
                toast.success('Arrived at pickup location!');
              }}
              className="w-full mt-2 bg-[#C1F11D] text-[#141414] hover:bg-[#b2e212] font-display font-bold text-xs py-2 rounded-sm"
            >
              <Navigation className="w-3.5 h-3.5 mr-1" strokeWidth={ICON_STROKE} />
              Arrived at Pickup
            </Button>
          </div>
        )}

        {/* Incoming Ride Request Toast Stack */}
        <div className="pointer-events-auto self-center md:self-end w-full max-w-sm">
          {activeRequest && !acceptedRide && (
            <RideRequestToast
              request={activeRequest}
              onAccept={handleAcceptRequest}
              onDecline={handleDeclineRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
}