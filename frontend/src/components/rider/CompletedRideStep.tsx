'use client';

import { CheckCircle2, MapPin, Navigation, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRideStore, Ride } from '@/store/useRideStore';
import { Card } from '@/components/ui/card';

interface CompletedRideStepProps {
  ride: Ride;
  onDone: () => void;
}

export default function CompletedRideStep({ ride, onDone }: CompletedRideStepProps) {
  const resetBookingState = useRideStore((s) => s.resetBookingState);

  const handleFinish = () => {
    resetBookingState();
    onDone();
  };

  return (
    <div className="w-full flex flex-col items-center py-2 space-y-4 text-center font-sans">
      {/* Icon Badge */}
      <div className="relative flex items-center justify-center">
        <div className="size-16 rounded-full bg-[#C1F11D]/30 flex items-center justify-center animate-pulse" />
        <div className="absolute size-12 rounded-full bg-zinc-950 text-[#C1F11D] flex items-center justify-center shadow-lg border-2 border-white">
          <CheckCircle2 className="size-7 text-[#C1F11D]" />
        </div>
      </div>

      {/* Header */}
      <div>
        <h3 className="font-display text-xl font-extrabold text-zinc-950 tracking-tight">
          You have arrived!
        </h3>
        <p className="font-display text-xs text-zinc-500 font-medium">
          Thanks for riding with us. Hope you enjoyed your journey!
        </p>
      </div>

      {/* Fare & Route Card Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="bg-white border border-zinc-200 rounded-md p-4 flex flex-col justify-center shadow-xs">
          <span className="font-display text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Total Fare Paid
          </span>
          <span className="font-display text-2xl font-extrabold text-zinc-950 pt-1 tabular-nums">
            PKR {(ride.finalFare || ride.offeredFare || ride.fare || 0).toLocaleString()}
          </span>
        </div>

        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-2.5 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-[#C1F11D]/25 text-zinc-950">
              <MapPin className="size-3" />
            </div>
            <p className="font-display text-xs text-zinc-800 line-clamp-1 font-medium">
              {ride.pickupAddress || 'Pickup Location'}
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-emerald-500/15 text-emerald-600">
              <Navigation className="size-3" />
            </div>
            <p className="font-display text-xs text-zinc-800 line-clamp-1 font-medium">
              {ride.dropoffAddress || 'Destination'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        type="button"
        onClick={handleFinish}
        className="w-full bg-[#C1F11D] hover:bg-[#b0dc17] text-black font-display font-bold rounded-md py-3.5 text-sm shadow-md shadow-[#C1F11D]/25 transition-all"
      >
        <Sparkles className="size-4 mr-2" />
        Book Another Ride
      </Button>
    </div>
  );
}

