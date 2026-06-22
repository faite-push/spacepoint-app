"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicSiteConfig } from "@/lib/site-api";

const STORAGE_KEY = "spacepoint-home-popup-dismissed";

export function ConversionPopup({ config }: { config?: PublicSiteConfig | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isHome = pathname === "/";
  const isEnabled =
    isHome &&
    config?.popupEnabled === true &&
    Boolean(config.popupTitle?.trim());

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) return;

    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* ignore */
    }

    const trigger = config?.popupTrigger ?? "entry";
    const delayMs = Math.max(1, config?.popupDelay ?? 5) * 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let removeExitListener: (() => void) | undefined;

    const show = () => setOpen(true);

    if (trigger === "entry") {
      timer = setTimeout(show, 800);
    } else if (trigger === "delay") {
      timer = setTimeout(show, delayMs);
    } else if (trigger === "exit") {
      const onMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          show();
          document.removeEventListener("mouseout", onMouseLeave);
        }
      };
      document.addEventListener("mouseout", onMouseLeave);
      removeExitListener = () =>
        document.removeEventListener("mouseout", onMouseLeave);
    }

    return () => {
      if (timer) clearTimeout(timer);
      removeExitListener?.();
    };
  }, [isEnabled, config?.popupTrigger, config?.popupDelay]);

  if (!isEnabled) return null;

  const title = config!.popupTitle!.trim();
  const description = config?.popupDescription?.trim();
  const ctaLabel = config?.popupCtaLabel?.trim() || "Saiba mais";
  const ctaHref = config?.popupCtaLink?.trim() || "/";
  const isExternal = /^https?:\/\//i.test(ctaHref);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
    >
      <DialogContent className="max-w-[360px] gap-0 overflow-hidden border-white/10 bg-[#111] p-0 sm:rounded-2xl">
        {config?.popupImageUrl ? (
          <div className="relative aspect-video w-full bg-zinc-900">
            <Image
              src={config.popupImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="360px"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-zinc-900">
            <ImageIcon className="h-10 w-10 text-zinc-700" />
          </div>
        )}

        <div className="space-y-4 p-6 text-center">
          <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-sm text-zinc-400">
              {description}
            </DialogDescription>
          ) : null}

          {isExternal ? (
            <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
              >
                {ctaLabel}
              </a>
            </Button>
          ) : (
            <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
              <Link href={ctaHref} onClick={dismiss}>
                {ctaLabel}
              </Link>
            </Button>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Talvez mais tarde
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
