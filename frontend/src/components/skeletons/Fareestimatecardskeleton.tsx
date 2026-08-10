'use client';

/**
 * Loading placeholder for <FareEstimateCard />.
 * Mirrors its exact structure (category grid, fare stepper, CTA) so the
 * layout doesn't shift when real data arrives — swap this in while a route
 * or fare estimate is being calculated.
 *
 * Usage:
 *   {isEstimating ? <FareEstimateCardSkeleton /> : <FareEstimateCard />}
 */
export default function FareEstimateCardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Calculating fare estimate"
      className="w-full bg-white/90 backdrop-blur-md border border-black/10 rounded-xl p-4 shadow-sm space-y-4 animate-pulse"
    >
      {/* Category grid */}
      <div>
        <div className="h-2.5 w-36 bg-gray-200 rounded-full mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50"
            >
              <div className="w-4 h-4 rounded-full bg-gray-200" />
              <div className="h-2.5 w-9 bg-gray-200 rounded-full" />
              <div className="h-2 w-14 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Fare stepper */}
      <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-24 bg-gray-200 rounded-full" />
          <div className="h-2.5 w-16 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
          <div className="flex-1 h-11 rounded-lg bg-gray-200" />
          <div className="w-10 h-10 rounded-lg bg-gray-200 shrink-0" />
        </div>
      </div>

      {/* CTA */}
      <div className="h-12 w-full bg-gray-200 rounded-lg" />
    </div>
  );
}