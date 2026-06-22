"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, Save, ShoppingBag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { siteSettingsApi, type SiteConfigRecord } from "@/lib/admin-api";

export function HomeShowcaseSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<SiteConfigRecord>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  useEffect(() => {
    if (data?.config) setForm(data.config);
  }, [data?.config]);

  const saveMutation = useMutation({
    mutationFn: () =>
      siteSettingsApi.update({
        homeShowcaseEnabled: form.homeShowcaseEnabled ?? false,
        homeShowcaseTitle: form.homeShowcaseTitle ?? "",
        homeShowcaseSubtitle: form.homeShowcaseSubtitle ?? "",
      }),
    onSuccess: () => {
      toast.success("Configuração da vitrine salva");
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
    <div className="space-y-6 rounded-md border border-white/5 bg-transparent p-4">
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">
              Vitrine de Produtos
            </h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Destaque seus melhores produtos na página inicial.
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
              <Save className="h-4 w-4 hidden" />
            )}
            Salvar alterações
          </Button>
        </div>
      )}

      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Toggle
            id="home-showcase-toggle"
            size="sm"
            pressed={form.homeShowcaseEnabled ?? false}
            onPressedChange={(pressed) => set("homeShowcaseEnabled", pressed)}
          >
            {form.homeShowcaseEnabled ? (
              <Check className="h-4 w-4" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Toggle>

          <div>
            <p className="font-medium text-white">Exibir vitrine na Home</p>
            <p className="text-sm text-zinc-500">
              Mostra os produtos marcados como "Destaque" na página inicial.
            </p>
          </div>
        </div>

        {hideHeader && (
          <div className="flex items-center justify-end mb-4">
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
      </div>

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label className="text-zinc-300">Título da Seção</Label>
          <Input
            value={form.homeShowcaseTitle ?? ""}
            onChange={(e) => set("homeShowcaseTitle", e.target.value)}
            placeholder="Ex: Nossos Favoritos, Produtos em Destaque"
            className="bg-[#111] border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Subtítulo (opcional)</Label>
          <Input
            value={form.homeShowcaseSubtitle ?? ""}
            onChange={(e) => set("homeShowcaseSubtitle", e.target.value)}
            placeholder="Ex: Confira as melhores ofertas da semana"
            className="bg-[#111] border-white/10"
          />
        </div>
      </div>

      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <p className="text-xs text-zinc-400">
          <strong>Dica:</strong> Para gerenciar quais produtos aparecem aqui, vá até a listagem de{" "}
          <strong>Produtos</strong> e marque-os com a estrela de "Destaque".
        </p>
      </div>
    </div>
  );
}