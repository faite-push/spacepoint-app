"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { siteSettingsApi, type SiteConfigRecord } from "@/lib/admin-api";

export function SystemPagesSettings({ hideHeader = false }: { hideHeader?: boolean }) {
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
        maintenanceModeEnabled: form.maintenanceModeEnabled ?? false,
        maintenanceTitle: form.maintenanceTitle ?? null,
        maintenanceMessage: form.maintenanceMessage ?? null,
        maintenanceImageUrl: form.maintenanceImageUrl ?? null,
        page404Title: form.page404Title ?? null,
        page404Message: form.page404Message ?? null,
        page404ButtonLabel: form.page404ButtonLabel ?? null,
        page404ButtonHref: form.page404ButtonHref ?? null,
      }),
    onSuccess: () => {
      toast.success("Páginas de sistema salvas");
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
              Erro e manutenção
            </h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Página 404 e modo manutenção da loja pública.
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

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Modo manutenção
        </h2>

        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Ativar manutenção</p>
            <p className="text-xs text-zinc-500">
              Redireciona visitantes para /maintenance. O painel admin continua acessível.
            </p>
          </div>
          <Switch
            checked={form.maintenanceModeEnabled ?? false}
            onCheckedChange={(v) => set("maintenanceModeEnabled", v)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Título</Label>
          <Input
            value={form.maintenanceTitle ?? ""}
            onChange={(e) => set("maintenanceTitle", e.target.value)}
            className="bg-[#111] border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Mensagem</Label>
          <Textarea
            value={form.maintenanceMessage ?? ""}
            onChange={(e) => set("maintenanceMessage", e.target.value)}
            rows={3}
            className="bg-[#111] border-white/10 resize-y"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Imagem (opcional)</Label>
          <ImageUpload
            value={form.maintenanceImageUrl ?? ""}
            onChange={(url) => set("maintenanceImageUrl", url || null)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Página 404
        </h2>

        <div className="space-y-2">
          <Label className="text-zinc-300">Título</Label>
          <Input
            value={form.page404Title ?? ""}
            onChange={(e) => set("page404Title", e.target.value)}
            className="bg-[#111] border-white/10"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-zinc-300">Mensagem</Label>
          <Textarea
            value={form.page404Message ?? ""}
            onChange={(e) => set("page404Message", e.target.value)}
            rows={3}
            className="bg-[#111] border-white/10 resize-y"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Texto do botão</Label>
            <Input
              value={form.page404ButtonLabel ?? ""}
              onChange={(e) => set("page404ButtonLabel", e.target.value)}
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Link do botão</Label>
            <Input
              value={form.page404ButtonHref ?? ""}
              onChange={(e) => set("page404ButtonHref", e.target.value)}
              placeholder="/"
              className="bg-[#111] border-white/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
