"use client";

import { ptBR } from "date-fns/locale";
import { useState } from "react";

import { CalendarDays, Calendar as CalendarIcon, Clock } from "lucide-react";
import { PiCalendarDotsDuotone } from "react-icons/pi";
import { format, subDays, startOfDay } from "date-fns";

type DateRange = { from?: Date; to?: Date };

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangeFilterProps {
  onRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangeFilter({ onRangeChange }: DateRangeFilterProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
  const [label, setLabel] = useState("Últimos 7 dias");

  const handleSelectPreset = (preset: string) => {
    let from = new Date();
    let to = new Date();

    switch (preset) {
      case "today":
        from = startOfDay(new Date());
        setLabel("Hoje");
        break;
      case "7d":
        from = subDays(new Date(), 7);
        setLabel("Últimos 7 dias");
        break;
      case "30d":
        from = subDays(new Date(), 30);
        setLabel("Últimos 30 dias");
        break;
      case "all":
        from = new Date(2025, 0, 1);
        setLabel("Todo o período");
        break;
    }

    const range = { from, to };
    setDate(range);
    onRangeChange(range);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger className={cn(
          buttonVariants({ variant: "outline" }),
          "justify-start font-medium bg-card border-white/5 h-10 px-4 rounded-md hover:bg-white/5",
          !date && "text-muted-foreground"
        )}>
          <CalendarDays className="mr-1 h-4.5 w-4.5 text-white/70" />
          <span className="text-sm font-medium text-white/70">
            {label === "Personalizado" && date?.from
              ? date.to
                ? `${format(date.from, "dd/MM")} - ${format(date.to, "dd/MM")}`
                : format(date.from, "dd/MM")
              : label}
          </span>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-4 bg-background border-white/10 rounded-md" align="start">
          <div className="space-y-4">
            <Select onValueChange={handleSelectPreset}>
              <SelectTrigger className="w-full bg-background border cursor-pointer border-white/5 hover:border-primary/70 focus:border-primary/70 focus:ring-none h-10 rounded-sm px-4 text-sm font-medium transition-all duration-200">
                <SelectValue placeholder={label} />
              </SelectTrigger>
              <SelectContent className="bg-background p-1 border-white/10 rounded-sm">
                <SelectItem value="today" className="text-sm px-3 cursor-pointer">Hoje</SelectItem>
                <SelectItem value="7d" className="text-sm px-3 cursor-pointer">Últimos 7 dias</SelectItem>
                <SelectItem value="30d" className="text-sm px-3 cursor-pointer">Últimos 30 dias</SelectItem>
                <SelectItem value="all" className="text-sm px-3 cursor-pointer">Todo o período</SelectItem>
              </SelectContent>
            </Select>

            <Calendar
              mode="range"
              selected={date}
              onSelect={(newDate: any) => {
                setDate(newDate);
                const d = newDate as any;
                if (d?.from) {
                  setLabel("Personalizado");
                  if (d.to) {
                    onRangeChange({ from: d.from, to: d.to });
                  }
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
