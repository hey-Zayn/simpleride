'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChevronUp, MapPin } from 'lucide-react';
import BookingPanel from '@/components/rider/BookingPanel';
import RiderHeader from '@/components/rider/RiderHeader';
import MapViewSkeleton from '@/components/skeletons/MapViewSkeleton';
import SearchingDriverStep from '@/components/rider/SearchingDriverStep';
import MatchedDriverStep from '@/components/rider/MatchedDriverStep';
import CompletedRideStep from '@/components/rider/CompletedRideStep';
import DriverOfferToast from '@/components/rider/DriverOfferToast';

import { useRideStore, Coordinates } from '@/store/useRideStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useRiderSockets } from '@/hooks/useRiderSockets';
import { useRiderGpsTracker } from '@/hooks/useRiderGpsTracker';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const MapView = dynamic(() => import('@/components/rider/MapView'), {
  ssr: false,
  loading: () => <MapViewSkeleton />,
});

export default function RidePage() {
  const { user, token } = useAuthStore();
  const [activePicker, setActivePicker] = useState<'pickup' | 'dropoff' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const {
    pickup,
    dropoff,
    pickupAddress,
    dropoffAddress,
    nearbyDrivers,
    currentRide,
    setPickup,
    setDropoff,
    getEstimate,
    acceptRideBid,
    acceptCounterBid,
  } = useRideStore();

  const riderId = user?.id || ''; 
  const jwtToken = token || '';

  // 1. Real-Time Socket Connection for Bids and Ride Updates
  const { counterBids, rideStatus } = useRiderSockets(riderId, currentRide?.id || null);

  // 2. Real-Time Live Driver Location Tracking during active trip
  const { driverCoords } = useRiderGpsTracker(
    ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(currentRide?.status || '') ? currentRide?.id || null : null,
    jwtToken
  );

  // 3. State-driven drawer opening
  useEffect(() => {
    if (['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(currentRide?.status || '')) {
      setIsDrawerOpen(true);
    }
  }, [currentRide?.status]);

  // 4. Get active incoming bid (if any) from Sockets
  const latestCounterBid = counterBids.length > 0 ? counterBids[counterBids.length - 1] : null;

  const handleSelectLocation = async (coords: Coordinates) => {
    if (!activePicker) return;

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
      );
      const data = await res.json();
      const address = data.display_name || 'Selected Location';

      if (activePicker === 'pickup') setPickup(coords, address);
      else setDropoff(coords, address);
    } catch {
      if (activePicker === 'pickup') setPickup(coords, 'Selected Location');
      else setDropoff(coords, 'Selected Location');
    } finally {
      setActivePicker(null);
      setIsDrawerOpen(true);
    }
  };

  const renderDrawerStepContent = () => {
    if (currentRide?.status === 'REQUESTED') {
      return <SearchingDriverStep onTimeout={() => setIsDrawerOpen(false)} />;
    }

    if (currentRide && ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(currentRide.status)) {
      return <MatchedDriverStep ride={currentRide} />;
    }

    if (currentRide?.status === 'COMPLETED') {
      return <CompletedRideStep ride={currentRide} onDone={() => setIsDrawerOpen(false)} />;
    }

    return (
      <div className="w-full">
        <BookingPanel
          pickupValue={pickup ? { ...pickup, address: pickupAddress } : null}
          dropoffValue={dropoff ? { ...dropoff, address: dropoffAddress } : null}
          onPickupChange={(coords, addr) => coords && setPickup(coords, addr)}
          onDropoffChange={(coords, addr) => coords && setDropoff(coords, addr)}
          onEnableMapPicker={(mode) => {
            setActivePicker(mode);
            setIsDrawerOpen(false);
          }}
          activeMapPickerMode={activePicker}
          onRequestRideSuccess={() => setIsDrawerOpen(true)}
        />
      </div>
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100 font-sans">
      <div className="absolute inset-0 z-0">
        <MapView
          pickup={pickup}
          dropoff={dropoff}
          selectingMode={activePicker}
          onSelectLocation={handleSelectLocation}
          // Blend live driver coordinates into the map markers
          driverCoords={driverCoords}
          nearbyDrivers={nearbyDrivers}
        />
      </div>

      <RiderHeader
        userName={user?.fullName || 'Rider'}
        onLogout={() => {
          useAuthStore.getState().logoutUser();
        }}
      />

      {/* Real Live Driver Offer Toast (Replaces Mock Timer Simulation) */}
      {latestCounterBid && currentRide?.status === 'REQUESTED' && (
        <DriverOfferToast
          driverName={latestCounterBid.driverName || 'Driver'}
          rating={latestCounterBid.driverRating || 4.9}
          vehicle="Standard Ride"
          offeredFare={latestCounterBid.counterFare}
          durationMins={3}
          onAccept={async () => {
            if (!currentRide) return;
            try {
              await acceptCounterBid(currentRide.id, latestCounterBid.bidId);
            } catch (err) {
              console.error('Failed to accept counter bid:', err);
            } finally {
              setIsDrawerOpen(true);
            }
          }}
          onDecline={() => {
            // Dismiss bid locally
          }}
        />
      )}

      {/* Drawer Container */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[500px] z-40">
          <DrawerTrigger asChild>
            <button className="w-full bg-[#141414]/90 backdrop-blur-md border border-white/20 rounded-sm p-3 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-sm bg-[#C1F11D] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#141414]" strokeWidth={1.75} />
                </div>
                <div className="text-left overflow-hidden">
                  <h3 className="font-display font-bold text-sm text-white/95 truncate">
                    {currentRide ? 'Driver Assigned' : 'Where are you going?'}
                  </h3>
                  <p className="font-display text-xs text-white/70 truncate">
                    {pickupAddress || 'Set pickup and drop-off points'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-[#C1F11D] text-[#141414] px-3.5 py-2 rounded-sm text-xs font-display font-bold shrink-0">
                <span>{currentRide ? 'View' : 'Book'}</span>
                <ChevronUp className="w-4 h-4" strokeWidth={1.75} />
              </div>
            </button>
          </DrawerTrigger>
        </div>

        <DrawerContent className="bg-white/95 backdrop-blur-md border-t border-white/20 rounded-t-md shadow-lg h-auto max-h-[85vh] p-0">
          <div className="w-full px-4 sm:px-8 py-3">
            <DrawerHeader className="p-0 pb-1">
              <DrawerTitle className="sr-only">Ride Step Details</DrawerTitle>
            </DrawerHeader>

            <div className="w-full overflow-y-auto no-scrollbar py-2">
              {renderDrawerStepContent()}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}