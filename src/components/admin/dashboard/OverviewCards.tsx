"use client";

import { DollarSign, ShoppingCart, Wallet, MousePointerClick, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Metric {
  value: number;
  change: number;
}

interface OverviewCardsProps {
  metrics: {
    revenue: Metric;
    sales: Metric;
    avgTicket: Metric;
    visits: Metric;
  };
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function OverviewCards({ metrics }: OverviewCardsProps) {
  const cards = [
    {
      title: "Faturamento",
      value: formatBRL(metrics.revenue.value),
      change: metrics.revenue.change,
      icon: DollarSign,
      formattedChange: formatBRL(Math.abs(metrics.revenue.value * (metrics.revenue.change / 100)))
    },
    {
      title: "Vendas",
      value: metrics.sales.value.toLocaleString('pt-BR') + " Vendas",
      change: metrics.sales.change,
      icon: ShoppingCart,
      formattedChange: Math.abs(Math.round(metrics.sales.value * (metrics.sales.change / 100))).toLocaleString('pt-BR')
    },
    {
      title: "Ticket Médio",
      value: formatBRL(metrics.avgTicket.value),
      change: metrics.avgTicket.change,
      icon: Wallet,
      formattedChange: formatBRL(Math.abs(metrics.avgTicket.value * (metrics.avgTicket.change / 100)))
    },
    {
      title: "Visitas",
      value: metrics.visits.value.toLocaleString('pt-BR'),
      change: metrics.visits.change,
      icon: MousePointerClick,
      formattedChange: Math.abs(Math.round(metrics.visits.value * (metrics.visits.change / 100))).toLocaleString('pt-BR')
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isUp = card.change >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;

        return (
          <div key={card.title} className="bg-card/50 border border-white/5 rounded-md p-5 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-white/60">{card.title}</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-medium text-white">{card.value}</h3>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex items-center gap-0.5 rounded-xs px-2 py-0.5 text-xs font-medium",
                  isUp ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  <TrendIcon className="h-3.5 w-3.5" />
                  {Math.abs(card.change).toFixed(1)}%
                </div>
                <span className="text-[11px] text-white/40">
                  {isUp ? "+" : "-"} {card.formattedChange}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
