'use client';

import { useState, useEffect } from 'react';
import { Compass, Clock } from 'lucide-react';
import { useRideStore } from '@/store/useRideStore';

interface SearchingDriverStepProps {
  onTimeout?: () => void;
}

const SEARCH_STATUS_MESSAGES = [
  'Broadcasting request to nearby drivers...',
  'Finding top-rated drivers in your area...',
  'Checking driver availability and routes...',
  'Waiting for driver response...',
];

const TOTAL_SEARCH_SECONDS = 120; // 2 minutes limit

export default function SearchingDriverStep({ onTimeout }: SearchingDriverStepProps) {
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
    <div className="w-full flex flex-col items-center justify-between py-2 space-y-5">
      {/* Top Bar with Timer */}
      <div className="w-full space-y-2">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C1F11D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C1F11D]"></span>
            </span>
            <span className="text-xs font-display font-extrabold text-[#141414] uppercase tracking-wider">
              Searching for Driver
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#141414] text-[#C1F11D] px-3 py-1 rounded-sm text-xs font-mono font-bold shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#C1F11D] h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Animated Sonar Radar Icon */}
      <div className="relative flex items-center justify-center py-4">
        <div className="absolute w-36 h-36 rounded-full border border-[#C1F11D]/50 animate-ping duration-1000" />
        <div className="absolute w-28 h-28 rounded-full border border-[#141414]/10 animate-pulse" />
        <div className="absolute w-20 h-20 rounded-full bg-[#C1F11D]/20 animate-pulse" />

        <div className="relative w-16 h-16 rounded-full bg-[#141414] text-[#C1F11D] flex items-center justify-center shadow-2xl border-2 border-white">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
        </div>
      </div>

      {/* Live Status Message Ticker */}
      <div className="text-center space-y-1">
        <h4 className="font-display font-black text-base text-[#141414] tracking-tight">
          Broadcasting your offer
        </h4>
        <p className="text-xs font-display font-semibold text-gray-500 h-5 transition-all duration-300">
          {SEARCH_STATUS_MESSAGES[statusIndex]}
        </p>
      </div>

      {/* Trip Information Summary */}
      <div className="w-full bg-gray-50 border border-gray-100 rounded-sm p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs border-b border-gray-200/60 pb-2">
          <span className="font-bold text-gray-400 uppercase text-[10px]">Your Offered Fare</span>
          <span className="font-black text-[#141414] text-sm">
            PKR {currentRide?.offeredFare || currentRide?.fare || 0}
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-display">
          <div className="flex items-center gap-2 text-gray-700 truncate">
            <span className="w-2 h-2 rounded-full bg-black shrink-0" />
            <span className="truncate">
              <strong className="text-[#141414]">Pickup:</strong> {pickupAddress || currentRide?.pickupAddress || 'Current Location'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 truncate">
            <span className="w-2 h-2 rounded-full bg-[#C1F11D] border border-black shrink-0" />
            <span className="truncate">
              <strong className="text-[#141414]">Dropoff:</strong> {dropoffAddress || currentRide?.dropoffAddress || 'Destination'}
            </span>
          </div>
        </div>
      </div>

      {/* Informational Footer */}
      <div className="w-full text-center pt-1">
        <p className="text-[11px] text-gray-400 font-medium">
          Request automatically expires in 2 minutes if no driver accepts.
        </p>
      </div>
    </div>
  );
}