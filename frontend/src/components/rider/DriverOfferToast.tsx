'use client';

import { useEffect, useState } from 'react';
import { Star, Check, X, Car } from 'lucide-react';

interface DriverOfferProps {
  driverName: string;
  rating: number;
  vehicle: string;
  offeredFare: number;
  durationMins: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function DriverOfferToast({
  driverName,
  rating,
  vehicle,
  offeredFare,
  durationMins,
  onAccept,
  onDecline,
}: DriverOfferProps) {
  const [timeLeft, setTimeLeft] = useState(25); // 25-second decision timer

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onDecline]);

  const progressPercentage = (timeLeft / 25) * 100;

  return (
    <div className="w-full bg-[#141414] text-white p-4 rounded-xl shadow-2xl border border-white/15 animate-in fade-in slide-in-from-top-4 duration-300 font-sans pointer-events-auto">
      {/* Top Countdown Bar */}
      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-3">
        <div
          className="bg-[#F47920] h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F47920] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#F47920]"></span>
          </span>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#F47920]">
            Driver Counter Offer
          </p>
        </div>

        <span className="text-[10px] font-mono font-bold text-gray-400 bg-white/10 px-2 py-0.5 rounded-full">
          {timeLeft}s
        </span>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10 mb-3">
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-white tracking-tight">{driverName}</h4>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-[#F47920]" />
            <span>{vehicle}</span>
          </p>
          <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold pt-0.5">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{(rating || 4.9).toFixed(1)}</span>
            <span className="text-gray-400 font-normal">• ~{durationMins} mins away</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-gray-400 block">Counter Fare</span>
          <p className="text-lg font-mono font-black text-[#F47920]">PKR {offeredFare.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecline}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors border border-white/10"
        >
          <X className="w-3.5 h-3.5" /> Decline
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="flex-1 py-2 bg-[#F47920] hover:bg-[#e06810] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-lg shadow-[#F47920]/20"
        >
          <Check className="w-3.5 h-3.5" /> Accept Offer
        </button>
      </div>
    </div>
  );
}