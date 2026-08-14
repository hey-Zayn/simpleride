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
      <div className="w-full space-y-2">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F47920] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F47920]"></span>
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[#141414] uppercase tracking-wider">
              Searching for Driver
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#141414] text-[#F47920] px-3 py-1.5 rounded-lg text-xs font-mono font-black shadow-md">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#F47920] h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Radar/Status & Trip Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Radar & Status Box */}
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-center">
          <div className="relative flex items-center justify-center py-2">
            <div className="absolute w-28 h-28 rounded-full border border-[#F47920]/40 animate-ping duration-1000" />
            <div className="absolute w-20 h-20 rounded-full bg-[#F47920]/15 animate-pulse" />
            <div className="relative w-14 h-14 rounded-full bg-[#141414] text-[#F47920] flex items-center justify-center shadow-lg border-2 border-white">
              <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '5s' }} />
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-sm sm:text-base text-[#141414] tracking-tight">
              {counterBids.length > 0 ? 'Review Driver Offers' : 'Broadcasting your offer'}
            </h4>
            <p className="text-xs font-medium text-gray-500 min-h-[20px] transition-all">
              {counterBids.length > 0
                ? `${counterBids.length} counter offer(s) received. Accept to match immediately!`
                : SEARCH_STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
        </div>

        {/* Trip Information Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <span className="font-extrabold text-gray-400 uppercase text-[10px] tracking-wider">Your Offered Fare</span>
            <span className="font-mono font-black text-[#F47920] text-base sm:text-lg">
              PKR {(currentRide?.offeredFare || currentRide?.fare || 0).toLocaleString()}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="truncate font-medium">
                <strong className="text-[#141414]">Pickup:</strong> {pickupAddress || currentRide?.pickupAddress || 'Current Location'}
              </p>
            </div>
            <div className="flex items-start gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="truncate font-medium">
                <strong className="text-[#141414]">Dropoff:</strong> {dropoffAddress || currentRide?.dropoffAddress || 'Destination'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Counter Offers Section */}
      {counterBids.length > 0 && (
        <div className="w-full bg-amber-50/90 border border-amber-300 rounded-xl p-4 space-y-3 shadow-md animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Driver Counter Offers ({counterBids.length})
            </span>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-2.5 py-0.5 rounded-full">
              Action Required
            </span>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {counterBids.map((bid) => (
              <div
                key={bid.bidId}
                className="flex items-center justify-between bg-white border border-amber-200 p-3 rounded-lg shadow-sm"
              >
                <div>
                  <p className="text-xs font-bold text-[#141414]">
                    {bid.driverName || 'Nearby Driver'}
                  </p>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    ★ {(bid.driverRating || 4.9).toFixed(1)} Rating
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Offer</p>
                    <p className="text-sm font-mono font-black text-[#F47920]">
                      PKR {bid.counterFare.toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeclineBid && onDeclineBid(bid.bidId)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-gray-300 flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Decline
                  </button>

                  <button
                    type="button"
                    onClick={() => onAcceptBid && onAcceptBid(bid)}
                    className="bg-[#F47920] hover:bg-[#e06810] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-md shadow-[#F47920]/20 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Accept
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