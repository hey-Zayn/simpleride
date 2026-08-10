import { Skeleton } from '@/components/ui/skeleton';

// Matches the shape of the vehicle-category grid + fare stepper it stands
// in for, so the layout doesn't jump once real numbers arrive.
export default function FareSectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32 rounded-sm" />
        <Skeleton className="h-4 w-20 rounded-sm" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-sm border border-gray-200 bg-white"
          >
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-2.5 w-10 rounded-sm" />
            <Skeleton className="h-2 w-14 rounded-sm" />
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 p-3 rounded-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-2.5 w-16 rounded-sm" />
          <Skeleton className="h-2.5 w-20 rounded-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-sm shrink-0" />
          <Skeleton className="flex-1 h-10 rounded-sm" />
          <Skeleton className="w-10 h-10 rounded-sm shrink-0" />
        </div>
      </div>

      <Skeleton className="w-full h-[52px] rounded-sm" />
    </div>
  );
}