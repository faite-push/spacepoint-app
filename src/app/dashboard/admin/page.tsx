"use client";

import { useState } from "react";
import { subDays } from "date-fns";
import { Package, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { usePermission } from "@/providers/PermissionProvider";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/lib/api";

import { PerformanceChart } from "@/components/admin/dashboard/PerformanceChart";
import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { CustomersChart } from "@/components/admin/dashboard/CustomersChart";
import { OverviewCards } from "@/components/admin/dashboard/OverviewCards";
import { MetricSidebar } from "@/components/admin/dashboard/MetricSidebar";
import { DashboardSkeleton } from "@/components/admin/skeletons/DashboardSkeleton";

async function fetchStats(from: Date, to: Date) {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const res = await fetch(`${API_URL}/v2/api/admin/stats?from=${fromIso}&to=${toIso}`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao carregar métricas");

  const data = await res.json();
  return {
    ...data,
    sidebar: {
      ...data.sidebar,
      latestSales: data.sidebar?.latestSales || [],
      productStats: data.sidebar?.productStats || { lowStock: [], topSellers: [] }
    }
  };
};

export default function AdminDashboard() {
  const { hasPermission } = usePermission();
  const canopyAnalytics = hasPermission('analytics:view');

  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "stats", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => fetchStats(dateRange.from, dateRange.to),
    enabled: canopyAnalytics,
  });

  if (!canopyAnalytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel administrativo</p>
        </div>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 rounded-3xl border border-white/5 bg-[#0A0A0A]">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-500/10 border border-purple-500/20">
            <Package className="h-10 w-10 text-purple-500" />
          </div>
          <div className="text-center max-w-sm px-6">
            <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
            <p className="mt-2 text-sm text-zinc-500 leading-relaxed">Você não tem permissão para visualizar as métricas de desempenho da loja.</p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Permissão Necessária</span>
              <code className="rounded bg-white/5 px-2 py-1 text-xs text-purple-400 border border-white/10">analytics:view</code>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="relative space-y-8 pb-20 animate-in fade-in duration-700 min-h-screen">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-muted-foreground">Análises e informações de rendimentos</p>
        </div>
        <DateRangeFilter onRangeChange={(range) => setDateRange(range)} />
      </div>

      <div className="relative z-10">
        {error || !data ? (
          <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-zinc-500">
            <p className="text-lg font-medium text-white">Ops! Algo deu errado.</p>
            <p className="text-sm">Não foi possível carregar as métricas agora.</p>
            <Button variant="outline" className="rounded-xl border-white/10" onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        ) : (
          <>
            <OverviewCards metrics={data.metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
              <div className="lg:col-span-2 space-y-6">
                <PerformanceChart data={data.charts.performance} />
                <CustomersChart data={data.charts.customers} />
              </div>

              <div className="lg:col-span-1">
                <MetricSidebar data={data.sidebar} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};