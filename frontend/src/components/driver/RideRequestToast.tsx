"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  MapPin,
  Navigation,
  Star,
  UserRound,
  X,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface RideRequest {
  id: string;
  rideId?: string;
  passengerName?: string;
  passengerRating?: number;
  pickupAddress: string;
  dropoffAddress: string;
  fare: number;
  offeredFare?: number;
  distanceKm?: number;
  estimatedMins?: number;
  expiresInSeconds?: number;
}

interface RideRequestToastProps {
  request: RideRequest;
  onAccept: (request: RideRequest) => void;
  onDecline: (requestId: string) => void;
  onCounterOffer: (request: RideRequest, counterFare: number) => void;
  pending?: boolean;
}

export default function RideRequestToast({
  request,
  onAccept,
  onDecline,
  onCounterOffer,
  pending = false,
}: RideRequestToastProps) {
  const expiresIn = request.expiresInSeconds ?? 120;
  const [timeLeft, setTimeLeft] = useState(expiresIn);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterFare, setCounterFare] = useState(
    String(Math.round(request.fare * 1.15)),
  );

  useEffect(() => {
    setTimeLeft(expiresIn);
    setCounterFare(String(Math.round(request.fare * 1.15)));
    setCounterOpen(false);
  }, [expiresIn, request.id, request.fare]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDecline(request.rideId ?? request.id);
      return;
    }
    const timer = window.setTimeout(
      () => setTimeLeft((value) => value - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [onDecline, request.id, request.rideId, timeLeft]);

  const counter = Number(counterFare);
  const initials = (request.passengerName || "Rider")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside
      className="w-full max-w-sm overflow-hidden rounded-md border border-border/80 bg-zinc-950/95 text-white shadow-2xl backdrop-blur-md"
      aria-live="assertive"
    >
      {/* Progress Bar with Lime Highlight */}
      <div className="h-1.5 w-full bg-zinc-800">
        <div
          className="h-full bg-[#C1F11D] transition-[width] duration-1000 ease-linear shadow-[0_0_8px_#C1F11D]"
          style={{ width: `${Math.max(0, (timeLeft / expiresIn) * 100)}%` }}
        />
      </div>

      <div className="space-y-3.5 p-4">
        {/* Rider Header */}
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 rounded-md border border-[#C1F11D]/30 ring-2 ring-[#C1F11D]/20">
              <AvatarFallback className="rounded-md bg-[#C1F11D]/15 font-display text-sm font-bold text-[#C1F11D]">
                {initials || <UserRound className="size-4" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-display text-sm font-bold text-white">
                  {request.passengerName || "Rider"}
                </h4>
                <Badge
                  variant="outline"
                  className="rounded-sm border-[#C1F11D]/30 bg-[#C1F11D]/10 px-1.5 py-0 text-[10px] font-display font-medium text-[#C1F11D]"
                >
                  NEW
                </Badge>
              </div>
              <p className="flex items-center gap-1 font-display text-xs text-zinc-400">
                <Star className="size-3 fill-[#C1F11D] text-[#C1F11D]" />
                <span className="font-semibold text-zinc-200">
                  {(request.passengerRating ?? 4.8).toFixed(1)}
                </span>
                <span>· 10+ rides</span>
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-display text-lg font-extrabold text-[#C1F11D] tabular-nums tracking-tight">
              PKR {request.fare.toLocaleString()}
            </p>
            <p className="flex items-center justify-end gap-1 font-display text-xs text-zinc-400">
              <Clock className="size-3 text-[#C1F11D]" />
              <span className="tabular-nums font-medium text-zinc-300">{timeLeft}s left</span>
            </p>
          </div>
        </header>

        {/* Route Details Card */}
        <div className="space-y-2.5 rounded-md border border-zinc-800 bg-zinc-900/70 p-3 text-xs">
          <div className="flex gap-2.5 items-start">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-[#C1F11D]/15 text-[#C1F11D]">
              <MapPin className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-display text-[10px] font-bold uppercase tracking-wider text-[#C1F11D]/80">
                Pickup
              </span>
              <p className="font-display text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                {request.pickupAddress}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start">
            <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm bg-emerald-500/15 text-emerald-400">
              <Navigation className="size-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block font-display text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                Drop-off
              </span>
              <p className="font-display text-xs text-zinc-200 line-clamp-2 leading-relaxed">
                {request.dropoffAddress}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-800 pt-2 font-display text-[11px] text-zinc-400 tabular-nums">
            <span>
              <strong className="text-zinc-200">{request.distanceKm?.toFixed(1) ?? "—"} km</strong> distance
            </span>
            <span>·</span>
            <span>
              est. <strong className="text-zinc-200">{request.estimatedMins ?? "—"} min</strong> trip
            </span>
          </div>
        </div>

        {/* Counter Offer Input */}
        {counterOpen && (
          <div className="flex gap-2 items-center rounded-md border border-[#C1F11D]/30 bg-zinc-900/90 p-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-display text-xs font-bold text-[#C1F11D]">
                PKR
              </span>
              <Input
                className="h-9 rounded-md border-zinc-700 bg-zinc-950 pl-11 font-display text-sm font-semibold text-white focus-visible:border-[#C1F11D] focus-visible:ring-1 focus-visible:ring-[#C1F11D]"
                inputMode="decimal"
                aria-label="Counter offer in PKR"
                value={counterFare}
                onChange={(event) => setCounterFare(event.target.value)}
              />
            </div>
            <Button
              size="sm"
              className="h-9 rounded-md bg-[#C1F11D] font-display font-bold text-black hover:bg-[#b0dc17]"
              disabled={pending || !Number.isFinite(counter) || counter <= 0}
              onClick={() => onCounterOffer(request, counter)}
            >
              <TrendingUp className="mr-1 size-3.5" />
              Send
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            className="min-h-10 rounded-md border-zinc-800 bg-zinc-900/80 font-display font-medium text-zinc-300 hover:border-red-500/30 hover:bg-red-500/15 hover:text-red-400"
            disabled={pending}
            onClick={() => onDecline(request.rideId ?? request.id)}
          >
            <X className="size-4 mr-1" />
            Reject
          </Button>
          <Button
            variant="secondary"
            className="min-h-10 rounded-md bg-zinc-800 font-display font-medium text-zinc-200 hover:bg-zinc-700"
            disabled={pending}
            onClick={() => setCounterOpen((open) => !open)}
          >
            Counter
          </Button>
          <Button
            className="min-h-10 rounded-md bg-[#C1F11D] font-display font-bold text-black shadow-[0_0_12px_rgba(193,241,29,0.35)] hover:bg-[#b0dc17] hover:scale-[1.02] transition-transform"
            disabled={pending}
            onClick={() => onAccept(request)}
          >
            <Check className="size-4 mr-1 stroke-[2.5]" />
            Accept
          </Button>
        </div>
      </div>
    </aside>
  );
}

