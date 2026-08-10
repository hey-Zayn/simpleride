import { Skeleton } from '@/components/ui/skeleton';
import { Navigation } from 'lucide-react';

// Shown while the Leaflet map bundle is loading (next/dynamic's `loading`
// fallback) so the screen doesn't flash plain text on first paint.
export default function MapViewSkeleton() {
  return (
    <div className="relative w-full h-full min-h-[480px] bg-gray-100 overflow-hidden">
      <Skeleton className="absolute inset-0 rounded-none bg-gray-200/80" />

      {/* Faint road grid — implies a map without pretending to be real geodata */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.08]"
        preserveAspectRatio="none"
        viewBox="0 0 400 400"
        aria-hidden="true"
      >
        <line x1="0" y1="80" x2="400" y2="80" stroke="#141414" strokeWidth="2" />
        <line x1="0" y1="200" x2="400" y2="190" stroke="#141414" strokeWidth="2" />
        <line x1="0" y1="320" x2="400" y2="330" stroke="#141414" strokeWidth="2" />
        <line x1="90" y1="0" x2="100" y2="400" stroke="#141414" strokeWidth="2" />
        <line x1="230" y1="0" x2="220" y2="400" stroke="#141414" strokeWidth="2" />
        <line x1="330" y1="0" x2="340" y2="400" stroke="#141414" strokeWidth="2" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5">
        <div className="w-11 h-11 rounded-sm bg-[#141414] flex items-center justify-center animate-pulse">
          <Navigation className="w-5 h-5 text-[#C1F11D]" strokeWidth={1.75} />
        </div>
        <p className="font-display font-bold text-xs text-[#141414]/50 uppercase tracking-wider">
          Loading map…
        </p>
      </div>
    </div>
  );
}