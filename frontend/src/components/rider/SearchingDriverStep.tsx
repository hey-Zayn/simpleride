'use client';

import { useState, useEffect } from 'react';
import { Compass, Clock, MapPin, Check, X, ShieldAlert } from 'lucide-react';
import { useRideStore } from '@/store/useRideStore';
import { DriverCounterBid } from '@/hooks/useRiderSockets';

interface SearchingDriverStepProps {
  onTimeout?: () => void;
  counterBids?: DriverCounterBid[];
  onAcceptBid?: (bid: DriverCounterBid) => void;
  onDeclineBid?: (bidId: string) => void;
}

const SEARCH_STATUS_MESSAGES = [
  'Broadcasting request to nearby drivers...',
  'Finding top-rated drivers in your area...',
  'Checking driver availability and routes...',
  'Waiting for driver response...',
];

const TOTAL_SEARCH_SECONDS = 120; // 2 minutes limit

export default function SearchingDriverStep({
  onTimeout,
  counterBids = [],
  onAcceptBid,
  onDeclineBid,
}: SearchingDriverStepProps) {
  const [timeLeft, setTimeLeft] = useState(TOTAL_SEARCH_SECONDS);
  const [statusIndex, setStatusIndex] = useState(0);
  
  const pickupAddress = useRideStore((s) => s.pickupAddress);
  const dropoffAddress = useRideStore((s) => s.dropoffAddress);
  const currentRide = useRideStore((s) => s.currentRide);
  const resetBookingState = useRideStore((s) => s.resetBookingState);

  // 2-Minute Auto-Timeout
  useEffect(() => {
    if (timeLeft <= 0) {
      resetBookingState();
      if (onTimeout) onTimeout();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, resetBookingState, onTimeout]);

  // Status message rotation
  useEffect(() => {
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % SEARCH_STATUS_MESSAGES.length);
    }, 3500);

    return () => clearInterval(statusTimer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / TOTAL_SEARCH_SECONDS) * 100;

  return (
    <div className="w-full flex flex-col space-y-4 font-sans">
      {/* Header & Countdown Timer Bar */}
      <div className="w-full space-y-2.5">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C1F11D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C1F11D]"></span>
            </span>
            <span className="font-display text-xs sm:text-sm font-extrabold text-zinc-950 uppercase tracking-wider">
              Searching for Driver
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-zinc-950 text-[#C1F11D] px-3 py-1.5 rounded-md text-xs font-display font-bold shadow-sm">
            <Clock className="size-3.5 text-[#C1F11D]" />
            <span className="tabular-nums font-mono">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Dynamic Progress Bar with Lime Accent */}
        <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#C1F11D] h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_#C1F11D]"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Radar/Status & Trip Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Radar & Status Box */}
        <div className="flex flex-col items-center justify-center p-5 bg-white border border-zinc-200 rounded-md space-y-3.5 text-center shadow-xs">
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute size-28 rounded-full border border-[#C1F11D]/50 animate-ping duration-1000" />
            <div className="absolute size-20 rounded-full bg-[#C1F11D]/15 animate-pulse" />
            <div className="relative size-14 rounded-full bg-zinc-950 text-[#C1F11D] flex items-center justify-center shadow-lg border-2 border-white">
              <Compass className="size-7 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-display font-bold text-sm sm:text-base text-zinc-950 tracking-tight">
              {counterBids.length > 0 ? 'Review Driver Offers' : 'Broadcasting your offer'}
            </h4>
            <p className="font-display text-xs font-medium text-zinc-500 min-h-[20px] transition-all">
              {counterBids.length > 0
                ? `${counterBids.length} counter offer(s) received. Accept to match immediately!`
                : SEARCH_STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
        </div>

        {/* Trip Information Summary */}
        <div className="bg-white border border-zinc-200 rounded-md p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <span className="font-display font-bold text-zinc-500 uppercase text-[10px] tracking-wider">
              Your Offered Fare
            </span>
            <span className="font-display font-extrabold text-zinc-950 text-base sm:text-xl tabular-nums">
              PKR {(currentRide?.offeredFare || currentRide?.fare || 0).toLocaleString()}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-[#C1F11D]/25 text-zinc-950">
                <MapPin className="size-3" />
              </div>
              <p className="font-display text-xs text-zinc-800 line-clamp-1">
                <strong className="text-zinc-950 font-bold">Pickup:</strong>{' '}
                {pickupAddress || currentRide?.pickupAddress || 'Current Location'}
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-emerald-500/15 text-emerald-600">
                <MapPin className="size-3" />
              </div>
              <p className="font-display text-xs text-zinc-800 line-clamp-1">
                <strong className="text-zinc-950 font-bold">Dropoff:</strong>{' '}
                {dropoffAddress || currentRide?.dropoffAddress || 'Destination'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Counter Offers Section */}
      {counterBids.length > 0 && (
        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-4 space-y-3 shadow-lg animate-in fade-in duration-300 text-white">
          <div className="flex items-center justify-between">
            <span className="font-display text-xs font-bold text-[#C1F11D] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#C1F11D]" /> Driver Counter Offers ({counterBids.length})
            </span>
            <span className="font-display text-[10px] text-zinc-300 font-semibold bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-sm">
              Action Required
            </span>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {counterBids.map((bid) => (
              <div
                key={bid.bidId}
                className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-3 rounded-md shadow-sm"
              >
                <div>
                  <p className="font-display text-xs font-bold text-white">
                    {bid.driverName || 'Driver'}
                  </p>
                  <p className="font-display text-[11px] text-zinc-400 font-medium">
                    {bid.vehicleType || currentRide?.vehicleType || 'MINI'} · ★ {(bid.driverRating || 4.9).toFixed(1)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="font-display text-[9px] uppercase font-bold text-zinc-400">Offer</p>
                    <p className="font-display text-sm font-extrabold text-[#C1F11D] tabular-nums">
                      PKR {bid.counterFare.toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeclineBid && onDeclineBid(bid.bidId)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-md text-xs font-display font-medium transition-colors border border-zinc-700 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => onAcceptBid && onAcceptBid(bid)}
                    className="bg-[#C1F11D] hover:bg-[#b0dc17] text-black px-3.5 py-1.5 rounded-md text-xs font-display font-bold transition-colors shadow-sm shadow-[#C1F11D]/20 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informational Footer */}
      <div className="w-full text-center pt-1">
        <p className="text-[11px] text-gray-400 font-medium">
          Request automatically expires in 2 minutes if no driver accepts.
        </p>
      </div>
    </div>
  );
}