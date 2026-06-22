"use client";

import { Ticket, Users, TrendingUp, Wallet, DollarSign, Receipt, ReceiptText } from "lucide-react";
import { CouponStats } from "@/lib/coupons-api";
import { GrGroup } from "react-icons/gr";
import { cn } from "@/lib/utils";

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
      "relative group select-none overflow-hidden rounded-md border border-white/3 bg-background/50 px-4 py-4 md:px-6 md:py-5 transition-all duration-300",
      className
    )}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-white/5" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg md:text-xl font-medium text-white tracking-tight">{value}</h3>
                <p className="text-xs md:text-sm text-white/60">{label}</p>
              </div>
            </div>
          )}
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
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Cupons Usos"
        value={stats?.totalUses || 0}
        description="Total de utilizações"
        icon={GrGroup}
        loading={loading}
      />

      <StatCard
        label="Cupons Utilizados"
        value={stats?.uniqueCouponsUsed || 0}
        description="Tipos de cupons ativos"
        icon={ReceiptText}
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
        icon={DollarSign}
        loading={loading}
      />
    </div>
  );
}
