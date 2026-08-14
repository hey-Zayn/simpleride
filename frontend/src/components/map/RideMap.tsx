'use client';

import MapView, { Coordinates } from '@/components/rider/MapView';

interface RideMapProps {
  pickup?: Coordinates | null;
  dropoff?: Coordinates | null;
  driverLocation?: Coordinates | null;
  showDriverMarker?: boolean;
  rideStatus?: string;
}

export default function RideMap({
  pickup = null,
  dropoff = null,
  driverLocation = null,
  showDriverMarker = true,
  rideStatus = 'SEARCHING',
}: RideMapProps) {
  return (
    <MapView
      pickup={pickup}
      dropoff={dropoff}
      driverCoords={showDriverMarker ? driverLocation : null}
      rideStatus={rideStatus}
    />
  );
}