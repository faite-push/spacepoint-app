import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { CreditCard, Smartphone, History, PackageSearch, TrendingUp, AlertCircle, ShoppingBag, Layers } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RiAlarmWarningFill } from "react-icons/ri";

interface MetricSidebarProps {
  data: {
    conversion: { total: number; approvedCount: number; pendingCount: number; approvedPct: number };
    methods: { name: string; value: number }[];
    gateways: { name: string; value: number }[];
    latestSales?: { id: string; customer: string; value: number; time: string; status: "success" | "pending" | "failed" }[];
    productStats?: {
      lowStock: { id: string; name: string; stock: number; price: number }[];
      topSellers: { id: string; name: string; salesCount: number; price: number }[];
    };
  }
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function MetricSidebar({ data }: MetricSidebarProps) {
  const [productFilter, setProductFilter] = useState<"lowStock" | "topSellers">("topSellers");

  const conversion = data.conversion ?? {
    total: 0,
    approvedCount: 0,
    pendingCount: 0,
    approvedPct: 0,
  };
  const sales = data.latestSales || [];
  const products = data.productStats || { lowStock: [], topSellers: [] };

  return (
    <div className="space-y-4">
      <div className="bg-card/50 border border-white/5 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Conversão</h3>
          <button className="cursor-pointer text-xs font-medium text-primary hover:underline">Ver pedidos</button>
        </div>

        <div className="relative h-[160px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              barSize={12}
              data={[{ value: conversion.approvedPct }]}
              startAngle={210}
              endAngle={-30}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background={{ fill: 'rgba(255,255,255,0.03)' }}
                dataKey="value"
                cornerRadius={12}
                fill="#A855F7"
                animationDuration={1500}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <p className="text-lg font-medium text-white">{formatBRL(conversion.total)}</p>
            <p className="text-xs font-light text-white/50">Faturamento</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 px-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[11px] font-medium text-zinc-300">Aprovados {conversion.approvedPct}%</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[11px] font-medium text-zinc-300">Pendentes {100 - conversion.approvedPct}%</span>
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card/50 border border-white/5 rounded-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-medium text-white">Últimas Vendas</h3>
        </div>
        <ScrollArea className="h-[150px] pr-4">
          <div className="space-y-4">
            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <ShoppingBag className="h-8 w-8 text-white/10 mb-2" />
                <p className="text-xs text-white/20">Nenhuma venda recente</p>
              </div>
            ) : sales.map((sale) => {
              const formattedTime = sale.time ? formatDistanceToNow(new Date(sale.time), { addSuffix: true, locale: ptBR }) : "";
              return (
                <div key={sale.id} className="flex items-center gap-3 group">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border border-white/5 bg-white/5",
                    sale.status === "success" && "group-hover:bg-green-500/10 group-hover:border-green-500/20 transition-colors",
                    sale.status === "pending" && "group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-colors",
                  )}>
                    <ShoppingBag className={cn(
                      "h-4 w-4",
                      sale.status === "success" && "text-green-500",
                      sale.status === "pending" && "text-amber-500",
                      sale.status === "failed" && "text-red-500",
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{sale.customer}</p>
                    <p className="text-[10px] text-white/40">{formattedTime}</p>
                  </div>
                  <p className="text-xs font-semibold text-white">{formatBRL(sale.value)}</p>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="bg-card/50 border border-white/5 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-white">Produtos</h3>
          </div>
          <div className="flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setProductFilter("topSellers")}
                  className={cn(
                    "cursor-pointer p-2 rounded-sm transition-all",
                    productFilter === "topSellers" ? "bg-primary text-white" : "text-white/40 hover:text-white"
                  )}
                >
                  <Layers className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mais vendidos</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setProductFilter("lowStock")}
                  className={cn(
                    "cursor-pointer p-2 rounded-sm transition-all",
                    productFilter === "lowStock" ? "bg-red-500 text-white" : "text-white/40 hover:text-white"
                  )}
                >
                  <RiAlarmWarningFill className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Estoque baixo</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-4">
            {((productFilter === "topSellers" ? products.topSellers : products.lowStock) || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <PackageSearch className="h-8 w-8 text-white/10 mb-2" />
                <p className="text-xs text-white/20">Nenhum produto encontrado</p>
              </div>
            ) : (productFilter === "topSellers" ? products.topSellers : products.lowStock).map((p: any) => (
              <div key={p.id} className="flex flex-col gap-1.5 p-2 rounded-md hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-medium text-white/90 line-clamp-1 flex-1 pr-2">{p.name}</p>
                  <span className="text-xs font-bold text-white whitespace-nowrap">{formatBRL(p.price)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40">
                    {productFilter === "topSellers" ? `${p.salesCount} vendas` : `${p.stock} em estoque`}
                  </span>
                  <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        productFilter === "topSellers" ? "bg-primary shadow-[0_0_8px_#A855F7]" : "bg-red-500 shadow-[0_0_8px_#EF4444]"
                      )}
                      style={{ width: `${productFilter === "topSellers" ? Math.min((p.salesCount / 200) * 100, 100) : Math.max(100 - (p.stock * 10), 10)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};