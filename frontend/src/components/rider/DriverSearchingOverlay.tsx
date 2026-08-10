'use client';

import { useEffect, useRef, useState } from 'react';
import { Bike, Car, Sparkles, X, Check } from 'lucide-react';
import { useRideStore, Ride } from '@/store/useRideStore';
import { Button } from '@/components/ui/button';

const ICON_STROKE = 1.75;
const POLL_INTERVAL_MS = 4000;
const MATCHED_TRANSITION_MS = 1400;

const VEHICLE_ICONS: Record<string, typeof Bike> = {
  BIKE: Bike,
  MINI: Car,
  COMFORT: Sparkles,
};

function formatPKR(value: number) {
  return Number(value || 0).toLocaleString('en-PK');
}

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

interface DriverSearchingOverlayProps {
  onCancelled?: () => void;
  onMatched?: (ride: Ride) => void;
}

// Mount this only while `currentRide.status === 'REQUESTED'` (see the
// integration snippet below). It polls `fetchActiveRide` in the background
// so the store's `currentRide` stays fresh, shows a radar-style searching
// animation, and plays a brief "matched" transition the moment a driver
// accepts — then hands off via `onMatched` so the parent can swap in
// whatever tracking UI comes next.
export default function DriverSearchingOverlay({
  onCancelled,
  onMatched,
}: DriverSearchingOverlayProps) {
  const { currentRide, fetchActiveRide, updateRideStatus, resetBookingState, isLoading } =
    useRideStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [matched, setMatched] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasFiredMatch = useRef(false);

  const rideId = currentRide?.id;

  // Poll ride status while searching
  useEffect(() => {
    if (!rideId || matched) return;

    pollRef.current = setInterval(async () => {
      try {
        const ride = await fetchActiveRide(rideId);
        if (ride.status !== 'REQUESTED') {
          handleMatch(ride);
        }
      } catch (err) {
        // Transient network hiccups shouldn't interrupt the search UI
        console.error('Ride status poll failed:', err);
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId, matched]);

  // Elapsed timer
  useEffect(() => {
    tickRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Covers the edge case where this mounts after the ride was already
  // matched elsewhere (e.g. a page refresh) — skip straight to the transition.
  useEffect(() => {
    if (currentRide && currentRide.status !== 'REQUESTED' && !matched) {
      handleMatch(currentRide);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRide?.status]);

  const handleMatch = (ride: Ride) => {
    if (hasFiredMatch.current) return;
    hasFiredMatch.current = true;

    if (pollRef.current) clearInterval(pollRef.current);
    setMatched(true);
    setTimeout(() => onMatched?.(ride), MATCHED_TRANSITION_MS);
  };

  if (!currentRide) return null;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await updateRideStatus(currentRide.id, 'CANCELLED');
      resetBookingState();
      onCancelled?.();
    } catch {
      // Error already surfaced via toast inside the store
    } finally {
      setIsCancelling(false);
    }
  };

  const VehicleIcon = VEHICLE_ICONS[currentRide.vehicleType] || Car;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[500px] z-40">
      <div className="bg-white/95 backdrop-blur-md border border-black/10 rounded-sm shadow-xl overflow-hidden">
        <div className="h-[3px] bg-[#C1F11D]" />

        <div className="p-4 space-y-4">
          {/* Radar / matched status */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              {!matched && (
                <>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#C1F11D]/40 animate-ping [animation-duration:1.8s]" />
                  <span className="absolute inline-flex h-[70%] w-[70%] rounded-full bg-[#C1F11D]/50 animate-ping [animation-duration:1.8s] [animation-delay:0.3s]" />
                </>
              )}
              <div
                className={`relative w-11 h-11 rounded-sm flex items-center justify-center shadow-sm transition-colors ${
                  matched ? 'bg-[#C1F11D]' : 'bg-[#141414]'
                }`}
              >
                {matched ? (
                  <Check className="w-5 h-5 text-[#141414]" strokeWidth={2.25} />
                ) : (
                  <VehicleIcon className="w-5 h-5 text-[#C1F11D]" strokeWidth={ICON_STROKE} />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-base text-[#141414]">
                {matched ? 'Driver found!' : 'Finding your ride…'}
              </h3>
              <p className="text-xs text-gray-500 font-semibold">
                {matched
                  ? 'Setting up your trip…'
                  : `Matching you with nearby drivers · ${formatElapsed(elapsedSeconds)}`}
              </p>
            </div>
          </div>

          {/* Trip summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-3 space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="flex flex-col items-center pt-1 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
                <span className="w-px flex-1 min-h-[14px] bg-gray-300 my-0.5" />
                <span className="w-1.5 h-1.5 rounded-sm bg-rose-500" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-xs font-semibold text-[#141414] truncate">
                  {currentRide.pickupAddress}
                </p>
                <p className="text-xs font-semibold text-gray-500 truncate">
                  {currentRide.dropoffAddress}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200/80">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {currentRide.vehicleType} · {Number(currentRide.distanceKm).toFixed(1)} km
              </span>
              <span className="text-sm font-display font-bold text-[#141414]">
                PKR {formatPKR(currentRide.offeredFare)}
              </span>
            </div>
          </div>

          {/* Cancel — hidden once a driver has matched */}
          {!matched && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCancelling || isLoading}
              className="w-full rounded-sm border-gray-300 text-[#141414] font-display font-bold py-3 h-auto flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-rose-300 hover:text-rose-600 transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={ICON_STROKE} />
              {isCancelling ? 'Cancelling…' : 'Cancel ride'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}