'use client';

import { useEffect, useState } from 'react';
import { Star, Check, X, Car, Bike, Sparkles, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

  const initials = (driverName || 'Driver')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const normalizedVehicle = vehicle.toUpperCase();
  const VehicleIcon =
    normalizedVehicle.includes('BIKE')
      ? Bike
      : normalizedVehicle.includes('COMFORT')
      ? Sparkles
      : Car;

  const vehicleLabel =
    normalizedVehicle === 'BIKE'
      ? 'Bike Ride'
      : normalizedVehicle === 'COMFORT'
      ? 'Comfort Car'
      : normalizedVehicle === 'MINI'
      ? 'Mini Car'
      : vehicle;

  return (
    <aside
      className="w-full max-w-sm overflow-hidden rounded-md border border-border/80 bg-zinc-950/95 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
      aria-live="assertive"
    >
      {/* Top Countdown Bar */}
      <div className="h-1.5 w-full bg-zinc-800">
        <div
          className="h-full bg-[#C1F11D] transition-[width] duration-1000 ease-linear shadow-[0_0_8px_#C1F11D]"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="space-y-3.5 p-4">
        {/* Header Badge & Timer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C1F11D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C1F11D]"></span>
            </span>
            <p className="font-display text-[11px] font-extrabold uppercase tracking-wider text-[#C1F11D]">
              Driver Counter Offer
            </p>
          </div>

          <Badge
            variant="outline"
            className="rounded-sm border-zinc-800 bg-zinc-900 px-2 py-0.5 font-display text-[10px] font-medium text-zinc-300"
          >
            <Clock className="mr-1 size-3 text-[#C1F11D]" />
            {timeLeft}s
          </Badge>
        </div>

        {/* Driver & Offer Details Card */}
        <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/70 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-md border border-[#C1F11D]/30 ring-2 ring-[#C1F11D]/20">
              <AvatarFallback className="rounded-md bg-[#C1F11D]/15 font-display text-sm font-bold text-[#C1F11D]">
                {initials || 'DR'}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-0.5">
              <h4 className="font-display text-sm font-bold text-white tracking-tight">
                {driverName || 'Driver'}
              </h4>
              <p className="flex items-center gap-1.5 font-display text-xs text-zinc-300">
                <VehicleIcon className="size-3.5 text-[#C1F11D]" />
                <span className="font-medium">{vehicleLabel}</span>
              </p>
              <div className="flex items-center gap-1 font-display text-xs text-zinc-400">
                <Star className="size-3 fill-[#C1F11D] text-[#C1F11D]" />
                <span className="font-semibold text-zinc-200">
                  {(rating || 4.9).toFixed(1)}
                </span>
                <span>· ~{durationMins || 3} mins away</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="block font-display text-[10px] font-bold uppercase tracking-wider text-[#C1F11D]/80">
              Counter Fare
            </span>
            <p className="font-display text-lg font-extrabold text-[#C1F11D] tabular-nums tracking-tight">
              PKR {offeredFare.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="min-h-10 rounded-md border-zinc-800 bg-zinc-900/80 font-display font-medium text-zinc-300 hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-400"
            onClick={onDecline}
          >
            <X className="mr-1.5 size-4" /> Decline
          </Button>
          <Button
            className="min-h-10 rounded-md bg-[#C1F11D] font-display font-bold text-black shadow-[0_0_12px_rgba(193,241,29,0.35)] hover:bg-[#b0dc17] hover:scale-[1.02] transition-transform"
            onClick={onAccept}
          >
            <Check className="mr-1.5 size-4 stroke-[2.5]" /> Accept Offer
          </Button>
        </div>
      </div>
    </aside>
  );
}