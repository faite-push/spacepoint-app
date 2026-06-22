import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="relative space-y-8 pb-20 animate-in fade-in duration-700 min-h-screen">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-full sm:w-[300px] rounded-md" />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-md border border-white/5 bg-[#0A0A0A]" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[400px] rounded-md border border-white/5 bg-[#0A0A0A]" />
            <Skeleton className="h-[300px] rounded-md border border-white/5 bg-[#0A0A0A]" />
          </div>

          <div className="lg:col-span-1">
            <Skeleton className="h-[720px] rounded-md border border-white/5 bg-[#0A0A0A]" />
          </div>
        </div>
      </div>
    </div>
  );
}
