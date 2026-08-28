'use client';

import { Separator } from '@/components/ui/separator';
import LocationPicker, { LocationValue, Coordinates } from './LocationPicker';
import RideSelector from './RideSelector';
import { useRideStore } from '@/store/useRideStore';
import { useBreakpoint } from '@/lib/hooks';

interface BookingPanelProps {
  pickupValue?: LocationValue | null;
  dropoffValue?: LocationValue | null;
  onPickupChange?: (coords: Coordinates | null, address: string) => void;
  onDropoffChange?: (coords: Coordinates | null, address: string) => void;
  onEnableMapPicker?: (mode: 'pickup' | 'dropoff') => void;
  activeMapPickerMode?: 'pickup' | 'dropoff' | null;
  onRequestRideSuccess?: (rideData: any) => void;
}

function formatPKR(value: number) {
  return Number(value || 0).toLocaleString('en-PK');
}

export default function BookingPanel({
  pickupValue,
  dropoffValue,
  onPickupChange,
  onDropoffChange,
  onEnableMapPicker,
  activeMapPickerMode,
  onRequestRideSuccess,
}: BookingPanelProps) {
  const { distanceKm, durationMins, offeredFare } = useRideStore();
  const hasEstimate = Boolean(distanceKm && distanceKm > 0);
  const isDesktop = useBreakpoint('lg');

  return (
    <div className="w-full overflow-hidden font-sans">
      <div className="h-[3px] bg-[#C1F11D] rounded-full" />

      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-[var(--border-muted)]">
        <h2 className="text-lg font-display font-bold text-[var(--ink)]">Where are you going?</h2>

        {hasEstimate && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              {distanceKm.toFixed(1)} km · {Math.round(durationMins)} min
            </span>
            <span className="text-sm font-display font-bold text-[var(--ink)] whitespace-nowrap">
              PKR {formatPKR(offeredFare)}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="flex flex-col md:flex-row items-stretch">
          <div className="md:w-[46%] shrink-0">
            <LocationPicker
              pickupValue={pickupValue}
              dropoffValue={dropoffValue}
              onPickupChange={onPickupChange}
              onDropoffChange={onDropoffChange}
              onEnableMapPicker={onEnableMapPicker}
              activeMapPickerMode={activeMapPickerMode}
            />
          </div>

          {isDesktop ? (
            <Separator orientation="vertical" className="hidden md:block bg-[var(--border-muted)]" />
          ) : (
            <Separator className="md:hidden bg-[var(--border-muted)]" />
          )}

          <div className="flex-1">
            <RideSelector onRequestRideSuccess={onRequestRideSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}