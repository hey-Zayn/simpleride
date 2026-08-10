'use client';

import { useEffect } from 'react';
import { Loader2, ShieldCheck, Car, MapPin, CheckCircle, XCircle } from 'lucide-react';
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

  return (
    <div className="bg-red-600 border-2 border-[#141414] rounded-2xl p-5 shadow-[4px_4px_0px_0px_#141414] space-y-5">
      {/* 1. SEARCHING / REQUESTED STATE */}
      {currentRide.status === 'REQUESTED' && (
        <div className="text-center py-6 space-y-4">
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto">
            <div className="absolute inset-0 bg-[#C1F11D] rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-[#141414] text-[#C1F11D] rounded-full p-4 border-2 border-[#141414]">
              <Car className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-[#141414]">Finding your driver...</h3>
            <p className="text-xs text-[#141414]/60 font-semibold mt-1">
              Contacting nearby drivers in your area
            </p>
          </div>
          <button
            onClick={resetBookingState}
            className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 underline"
          >
            Cancel Request
          </button>
        </div>
      )}

      {/* 2. ACCEPTED / ARRIVED STATE (SHOW OTP) */}
      {(currentRide.status === 'ACCEPTED' || currentRide.status === 'ARRIVED') && (
        <div className="space-y-4">
          <div className="bg-[#C1F11D] border-2 border-[#141414] p-3 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#141414]">Status</span>
              <p className="font-display font-bold text-sm text-[#141414]">
                {currentRide.status === 'ACCEPTED' ? 'Driver on the way' : 'Driver Arrived!'}
              </p>
            </div>
            <Loader2 className="w-5 h-5 animate-spin text-[#141414]" />
          </div>

          {/* OTP Code Card */}
          {currentRide.otp && (
            <div className="bg-[#FFFEE9] border-2 border-[#141414] p-4 rounded-xl text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#141414]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Share OTP with Driver to Start Ride</span>
              </div>
              <p className="font-display font-bold text-3xl tracking-widest text-[#141414]">
                {currentRide.otp}
              </p>
            </div>
          )}

          {/* Trip Info */}
          <div className="border-2 border-[#141414]/10 rounded-xl p-3 space-y-2 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="truncate text-[#141414]">{currentRide.pickupAddress}</p>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-600 shrink-0" />
              <p className="truncate text-[#141414]">{currentRide.dropoffAddress}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. IN_PROGRESS STATE */}
      {currentRide.status === 'IN_PROGRESS' && (
        <div className="space-y-4 text-center py-2">
          <div className="bg-emerald-100 border-2 border-emerald-500 text-emerald-900 p-3 rounded-xl font-display font-bold text-sm">
            🚀 Trip in Progress
          </div>
          <p className="text-xs text-[#141414]/70 font-semibold">
            Heading to destination. Wish you a safe journey!
          </p>
          <div className="bg-[#FFFEE9] border-2 border-[#141414] p-3 rounded-xl text-left">
            <p className="text-xs font-bold text-[#141414]/60">Total Fare to Pay</p>
            <p className="font-display font-bold text-2xl text-[#141414]">PKR {currentRide.fare}</p>
          </div>
        </div>
      )}

      {/* 4. COMPLETED STATE */}
      {currentRide.status === 'COMPLETED' && (
        <div className="text-center py-4 space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-display font-bold text-xl text-[#141414]">Ride Completed!</h3>
          <p className="text-sm font-bold text-[#141414]">Total Paid: PKR {currentRide.fare}</p>
          <button
            onClick={resetBookingState}
            className="w-full bg-[#141414] text-white font-display font-bold py-3 rounded-xl border-2 border-[#141414] shadow-[2px_2px_0px_0px_#C1F11D]"
          >
            Book Another Ride
          </button>
        </div>
      )}

      {/* 5. CANCELLED STATE */}
      {currentRide.status === 'CANCELLED' && (
        <div className="text-center py-4 space-y-3">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="font-display font-bold text-xl text-[#141414]">Ride Cancelled</h3>
          <button
            onClick={resetBookingState}
            className="w-full bg-[#141414] text-white font-display font-bold py-3 rounded-xl border-2 border-[#141414]"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}