"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, MousePointerClick, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { siteSettingsApi, type SiteConfigRecord } from "@/lib/admin-api";
import { Textarea } from "@/components/ui/textarea";
import { ConversionPopupPreview } from "@/components/home/conversion-popup";
import { Toggle } from "@/components/ui/toggle";

export function HomePopupSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
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
      queryClient.invalidateQueries({ queryKey: ["site-config"] });
      router.refresh();
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
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-md border border-white/5 bg-transparent">
            <div className="flex justify-between items-center border-b border-white/5 px-4 py-2">
              <p className="text-sm font-medium text-white">Sistema de Pop-up</p>

              {hideHeader && (
                <div className="flex">
                  <Button
                    className="gap-2 w-full sm:w-auto"
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

            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between p-3 rounded-md border border-white/5 bg-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <MousePointerClick className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Ativar Pop-up</p>
                    <p className="text-xs text-zinc-500">Exibir pop-up para visitantes na Home.</p>
                  </div>
                </div>
                <Toggle
                  id="top-bar-enabled"
                  size="sm"
                  pressed={form.popupEnabled ?? false}
                  onPressedChange={(v) => set("popupEnabled", v)}
                >
                  {form.popupEnabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Toggle>
              </div>

              <div className="flex md:flex-row flex-col gap-4">
                <div className="flex-1 space-y-2">
                  <Label className="text-muted-foreground">Gatilho de Exibição</Label>
                  <Select
                    value={form.popupTrigger ?? "entry"}
                    onValueChange={(v: string) => set("popupTrigger", v as any)}
                  >
                    <SelectTrigger>
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
                  <div className="flex-1 space-y-2">
                    <Label className="text-zinc-300">Atraso (segundos)</Label>
                    <Input
                      type="number"
                      value={form.popupDelay ?? 0}
                      onChange={(e) => set("popupDelay", parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-md border border-white/5 bg-transparent">
            <div className="border-b border-white/5 px-4 py-3">
              <p className="text-sm font-medium text-white">Conteúdo</p>
            </div>

            <div className="px-4 py-3 space-y-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Título</Label>
                <Input
                  value={form.popupTitle ?? ""}
                  onChange={(e) => set("popupTitle", e.target.value)}
                  placeholder="Ex: Ganhe 10% de desconto!"
                  className="bg-[#111] border-white/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Descrição</Label>
                <Textarea
                  rows={3}
                  value={form.popupDescription ?? ""}
                  onChange={(e) => set("popupDescription", e.target.value)}
                  placeholder="Ex: Assine nossa newsletter e receba um cupom exclusivo."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Texto do Botão</Label>
                  <Input
                    value={form.popupCtaLabel ?? ""}
                    onChange={(e) => set("popupCtaLabel", e.target.value)}
                    placeholder="Ex: Quero meu desconto"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Link do Botão</Label>
                  <Input
                    value={form.popupCtaLink ?? ""}
                    onChange={(e) => set("popupCtaLink", e.target.value)}
                    placeholder="Ex: /produtos ou https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Imagem de Destaque</Label>
                <div className="">
                  <ImageUpload
                    aspectRatio="auto"
                    value={form.popupImageUrl ?? null}
                    onChange={(url) => set("popupImageUrl", url)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-white/5 bg-transparent h-full flex flex-col">
            <div className="border-b border-white/5 px-4 py-3">
              <p className="text-sm font-medium text-white">Pré-visualização</p>
            </div>

            <div className="px-4 py-3">
              <ConversionPopupPreview
                config={{
                  popupTitle: form.popupTitle ?? null,
                  popupDescription: form.popupDescription ?? null,
                  popupImageUrl: form.popupImageUrl ?? null,
                  popupCtaLabel: form.popupCtaLabel ?? null,
                  popupCtaLink: form.popupCtaLink ?? null,
                }}
              />
              <p className="mt-4 text-center text-xs text-muted-foreground italic">
                Pré-visualização fiel ao pop-up exibido na página inicial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
