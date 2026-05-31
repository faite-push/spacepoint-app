"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { 
  DollarSign, Package, ShoppingCart, Users, TrendingUp, TrendingDown, 
  ArrowUpRight, Loader2, Calendar as CalendarIcon, 
  ArrowRight, MousePointerClick, Wallet
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";

import { API_URL } from "@/lib/api";
import { usePermission } from "@/providers/PermissionProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MetricValue {
  value: number;
  change: number;
  previousValue: number;
}

interface DashboardStats {
  metrics: {
    revenue: MetricValue;
    ordersToday: MetricValue;
    activeProducts: MetricValue;
    users: MetricValue;
  };
  salesChart: { day: string; sales: number; revenue: number }[];
  topProducts: {
    id: string;
    name: string;
    slug: string | null;
    imageUrl: string | null;
    sales: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    status: string;
    total: number;
    createdAt: string;
    customer: { name: string; email: string | null };
    product: string;
    itemsCount: number;
  }[];
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((cents ?? 0) / 100);
}

function formatPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function formatDateBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const STATUS_BADGES: Record<string, string> = {
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  DELIVERED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  REFUNDED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Pago",
  DELIVERED: "Entregue",
  PENDING: "Pendente",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/v2/api/admin/stats`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Falha ao carregar métricas");
  return res.json();
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-3 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">{label}</p>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-white">
            {formatBRL(payload[0].value)}
          </p>
          <p className="text-[11px] text-zinc-400">
            {payload[0].payload.sales} vendas
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const { hasPermission } = usePermission();
  const canViewAnalytics = hasPermission('analytics:view');

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
    refetchInterval: 60_000,
    enabled: canViewAnalytics,
  });

  if (!canViewAnalytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-zinc-500">Bem-vindo ao painel administrativo</p>
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
  }

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-b-2 border-t-2 border-purple-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-purple-500/20"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4 text-zinc-500">
        <p className="text-lg font-medium text-white">Ops! Algo deu errado.</p>
        <p className="text-sm">Não foi possível carregar as métricas agora.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  const { metrics, salesChart, topProducts, recentOrders } = data;

  const metricCards = [
    {
      title: "Receita (7d)",
      value: formatBRL(metrics.revenue.value),
      change: metrics.revenue.change,
      icon: DollarSign,
      color: "emerald",
    },
    {
      title: "Pedidos Hoje",
      value: String(metrics.ordersToday.value),
      change: metrics.ordersToday.change,
      icon: ShoppingCart,
      color: "purple",
    },
    {
      title: "Taxa Conversão",
      value: "3.2%", // Mock por enquanto
      change: 12.5,
      icon: MousePointerClick,
      color: "blue",
    },
    {
      title: "Ticket Médio",
      value: formatBRL(metrics.revenue.value / (metrics.ordersToday.value || 10)), // Mock heuristic
      change: -2.3,
      icon: Wallet,
      color: "amber",
    },
  ];

  const chartData = salesChart.map(day => ({
    ...day,
    revenue: day.revenue / 100 // Convert cents to reais for display
  }));

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white lg:text-3xl tracking-tight">Analytics</h1>
          <p className="text-sm text-zinc-500 mt-1">Desempenho da loja nos últimos períodos.</p>
        </div>
        <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/10 rounded-xl p-1">
          <Button variant="ghost" size="sm" className="bg-white/5 text-white">7 Dias</Button>
          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">30 Dias</Button>
          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">Total</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const isUp = metric.change >= 0;
          const TrendIcon = isUp ? TrendingUp : TrendingDown;

          return (
            <div
              key={metric.title}
              className="relative group rounded-3xl border border-white/5 bg-[#0A0A0A] p-6 overflow-hidden transition-all hover:border-white/10"
            >
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <Icon size={80} />
              </div>
              
              <div className="flex items-start justify-between relative z-10">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors",
                  metric.color === "emerald" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
                  metric.color === "purple" && "bg-purple-500/10 border-purple-500/20 text-purple-500",
                  metric.color === "blue" && "bg-blue-500/10 border-blue-500/20 text-blue-500",
                  metric.color === "amber" && "bg-amber-500/10 border-amber-500/20 text-amber-500",
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold border",
                  isUp ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : "bg-red-400/10 text-red-400 border-red-400/20"
                )}>
                  <TrendIcon className="h-3 w-3" />
                  {formatPct(metric.change)}
                </div>
              </div>
              <div className="mt-4 relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">{metric.title}</p>
                <p className="mt-1 text-2xl font-black text-white">{metric.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-6 lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Curva de Vendas
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">LIVE</Badge>
              </h3>
              <p className="text-xs text-zinc-500 mt-1">Evolução do faturamento diário bruto.</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                Receita
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9333EA', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#9333EA" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Top Produtos</h3>
            <Link href="/dashboard/admin/products" className="text-xs text-purple-400 font-bold hover:underline">Ver todos</Link>
          </div>
          <div className="space-y-5">
            {topProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-20">
                <Package size={40} />
                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/50">Sem dados</p>
              </div>
            )}
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 group cursor-default">
                <div className="relative">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 text-xs font-black text-white/40 group-hover:text-purple-400 group-hover:border-purple-400/30 transition-all">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-bold text-white group-hover:text-purple-300 transition-colors">
                    {product.name}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">
                    {product.sales} vendas realizadas
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-black text-white">
                    {formatBRL(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-8 border-white/5 bg-white/[0.02] text-xs h-10 hover:bg-white/10 hover:border-white/10 rounded-xl" asChild>
            <Link href="/dashboard/admin/products">Relatório completo de produtos</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Fluxo de Pedidos</h3>
            <p className="text-xs text-zinc-500 mt-1">Status em tempo real das transações.</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl border-white/5 hover:bg-white/5 text-xs font-bold tracking-tight gap-2" asChild>
            <Link href="/dashboard/admin/orders">
              Ver todos os pedidos <ArrowRight size={14} />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
             <thead>
               <tr className="bg-white/[0.01]">
                 <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-600">ID Pedido</th>
                 <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-600">Comprador</th>
                 <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-600">Produto Principal</th>
                 <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-600">Total</th>
                 <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-zinc-600">Status</th>
                 <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-zinc-600 pr-8">Data/Hora</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/[0.03]">
               {recentOrders.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="py-20 text-center text-sm text-zinc-600 font-medium italic">Nenhum pedido registrado até o momento.</td>
                 </tr>
               ) : (
                 recentOrders.map((order) => {
                   const statusKey = (order.status ?? "").toUpperCase();
                   return (
                     <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                       <td className="px-6 py-4">
                         <span className="font-mono text-xs font-bold text-purple-400/80">
                           #{order.id.slice(-8).toUpperCase()}
                         </span>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight">{order.customer.name}</span>
                           <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">{order.customer.email}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                           <span className="text-[13px] text-zinc-300 truncate max-w-[200px]">{order.product}</span>
                           {order.itemsCount > 1 && (
                             <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-white/10 text-zinc-500">+{order.itemsCount - 1}</Badge>
                           )}
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className="text-[13px] font-black text-white">{formatBRL(order.total)}</span>
                       </td>
                       <td className="px-6 py-4">
                         <Badge 
                           className={cn(
                             "text-[10px] font-bold uppercase tracking-widest border px-2.5 py-0.5",
                             STATUS_BADGES[statusKey] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                           )}
                         >
                           {STATUS_LABELS[statusKey] ?? order.status}
                         </Badge>
                       </td>
                       <td className="px-6 py-4 text-right pr-8">
                         <span className="text-[11px] font-bold text-zinc-500">{formatDateBR(order.createdAt)}</span>
                       </td>
                     </tr>
                   );
                 })
               )}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      variant === "outline" ? "border" : "bg-primary text-white",
      className
    )}>
      {children}
    </span>
  );
}
