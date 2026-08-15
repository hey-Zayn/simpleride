'use client';

import { Signal, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Availability = 'OFFLINE' | 'CONNECTING' | 'ONLINE';
interface DriverAvailabilityBarProps { availability: Availability; isOnline: boolean; isSubmitting: boolean; onToggle: () => void; }
export function DriverAvailabilityBar({ availability, isOnline, isSubmitting, onToggle }: DriverAvailabilityBarProps) {
  const online = isOnline;
  const copy = online ? 'Online — waiting for offers' : availability === 'CONNECTING' ? 'Connecting to GPS' : 'You are offline';
  return <header className="absolute left-4 right-4 top-[max(1rem,env(safe-area-inset-top))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl border border-border bg-popover/95 p-3 shadow-sm backdrop-blur"><span className={`flex size-9 items-center justify-center rounded-full ${online ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>{online ? <Signal className="size-4" /> : <WifiOff className="size-4" />}</span><p className="min-w-0 flex-1 text-sm font-medium" aria-live="polite">{copy}</p><Button size="sm" className="min-h-11" disabled={isSubmitting} onClick={onToggle}>{online ? 'Go offline' : 'Go online'}</Button></header>;
}
