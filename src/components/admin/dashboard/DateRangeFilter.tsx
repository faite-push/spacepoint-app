"use client";

import { useState } from "react";
import { format } from "date-fns";

import { CalendarDays } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { getRangeForPreset, PRESET_LABELS, type DateRangePreset, } from "@/lib/date-range-presets";

type DateRange = { from?: Date; to?: Date };

interface DateRangeFilterProps {
  onRangeChange: (range: { from: Date; to: Date }) => void;
  defaultPreset?: Exclude<DateRangePreset, "custom">;
}

function getDisplayLabel(preset: DateRangePreset, date?: DateRange): string {
  if (preset === "custom" && date?.from) {
    return date.to
      ? `${format(date.from, "dd/MM")} - ${format(date.to, "dd/MM")}`
      : format(date.from, "dd/MM");
  };

  if (preset !== "custom") {
    return PRESET_LABELS[preset];
  };

  return PRESET_LABELS["7d"];
}

export function DateRangeFilter({ onRangeChange, defaultPreset = "7d", }: DateRangeFilterProps) {
  const initialRange = getRangeForPreset(defaultPreset);
  const [preset, setPreset] = useState<DateRangePreset>(defaultPreset);
  const [date, setDate] = useState<DateRange>(initialRange);

  const handleSelectPreset = (value: Exclude<DateRangePreset, "custom">) => {
    const range = getRangeForPreset(value);
    setPreset(value);
    setDate(range);
    onRangeChange(range);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "justify-start font-medium bg-card border-white/5 h-10 px-4 rounded-md hover:bg-white/5",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarDays className="mr-1 h-4.5 w-4.5 text-white/70" />
          <span className="text-sm font-medium text-white/70">
            {getDisplayLabel(preset, date)}
          </span>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-4 bg-background border-white/10 rounded-md" align="start">
          <div className="space-y-4">
            <Select
              value={preset === "custom" ? "" : preset}
              onValueChange={(value) =>
                handleSelectPreset(value as Exclude<DateRangePreset, "custom">)
              }
            >
              <SelectTrigger className="w-full bg-background border cursor-pointer border-white/5 hover:border-primary/70 focus:border-primary/70 focus:ring-none h-10 rounded-sm px-4 text-sm font-medium transition-all duration-200">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent className="p-1 border-white/10 rounded-sm">
                <SelectItem value="today" className="text-sm cursor-pointer">Hoje</SelectItem>
                <SelectItem value="7d" className="text-sm cursor-pointer">Últimos 7 dias</SelectItem>
                <SelectItem value="30d" className="text-sm cursor-pointer">Últimos 30 dias</SelectItem>
                <SelectItem value="all" className="text-sm cursor-pointer">Todo o período</SelectItem>
              </SelectContent>
            </Select>

            <Calendar
              mode="range"
              selected={date}
              onSelect={(newDate) => {
                setDate(newDate ?? undefined);
                if (newDate?.from && newDate.to) {
                  setPreset("custom");
                  onRangeChange({ from: newDate.from, to: newDate.to });
                }
              }}
              className="rounded-xl"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}