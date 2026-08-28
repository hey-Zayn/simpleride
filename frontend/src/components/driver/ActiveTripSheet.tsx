'use client';

import { AlertTriangle, Clock, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { DriverAction, DriverRide } from '@/types/driver-ride';

interface ActiveTripSheetProps {
  ride: DriverRide | null;
  action: DriverAction;
  otp: string;
  pending: boolean;
  onOtpChange: (value: string) => void;
  onStatus: (status: 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED') => void;
  onReturnToIdle: () => void;
}

export function ActiveTripSheet({
  ride,
  action,
  otp,
  pending,
  onOtpChange,
  onStatus,
  onReturnToIdle,
}: ActiveTripSheetProps) {
  if (!ride) return null;

  const initials = (ride.passengerName || 'Rider')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const primary =
    action.kind === 'MARK_ARRIVED' ? (
      <Button
        className="min-h-11 w-full rounded-md bg-[#C1F11D] font-display font-bold text-black shadow-md shadow-[#C1F11D]/25 hover:bg-[#b0dc17] transition-all"
        disabled={pending}
        onClick={() => onStatus('ARRIVED')}
      >
        Mark Arrived at Pickup
      </Button>
    ) : action.kind === 'VERIFY_OTP' ? (
      <div className="space-y-3.5 rounded-md border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-center">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-zinc-600">
            Enter Rider&apos;s 4-Digit OTP
          </p>
          <p className="font-display text-[11px] text-zinc-500">
            Ask rider for the code to begin trip
          </p>
        </div>
        <InputOTP
          maxLength={4}
          value={otp}
          onChange={onOtpChange}
          containerClassName="justify-center"
        >
          <InputOTPGroup className="gap-2">
            {[0, 1, 2, 3].map((index) => (
              <InputOTPSlot
                key={index}
                index={index}
                className="size-11 rounded-md border border-zinc-300 bg-white font-display text-base font-bold text-zinc-900 shadow-sm focus-visible:border-[#C1F11D] focus-visible:ring-2 focus-visible:ring-[#C1F11D]"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button
          className="min-h-11 w-full rounded-md bg-[#C1F11D] font-display font-bold text-black shadow-md shadow-[#C1F11D]/25 hover:bg-[#b0dc17] transition-all"
          disabled={pending || otp.length !== 4}
          onClick={() => onStatus('IN_PROGRESS')}
        >
          <ShieldCheck className="mr-1.5 size-4 stroke-[2.5]" />
          Verify OTP & Start Trip
        </Button>
      </div>
    ) : action.kind === 'COMPLETE_TRIP' ? (
      <Button
        className="min-h-11 w-full rounded-md bg-[#C1F11D] font-display font-bold text-black shadow-md shadow-[#C1F11D]/25 hover:bg-[#b0dc17] transition-all"
        disabled={pending}
        onClick={() => onStatus('COMPLETED')}
      >
        Complete Trip
      </Button>
    ) : action.kind === 'RETURN_TO_IDLE' ? (
      <Button
        className="min-h-11 w-full rounded-md bg-zinc-900 font-display font-bold text-white hover:bg-zinc-800 transition-all"
        onClick={onReturnToIdle}
      >
        Return to Online Mode
      </Button>
    ) : null;

  return (
    <section className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-2xl rounded-t-2xl border-t border-black/10 bg-white/95 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md text-zinc-900">
      <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-zinc-300" />

      {/* Header with Rider info & Fare */}
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-10 rounded-md border border-[#C1F11D]/40 ring-2 ring-[#C1F11D]/20">
            <AvatarFallback className="rounded-md bg-[#C1F11D]/20 font-display text-sm font-bold text-zinc-950">
              {initials || 'R'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-sm font-bold text-zinc-950">
                {ride.passengerName ?? 'Rider'}
              </h3>
              <Badge
                variant="outline"
                className="rounded-sm border-[#C1F11D]/60 bg-[#C1F11D]/20 px-1.5 py-0 text-[10px] font-display font-bold text-zinc-900"
              >
                {ride.status.replace('_', ' ')}
              </Badge>
            </div>
            <p className="flex items-center gap-1 font-display text-xs text-zinc-500 mt-0.5">
              <Clock className="size-3 text-[#C1F11D]" />
              <span>Trip in progress</span>
            </p>
          </div>
        </div>

        <Badge className="rounded-md border border-[#C1F11D]/60 bg-[#C1F11D]/25 px-2.5 py-1 font-display text-sm font-extrabold text-zinc-950 tabular-nums">
          PKR {(ride.finalFare ?? ride.offeredFare).toLocaleString()}
        </Badge>
      </header>

      {/* Route Details Card */}
      <div className="my-3.5 space-y-2.5 rounded-md border border-zinc-200 bg-zinc-50 p-3.5 text-xs">
        <div className="flex gap-2.5 items-start">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-[#C1F11D]/25 text-zinc-950">
            <MapPin className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Pickup Point
            </span>
            <p className="font-display text-xs font-semibold text-zinc-800 line-clamp-2 leading-relaxed">
              {ride.pickupAddress}
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 items-start">
          <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-emerald-500/15 text-emerald-600">
            <Navigation className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-display text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Drop-off Destination
            </span>
            <p className="font-display text-xs font-semibold text-zinc-800 line-clamp-2 leading-relaxed">
              {ride.dropoffAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Action status note */}
      <div
        className="mb-3.5 flex items-center gap-2 font-display text-xs font-medium text-zinc-600"
        aria-live="polite"
      >
        <span className="size-2 rounded-full bg-[#C1F11D] ring-2 ring-[#C1F11D]/30" />
        {action.label}
      </div>

      {primary}

      {/* Footer secondary controls */}
      <div className="mt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="min-h-10 flex-1 rounded-md border-zinc-200 bg-white font-display font-medium text-zinc-700 hover:bg-zinc-100"
        >
          <Phone className="mr-1.5 size-3.5" />
          Contact Rider
        </Button>

        {['ACCEPTED', 'ARRIVED'].includes(ride.status) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="min-h-10 flex-1 rounded-md border-red-200 bg-red-50/50 font-display font-medium text-red-600 hover:bg-red-100 hover:text-red-700"
              >
                <AlertTriangle className="mr-1.5 size-3.5" />
                Cancel Trip
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-md border border-zinc-200 bg-white text-zinc-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display font-bold">
                  Cancel this ride?
                </AlertDialogTitle>
                <AlertDialogDescription className="font-display text-xs text-zinc-500">
                  This will cancel the current trip. Please only cancel if you cannot complete the route.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-md font-display">
                  Keep Ride
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-md bg-red-600 font-display font-bold text-white hover:bg-red-700"
                  disabled={pending}
                  onClick={() => onStatus('CANCELLED')}
                >
                  Cancel Ride
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </section>
  );
}

