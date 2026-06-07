"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = {
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (date: any) => void;
  className?: string;
  mode?: "single" | "range";
  initialFocus?: boolean;
  locale?: any;
  numberOfMonths?: number;
};

export function Calendar({ selected, onSelect, className, mode = "single" }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Handle initial selected month
  React.useEffect(() => {
    if (selected) {
        if (selected instanceof Date) {
            setCurrentMonth(selected);
        } else if (selected.from) {
            setCurrentMonth(selected.from);
        }
    }
  }, []);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const isSelected = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (mode === "single" && selected instanceof Date) {
        return d.toDateString() === selected.toDateString();
    }
    if (mode === "range" && typeof selected === 'object' && !(selected instanceof Date)) {
        if (selected.from && d.toDateString() === selected.from.toDateString()) return true;
        if (selected.to && d.toDateString() === selected.to.toDateString()) return true;
    }
    return false;
  };

  const isInRange = (day: number) => {
    if (mode !== "range" || !selected || (selected instanceof Date)) return false;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (selected.from && selected.to) {
        return d > selected.from && d < selected.to;
    }
    return false;
  };

  const handleDayClick = (dayNum: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
    
    if (mode === "single") {
        onSelect?.(clickedDate);
    } else {
        const s = selected as { from?: Date; to?: Date } || {};
        if (!s.from || (s.from && s.to)) {
            onSelect?.({ from: clickedDate, to: undefined });
        } else {
            if (clickedDate < s.from) {
                onSelect?.({ from: clickedDate, to: s.from });
            } else {
                onSelect?.({ from: s.from, to: clickedDate });
            }
        }
    }
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
            onClick={() => handleDayClick(day)}
            className={cn(
              "h-8 w-8 text-xs rounded-md flex items-center justify-center transition-colors relative",
              isSelected(day) 
                ? "bg-primary text-white font-bold z-10" 
                : isInRange(day) 
                    ? "bg-primary/20 text-white"
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
