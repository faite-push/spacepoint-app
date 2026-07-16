"use client";

import { EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export const MASK_MONEY = "R$ ••••";
export const MASK_COUNT = "••••";
export const MASK_PERCENT = "••%";

export function HiddenValuesBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-10 flex items-center justify-center",
        className
      )}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/70 px-3.5 py-1.5 text-xs font-medium text-white/90 shadow-lg backdrop-blur-sm">
        <EyeOff className="size-3.5 text-white/70" />
        Valores ocultos
      </div>
    </div>
  );
}

/** Dados densos e “bonitos” só para o blur do modo privacidade. */
export function buildPrivacyPerformanceData() {
  return Array.from({ length: 24 }, (_, i) => {
    const t = i / 23;
    const wave = Math.sin(t * Math.PI * 2.4) * 0.45 + Math.sin(t * Math.PI * 5.2) * 0.2;
    const wave2 = Math.cos(t * Math.PI * 2.1 + 0.8) * 0.35 + Math.sin(t * Math.PI * 4.1) * 0.15;
    const wave3 = Math.sin(t * Math.PI * 2.8 + 1.4) * 0.4 + Math.cos(t * Math.PI * 3.6) * 0.18;
    return {
      label: `${String(i).padStart(2, "0")}:00`,
      revenue: Math.round(2200 + wave * 1400 + i * 35),
      sales: Math.round(48 + wave2 * 28 + 8),
      unitsSold: Math.round(62 + wave3 * 32 + 10),
    };
  });
}

export function buildPrivacyCustomersData() {
  return Array.from({ length: 18 }, (_, i) => {
    const t = i / 17;
    const unique = Math.round(55 + Math.sin(t * Math.PI * 3) * 28 + Math.cos(t * Math.PI * 1.5) * 12 + i * 1.2);
    const returning = Math.round(unique * (0.55 + Math.sin(t * Math.PI * 2.2) * 0.12));
    return {
      label: `${String(i + 6).padStart(2, "0")}h`,
      unique: Math.max(20, unique),
      returning: Math.max(12, returning),
    };
  });
}
