---

#### `.opencode/skill/spatial-map-marker.md`
```markdown
# Skill: spatial-map-marker

## Context
High-performance React/Mapbox/Leaflet spatial marker animation for live streaming driver GPS coordinates via WebSockets.

## Implementation Standard (TypeScript - Next.js 16 / React 19)

```tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface ActiveDriverMarkerProps {
  lat: number;
  lng: number;
  heading: number;
  isMatched?: boolean;
}

export const ActiveDriverMarker: React.FC<ActiveDriverMarkerProps> = ({
  lat,
  lng,
  heading,
  isMatched = false,
}) => {
  const markerRef = useRef<HTMLDivElement>(null);

  // Throttled CSS transform spatial interpolation to avoid jank
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.style.transform = `translate3d(${lng}px, ${lat}px, 0) rotate(${heading}deg)`;
    }
  }, [lat, lng, heading]);

  return (
    <div
      ref={markerRef}
      className="absolute transition-transform duration-300 ease-linear will-change-transform"
    >
      <div
        className={`relative flex items-center justify-center rounded-full p-2 transition-all ${
          isMatched
            ? 'bg-[--surface] text-[--brand-primary] ring-2 ring-[--brand-primary] ring-offset-2 shadow-[--shadow-overlay]'
            : 'bg-[--ink] text-white shadow-[--shadow-card]'
        }`}
      >
        {/* Pulsing indicator dot for active drivers */}
        {isMatched && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[--brand-primary] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[--brand-primary]"></span>
          </span>
        )}
        <NavigationIcon className="w-5 h-5"/>
      </div>
    </div>
  );
};

const NavigationIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
  </svg>
);