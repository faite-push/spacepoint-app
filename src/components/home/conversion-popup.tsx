"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, } from "@/components/ui/dialog";
import { fetchSiteConfig, type PublicSiteConfig } from "@/lib/site-api";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "spacepoint-home-popup-dismissed";

export const CONVERSION_POPUP_DIALOG_CLASS = "w-full md:w-auto md:max-w-[min(92vw,42rem)] max-w-screen rounded-md gap-0 overflow-hidden p-0 bg-black/30 backdrop-blur-lg";

export type ConversionPopupConfig = Pick<
  PublicSiteConfig,
  | "popupTitle"
  | "popupDescription"
  | "popupImageUrl"
  | "popupCtaLabel"
  | "popupCtaLink"
>;

type ConversionPopupPanelProps = {
  config: ConversionPopupConfig;
  onCtaClick?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
  titleFallback?: string;
  descriptionFallback?: string;
  ctaFallback?: string;
  /** false no preview admin (fora do Dialog) */
  useDialogSemantics?: boolean;
};

export function ConversionPopupPanel({
  config,
  onCtaClick,
  showCloseButton = false,
  onClose,
  titleFallback = "Título do Pop-up",
  descriptionFallback,
  ctaFallback = "Saiba mais",
  useDialogSemantics = true,
}: ConversionPopupPanelProps) {
  const title = config.popupTitle?.trim() || titleFallback;
  const description = config.popupDescription?.trim() || descriptionFallback;
  const ctaLabel = config.popupCtaLabel?.trim() || ctaFallback;
  const ctaHref = config.popupCtaLink?.trim() || "/";
  const isExternal = /^https?:\/\//i.test(ctaHref);

  const titleClass = "text-lg font-bold text-white md:text-2xl";
  const descriptionClass = "text-sm text-zinc-400";

  return (
    <>
      {showCloseButton && (
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-sm bg-transparent p-2 opacity-70 ring-offset-background transition-opacity hover:bg-white/10 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {config.popupImageUrl ? (
        <div className="flex justify-center bg-zinc-950/40 px-4 pt-12">
          <img
            src={config.popupImageUrl}
            alt="Pop-up"
            className="pointer-events-none block h-auto max-h-[min(70vh,560px)] w-auto max-w-full select-none rounded-lg"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full min-w-[min(92vw,28rem)] items-center justify-center bg-zinc-900">
          <ImageIcon className="h-10 w-10 text-zinc-700" />
        </div>
      )}

      <div className="space-y-4 p-6 text-center">
        <div>
          {useDialogSemantics ? (
            <DialogTitle className={titleClass}>{title}</DialogTitle>
          ) : (
            <h2 className={titleClass}>{title}</h2>
          )}
          {description ? (
            useDialogSemantics ? (
              <DialogDescription className={descriptionClass}>{description}</DialogDescription>
            ) : (
              <p className={descriptionClass}>{description}</p>
            )
          ) : null}
        </div>

        <div className="flex flex-row gap-2">
          {isExternal ? (
            <Button
              asChild
              size="lg"
              className="flex-2 bg-primary text-white hover:bg-primary/90"
            >
              <a
                href={ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onCtaClick}
              >
                {ctaLabel}
              </a>
            </Button>
          ) : (
            <Button asChild size="lg" className="flex-1 bg-primary text-white hover:bg-primary/90">
              <Link href={ctaHref} onClick={onCtaClick}>
                {ctaLabel}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

export function ConversionPopupPreview({
  config,
  className,
}: {
  config: ConversionPopupConfig;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[420px] items-center justify-center rounded-md border border-dashed border-white/5 bg-zinc-900/50 p-6",
        className
      )}
    >
      <div
        className={cn(
          "relative grid w-full max-w-[min(100%,42rem)] border border-white/10 shadow-2xl sm:rounded-md",
          CONVERSION_POPUP_DIALOG_CLASS
        )}
      >
        <ConversionPopupPanel
          config={config}
          showCloseButton
          onClose={() => undefined}
          useDialogSemantics={false}
          descriptionFallback="Aqui aparecerá a descrição configurada ao lado."
        />
      </div>
    </div>
  );
}

export function ConversionPopup({ config: initialConfig }: { config?: PublicSiteConfig | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const { data: liveConfig } = useQuery({
    queryKey: ["site-config", "popup"],
    queryFn: fetchSiteConfig,
    enabled: pathname === "/",
    staleTime: 0,
    refetchOnMount: "always",
  });

  const config = liveConfig ?? initialConfig;
  const isHome = pathname === "/";
  const isEnabled =
    isHome &&
    Boolean(config?.popupEnabled) &&
    Boolean(config?.popupTitle?.trim());

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

  if (!isEnabled || !config) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) dismiss(); }}>
      <DialogContent className={CONVERSION_POPUP_DIALOG_CLASS}>
        <ConversionPopupPanel config={config} onCtaClick={dismiss} />
      </DialogContent>
    </Dialog>
  );
}
