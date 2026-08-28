'use client';

import { useState, useEffect } from 'react';
import {
  Bike,
  Car,
  Sparkles,
  ArrowRight,
  Loader2,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Equal,
  RotateCcw,
} from 'lucide-react';
import { useRideStore } from '@/store/useRideStore';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import FareSectionSkeleton from '../skeletons/FareSectionSkeleton';

interface RideSelectorProps {
  onRequestRideSuccess?: (rideData: any) => void;
}

const VEHICLE_CATEGORIES = [
  { id: 'BIKE', name: 'Bike', icon: Bike },
  { id: 'MINI', name: 'Mini', icon: Car },
  { id: 'COMFORT', name: 'Comfort', icon: Sparkles },
] as const;

const ICON_STROKE = 1.75;
const FARE_STEP = 5;
const MIN_FARE = 10;
const DISABLE_DURATION = 120; // 2 Minutes

function formatPKR(value: number) {
  return Number(value || 0).toLocaleString('en-PK');
}

function RouteEmptyState() {
  return (
    <div className="h-full min-h-[240px] flex flex-col items-center justify-center gap-2.5 text-center border border-dashed border-gray-200 rounded-sm bg-gray-50/70 px-6 py-10">
      <div className="w-10 h-10 rounded-sm bg-[#141414] flex items-center justify-center">
        <Car className="w-5 h-5 text-[#C1F11D]" strokeWidth={ICON_STROKE} />
      </div>
      <p className="text-xs font-display font-bold text-[#141414]/70 uppercase tracking-wide">
        Set your route
      </p>
      <p className="text-[11px] text-gray-400 max-w-[200px] leading-relaxed">
        Add a pickup and drop-off to see vehicle options and fares here.
      </p>
    </div>
  );
}

