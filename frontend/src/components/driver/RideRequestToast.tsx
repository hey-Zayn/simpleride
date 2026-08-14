'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, Check, X, User } from 'lucide-react';

export interface RideRequest {
  id: string;
  rideId?: string;
  passengerName?: string;
  passengerRating?: number;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  offeredFare?: number;
  distanceKm?: number;
  estimatedMins?: number;
  expiresInSeconds?: number;
}

interface RideRequestToastProps {
  request: RideRequest;
  onAccept: (request: RideRequest) => void;
  onDecline: (requestId: string) => void;
  onCounterOffer?: (request: RideRequest, counterFare: number) => void;
}

export default function RideRequestToast({
  request,
  onAccept,
  onDecline,
  onCounterOffer,
}: RideRequestToastProps) {
  const expiresIn = request.expiresInSeconds || 120;
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const baseFare = request.offeredFare || request.fare || 100;
  const [counterFare, setCounterFare] = useState<number>(Math.round(baseFare * 1.15));

  const targetId = request.rideId || request.id;

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline(targetId);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, targetId, onDecline]);

  const progressPercent = (timeLeft / expiresIn) * 100;

  const handleSendCounter = () => {
    if (onCounterOffer && counterFare > 0) {
      onCounterOffer(request, counterFare);
      setShowCounterInput(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[#141414] text-white border border-white/15 rounded-xl shadow-2xl overflow-hidden font-sans pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
      {/* Top Countdown Bar */}
      <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
        <div
          className="bg-[#F47920] h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Header: Passenger Info & Offered Fare */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F47920]/20 border border-[#F47920]/40 text-[#F47920] flex items-center justify-center font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight">
                {request.passengerName || 'Passenger'}
              </p>
              <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                ★ {(request.passengerRating || 4.8).toFixed(1)} Rating
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Rider Offer</p>
            <p className="text-lg font-mono font-black text-[#F47920]">
              PKR {baseFare.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-2 text-xs bg-white/5 p-3 rounded-lg border border-white/10">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-gray-200 font-medium truncate">{request.pickupAddress}</p>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-gray-300 font-medium truncate">{request.dropoffAddress}</p>
          </div>
        </div>

        {/* Distance & Mins Badge */}
        <div className="flex items-center justify-between text-[11px] bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-gray-300 font-mono">
          <span className="flex items-center gap-1">
            <Navigation className="w-3 h-3 text-[#F47920]" /> {(request.distanceKm || 3.5).toFixed(1)} km pickup
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#F47920]" /> ~{request.estimatedMins || 10} mins
          </span>
        </div>

        {/* Counter Offer Input Box */}
        {showCounterInput && (
          <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-500/30 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">Enter Your Counter Fare (PKR)</span>
              <span className="text-[10px] text-amber-400/80 font-mono">Min: {baseFare}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={counterFare}
                onChange={(e) => setCounterFare(Number(e.target.value) || baseFare)}
                className="w-full text-center font-mono font-bold text-sm bg-[#141414] border border-amber-500/50 rounded-lg py-1.5 outline-none text-white focus:border-[#F47920]"
              />
              <button
                type="button"
                onClick={handleSendCounter}
                className="bg-[#F47920] hover:bg-[#e06810] text-white font-bold text-xs rounded-lg py-1.5 px-4 shrink-0 transition-colors"
              >
                Send Counter
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onDecline(targetId)}
            className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-white/10"
          >
            <X className="w-3.5 h-3.5" /> Decline
          </button>

          {onCounterOffer && (
            <button
              type="button"
              onClick={() => setShowCounterInput(!showCounterInput)}
              className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors border border-amber-500/30"
            >
              {showCounterInput ? 'Cancel' : 'Counter'}
            </button>
          )}

          <button
            type="button"
            onClick={() => onAccept(request)}
            className="flex-1 py-2 bg-[#F47920] hover:bg-[#e06810] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-lg shadow-[#F47920]/20"
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
        </div>
      </div>
    </div>
  );
}