import { startOfDay, subDays } from "date-fns";

export type DateRangePreset = "today" | "7d" | "30d" | "all" | "custom";

export const PRESET_LABELS: Record<Exclude<DateRangePreset, "custom">, string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  all: "Todo o período",
};

export function getRangeForPreset(
  preset: Exclude<DateRangePreset, "custom">
): { from: Date; to: Date } {
  const to = new Date();

  switch (preset) {
    case "today":
      return { from: startOfDay(to), to };
    case "7d":
      return { from: subDays(to, 7), to };
    case "30d":
      return { from: subDays(to, 30), to };
    case "all":
      return { from: new Date(2025, 0, 1), to };
  }
}