export default function RideSelector({ onRequestRideSuccess }: RideSelectorProps) {
  const { user } = useAuthStore();
  const {
    pickup,
    dropoff,
    pickupAddress,
    dropoffAddress,
    distanceKm,
    durationMins,
    selectedVehicle,
    setSelectedVehicle,
    offeredFare,
    setOfferedFare,
    backendEstimates,
    requestRide,
    isLoading,
  } = useRideStore();

  const isLoadingStore = useRideStore((state) => state.isLoading);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const isLocationValid = Boolean(pickup?.lat && dropoff?.lat);
  const isEstimating = Boolean(isLocationValid && isLoadingStore);
  const hasEstimate = Boolean(distanceKm && distanceKm > 0);
  const currentRide = useRideStore((state) => state.currentRide);
  const isSearchingDriver = cooldown > 0 || isLoading || currentRide?.status === 'REQUESTED';

  const handleVehicleSelect = (vehicle: 'BIKE' | 'MINI' | 'COMFORT') => {
    setSelectedVehicle(vehicle);
    const newVehicleFare = backendEstimates?.[vehicle];
    if (newVehicleFare) setOfferedFare(newVehicleFare);
  };

  const handleIncrement = () => setOfferedFare(offeredFare + FARE_STEP);
  const handleDecrement = () => setOfferedFare(Math.max(MIN_FARE, offeredFare - FARE_STEP));

  const baseline = backendEstimates?.[selectedVehicle];
  const resetToEstimate = () => {
    if (baseline) setOfferedFare(baseline);
  };

  const handleRequestRide = async () => {
    if (!pickup?.lat || !dropoff?.lat) {
      toast.error('Please select both pickup and drop-off locations.');
      return;
    }

    const payload = {
      pickupLat: Number(pickup.lat),
      pickupLng: Number(pickup.lng),
      dropoffLat: Number(dropoff.lat),
      dropoffLng: Number(dropoff.lng),
      pickupAddress: pickupAddress || 'Pickup Location',
      dropoffAddress: dropoffAddress || 'Drop-off Location',
      vehicleType: selectedVehicle,
      offeredFare: Number(offeredFare),
      distanceKm: Number(distanceKm || 0),
      durationMins: Number(durationMins || 0),
      passengerName: user?.fullName,
    };

    try {
      setCooldown(DISABLE_DURATION);
      const result = await requestRide(payload);
      if (onRequestRideSuccess) {
        onRequestRideSuccess(result);
      }
    } catch (err) {
      console.error('Ride request error:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!isEstimating && !hasEstimate) {
    return <RouteEmptyState />;
  }

  if (isEstimating && !hasEstimate) {
    return <FareSectionSkeleton />;
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="block text-xs font-bold font-display text-gray-500 uppercase tracking-wider mb-2">
          Select vehicle category
        </label>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_CATEGORIES.map((cat) => {
            const isSelected = selectedVehicle === cat.id;
            const estimate = backendEstimates?.[cat.id];
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleVehicleSelect(cat.id)}
                aria-pressed={isSelected}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-sm border transition-all ${
                  isSelected
                    ? 'bg-[#C1F11D] border-[#141414] text-[#141414] shadow-sm font-bold'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={ICON_STROKE} />
                <span className="text-xs font-bold font-display">{cat.name}</span>
                <span className="text-[11px] font-semibold opacity-75">
                  {estimate !== undefined ? `PKR ${formatPKR(estimate)}` : 'Calculating…'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-display text-gray-600">Your offer</span>
            <span className="text-xs text-gray-400">Step: {FARE_STEP} PKR</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={offeredFare <= MIN_FARE}
              aria-label="Decrease offer"
              className="w-10 h-10 shrink-0 rounded-sm bg-white border-gray-300 font-bold text-[#141414] active:bg-gray-100 disabled:opacity-40"
            >
              <Minus className="w-4 h-4" strokeWidth={ICON_STROKE} />
            </Button>

            <div className="flex-1 flex items-center justify-center bg-white border border-gray-300 rounded-sm px-3 py-1.5">
              <span className="text-xs font-bold text-gray-400 mr-1.5">PKR</span>
              <input
                type="number"
                inputMode="numeric"
                value={offeredFare}
                onChange={(e) => setOfferedFare(Number(e.target.value) || 0)}
                className="w-full text-center font-display font-bold text-lg text-[#141414] outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              aria-label="Increase offer"
              className="w-10 h-10 shrink-0 rounded-sm bg-white border-gray-300 font-bold text-[#141414] active:bg-gray-100"
            >
              <Plus className="w-4 h-4" strokeWidth={ICON_STROKE} />
            </Button>
          </div>

          {baseline !== undefined && (
            <div className="flex items-center justify-between pt-0.5">
              {offeredFare === baseline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                  <Equal className="w-3 h-3" strokeWidth={ICON_STROKE} /> Matches the estimate
                </span>
              ) : offeredFare > baseline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6b9e00]">
                  <TrendingUp className="w-3 h-3" strokeWidth={ICON_STROKE} /> Above estimate — faster match likely
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <TrendingDown className="w-3 h-3" strokeWidth={ICON_STROKE} /> Below estimate — may take longer
                </span>
              )}

              {offeredFare !== baseline && (
                <button
                  type="button"
                  onClick={resetToEstimate}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-[#141414] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={ICON_STROKE} /> Reset
                </button>
              )}
            </div>
          )}
        </div>

        <Button
          type="button"
          disabled={isSearchingDriver}
          onClick={handleRequestRide}
          className={`w-full font-display px-4 rounded-sm flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.99] h-auto py-3.5 border border-[#141414]/20 ${
            isSearchingDriver
              ? 'bg-[#C1F11D] text-[#141414] opacity-90 cursor-not-allowed'
              : 'bg-[#141414] hover:bg-black text-[#C1F11D]'
          }`}
        >
          {isSearchingDriver ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#141414]" strokeWidth={ICON_STROKE} />
              <span className="text-xs font-bold text-[#141414]">
                Searching Driver ({formatTime(cooldown)})
              </span>
            </>
          ) : (
            <>
              <span className="text-xs text-center leading-tight text-white font-bold">
                Request ride PKR {formatPKR(offeredFare)}
              </span>
              <ArrowRight className="w-5 h-5 text-[#C1F11D]" strokeWidth={ICON_STROKE} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}