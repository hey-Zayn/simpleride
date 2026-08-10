'use client';

import { Star, Phone, MessageSquare, Car, ShieldCheck } from 'lucide-react';
import { Ride } from '@/store/useRideStore';

interface MatchedDriverStepProps {
  ride: Ride;
}

export default function MatchedDriverStep({ ride }: MatchedDriverStepProps) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    ACCEPTED: { label: 'Driver En Route', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    ARRIVED: { label: 'Driver Arrived at Pickup', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    IN_PROGRESS: { label: 'Trip In Progress', color: 'bg-blue-100 text-blue-900 border-blue-300' },
    COMPLETED: { label: 'Trip Completed', color: 'bg-zinc-900 text-white border-zinc-700' },
  };

  const currentStatus = statusLabels[ride.status] || { label: ride.status, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="p-5 space-y-4">
      {/* Header Status */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Trip Status
          </span>
          <span className="text-sm font-black text-[#141414] uppercase">
            {currentStatus.label}
          </span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-sm border ${currentStatus.color}`}>
          {ride.status === 'ACCEPTED' ? 'Arriving Soon' : currentStatus.label}
        </span>
      </div>

      {/* Driver Profile & OTP Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={ride.driver?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt="Driver"
              className="w-12 h-12 rounded-full object-cover border border-black/10"
            />
            <span className="absolute -bottom-1 -right-1 bg-[#141414] text-[#C1F11D] p-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#141414]">{ride.driver?.name || 'Assigned Driver'}</h4>
            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-[#141414]">4.9</span>
              <span>(120+ rides)</span>
            </div>
          </div>
        </div>

        {/* OTP PIN Code display for Rider */}
        {ride.otp && ride.status !== 'COMPLETED' && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-gray-400">Start Pin</span>
            <span className="text-sm font-mono font-black tracking-widest bg-[#C1F11D] text-[#141414] px-2.5 py-1 rounded-sm border border-[#141414]/20 shadow-sm">
              {ride.otp}
            </span>
          </div>
        )}
      </div>

      {/* Vehicle Specs */}
      <div className="bg-gray-50 p-3 rounded-sm flex items-center justify-between border border-gray-100">
        <div className="flex items-center gap-2.5">
          <Car className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-xs font-bold text-[#141414]">{ride.driver?.vehicleModel || 'Registered Vehicle'}</p>
            <p className="text-[11px] text-gray-500 font-mono font-semibold uppercase">{ride.driver?.plateNumber || 'LEB-8921'}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Agreed Fare</p>
          <p className="text-xs font-extrabold text-[#141414]">PKR {ride.offeredFare || ride.fare}</p>
        </div>
      </div>
    </div>
  );
}