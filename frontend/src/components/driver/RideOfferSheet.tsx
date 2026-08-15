'use client';

import { useState } from 'react';
import { Check, Clock, MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { IncomingRideRequest } from '@/types/driver-ride';

interface RideOfferSheetProps { request: IncomingRideRequest | null; secondsLeft: number; pending: boolean; onAccept: () => void; onDecline: () => void; onCounter: (fare: number) => void; }
export function RideOfferSheet({ request, secondsLeft, pending, onAccept, onDecline, onCounter }: RideOfferSheetProps) {
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterFare, setCounterFare] = useState('');
  if (!request) return null;
  const fare = request.offeredFare;
  const sendCounter = () => { const value = Number(counterFare); if (Number.isFinite(value) && value > 0) onCounter(value); };
  return <Sheet open={Boolean(request)} onOpenChange={(open) => { if (!open) onDecline(); }}><SheetContent side="bottom" showCloseButton={false} className="mx-auto max-h-[82dvh] max-w-xl rounded-t-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"><div className="mx-auto mt-3 h-1 w-10 rounded-full bg-border" /><SheetHeader className="px-0"><div className="flex items-start justify-between gap-4"><div><SheetTitle>New ride offer</SheetTitle><SheetDescription><Clock className="mr-1 inline size-3" />Expires in {secondsLeft}s</SheetDescription></div><p className="font-display text-2xl font-bold tabular-nums">PKR {fare.toLocaleString()}</p></div></SheetHeader><div className="space-y-3 text-sm"><p className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-emerald-500" />{request.pickupAddress}</p><p className="flex gap-2"><Navigation className="mt-0.5 size-4 shrink-0 text-primary" />{request.dropoffAddress}</p><p className="text-muted-foreground tabular-nums">{request.distanceKm?.toFixed(1) ?? '—'} km · {request.estimatedMins ?? '—'} min</p>{counterOpen && <div className="flex gap-2"><Input inputMode="decimal" aria-label="Counter fare in PKR" placeholder={`Counter above PKR ${fare}`} value={counterFare} onChange={(event) => setCounterFare(event.target.value)} /><Button variant="secondary" disabled={pending || !counterFare} onClick={sendCounter}>Send</Button></div>}</div><SheetFooter className="px-0"><div className="grid grid-cols-3 gap-2"><Button variant="outline" className="min-h-11" disabled={pending} onClick={onDecline}><X />Decline</Button><Button variant="secondary" className="min-h-11" disabled={pending} onClick={() => setCounterOpen((value) => !value)}>Counter</Button><Button className="min-h-11" disabled={pending} onClick={onAccept}><Check />Accept</Button></div></SheetFooter></SheetContent></Sheet>;
}
