"use client";

import { DollarSign, ShoppingCart, Wallet, MousePointerClick, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MASK_COUNT, MASK_MONEY, MASK_PERCENT } from "@/components/admin/dashboard/privacy-mode";

interface Metric {
  value: number;
  change: number;
  delta?: number;
}

interface OverviewCardsProps {
  metrics: {
    revenue: Metric;
    sales: Metric;
    avgTicket: Metric;
    visits: Metric;
  };
  valuesHidden?: boolean;
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function OverviewCards({ metrics, valuesHidden = false }: OverviewCardsProps) {
  const cards = [
    {
      title: "Faturamento",
      value: valuesHidden ? MASK_MONEY : formatBRL(metrics.revenue.value),
      change: metrics.revenue.change,
      icon: DollarSign,
      formattedChange: valuesHidden
        ? MASK_MONEY
        : formatBRL(Math.abs(metrics.revenue.delta ?? 0)),
    },
    {
      title: "Vendas",
      value: valuesHidden
        ? `${MASK_COUNT} Vendas`
        : `${metrics.sales.value.toLocaleString("pt-BR")} Vendas`,
      change: metrics.sales.change,
      icon: ShoppingCart,
      formattedChange: valuesHidden
        ? MASK_COUNT
        : Math.abs(metrics.sales.delta ?? 0).toLocaleString("pt-BR"),
    },
    {
      title: "Ticket Médio",
      value: valuesHidden ? MASK_MONEY : formatBRL(metrics.avgTicket.value),
      change: metrics.avgTicket.change,
      icon: Wallet,
      formattedChange: valuesHidden
        ? MASK_MONEY
        : formatBRL(Math.abs(metrics.avgTicket.delta ?? 0)),
    },
    {
      title: "Visitas",
      value: valuesHidden ? MASK_COUNT : metrics.visits.value.toLocaleString("pt-BR"),
      change: metrics.visits.change,
      icon: MousePointerClick,
      formattedChange: valuesHidden
        ? MASK_COUNT
        : Math.abs(metrics.visits.delta ?? 0).toLocaleString("pt-BR"),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const isFlat = Math.abs(card.change) < 0.05;
        const isUp = card.change >= 0;
        const TrendIcon = isUp ? TrendingUp : TrendingDown;

        return (
          <div
            key={card.title}
            className="bg-card/50 border border-white/5 rounded-md p-4 sm:p-5 transition-all"
          >
            <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm sm:text-xl font-medium text-white truncate">{card.value}</h3>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <div
                      className={cn(
                        "flex items-center gap-0.5 rounded-xs px-2 py-0.5 text-xs font-medium",
                        isFlat
                          ? "bg-white/5 text-white/50"
                          : isUp
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                      )}
                    >
                      {!isFlat && <TrendIcon className="h-3.5 w-3.5" />}
                      {valuesHidden
                        ? MASK_PERCENT
                        : isFlat
                          ? "0%"
                          : `${Math.abs(card.change).toFixed(1)}%`}
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-white/40 whitespace-nowrap">
                      {isFlat ? "~" : isUp ? "+" : "-"} {card.formattedChange}
                    </span>
                  </div>
                </div>
              </div>

              <span className="hidden sm:flex items-center justify-end text-xs font-medium text-white/60">
                {card.title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
