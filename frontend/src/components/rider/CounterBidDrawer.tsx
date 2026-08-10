'use client';

import React, { useState } from 'react';
import { DriverCounterBid } from '@/hooks/useRiderSockets';

interface CounterBidDrawerProps {
  rideId: string;
  bids: DriverCounterBid[];
  onBidAccepted: () => void;
}

export default function CounterBidDrawer({
  rideId,
  bids,
  onBidAccepted,
}: CounterBidDrawerProps) {
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);

  const handleAcceptBid = async (bidId: string) => {
    setAcceptingBidId(bidId);
    try {
      const res = await fetch(`/ride/api/rides/${rideId}/counter/${bidId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to accept counter offer');

      onBidAccepted();
    } catch (err: any) {
      alert(err.message || 'Error accepting offer.');
    } finally {
      setAcceptingBidId(null);
    }
  };

  if (bids.length === 0) return null;

  return (
    <div className="w-full bg-zinc-950 border-t border-zinc-800 p-4 rounded-t-xl text-white shadow-2xl space-y-3">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
        Driver Counter Offers ({bids.length})
      </h3>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {bids.map((bid) => (
          <div
            key={bid.bidId}
            className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-3 rounded"
          >
            <div>
              <p className="text-sm font-bold">{bid.driverName || 'Nearby Driver'}</p>
              <p className="text-xs text-zinc-400">★ {bid.driverRating || 4.9}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-mono font-bold text-yellow-400">
                PKR {bid.counterFare}
              </span>
              <button
                onClick={() => handleAcceptBid(bid.bidId)}
                disabled={acceptingBidId === bid.bidId}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1.5 rounded text-xs font-bold"
              >
                {acceptingBidId === bid.bidId ? 'Accepting...' : 'Accept'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}