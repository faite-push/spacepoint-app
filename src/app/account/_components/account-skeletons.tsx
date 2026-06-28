import { Skeleton } from "@/components/ui/skeleton";

export function OrderSkeleton() {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4 flex-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function WishlistSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <Skeleton className="h-24 w-24 rounded-xl shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-24 mt-auto" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-8 flex-1 rounded-lg" />
          <Skeleton className="h-8 w-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="relative group select-none rounded-md border border-white/5 bg-transparent p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center justify-center gap-3">
          <Skeleton className="h-10 w-10 rounded-md shrink-0" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderDetailsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-24" />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <Skeleton className="h-7 w-40" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="p-6 border-b border-white/5 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="p-6 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
