'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
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

const MapView = dynamic(() => import('@/components/rider/MapView'), {
  ssr: false,
  loading: () => <MapViewSkeleton />,
});

export default function RidePage() {
  const { user, token } = useAuthStore();
  const [activePicker, setActivePicker] = useState<'pickup' | 'dropoff' | null>(null);

  const {
    pickup,
    dropoff,
    pickupAddress,
    dropoffAddress,
    nearbyDrivers,
    currentRide,
    setPickup,
    setDropoff,
    acceptCounterBid,
    resetBookingState,
  } = useRideStore();

  const riderId = user?.id || ''; 
  const jwtToken = token || '';

  // 1. Real-Time Socket Connection for Bids and Ride Updates
  const { counterBids, rideStatus, dismissCounterBid } = useRiderSockets(riderId, currentRide?.id || null);

  // 2. Real-Time Live Driver Location Tracking during active trip
  const { driverCoords } = useRiderGpsTracker(
    ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(currentRide?.status || '') ? currentRide?.id || null : null,
    jwtToken
  );

  const handleAcceptBid = async (bidId: string) => {
    if (!currentRide) return;
    try {
      await acceptCounterBid(currentRide.id, bidId);
    } catch (err) {
      console.error('Failed to accept counter bid:', err);
    }
  };

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
    }
  };

  const renderPanelContent = () => {
    if (['SEARCHING', 'REQUESTED'].includes(currentRide?.status || '')) {
      return (
        <SearchingDriverStep
          onTimeout={resetBookingState}
          counterBids={counterBids}
          onAcceptBid={(bid) => handleAcceptBid(bid.bidId)}
          onDeclineBid={(bidId) => dismissCounterBid(bidId)}
        />
      );
    }

    if (currentRide && ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(currentRide.status)) {
      return <MatchedDriverStep ride={currentRide} />;
    }

    if (currentRide?.status === 'COMPLETED') {
      return <CompletedRideStep ride={currentRide} onDone={resetBookingState} />;
    }

    return (
      <BookingPanel
        pickupValue={pickup ? { ...pickup, address: pickupAddress } : null}
        dropoffValue={dropoff ? { ...dropoff, address: dropoffAddress } : null}
        onPickupChange={(coords, addr) => coords && setPickup(coords, addr)}
        onDropoffChange={(coords, addr) => coords && setDropoff(coords, addr)}
        onEnableMapPicker={(mode) => setActivePicker(mode)}
        activeMapPickerMode={activePicker}
        onRequestRideSuccess={() => {}}
      />
    );
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-100 font-sans">
      {/* Map View Full Bleed */}
      <div className="absolute inset-0 z-0">
        <MapView
          pickup={pickup}
          dropoff={dropoff}
          selectingMode={activePicker}
          onSelectLocation={handleSelectLocation}
          driverCoords={driverCoords}
          nearbyDrivers={nearbyDrivers}
          rideStatus={currentRide?.status || rideStatus}
        />
      </div>

      {/* Header */}
      <RiderHeader
        userName={user?.fullName || 'Rider'}
        onLogout={() => {
          useAuthStore.getState().logoutUser();
        }}
      />

      {/* Real Live Driver Offer Toasts Overlay (Fixed top-20 right-4 z-[9999] floating above Leaflet map) */}
      {['SEARCHING', 'REQUESTED'].includes(currentRide?.status || '') && counterBids.length > 0 && (
        <div className="fixed top-20 right-4 z-[9999] w-full max-w-sm space-y-3.5 pointer-events-auto px-3 sm:px-0">
          {counterBids.map((bid) => (
            <DriverOfferToast
              key={bid.bidId}
              driverName={bid.driverName || 'Driver'}
              rating={bid.driverRating || 4.9}
              vehicle="Standard Ride"
              offeredFare={bid.counterFare}
              durationMins={3}
              onAccept={() => handleAcceptBid(bid.bidId)}
              onDecline={() => dismissCounterBid(bid.bidId)}
            />
          ))}
        </div>
      )}

      {/* Full-Width Bottom Overlay Panel (Booking, Searching, Matched Driver, Completed) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full bg-white/95 backdrop-blur-md border-t border-black/10 rounded-t-2xl shadow-2xl p-4 sm:p-6 overflow-y-auto max-h-[85vh] md:max-h-[60vh] no-scrollbar transition-all duration-300 font-sans pointer-events-auto">
        {renderPanelContent()}
      </div>
    </div>
  );
}