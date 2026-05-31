"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { PublicSiteConfig } from "@/lib/site-api";
import { Button } from "../ui/button";

const STORAGE_KEY = "sp_topbar_dismissed";

export function PromoTopBar({ config }: { config?: PublicSiteConfig | null }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!config?.topBarEnabled || !config.topBarText?.trim()) return;
    if (!config.topBarDismissible) {
      setDismissed(false);
      return;
    }
    const stored = sessionStorage.getItem(STORAGE_KEY);
    setDismissed(stored === "1");
  }, [config]);

  if (!config?.topBarEnabled || !config.topBarText?.trim() || dismissed) {
    return null;
  }

  const bg = config.topBarBackgroundColor?.trim() || "#9333EA";
  const color = config.topBarTextColor?.trim() || "#ffffff";
  const href = config.topBarLinkUrl?.trim();

  const content = (
    <span className="text-center text-xs font-medium sm:text-sm">{config.topBarText}</span>
  );

  return (
    <div
      className="relative z-[60] w-full px-4 py-2.5"
      style={{ backgroundColor: bg, color }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3">
        {href ? (
          <Link href={href} className="hover:underline underline-offset-2">
            {content}
          </Link>
        ) : (
          content
        )}
        {config.topBarDismissible && (
          <Button
            type="button"
            size="icon-sm"
            onClick={() => {
              sessionStorage.setItem(STORAGE_KEY, "1");
              setDismissed(true);
            }}
            className="absolute hover:bg-white/10 right-2 top-1/2 -translate-y-1/2 p-1 opacity-80 hover:opacity-100 sm:right-4 active:scale-95"
            aria-label="Fechar aviso"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
