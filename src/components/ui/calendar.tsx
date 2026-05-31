"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  className?: string;
  mode?: "single"; // For compat with shadcn
  initialFocus?: boolean;
};

export function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const isSelected = (day: number) => {
    return selected?.getDate() === day &&
           selected?.getMonth() === currentMonth.getMonth() &&
           selected?.getFullYear() === currentMonth.getFullYear();
  };

  const monthName = currentMonth.toLocaleString("pt-BR", { month: "long" });

  return (
    <div className={cn("p-3 bg-[#0D0D0D]", className)}>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-white/5 rounded text-zinc-400">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium text-white capitalize">
          {monthName} {currentMonth.getFullYear()}
        </div>
        <button onClick={nextMonth} className="p-1 hover:bg-white/5 rounded text-zinc-400">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase font-bold text-zinc-600 mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {padding.map(i => <div key={`p-${i}`} />)}
        {days.map(day => (
          <button
            key={day}
            type="button"
            onClick={() => onSelect?.(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
            className={cn(
              "h-8 w-8 text-xs rounded-md flex items-center justify-center transition-colors",
              isSelected(day) 
                ? "bg-primary text-white font-bold" 
                : "text-zinc-400 hover:bg-white/5"
            )}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
