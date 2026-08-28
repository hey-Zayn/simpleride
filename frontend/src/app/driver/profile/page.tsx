'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Star, Car, Bike, Sparkles, CheckCircle2, LogOut, History } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function DriverProfilePage() {
  const { user, fetchMe, logoutUser } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const initials = (user?.fullName || 'Driver')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const vehicleType = user?.driverProfile?.vehicleType || user?.vehicleType || 'MINI';
  const VehicleIcon =
    vehicleType === 'BIKE' ? Bike : vehicleType === 'COMFORT' ? Sparkles : Car;

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
            Driver Profile
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutUser()}
            className="rounded-md font-display text-[11px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2 sm:px-3 shrink-0"
          >
            <LogOut className="mr-1 size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Log Out</span>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-3 py-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
        {/* Profile Banner Card */}
        <Card className="rounded-md border border-black/10 bg-white shadow-sm overflow-hidden">
          <div className="h-16 sm:h-24 w-full bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 relative">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <Badge className="rounded-sm border border-[#C1F11D]/60 bg-[#C1F11D] font-display text-[10px] sm:text-xs font-bold text-black shadow-sm">
                VERIFIED DRIVER
              </Badge>
            </div>
          </div>

          <CardContent className="relative px-3 pb-4 pt-0 sm:px-6 sm:pb-6">
            <div className="flex flex-col gap-3 -mt-8 sm:-mt-12 mb-4 sm:mb-6">
              <div className="flex items-end gap-3 sm:gap-4">
                <Avatar className="size-14 sm:size-20 rounded-md border-[3px] sm:border-4 border-white bg-white shadow-md ring-2 ring-[#C1F11D]/40 shrink-0">
                  <AvatarFallback className="rounded-md bg-[#C1F11D] font-display text-base sm:text-xl font-extrabold text-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-display text-lg sm:text-2xl font-extrabold text-zinc-950 tracking-tight truncate">
                      {user?.fullName || 'Driver Partner'}
                    </h1>
                    <CheckCircle2 className="size-4 sm:size-5 text-[#C1F11D] fill-[#141414] shrink-0" />
                  </div>
                  <p className="font-display text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1 truncate">
                    <Mail className="size-3 sm:size-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href="/driver/history" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto rounded-md border-zinc-300 font-display text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                  >
                    <History className="mr-1.5 size-3.5" />
                    Trip History
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats Grid — 2 cols on mobile, 4 on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 border-t border-zinc-100 pt-4 sm:pt-5">
              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3">
                <span className="block font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Rating
                </span>
                <p className="mt-0.5 sm:mt-1 flex items-center gap-1 font-display text-sm sm:text-lg font-extrabold text-zinc-900">
                  <Star className="size-3.5 sm:size-4 fill-[#C1F11D] text-[#C1F11D]" />
                  {(user?.driverProfile?.rating || 4.9).toFixed(1)}
                </p>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3">
                <span className="block font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Vehicle
                </span>
                <p className="mt-0.5 sm:mt-1 font-display text-sm sm:text-lg font-extrabold text-zinc-900 flex items-center gap-1">
                  <VehicleIcon className="size-3.5 sm:size-4 text-[#C1F11D]" />
                  {vehicleType}
                </p>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3">
                <span className="block font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Status
                </span>
                <p className="mt-0.5 sm:mt-1 font-display text-sm sm:text-lg font-extrabold text-emerald-600 flex items-center gap-1">
                  <span className="size-1.5 sm:size-2 rounded-full bg-emerald-500" />
                  {user?.driverStatus || 'OFFLINE'}
                </p>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3">
                <span className="block font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Fee
                </span>
                <p className="mt-0.5 sm:mt-1 font-display text-sm sm:text-base font-extrabold text-[#C1F11D] bg-zinc-900 px-1.5 py-0.5 rounded-sm inline-block">
                  0% Free
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="rounded-md border border-black/10 bg-white shadow-sm">
            <CardHeader className="border-b border-zinc-100 px-3 sm:px-6 pb-3">
              <CardTitle className="font-display text-sm sm:text-base font-bold text-zinc-900">
                Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4 text-sm">
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">Full Name</span>
                <p className="font-display font-bold text-zinc-900 mt-0.5">{user?.fullName || '—'}</p>
              </div>
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">Email Address</span>
                <p className="font-display font-medium text-zinc-900 mt-0.5 break-all">{user?.email || '—'}</p>
              </div>
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">Phone Number</span>
                <p className="font-display font-medium text-zinc-900 mt-0.5">{user?.phone || '+92 300 0000000'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border border-black/10 bg-white shadow-sm">
            <CardHeader className="border-b border-zinc-100 px-3 sm:px-6 pb-3">
              <CardTitle className="font-display text-sm sm:text-base font-bold text-zinc-900">
                Vehicle & Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4 text-sm">
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">Vehicle Category</span>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className="rounded-sm bg-[#C1F11D] font-display text-[10px] sm:text-xs font-bold text-black">
                    {vehicleType}
                  </Badge>
                  <span className="text-[11px] sm:text-xs text-zinc-500 font-display">Authorized</span>
                </div>
              </div>
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">Number Plate</span>
                <p className="font-display font-bold text-zinc-900 mt-0.5 tracking-wider font-mono text-sm">
                  {user?.driverProfile?.vehicleNumber || user?.vehicleNumber || 'LEC-1234'}
                </p>
              </div>
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">License ID</span>
                <p className="font-display font-medium text-zinc-900 mt-0.5 font-mono text-xs break-all">
                  {user?.driverProfile?.licenseNumber || user?.licenseNumber || 'DL-PK-9876543'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
