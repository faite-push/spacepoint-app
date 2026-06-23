import { Skeleton } from "@/components/ui/skeleton";

export function GatewaysSkeleton() {
  return (
    <div className="relative space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="relative space-y-1">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-md border border-white/5 bg-card p-4 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="h-14 w-14 rounded-sm shrink-0" />
                <div className="min-w-0 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-24 rounded-sm" />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-white/5 bg-white/[0.02] p-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="text-center space-y-2">
                  <Skeleton className="mx-auto h-3 w-12" />
                  <Skeleton className="mx-auto h-3 w-16" />
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-6 border-t border-white/5 pt-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
