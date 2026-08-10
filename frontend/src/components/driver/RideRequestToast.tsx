'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, Check, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RideRequest {
  id: string;
  passengerName?: string;
  passengerRating?: number;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
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

const ICON_STROKE = 1.75;

export default function RideRequestToast({
  request,
  onAccept,
  onDecline,
  onCounterOffer,
}: RideRequestToastProps) {
  const expiresIn = request.expiresInSeconds || 120;
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [counterFare, setCounterFare] = useState<number>(request.fare + 50);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline(request.id);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, request.id, onDecline]);

  const progressPercent = (timeLeft / expiresIn) * 100;

  const handleSendCounter = () => {
    if (onCounterOffer && counterFare > 0) {
      onCounterOffer(request, counterFare);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white border border-[#141414] rounded-sm shadow-xl overflow-hidden font-sans">
      {/* Timer Bar */}
      <div className="w-full bg-gray-100 h-1.5">
        <div
          className="bg-[#C1F11D] h-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 space-y-3">
        {/* Header: Passenger & Offered Fare */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4 text-[#C1F11D]" strokeWidth={ICON_STROKE} />
            </div>
            <div>
              <p className="text-xs font-bold font-display text-[#141414]">
                {request.passengerName || 'Passenger'}
              </p>
              <p className="text-[10px] text-gray-500 font-semibold">
                ★ {(request.passengerRating || 4.8).toFixed(1)} Rating
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Rider Offer</p>
            <p className="text-base font-display font-bold text-[#141414]">
              PKR {request.fare.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" strokeWidth={ICON_STROKE} />
            <p className="text-gray-700 font-medium truncate">{request.pickupAddress}</p>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" strokeWidth={ICON_STROKE} />
            <p className="text-gray-700 font-medium truncate">{request.dropoffAddress}</p>
          </div>
        </div>

        {/* Distance & Mins Badge */}
        <div className="flex items-center justify-between text-[11px] bg-gray-50 p-2 rounded-sm border border-gray-200">
          <span className="flex items-center gap-1 font-semibold text-gray-600">
            <Navigation className="w-3 h-3" /> {(request.distanceKm || 3.5).toFixed(1)} km pickup
          </span>
          <span className="flex items-center gap-1 font-semibold text-gray-600">
            <Clock className="w-3 h-3" /> ~{request.estimatedMins || 10} mins
          </span>
        </div>

        {/* Counter Offer Input Box */}
        {showCounterInput && (
          <div className="bg-amber-50 p-2.5 rounded-sm border border-amber-200 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">Your Counter Fare (PKR)</span>
              <span className="text-[10px] text-amber-700 font-semibold">Min: {request.fare}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={counterFare}
                onChange={(e) => setCounterFare(Number(e.target.value) || request.fare)}
                className="w-full text-center font-mono font-bold text-sm bg-white border border-amber-300 rounded-sm py-1 outline-none text-[#141414]"
              />
              <Button
                type="button"
                onClick={handleSendCounter}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-sm py-1 px-3"
              >
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => onDecline(request.id)}
            className="flex-1 rounded-sm text-xs font-bold font-display border-gray-300 hover:bg-gray-100 text-gray-700 py-1.5"
          >
            <X className="w-3.5 h-3.5 mr-1" strokeWidth={ICON_STROKE} />
            Decline
          </Button>

          {onCounterOffer && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCounterInput(!showCounterInput)}
              className="flex-1 rounded-sm text-xs font-bold font-display border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 py-1.5"
            >
              {showCounterInput ? 'Cancel' : 'Counter'}
            </Button>
          )}

          <Button
            type="button"
            onClick={() => onAccept(request)}
            className="flex-1 rounded-sm text-xs font-bold font-display bg-[#C1F11D] hover:bg-[#b2e212] text-[#141414] border border-[#141414]/20 py-1.5"
          >
            <Check className="w-3.5 h-3.5 mr-1" strokeWidth={ICON_STROKE} />
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}