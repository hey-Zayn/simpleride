'use client';

import { RideStatus } from '@/types/driver-ride';
const steps: RideStatus[] = ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
export function TripProgress({ status }: { status: RideStatus }) { const current = steps.indexOf(status); return <ol className="flex items-center gap-1" aria-label={`Ride progress: ${status.replace('_', ' ')}`}>{steps.map((step, index) => <li key={step} className={`h-1 flex-1 rounded-full ${index <= current ? 'bg-primary' : 'bg-muted'}`} />)}</ol>; }
