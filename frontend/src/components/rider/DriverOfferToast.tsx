'use client';

import { useEffect, useState } from 'react';
import { Star, Check, X } from 'lucide-react';

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
  const [timeLeft, setTimeLeft] = useState(15); // 15-second decision timer

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

  const progressPercentage = (timeLeft / 15) * 100;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 bg-[#141414] text-white p-4 rounded-sm shadow-2xl border border-white/10 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C1F11D] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C1F11D]"></span>
          </span>
          <p className="text-xs font-bold uppercase tracking-wider text-[#C1F11D]">
            New Driver Counter-Offer
          </p>
        </div>

        {/* Circular Countdown Indicator */}
        <div className="relative w-7 h-7 flex items-center justify-center text-[10px] font-bold">
          <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-gray-700"
              strokeWidth="3"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-[#C1F11D]"
              strokeDasharray={`${progressPercentage}, 100`}
              strokeWidth="3"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span>{timeLeft}s</span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-3 rounded-sm mb-4">
        <div>
          <h4 className="text-sm font-bold">{driverName}</h4>
          <p className="text-xs text-gray-400">{vehicle}</p>
          <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
            <Star className="w-3 h-3 fill-yellow-400" />
            <span>{rating}</span>
            <span className="text-gray-400">• {durationMins} mins away</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-gray-400">Offer</span>
          <p className="text-base font-extrabold text-[#C1F11D]">PKR {offeredFare}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDecline}
          className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-sm font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <X className="w-4 h-4" /> Decline
        </button>
        <button
          onClick={onAccept}
          className="flex-1 py-2 bg-[#C1F11D] hover:bg-[#b0df19] text-[#141414] rounded-sm font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Check className="w-4 h-4" /> Accept Ride
        </button>
      </div>
    </div>
  );
}