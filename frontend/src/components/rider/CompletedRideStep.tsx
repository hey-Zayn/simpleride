'use client';

import { CheckCircle2, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRideStore, Ride } from '@/store/useRideStore';

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
        <div className="w-16 h-16 rounded-full bg-[#F47920]/20 flex items-center justify-center animate-pulse" />
        <div className="absolute w-12 h-12 rounded-full bg-[#141414] text-[#F47920] flex items-center justify-center shadow-lg border-2 border-white">
          <CheckCircle2 className="w-7 h-7 text-[#F47920]" />
        </div>
      </div>

      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-[#141414] tracking-tight">
          You have arrived!
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Thanks for riding with us. Hope you enjoyed your journey!
        </p>
      </div>

      {/* Fare & Route Card Grid */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Total Fare Paid</span>
          <span className="text-xl font-mono font-black text-emerald-600 pt-1">
            PKR {(ride.offeredFare || ride.fare || 0).toLocaleString()}
          </span>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-xs">
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-medium truncate">{ride.pickupAddress || 'Pickup Location'}</p>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <p className="font-medium truncate">{ride.dropoffAddress || 'Destination'}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        type="button"
        onClick={handleFinish}
        className="w-full bg-[#141414] hover:bg-black text-[#F47920] font-bold rounded-xl py-3.5 text-sm shadow-lg"
      >
        <Sparkles className="w-4 h-4 mr-2 text-[#F47920]" />
        Book Another Ride
      </Button>
    </div>
  );
}
