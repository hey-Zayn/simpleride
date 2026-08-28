'use client';

import { Signal, WifiOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Availability = 'OFFLINE' | 'CONNECTING' | 'ONLINE';

interface DriverAvailabilityBarProps {
  availability: Availability;
  isOnline: boolean;
  isSubmitting: boolean;
  onToggle: () => void;
}

export function DriverAvailabilityBar({
  availability,
  isOnline,
  isSubmitting,
  onToggle,
}: DriverAvailabilityBarProps) {
  const online = isOnline;

  return (
    <header className="absolute left-4 right-4 top-4 z-30 mx-auto flex max-w-md items-center gap-3 rounded-md border border-black/10 bg-white/95 p-3.5 shadow-xl backdrop-blur-md text-zinc-900">
      <div
        className={`flex size-10 items-center justify-center rounded-md border transition-colors ${
          online
            ? 'border-[#C1F11D]/60 bg-[#C1F11D]/20 text-zinc-950 shadow-sm'
            : 'border-zinc-200 bg-zinc-100 text-zinc-400'
        }`}
      >
        {isSubmitting ? (
          <Loader2 className="size-4 animate-spin text-zinc-700" />
        ) : online ? (
          <Signal className="size-4.5 text-zinc-900" />
        ) : (
          <WifiOff className="size-4.5 text-zinc-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-display text-sm font-bold text-zinc-950 leading-none">
            {online
              ? 'Online'
              : availability === 'CONNECTING'
              ? 'Connecting GPS'
              : 'Offline'}
          </p>
          {online && (
            <Badge
              variant="outline"
              className="rounded-sm border-[#C1F11D]/60 bg-[#C1F11D]/25 px-1.5 py-0 text-[10px] font-display font-bold text-zinc-900"
            >
              LIVE
            </Badge>
          )}
        </div>
        <p className="font-display text-xs text-zinc-500 mt-1 leading-none">
          {online
            ? 'Waiting for ride offers...'
            : 'Go online to receive nearby requests'}
        </p>
      </div>

      <Button
        size="sm"
        disabled={isSubmitting}
        onClick={onToggle}
        className={`min-h-9 rounded-md font-display font-bold transition-transform active:scale-[0.98] ${
          online
            ? 'border border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 hover:text-zinc-950'
            : 'bg-[#C1F11D] text-black shadow-md shadow-[#C1F11D]/25 hover:bg-[#b0dc17]'
        }`}
      >
        {online ? 'Go offline' : 'Go online'}
      </Button>
    </header>
  );
}

