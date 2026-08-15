'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { LocationCoords } from '@/hooks/useDriverLocation';
import { RideStatus } from '@/types/driver-ride';

const RideMap = dynamic(() => import('@/components/map/RideMap'), { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> });

type Coordinates = { lat: number; lng: number } | null;

interface DriverMapCanvasProps { pickup: Coordinates; dropoff: Coordinates; driverLocation: LocationCoords | null; isOnline: boolean; rideStatus: RideStatus | 'SEARCHING'; }
export function DriverMapCanvas({ pickup, dropoff, driverLocation, isOnline, rideStatus }: DriverMapCanvasProps) {
  return <div className="absolute inset-0 z-0 isolate"><RideMap pickup={pickup} dropoff={dropoff} driverLocation={driverLocation} showDriverMarker={isOnline} rideStatus={rideStatus} /></div>;
}
