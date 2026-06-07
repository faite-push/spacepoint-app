"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ListFilter } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PerformanceChartProps {
  data: any[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [series, setSeries] = useState({
    revenue: true,
    sales: true,
    unitsSold: true
  });

  return (
    <div className="bg-card/50 border border-white/5 rounded-md p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-medium text-white">Visão geral de Performance</h3>
          <p className="text-sm text-white/40">Comparativo de faturamento e volume de pedidos.</p>
        </div>

        <Popover>
          <PopoverTrigger className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-9 w-24 rounded-md gap-2"
          )}>
            <span className="text-xs font-bold text-white/70">Filtrar</span>
            <ListFilter className="h-4 w-4 text-white/70" />
          </PopoverTrigger>

          <PopoverContent className="w-52 p-2 bg-card border-white/10 rounded-md" align="end">
            <div className="flex flex-col gap-1">
              <div
                className="flex items-center gap-3 px-3 h-10 rounded-md hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => setSeries(s => ({ ...s, revenue: !s.revenue }))}
              >
                <Checkbox
                  id="revenue"
                  checked={series.revenue}
                  className="h-6 w-6 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  onCheckedChange={(v: boolean) => setSeries(s => ({ ...s, revenue: v }))}
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <Label htmlFor="revenue" className="text-xs font-medium text-white/70 group-hover:text-white cursor-pointer select-none">Faturamento</Label>
                </div>
              </div>

              <div
                className="flex items-center gap-3 px-3 h-10 rounded-md hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => setSeries(s => ({ ...s, sales: !s.sales }))}
              >
                <Checkbox
                  id="sales"
                  checked={series.sales}
                  className="h-6 w-6 rounded-sm border-white/20 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                  onCheckedChange={(v: boolean) => setSeries(s => ({ ...s, sales: v }))}
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <Label htmlFor="sales" className="text-xs font-medium text-white/70 group-hover:text-white cursor-pointer select-none">Vendas</Label>
                </div>
              </div>

              <div
                className="flex items-center gap-3 px-3 h-10 rounded-md hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => setSeries(s => ({ ...s, unitsSold: !s.unitsSold }))}
              >
                <Checkbox
                  id="unitsSold"
                  checked={series.unitsSold}
                  className="h-6 w-6 rounded-sm border-white/20 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  onCheckedChange={(v: boolean) => setSeries(s => ({ ...s, unitsSold: v }))}
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <Label htmlFor="unitsSold" className="text-xs font-medium text-white/70 group-hover:text-white cursor-pointer select-none">Itens Vendidos</Label>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00c950" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00c950" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2b7fff" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2b7fff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }}
              dy={10}
              interval="preserveStartEnd"
            />
            {/* Left axis: Revenue in R$ */}
            <YAxis
              yAxisId="revenue"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }}
              tickFormatter={(v) => v === 0 ? "0" : `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              width={52}
            />
            {/* Right axis: counts (sales, units) */}
            <YAxis
              yAxisId="count"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }}
              width={28}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0F0F11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px' }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              formatter={(value: any, name: any) => {
                if (name === "Faturamento (R$)") {
                  return [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name];
                }
                return [value, name];
              }}
            />
            {series.revenue && (
              <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#A855F7" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} name="Faturamento (R$)" />
            )}
            {series.sales && (
              <Area yAxisId="count" type="monotone" dataKey="sales" stroke="#00c950" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" animationDuration={1500} name="Vendas (Qtd)" />
            )}
            {series.unitsSold && (
              <Area yAxisId="count" type="monotone" dataKey="unitsSold" stroke="#2b7fff" strokeWidth={3} fillOpacity={1} fill="url(#colorUnits)" animationDuration={1500} name="Itens Vendidos" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
