"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { siteSettingsApi, type SiteConfigRecord } from "@/lib/admin-api";

export function GlobalSettings({ hideHeader = false }: { hideHeader?: boolean }) {
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
        storeName: form.storeName ?? null,
        metaTitle: form.metaTitle ?? null,
        metaDescription: form.metaDescription ?? null,
        faviconUrl: form.faviconUrl ?? null,
        logoUrl: form.logoUrl ?? null,
        contactEmail: form.contactEmail ?? null,
        contactPhone: form.contactPhone ?? null,
        primaryColor: form.primaryColor ?? null,
      }),
    onSuccess: () => {
      toast.success("Configurações globais salvas");
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
  };

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">Global</h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Identidade da loja, SEO e informações exibidas em todo o site.
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

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-8">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Identidade</h2>
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
                    <Save className="h-4 w-4 hidden" />
                  )}
                  Salvar alterações
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome da loja</Label>
              <Input
                value={form.storeName ?? ""}
                placeholder="Nome da loja"
                onChange={(e) => set("storeName", e.target.value)}
                className="bg-[#111] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Cor primária (hex)</Label>
              <Input
                value={form.primaryColor ?? ""}
                onChange={(e) => set("primaryColor", e.target.value)}
                placeholder="#A855F7"
                className="bg-[#111] border-white/10"
              />
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Logo</Label>
              <ImageUpload
                value={form.logoUrl ?? null}
                onChange={(url) => set("logoUrl", url)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Favicon</Label>
              <ImageUpload
                value={form.faviconUrl ?? null}
                onChange={(url) => set("faviconUrl", url)}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">SEO</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Título padrão (meta title)</Label>
              <Input
                value={form.metaTitle ?? ""}
                onChange={(e) => set("metaTitle", e.target.value)}
                className="bg-[#111] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Descrição padrão (meta description)</Label>
              <textarea
                rows={3}
                value={form.metaDescription ?? ""}
                onChange={(e) => set("metaDescription", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#9333EA]/60"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-white/5 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Contato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">E-mail</Label>
              <Input
                type="email"
                value={form.contactEmail ?? ""}
                onChange={(e) => set("contactEmail", e.target.value)}
                className="bg-[#111] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Telefone</Label>
              <Input
                value={form.contactPhone ?? ""}
                onChange={(e) => set("contactPhone", e.target.value)}
                className="bg-[#111] border-white/10"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
