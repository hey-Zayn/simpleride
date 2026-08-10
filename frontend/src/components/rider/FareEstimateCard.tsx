'use client';

import { Plus, Minus, ArrowRight, Loader2, Bike, Car, Sparkles, TrendingUp, TrendingDown, Equal, RotateCcw } from 'lucide-react';
import { useRideStore } from '@/store/useRideStore';
import { toast } from 'sonner';
import FareEstimateCardSkeleton from '../../components/skeletons/Fareestimatecardskeleton';

interface FareEstimateCardProps {
  onRequestRideSuccess?: (rideData: any) => void;
}

// Icons match the ones used on the driver-registration vehicle picker,
// so the same category reads the same way everywhere in the app.
const VEHICLE_CATEGORIES = [
  { id: 'BIKE', name: 'Bike', icon: Bike },
  { id: 'MINI', name: 'Mini', icon: Car },
  { id: 'COMFORT', name: 'Comfort', icon: Sparkles },
] as const;

const FARE_STEP = 5;
const MIN_FARE = 10;

function formatPKR(value: number) {
  return Number(value || 0).toLocaleString('en-PK');
}

export default function FareEstimateCard({ onRequestRideSuccess }: FareEstimateCardProps) {
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

  // A route has been picked but the estimate hasn't landed yet — show the
  // skeleton instead of nothing, so the card doesn't just pop into place.
  if (pickup && dropoff && (!distanceKm || distanceKm <= 0)) {
    return <FareEstimateCardSkeleton />;
  }

  if (!distanceKm || distanceKm <= 0) return null;

  const handleVehicleSelect = (vehicle: 'BIKE' | 'MINI' | 'COMFORT') => {
    setSelectedVehicle(vehicle);

    // Automatically set offered fare to the selected vehicle's estimated fare
    const newVehicleFare = backendEstimates?.[vehicle];
    if (newVehicleFare) {
      setOfferedFare(newVehicleFare);
    }
  };

  const handleIncrement = () => setOfferedFare(offeredFare + FARE_STEP);
  const handleDecrement = () => setOfferedFare(Math.max(MIN_FARE, offeredFare - FARE_STEP));

  const baseline = backendEstimates?.[selectedVehicle];
  const resetToEstimate = () => {
    if (baseline) setOfferedFare(baseline);
  };

  const handleRequestRide = async () => {
    if (!pickup || !dropoff) {
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
      distanceKm: Number(distanceKm),
      durationMins: Number(durationMins),
    };

    try {
      const result = await requestRide(payload);
      if (onRequestRideSuccess) {
        onRequestRideSuccess(result);
      }
    } catch (err) {
      // Handled in store
    }
  };

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border border-black/10 rounded-sm shadow-sm">
      {/* Thin brand accent, echoes the lime route markers used elsewhere in the app */}
      <div className="h-[3px] bg-[#C1F11D] rounded-t-sm" />

      <div className="p-4 space-y-4">
        {/* Route strip — ties this card back to the pickup/drop-off just chosen */}
        {(pickupAddress || dropoffAddress) && (
          <div className="flex items-start gap-2.5 pb-3 border-b border-gray-100">
            <div className="flex flex-col items-center pt-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#141414]" />
              <span className="w-px flex-1 min-h-[14px] bg-gray-300 my-0.5" />
              <span className="w-1.5 h-1.5 rounded-sm bg-rose-500" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-xs font-semibold text-[#141414] truncate">
                {pickupAddress || 'Pickup location'}
              </p>
              <p className="text-xs font-semibold text-gray-500 truncate">
                {dropoffAddress || 'Drop-off destination'}
              </p>
            </div>
          </div>
        )}

        {/* Trip summary strip */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <span>
            {distanceKm.toFixed(1)} km · {Math.round(durationMins)} min
          </span>
          <span className="text-[#141414] normal-case text-sm font-bold tracking-normal">
            PKR {formatPKR(offeredFare)}
          </span>
        </div>

        {/* Category selection */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
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
                  <Icon className="w-4 h-4" strokeWidth={2} />
                  <span className="text-xs font-bold">{cat.name}</span>
                  <span className="text-[11px] font-semibold opacity-75">
                    {estimate !== undefined ? `PKR ${formatPKR(estimate)}` : 'Calculating…'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Editable fare with + / - buttons */}
        <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600">Your offer</span>
            <span className="text-xs text-gray-400">Step: {FARE_STEP} PKR</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={offeredFare <= MIN_FARE}
              aria-label="Decrease offer"
              className="w-10 h-10 shrink-0 rounded-sm bg-white border border-gray-300 flex items-center justify-center font-bold text-[#141414] active:bg-gray-100 disabled:opacity-40 disabled:active:bg-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

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

            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Increase offer"
              className="w-10 h-10 shrink-0 rounded-sm bg-white border border-gray-300 flex items-center justify-center font-bold text-[#141414] active:bg-gray-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Live comparison against the backend estimate */}
          {baseline !== undefined && (
            <div className="flex items-center justify-between pt-0.5">
              {offeredFare === baseline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                  <Equal className="w-3 h-3" /> Matches the estimate
                </span>
              ) : offeredFare > baseline ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6b9e00]">
                  <TrendingUp className="w-3 h-3" /> Above estimate — faster match likely
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                  <TrendingDown className="w-3 h-3" /> Below estimate — may take longer
                </span>
              )}

              {offeredFare !== baseline && (
                <button
                  type="button"
                  onClick={resetToEstimate}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-[#141414] transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleRequestRide}
          className="w-full bg-[#141414] text-[#C1F11D] font-display font-bold py-3.5 px-4 rounded-sm flex items-center justify-center gap-2 text-sm disabled:opacity-50 transition-all hover:bg-black active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Requesting ride…</span>
            </>
          ) : (
            <>
              <span>Request ride · PKR {formatPKR(offeredFare)}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}