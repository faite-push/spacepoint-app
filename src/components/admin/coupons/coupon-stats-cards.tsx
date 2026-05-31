"use client";

import { Ticket, Users, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { CouponStats } from "@/lib/coupons-api";

interface StatCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: any;
  className?: string;
  loading?: boolean;
}

function StatCard({ label, value, description, icon: Icon, className, loading }: StatCardProps) {
  return (
    <div className={cn(
      "relative group overflow-hidden rounded-xl border border-white/3 bg-background/50 px-6 py-3 transition-all duration-300 hover:border-white/5",
      className
    )}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-white/60">{label}</p>
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-white/5" />
          ) : (
            <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
          )}
          <p className="text-xs text-white/35">{description}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center text-white/60 transition-colors">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function CouponStatsCards({ stats, loading }: { stats?: CouponStats; loading?: boolean }) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Cupons Usos"
        value={stats?.totalUses || 0}
        description="Total de utilizações"
        icon={Ticket}
        loading={loading}
      />
      <StatCard
        label="Cupons Utilizados"
        value={stats?.uniqueCouponsUsed || 0}
        description="Tipos de cupons ativos"
        icon={Users}
        loading={loading}
      />
      <StatCard
        label="Valor Convertido"
        value={formatCurrency(stats?.totalConverted || 0)}
        description="Total em vendas com cupom"
        icon={TrendingUp}
        loading={loading}
      />
      <StatCard
        label="Valor Descontado"
        value={formatCurrency(stats?.totalDiscounted || 0)}
        description="Economia gerada aos clientes"
        icon={Wallet}
        loading={loading}
      />
    </div>
  );
}
