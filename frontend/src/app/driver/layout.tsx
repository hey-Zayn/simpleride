import React from 'react';
import DriverHeader from '@/components/driver/DriverHeader';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Sticky Top Header */}
      <DriverHeader />

      {/* Main Dynamic View Area */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </div>
    </div>
  );
}