"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PromoTopBar } from "@/components/storefront/promo-top-bar";
import { siteSettingsApi, type SiteConfigRecord } from "@/lib/admin-api";
import type { PublicSiteConfig } from "@/lib/site-api";

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
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">
              Faixa promocional
            </h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Barra no topo da loja para avisos, promoções e links rápidos.
            </p>
          </div>
          <Button
            className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end mb-4">
          <Button
            className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar alterações
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
        <p className="px-4 py-2 text-xs text-zinc-500 border-b border-white/10">Pré-visualização</p>
        <PromoTopBar config={preview} />
        {!form.topBarEnabled && (
          <p className="px-4 py-6 text-sm text-zinc-500 text-center">
            Ative a faixa para ver a pré-visualização.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Exibir faixa</p>
            <p className="text-xs text-zinc-500">Visível em todas as páginas públicas da loja.</p>
          </div>
          <Switch
            checked={form.topBarEnabled ?? false}
            onCheckedChange={(v) => set("topBarEnabled", v)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Texto</Label>
          <Input
            value={form.topBarText ?? ""}
            onChange={(e) => set("topBarText", e.target.value)}
            placeholder="Frete grátis em compras acima de R$ 99"
            className="bg-[#111] border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Link (opcional)</Label>
          <Input
            value={form.topBarLinkUrl ?? ""}
            onChange={(e) => set("topBarLinkUrl", e.target.value)}
            placeholder="/products ou https://..."
            className="bg-[#111] border-white/10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Cor de fundo</Label>
            <Input
              value={form.topBarBackgroundColor ?? ""}
              onChange={(e) => set("topBarBackgroundColor", e.target.value)}
              placeholder="#9333EA"
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Cor do texto</Label>
            <Input
              value={form.topBarTextColor ?? ""}
              onChange={(e) => set("topBarTextColor", e.target.value)}
              placeholder="#ffffff"
              className="bg-[#111] border-white/10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Permitir fechar</p>
            <p className="text-xs text-zinc-500">
              O visitante pode dispensar a faixa até fechar o navegador.
            </p>
          </div>
          <Switch
            checked={form.topBarDismissible ?? true}
            onCheckedChange={(v) => set("topBarDismissible", v)}
          />
        </div>
      </div>
    </div>
  );
}
