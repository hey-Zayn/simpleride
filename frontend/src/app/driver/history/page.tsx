'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Navigation, Calendar, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DriverRideRecord {
  id: string;
  vehicleType: 'BIKE' | 'MINI' | 'COMFORT';
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  calculatedFare: number;
  offeredFare: number;
  finalFare?: number;
  distanceKm: number;
  durationMins: number;
  createdAt: string;
}

export default function DriverHistoryPage() {
  const [rides, setRides] = useState<DriverRideRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await api.get('/ride/api/rides/history');
        const data = response.data?.data || response.data || [];
        setRides(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load driver trip history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredRides = rides.filter((ride) => {
    if (filter === 'ALL') return true;
    if (filter === 'COMPLETED') return ride.status === 'COMPLETED';
    if (filter === 'CANCELLED') return ['CANCELLED', 'EXPIRED'].includes(ride.status);
    return true;
  });

  const totalEarnings = rides
    .filter((r) => r.status === 'COMPLETED')
    .reduce((sum, r) => sum + (r.finalFare || r.offeredFare || 0), 0);

  const completedCount = rides.filter((r) => r.status === 'COMPLETED').length;

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-50 text-zinc-950 font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 w-full border-b border-black/10 bg-white/95 px-3 py-2.5 sm:px-6 sm:py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <Link
            href="/driver"
            className="flex items-center gap-1.5 sm:gap-2 font-display text-xs sm:text-sm font-bold text-zinc-800 hover:text-black transition-colors shrink-0"
          >
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-md border border-zinc-200 bg-zinc-100">
              <ArrowLeft className="size-3.5 sm:size-4" />
            </div>
            <span className="hidden xs:inline">Back</span>
          </Link>

          <span className="font-display text-xs sm:text-sm font-bold tracking-tight text-zinc-900 truncate text-center">
            Trip History
          </span>

          <Link href="/driver/profile">
            <Button variant="outline" size="sm" className="rounded-md font-display text-[11px] sm:text-xs font-bold border-zinc-300 px-2 sm:px-3 shrink-0">
              Profile
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-3 py-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="rounded-md border border-black/10 bg-white p-2.5 sm:p-4 shadow-sm">
            <span className="font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Earnings
            </span>
            <p className="font-display text-lg sm:text-2xl font-extrabold text-zinc-950 mt-0.5 sm:mt-1 tabular-nums">
              <span className="text-xs sm:text-base">PKR</span> {totalEarnings.toLocaleString()}
            </p>
          </Card>

          <Card className="rounded-md border border-black/10 bg-white p-2.5 sm:p-4 shadow-sm">
            <span className="font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Trips Done
            </span>
            <p className="font-display text-lg sm:text-2xl font-extrabold text-zinc-950 mt-0.5 sm:mt-1">
              {completedCount}
            </p>
          </Card>

          <Card className="rounded-md border border-black/10 bg-white p-2.5 sm:p-4 shadow-sm">
            <span className="font-display text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500">
              Platform Fee
            </span>
            <p className="font-display text-sm sm:text-base font-extrabold text-[#C1F11D] bg-zinc-950 px-1.5 py-0.5 rounded-sm inline-block mt-0.5 sm:mt-1">
              0% Free
            </p>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-b border-zinc-200 pb-3 overflow-x-auto no-scrollbar">
          {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-md font-display text-[11px] sm:text-xs font-bold transition-colors shrink-0 ${
                filter === tab
                  ? 'bg-zinc-950 text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
              }`}
            >
              {tab === 'ALL' ? 'All Trips' : tab === 'COMPLETED' ? 'Completed' : 'Cancelled'}
            </button>
          ))}
        </div>

        {/* Rides List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-zinc-400">
            <Loader2 className="size-6 sm:size-7 animate-spin text-zinc-800" />
            <p className="font-display text-xs font-semibold mt-3">Loading trip history...</p>
          </div>
        ) : filteredRides.length === 0 ? (
          <Card className="rounded-md border border-dashed border-zinc-300 bg-white p-8 sm:p-12 text-center shadow-none">
            <div className="mx-auto flex size-10 sm:size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              <Calendar className="size-5 sm:size-6" />
            </div>
            <h3 className="font-display text-sm sm:text-base font-bold text-zinc-900 mt-3 sm:mt-4">
              No trips recorded
            </h3>
            <p className="font-display text-[11px] sm:text-xs text-zinc-500 mt-1">
              Go online to receive ride offers.
            </p>
            <Link href="/driver" className="mt-4 sm:mt-5 inline-block">
              <Button className="rounded-md bg-[#C1F11D] font-display text-xs sm:text-sm font-bold text-black hover:bg-[#b0dc17]">
                Go to Dashboard
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRides.map((ride) => {
              const dateStr = new Date(ride.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              const isCompleted = ride.status === 'COMPLETED';
              const isCancelled = ['CANCELLED', 'EXPIRED'].includes(ride.status);
              const fare = ride.finalFare || ride.offeredFare;

              return (
                <Card
                  key={ride.id}
                  className="rounded-md border border-black/10 bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-2.5 sm:pb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Badge className="rounded-sm bg-zinc-900 font-display text-[10px] sm:text-[11px] font-bold text-white shrink-0">
                        {ride.vehicleType}
                      </Badge>
                      <span className="font-display text-[10px] sm:text-xs text-zinc-500 truncate">{dateStr}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-display text-sm sm:text-base font-extrabold text-zinc-950 tabular-nums">
                        PKR {fare?.toLocaleString()}
                      </span>
                      <div className="mt-0.5">
                        <Badge
                          variant="outline"
                          className={`rounded-sm text-[9px] sm:text-[10px] font-display font-bold px-1.5 py-0 ${
                            isCompleted
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                              : isCancelled
                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                              : 'border-[#C1F11D]/60 bg-[#C1F11D]/20 text-zinc-950'
                          }`}
                        >
                          {ride.status}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 sm:mt-3.5 space-y-1.5 sm:space-y-2 text-xs">
                    <div className="flex gap-2 items-start">
                      <MapPin className="size-3.5 text-[#C1F11D] shrink-0 mt-0.5 fill-black" />
                      <p className="font-display font-medium text-zinc-800 line-clamp-1 text-[11px] sm:text-xs">
                        {ride.pickupAddress}
                      </p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Navigation className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <p className="font-display font-medium text-zinc-800 line-clamp-1 text-[11px] sm:text-xs">
                        {ride.dropoffAddress}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] sm:text-[11px] font-display text-zinc-500">
                    <span>{ride.distanceKm?.toFixed(1)} km</span>
                    <span>~{ride.durationMins} mins</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
