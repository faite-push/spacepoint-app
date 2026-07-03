import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminAmbientGlowProps = {
  children: ReactNode;
  className?: string;
};

/** Envolve páginas admin e recorta os blurs decorativos para não gerar scroll horizontal no mobile. */
export function AdminAmbientGlow({ children, className }: AdminAmbientGlowProps) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-24 -right-24 h-[280px] w-[280px] rounded-full bg-white/[0.03] blur-[100px] sm:h-[420px] sm:w-[420px] sm:blur-[120px]" />
        <div className="absolute -top-24 -left-24 h-[280px] w-[280px] rounded-full bg-white/[0.03] blur-[100px] sm:h-[420px] sm:w-[420px] sm:blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 h-[280px] w-[280px] rounded-full bg-white/[0.03] blur-[100px] sm:h-[420px] sm:w-[420px] sm:blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 h-[280px] w-[280px] rounded-full bg-white/[0.03] blur-[100px] sm:h-[420px] sm:w-[420px] sm:blur-[120px]" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
