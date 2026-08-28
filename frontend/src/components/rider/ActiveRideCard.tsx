'use client';

import { useEffect } from 'react';
import {
  Loader2,
  ShieldCheck,
  Car,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { useRideStore } from '@/store/useRideStore';

export default function ActiveRideCard() {
  const currentRide = useRideStore((state) => state.currentRide);
  const fetchActiveRide = useRideStore((state) => state.fetchActiveRide);
  const resetBookingState = useRideStore((state) => state.resetBookingState);

  // Poll ride status every 3 seconds while ride is active
  useEffect(() => {
    if (!currentRide?.id) return;

    const interval = setInterval(() => {
      // Don't poll if completed or cancelled
      if (currentRide.status === 'COMPLETED' || currentRide.status === 'CANCELLED') {
        clearInterval(interval);
        return;
      }
      fetchActiveRide(currentRide.id);
    }, 3000);

    return () => clearInterval(interval);
  }, [currentRide?.id, currentRide?.status, fetchActiveRide]);

  if (!currentRide) return null;

  const statusColors: Record<string, string> = {
    searching: '#8A8A8A',
    accepted: '#2F6FED',
    arrived: '#B8860B',
    in_progress: '#C1F11D',
    completed: '#1F9D55',
    cancelled: '#E3413F',
    expired: '#8A8A8A',
  };

  const statusIcons: Record<string, React.ComponentType> = {
    searching: () => <Car className="w-4 h-4 animate-pulse" />,
    accepted: () => <CheckCircle className="w-4 h-4 text-[var(--brand-primary)]" />,
    arrived: () => <MapPin className="w-4 h-4 text-[var(--brand-primary)]" />,
    in_progress: () => <Car className="w-4 h-4 text-[var(--brand-primary)]" />,
    completed: () => <CheckCircle className="w-4 h-4 text-[var(--status-completed)]" />,
    cancelled: () => <XCircle className="w-4 h-4 text-[var(--status-cancelled)]" />,
    expired: () => <Clock className="w-4 h-4 text-[var(--status-expired)]" />,
  };

  const statusIconStyles: Record<string, string> = {
    searching: 'animate-pulse',
    accepted: '',
    arrived: '',
    in_progress: '',
    completed: '',
    cancelled: '',
    expired: '',
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border-muted)] rounded-md p-4 shadow-sm max-w-2xl mx-auto">
      {/* 1. SEARCHING / REQUESTED STATE */}
      {currentRide.status === 'REQUESTED' && (
        <div className="text-center py-6 space-y-4">
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto">
            <div className="absolute inset-0 bg-[var(--brand-primary)] rounded-full animate-ping opacity-75" />
            <div className="relative bg-[var(--ink)] text-[var(--brand-primary)] rounded-full p-2 border-2 border-[var(--ink)]">
              <Car className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-[var(--ink)]">Finding your driver...</h3>
            <p className="text-xs text-[var(--ink)]/60 font-semibold mt-1">
              Contacting nearby drivers in your area
            </p>
          </div>
          <button
            onClick={resetBookingState}
            className="mt-2 text-xs font-bold text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/88 underline"
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* 2. ACCEPTED / ARRIVED STATE (SHOW OTP) */}
      {(currentRide.status === 'ACCEPTED' || currentRide.status === 'ARRIVED') && (
        <div className="space-y-4">
          <div className="bg-[var(--brand-primary)]/10 border-2 border-[var(--brand-primary)] p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink)]">Status</span>
              <p className="font-display font-bold text-sm text-[var(--ink)]">
                {currentRide.status === 'ACCEPTED' ? 'Driver on the way' : 'Driver Arrived!'}
              </p>
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-[var(--brand-primary)]" />
          </div>

          {/* OTP Code Card */}
          {currentRide.otp && (
            <div className="bg-[var(--surface-alt)] border-2 border-[var(--border-muted)] p-4 rounded-xl text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                <ShieldCheck className="w-4 h-4 text-[var(--status-accepted)]" />
                <span>Share OTP with Driver to Start Ride</span>
              </div>
              <p className="font-display font-bold text-3xl tracking-widest text-[var(--ink)]">
                {currentRide.otp}
              </p>
            </div>
          )}

          {/* Trip Info */}
          <div className="border-2 border-[var(--border-muted)]/10 rounded-xl p-3 space-y-2 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
              <p className="truncate text-[var(--ink)]">{currentRide.pickupAddress}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[rose-600] shrink-0" />
              <p className="truncate text-[var(--ink)]">{currentRide.dropoffAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. IN_PROGRESS STATE */}
      {currentRide.status === 'IN_PROGRESS' && (
        <div className="space-y-4 text-center py-2">
          <div className="bg-[var(--status-in-progress)] border-2 border-emerald-500 text-emerald-900 p-3 rounded-xl font-display font-bold text-sm">
            🚀 Trip in Progress
          </div>
          <p className="text-xs text-[var(--ink)]/70 font-semibold">
            Heading to destination. Wish you a safe journey!
          </p>
          <div className="bg-[var(--surface-alt)] border-2 border-[var(--border-muted)] p-3 rounded-xl text-left">
            <p className="text-xs font-bold text-[var(--ink)]/60">Total Fare to Pay</p>
            <p className="font-display font-bold text-2xl text-[var(--ink)]">PKR {currentRide.fare}</p>
          </div>
        </div>
      )}

      {/* 4. COMPLETED STATE */}
      {currentRide.status === 'COMPLETED' && (
        <div className="text-center py-4 space-y-3">
          <CheckCircle className="w-12 h-12 text-[var(--status-completed)] mx-auto" />
          <h3 className="font-display font-bold text-xl text-[var(--ink)]">Ride Completed!</h3>
          <p className="text-sm font-bold text-[var(--ink)]">Total Paid: PKR {currentRide.fare}</p>
          <button
            onClick={resetBookingState}
            className="w-full bg-[var(--ink)] text-white font-display font-bold py-3 rounded-xl border-2 border-[var(--ink)] shadow-sm shadow-[2px_2px_0px_0px_[var(--brand-primary)]]"
          >
            Book Another Ride
          </button>
        </div>
      )}

      {/* 5. CANCELLED STATE */}
      {currentRide.status === 'CANCELLED' && (
        <div className="text-center py-4 space-y-3">
          <XCircle className="w-12 h-12 text-[var(--status-cancelled)] mx-auto" />
          <h3 className="font-display font-bold text-xl text-[var(--ink)]">Ride Cancelled</h3>
          <button
            onClick={resetBookingState}
            className="w-full bg-[var(--ink)] text-white font-display font-bold py-3 rounded-xl border-2 border-[var(--ink)]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* 6. EXPIRED STATE */}
      {currentRide.status === 'EXPIRED' && (
        <div className="text-center py-4 space-y-3">
          <Clock className="w-12 h-12 text-[var(--status-expired)] mx-auto animate-pulse" />
          <h3 className="font-display font-bold text-xl text-[var(--ink)]">Ride Expired</h3>
          <p className="text-sm font-bold text-[var(--ink)]/70">No driver accepted within 2 minutes.</p>
          <button
            onClick={resetBookingState}
            className="w-full bg-[var(--ink)] text-white font-display font-bold py-3 rounded-xl border-2 border-[var(--ink)]"
          >
            Request Again
          </button>
        </div>
      )}
    </div>
  );
}