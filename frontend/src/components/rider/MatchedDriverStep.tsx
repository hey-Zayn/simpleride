'use client';

import { Star, Car, ShieldCheck, MapPin, Copy, Navigation, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Ride } from '@/store/useRideStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface MatchedDriverStepProps {
  ride: Ride;
}

export default function MatchedDriverStep({ ride }: MatchedDriverStepProps) {
  const statusLabels: Record<string, { label: string; badgeClass: string }> = {
    ACCEPTED: {
      label: 'Driver En Route to Pickup',
      badgeClass: 'border-[#C1F11D]/60 bg-[#C1F11D]/25 text-zinc-950 font-bold',
    },
    ARRIVED: {
      label: 'Driver Arrived at Pickup',
      badgeClass: 'border-emerald-300 bg-emerald-50 text-emerald-700 font-bold',
    },
    IN_PROGRESS: {
      label: 'Trip In Progress',
      badgeClass: 'border-blue-300 bg-blue-50 text-blue-700 font-bold',
    },
    COMPLETED: {
      label: 'Trip Completed',
      badgeClass: 'border-zinc-900 bg-zinc-900 text-white font-bold',
    },
  };

  const currentStatus = statusLabels[ride.status] || {
    label: ride.status,
    badgeClass: 'border-zinc-200 bg-zinc-100 text-zinc-800',
  };

  const initials = (ride.driver?.name || 'Driver')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="w-full flex flex-col space-y-4 font-sans">
      {/* Header Status */}
      <div className="w-full flex items-center justify-between border-b border-zinc-200 pb-3">
        <div>
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">
            Trip Status
          </span>
          <span className="font-display text-sm sm:text-base font-extrabold text-zinc-950 uppercase tracking-tight">
            {currentStatus.label}
          </span>
        </div>
        <Badge
          variant="outline"
          className={`rounded-sm font-display text-xs px-2.5 py-1 ${currentStatus.badgeClass}`}
        >
          {ride.status === 'ACCEPTED' ? 'Arriving Soon' : currentStatus.label}
        </Badge>
      </div>

      {/* Main Grid: Driver Profile & Vehicle Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver Profile & OTP Badge */}
        <div className="bg-white p-4 rounded-md border border-zinc-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="size-12 rounded-md border-2 border-white shadow-sm ring-2 ring-[#C1F11D]/40">
                <AvatarFallback className="rounded-md bg-[#C1F11D] font-display text-sm font-extrabold text-black">
                  {initials || 'DR'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 bg-zinc-950 text-[#C1F11D] p-0.5 rounded-full ring-2 ring-white">
                <ShieldCheck className="size-3" />
              </span>
            </div>
            <div>
              <h4 className="font-display text-sm font-bold text-zinc-950">
                {ride.driver?.name || 'Assigned Driver'}
              </h4>
              <div className="flex items-center gap-1 font-display text-xs text-zinc-500 font-medium pt-0.5">
                <Star className="size-3.5 fill-[#C1F11D] text-[#C1F11D]" />
                <span className="font-bold text-zinc-950">4.9</span>
                <span>(120+ rides)</span>
              </div>
            </div>
          </div>

          {/* OTP PIN Code display for Rider */}
          {ride.otp && ride.status !== 'COMPLETED' && (
            <div className="flex flex-col items-end gap-1">
              <span className="font-display text-[10px] font-bold uppercase text-zinc-500">
                4-Digit Start OTP
              </span>
              <button
                type="button"
                onClick={() => {
                  if (ride.otp) {
                    navigator.clipboard.writeText(ride.otp);
                    toast.success(`OTP ${ride.otp} copied to clipboard!`);
                  }
                }}
                title="Click to copy OTP"
                className="flex items-center gap-1.5 bg-[#C1F11D] hover:bg-[#b0dc17] text-black px-3 py-1 rounded-md shadow-sm transition-all cursor-pointer group font-display"
              >
                <span className="text-base font-mono font-black tracking-widest">{ride.otp}</span>
                <Copy className="size-3.5 opacity-70 group-hover:opacity-100" />
              </button>
            </div>
          )}
        </div>

        {/* Vehicle Specs & Route Row */}
        <div className="bg-white p-4 rounded-md border border-zinc-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-md bg-zinc-950 text-[#C1F11D] flex items-center justify-center font-bold">
              <Car className="size-5" />
            </div>
            <div>
              <p className="font-display text-xs font-bold text-zinc-950">
                {ride.driver?.vehicleModel || ride.vehicleType || 'Standard Vehicle'}
              </p>
              <p className="font-display text-[11px] text-zinc-500 font-mono font-semibold uppercase">
                {ride.driver?.plateNumber || 'LEB-8921'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-[10px] text-zinc-500 font-bold uppercase">Agreed Fare</p>
            <p className="font-display text-lg font-extrabold text-zinc-950 tabular-nums">
              PKR {(ride.offeredFare || ride.fare || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Route Details */}
      <div className="w-full bg-white border border-zinc-200 rounded-md p-3.5 space-y-2.5 text-xs shadow-xs">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-[#C1F11D]/25 text-zinc-950">
            <MapPin className="size-3" />
          </div>
          <p className="font-display text-xs text-zinc-800 line-clamp-1">
            <strong className="text-zinc-950 font-bold">Pickup:</strong>{' '}
            {ride.pickupAddress || 'Pickup Location'}
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-emerald-500/15 text-emerald-600">
            <Navigation className="size-3" />
          </div>
          <p className="font-display text-xs text-zinc-800 line-clamp-1">
            <strong className="text-zinc-950 font-bold">Dropoff:</strong>{' '}
            {ride.dropoffAddress || 'Destination'}
          </p>
        </div>
      </div>
    </div>
  );
}