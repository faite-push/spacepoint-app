"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, MousePointerClick, Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { siteSettingsApi, type SiteConfigRecord } from "@/lib/admin-api";

export function HomePopupSettings({ hideHeader = false }: { hideHeader?: boolean }) {
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
        popupEnabled: form.popupEnabled ?? false,
        popupTitle: form.popupTitle ?? null,
        popupDescription: form.popupDescription ?? null,
        popupImageUrl: form.popupImageUrl ?? null,
        popupCtaLabel: form.popupCtaLabel ?? null,
        popupCtaLink: form.popupCtaLink ?? null,
        popupTrigger: (form.popupTrigger as any) ?? "entry",
        popupDelay: form.popupDelay ?? 0,
      }),
    onSuccess: () => {
      toast.success("Configuração do pop-up salva");
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
              Pop-up de Conversão
            </h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Capture leads ou destaque promoções com um pop-up impactante.
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-6">
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MousePointerClick className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Ativar Pop-up</p>
                  <p className="text-xs text-zinc-500">Exibir pop-up para visitantes na Home.</p>
                </div>
              </div>
              <Switch
                checked={form.popupEnabled ?? false}
                onCheckedChange={(v) => set("popupEnabled", v)}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Gatilho de Exibição</Label>
                <Select
                  value={form.popupTrigger ?? "entry"}
                  onValueChange={(v: string) => set("popupTrigger", v as any)}
                >
                  <SelectTrigger className="bg-[#111] border-white/10">
                    <SelectValue placeholder="Selecione o gatilho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Ao Entrar</SelectItem>
                    <SelectItem value="exit">Ao Sair (Exit Intent)</SelectItem>
                    <SelectItem value="delay">Com Atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.popupTrigger === "delay" && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Atraso (segundos)</Label>
                  <Input
                    type="number"
                    value={form.popupDelay ?? 0}
                    onChange={(e) => set("popupDelay", parseInt(e.target.value))}
                    className="bg-[#111] border-white/10"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-4">
             <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Conteúdo</h3>
            
            <div className="space-y-2">
              <Label className="text-zinc-300">Título</Label>
              <Input
                value={form.popupTitle ?? ""}
                onChange={(e) => set("popupTitle", e.target.value)}
                placeholder="Ex: Ganhe 10% de desconto!"
                className="bg-[#111] border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Descrição</Label>
              <textarea
                rows={3}
                value={form.popupDescription ?? ""}
                onChange={(e) => set("popupDescription", e.target.value)}
                placeholder="Ex: Assine nossa newsletter e receba um cupom exclusivo."
                className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/60"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-zinc-300">Texto do Botão</Label>
                <Input
                  value={form.popupCtaLabel ?? ""}
                  onChange={(e) => set("popupCtaLabel", e.target.value)}
                  placeholder="Ex: Quero meu desconto"
                  className="bg-[#111] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Link do Botão</Label>
                <Input
                  value={form.popupCtaLink ?? ""}
                  onChange={(e) => set("popupCtaLink", e.target.value)}
                  placeholder="Ex: /produtos ou https://..."
                  className="bg-[#111] border-white/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Imagem de Destaque</Label>
              <ImageUpload
                value={form.popupImageUrl ?? null}
                onChange={(url) => set("popupImageUrl", url)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 h-full flex flex-col">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-6">Pré-visualização</h3>
            
            <div className="flex-1 flex items-center justify-center bg-zinc-900/50 rounded-lg border border-dashed border-white/5 p-8">
              {/* Mock do Pop-up */}
              <div className="max-w-[320px] w-full bg-[#111] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                {form.popupImageUrl ? (
                  <div className="aspect-video w-full bg-zinc-800 relative">
                    <img src={form.popupImageUrl} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-zinc-800 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-zinc-700" />
                  </div>
                )}
                <div className="p-6 text-center space-y-4">
                  <h4 className="text-lg font-bold text-white">{form.popupTitle || "Título do Pop-up"}</h4>
                  <p className="text-sm text-zinc-400">{form.popupDescription || "Aqui aparecerá a descrição que você digitar ao lado."}</p>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    {form.popupCtaLabel || "Botão de Ação"}
                  </Button>
                  <button className="text-xs text-zinc-500 hover:text-zinc-300">Talvez mais tarde</button>
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-zinc-600 mt-4 italic">
              * O design real pode variar ligeiramente de acordo com o tema da vitrine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
