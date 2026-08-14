'use client';

import { Star, Car, ShieldCheck, MapPin, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Ride } from '@/store/useRideStore';

interface MatchedDriverStepProps {
  ride: Ride;
}

export default function MatchedDriverStep({ ride }: MatchedDriverStepProps) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    ACCEPTED: { label: 'Driver En Route to Pickup', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    ARRIVED: { label: 'Driver Arrived at Pickup', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    IN_PROGRESS: { label: 'Trip In Progress', color: 'bg-blue-100 text-blue-900 border-blue-300' },
    COMPLETED: { label: 'Trip Completed', color: 'bg-zinc-900 text-white border-zinc-700' },
  };

  const currentStatus = statusLabels[ride.status] || { label: ride.status, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="w-full flex flex-col space-y-4 font-sans">
      {/* Header Status */}
      <div className="w-full flex items-center justify-between border-b border-gray-200 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
            Trip Status
          </span>
          <span className="text-sm sm:text-base font-black text-[#141414] uppercase tracking-tight">
            {currentStatus.label}
          </span>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${currentStatus.color}`}>
          {ride.status === 'ACCEPTED' ? 'Arriving Soon' : currentStatus.label}
        </span>
      </div>

      {/* Main Grid: Driver Profile & Vehicle Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver Profile & OTP Badge */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={ride.driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt="Driver"
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-[#141414] text-[#F47920] p-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#141414]">{ride.driver?.name || 'Assigned Driver'}</h4>
              <div className="flex items-center gap-1 text-xs text-gray-500 font-medium pt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-bold text-[#141414]">4.9</span>
                <span>(120+ rides)</span>
              </div>
            </div>
          </div>

          {/* OTP PIN Code display for Rider */}
          {ride.otp && ride.status !== 'COMPLETED' && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-extrabold uppercase text-gray-400">4-Digit Start OTP</span>
              <button
                type="button"
                onClick={() => {
                  if (ride.otp) {
                    navigator.clipboard.writeText(ride.otp);
                    toast.success(`OTP ${ride.otp} copied to clipboard!`);
                  }
                }}
                title="Click to copy OTP"
                className="flex items-center gap-1.5 bg-[#F47920] hover:bg-[#e06810] text-white px-3 py-1 rounded-lg shadow-md shadow-[#F47920]/20 transition-all cursor-pointer group"
              >
                <span className="text-base font-mono font-black tracking-widest">{ride.otp}</span>
                <Copy className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
              </button>
            </div>
          )}
        </div>

        {/* Vehicle Specs & Route Row */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#141414] text-[#F47920] flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#141414]">{ride.driver?.vehicleModel || 'Standard Vehicle'}</p>
              <p className="text-[11px] text-gray-500 font-mono font-semibold uppercase">{ride.driver?.plateNumber || 'LEB-8921'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase">Agreed Fare</p>
            <p className="text-base font-mono font-black text-[#F47920]">
              PKR {(ride.offeredFare || ride.fare || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Trip Route Details */}
      <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="truncate font-medium">
            <strong className="text-[#141414]">Pickup:</strong> {ride.pickupAddress || 'Pickup Location'}
          </p>
        </div>
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="truncate font-medium">
            <strong className="text-[#141414]">Dropoff:</strong> {ride.dropoffAddress || 'Destination'}
          </p>
        </div>
      </div>
    </div>
  );
}