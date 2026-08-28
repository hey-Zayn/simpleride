'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Shield, Star, LogOut, History } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function RiderProfilePage() {
  const { user, fetchMe, logoutUser } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const initials = (user?.fullName || 'Rider')
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-50 text-zinc-950 font-sans">
      {/* Top Navbar — compact on mobile */}
      <header className="sticky top-0 z-30 w-full border-b border-black/10 bg-white/95 px-3 py-2.5 sm:px-6 sm:py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <Link
            href="/rider"
            className="flex items-center gap-1.5 sm:gap-2 font-display text-xs sm:text-sm font-bold text-zinc-800 hover:text-black transition-colors shrink-0"
          >
            <div className="flex size-7 sm:size-8 items-center justify-center rounded-md border border-zinc-200 bg-zinc-100">
              <ArrowLeft className="size-3.5 sm:size-4" />
            </div>
            <span className="hidden xs:inline">Back</span>
          </Link>

          <span className="font-display text-xs sm:text-sm font-bold tracking-tight text-zinc-900 truncate text-center">
            Passenger Profile
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
          <div className="h-16 sm:h-24 w-full bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 relative">
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <Badge className="rounded-sm border border-[#C1F11D]/60 bg-[#C1F11D] font-display text-[10px] sm:text-xs font-bold text-black shadow-sm">
                VERIFIED PASSENGER
              </Badge>
            </div>
          </div>

          <CardContent className="relative px-3 pb-4 pt-0 sm:px-6 sm:pb-6">
            {/* Avatar + Name row */}
            <div className="flex flex-col gap-3 -mt-8 sm:-mt-12 mb-4 sm:mb-6">
              <div className="flex items-end gap-3 sm:gap-4">
                <Avatar className="size-14 sm:size-20 rounded-md border-[3px] sm:border-4 border-white bg-white shadow-md ring-2 ring-[#C1F11D]/40 shrink-0">
                  <AvatarFallback className="rounded-md bg-[#C1F11D] font-display text-base sm:text-xl font-extrabold text-black">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-lg sm:text-2xl font-extrabold text-zinc-950 tracking-tight truncate">
                    {user?.fullName || 'Rider'}
                  </h1>
                  <p className="font-display text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1 truncate">
                    <Mail className="size-3 sm:size-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{user?.email}</span>
                  </p>
                </div>
              </div>

              {/* Action buttons — full width on mobile */}
              <div className="flex gap-2">
                <Link href="/rider/history" className="flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto rounded-md border-zinc-300 font-display text-xs font-semibold text-zinc-800 hover:bg-zinc-100"
                  >
                    <History className="mr-1.5 size-3.5" />
                    Ride History
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 border-t border-zinc-100 pt-4 sm:pt-5">
              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3">
                <span className="block font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Rating
                </span>
                <p className="mt-0.5 sm:mt-1 flex items-center gap-1 font-display text-sm sm:text-lg font-extrabold text-zinc-900">
                  <Star className="size-3.5 sm:size-4 fill-[#C1F11D] text-[#C1F11D]" />
                  4.9
                </p>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3">
                <span className="block font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Status
                </span>
                <p className="mt-0.5 sm:mt-1 flex items-center gap-1 font-display text-sm sm:text-lg font-extrabold text-emerald-600">
                  <Shield className="size-3.5 sm:size-4 text-emerald-600" />
                  Active
                </p>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50/70 p-2.5 sm:p-3">
                <span className="block font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Payment
                </span>
                <p className="mt-0.5 sm:mt-1 font-display text-sm sm:text-lg font-extrabold text-zinc-900">
                  Cash
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Account Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="rounded-md border border-black/10 bg-white shadow-sm">
            <CardHeader className="border-b border-zinc-100 px-3 sm:px-6 pb-3">
              <CardTitle className="font-display text-sm sm:text-base font-bold text-zinc-900">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4 text-sm">
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">
                  Full Name
                </span>
                <p className="font-display font-bold text-zinc-900 mt-0.5 text-sm">
                  {user?.fullName || '—'}
                </p>
              </div>
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">
                  Email Address
                </span>
                <p className="font-display font-medium text-zinc-900 mt-0.5 text-sm break-all">
                  {user?.email || '—'}
                </p>
              </div>
              <div>
                <span className="block font-display text-[11px] sm:text-xs font-semibold text-zinc-500">
                  Phone Number
                </span>
                <p className="font-display font-medium text-zinc-900 mt-0.5 text-sm">
                  {user?.phone || '+92 300 0000000'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-md border border-black/10 bg-white shadow-sm">
            <CardHeader className="border-b border-zinc-100 px-3 sm:px-6 pb-3">
              <CardTitle className="font-display text-sm sm:text-base font-bold text-zinc-900">
                Ride Preferences & Safety
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4 text-sm">
              <div className="flex items-center justify-between gap-2 py-1 border-b border-zinc-100">
                <span className="font-display text-[11px] sm:text-xs font-medium text-zinc-600">
                  Preferred Vehicles
                </span>
                <Badge variant="outline" className="rounded-sm font-display text-[10px] sm:text-xs font-bold text-zinc-900 shrink-0">
                  Bike & Mini
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 py-1 border-b border-zinc-100">
                <span className="font-display text-[11px] sm:text-xs font-medium text-zinc-600">
                  Negotiation
                </span>
                <Badge className="rounded-sm bg-[#C1F11D] font-display text-[10px] sm:text-xs font-bold text-black shrink-0">
                  Custom Bid
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 py-1">
                <span className="font-display text-[11px] sm:text-xs font-medium text-zinc-600">
                  OTP Verification
                </span>
                <Badge variant="outline" className="rounded-sm border-emerald-300 bg-emerald-50 text-emerald-700 font-display text-[10px] sm:text-xs font-bold shrink-0">
                  Enabled
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
