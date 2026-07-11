"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ListFilter } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CustomersChartProps {
  data: any[];
}

export function CustomersChart({ data }: CustomersChartProps) {
  const [series, setSeries] = useState({
    unique: true,
    returning: true
  });

  return (
    <div className="bg-card/50 border border-white/5 rounded-md p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Visitantes únicos e recorrentes</h3>
          <p className="text-sm text-white/40">Tráfego real da loja por período selecionado.</p>
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
                onClick={() => setSeries(s => ({ ...s, unique: !s.unique }))}
              >
                <Checkbox
                  id="unique"
                  checked={series.unique}
                  className="h-6 w-6 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  onCheckedChange={(v: boolean) => setSeries(s => ({ ...s, unique: v }))}
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <Label htmlFor="unique" className="text-xs font-medium text-white/70 group-hover:text-white cursor-pointer select-none">Visitantes únicos</Label>
                </div>
              </div>
              <div
                className="flex items-center gap-3 px-3 h-10 rounded-md hover:bg-white/5 transition-colors cursor-pointer group"
                onClick={() => setSeries(s => ({ ...s, returning: !s.returning }))}
              >
                <Checkbox
                  id="returning"
                  checked={series.returning}
                  className="h-6 w-6 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  onCheckedChange={(v: boolean) => setSeries(s => ({ ...s, returning: v }))}
                />
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <Label htmlFor="returning" className="text-xs font-medium text-white/70 group-hover:text-white cursor-pointer select-none">Visitantes recorrentes</Label>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }} dy={10} interval="preserveStartEnd" />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 10, fontWeight: 700 }} allowDecimals={false} />
            <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: '#0F0F11', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px', textTransform: 'uppercase' }}
            />
            {series.unique && (
              <Bar dataKey="unique" fill="#10b981" radius={[4, 4, 0, 0]} name="Clientes Únicos" animationDuration={1000} />
            )}
            {series.returning && (
              <Bar dataKey="returning" fill="#A855F7" radius={[4, 4, 0, 0]} name="Visitantes recorrentes" animationDuration={1000} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
