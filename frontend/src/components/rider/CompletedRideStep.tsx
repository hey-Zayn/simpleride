'use client';

import { CheckCircle2, Star, MapPin, Car, Sparkles } from 'lucide-react';
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
    <div className="w-full flex flex-col items-center py-4 space-y-5 text-center font-sans">
      {/* Icon Badge */}
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#C1F11D]/20 flex items-center justify-center animate-pulse" />
        <div className="absolute w-12 h-12 rounded-full bg-[#141414] text-[#C1F11D] flex items-center justify-center shadow-lg">
          <CheckCircle2 className="w-7 h-7 text-[#C1F11D]" />
        </div>
      </div>

      {/* Header */}
      <div>
        <h3 className="text-xl font-display font-black text-[#141414] tracking-tight">
          You have arrived!
        </h3>
        <p className="text-xs text-gray-500 font-medium">
          Thanks for riding with us. Hope you enjoyed your journey!
        </p>
      </div>

      {/* Fare Card */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-sm p-4 space-y-3 text-left">
        <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Fare Paid</span>
          <span className="text-lg font-mono font-black text-emerald-600">
            PKR {ride.offeredFare || ride.fare}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-[#C1F11D] mt-0.5 shrink-0" />
            <p className="font-medium truncate">{ride.pickupAddress}</p>
          </div>
          <div className="flex items-start gap-2 text-gray-700">
            <MapPin className="w-3.5 h-3.5 text-rose-500 mt-0.5 shrink-0" />
            <p className="font-medium truncate">{ride.dropoffAddress}</p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <Button
        onClick={handleFinish}
        className="w-full bg-[#141414] hover:bg-black text-[#C1F11D] font-display font-bold rounded-sm py-3 text-sm shadow-md"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Book Another Ride
      </Button>
    </div>
  );
}
