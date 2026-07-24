"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PromoTopBar } from "@/components/storefront/promo-top-bar";
import { siteSettingsApi, type SiteConfigRecord } from "@/lib/admin-api";
import type { PublicSiteConfig } from "@/lib/site-api";
import { Toggle } from "@/components/ui/toggle";

function toPreviewConfig(form: Partial<SiteConfigRecord>): PublicSiteConfig {
  return {
    id: "preview",
    topBarEnabled: form.topBarEnabled ?? false,
    topBarText: form.topBarText ?? null,
    topBarLinkUrl: form.topBarLinkUrl ?? null,
    topBarBackgroundColor: form.topBarBackgroundColor ?? null,
    topBarTextColor: form.topBarTextColor ?? null,
    topBarDismissible: form.topBarDismissible ?? true,
  } as PublicSiteConfig;
}

export function TopBarSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<SiteConfigRecord>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  useEffect(() => {
    if (data?.config) setForm(data.config);
  }, [data?.config]);

  const preview = useMemo(() => toPreviewConfig(form), [form]);

  const saveMutation = useMutation({
    mutationFn: () =>
      siteSettingsApi.update({
        topBarEnabled: form.topBarEnabled ?? false,
        topBarText: form.topBarText ?? null,
        topBarLinkUrl: form.topBarLinkUrl ?? null,
        topBarBackgroundColor: form.topBarBackgroundColor ?? null,
        topBarTextColor: form.topBarTextColor ?? null,
        topBarDismissible: form.topBarDismissible ?? true,
      }),
    onSuccess: () => {
      toast.success("Faixa promocional salva");
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof SiteConfigRecord>(key: K, value: SiteConfigRecord[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {hideHeader && (
        <div className="flex flex-col sm:flex-col md:flex-col lg:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center rounded-md w-full md:w-3xl border border-white/5 py-2 px-3 gap-2">
            <Toggle
              id="top-bar-enabled"
              size="sm"
              pressed={form.topBarEnabled ?? false}
              onPressedChange={(v) => set("topBarEnabled", v)}
            >
              {form.topBarEnabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Toggle>

            <div className="truncate">
              <p className="text-sm font-medium text-white">Faixa promocional <span className="text-blue-500 font-light">{form.topBarEnabled ? "( Ativada )" : "( Desativada )"}</span></p>
              <p className="text-xs text-muted-foreground truncate">Barra no topo da loja para avisos, promoções e links rápidos.</p>
            </div>
          </div>

          <div className="flex items-center rounded-md w-full md:w-3xl border border-white/5 py-2 px-3 gap-2">
            <Toggle
              id="top-bar-dismissible"
              size="sm"
              pressed={form.topBarDismissible ?? true}
              onPressedChange={(v) => set("topBarDismissible", v)}
            >
              {form.topBarDismissible ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Toggle>

            <div className="truncate">
              <p className="text-sm font-medium text-white">Permitir fechar <span className="text-blue-500 font-light">{form.topBarDismissible ? "( Ativado )" : "( Desativado )"}</span></p>
              <p className="text-xs text-muted-foreground truncate">
                O visitante pode dispensar a faixa até fechar o navegador.
              </p>
            </div>
          </div>

          <Button
            className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 hidden" />
            )}
            Salvar alterações
          </Button>
        </div>
      )}

      <div className="rounded-md bg-transparent border border-white/5 overflow-hidden">
        <p className="px-4 py-2 text-xs text-muted-foreground border-b border-white/5">Pré-visualização</p>
        <PromoTopBar config={preview} />
        {!form.topBarEnabled && (
          <p className="px-4 py-6 text-sm text-muted-foreground text-center">
            Ative a faixa para ver a pré-visualização.
          </p>
        )}
      </div>

      <div className="rounded-md border border-white/5 p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-muted-foreground">Texto</Label>
          <Input
            value={form.topBarText ?? ""}
            onChange={(e) => set("topBarText", e.target.value)}
            placeholder="Frete grátis em compras acima de R$ 99"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-muted-foreground">Link (opcional)</Label>
          <Input
            value={form.topBarLinkUrl ?? ""}
            onChange={(e) => set("topBarLinkUrl", e.target.value)}
            placeholder="/products ou https://..."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Cor de fundo</Label>
            <Input
              value={form.topBarBackgroundColor ?? ""}
              onChange={(e) => set("topBarBackgroundColor", e.target.value)}
              placeholder="#9333EA"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Cor do texto</Label>
            <Input
              value={form.topBarTextColor ?? ""}
              onChange={(e) => set("topBarTextColor", e.target.value)}
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
