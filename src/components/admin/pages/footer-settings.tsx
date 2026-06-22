"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Palette, AlignLeft, LayoutList, AlignJustify, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { FooterLinksEditor } from "./footer-links-editor";
import { SocialLinksEditor } from "./social-links-editor";
import { FooterContent } from "@/components/footer/footer-content";
import { siteSettingsApi, type FooterLink, type SiteConfigRecord } from "@/lib/admin-api";
import { resolveFooterConfig, FOOTER_DEFAULTS } from "@/lib/footer-config";
import type { PublicSiteConfig } from "@/lib/site-api";

function parseLinks(raw: FooterLink[] | null | undefined): FooterLink[] {
  return Array.isArray(raw) ? raw : [];
}

function formToPublicConfig(form: Partial<SiteConfigRecord>): PublicSiteConfig {
  return {
    id: "preview",
    bannerImageUrl: null,
    bannerTitle: null,
    bannerSubtitle: null,
    bannerCtaLabel: null,
    bannerCtaHref: null,
    footerText: null,
    metaDescription: null,
    metaTitle: form.storeName ?? null,
    storeName: form.storeName ?? null,
    faviconUrl: null,
    logoUrl: form.logoUrl ?? null,
    contactEmail: null,
    contactPhone: null,
    primaryColor: form.primaryColor ?? null,
    footerAboutText: form.footerAboutText ?? null,
    footerAboutTitle: form.footerAboutTitle ?? null,
    footerCopyright: form.footerCopyright ?? null,
    footerNewsletterEnabled: form.footerNewsletterEnabled ?? true,
    footerNewsletterPlaceholder: form.footerNewsletterPlaceholder ?? null,
    footerNewsletterButtonLabel: form.footerNewsletterButtonLabel ?? null,
    footerLogoUrl: form.footerLogoUrl ?? null,
    footerLogoHref: form.footerLogoHref ?? null,
    footerLogoAlt: form.footerLogoAlt ?? null,
    footerBackgroundColor: form.footerBackgroundColor ?? null,
    footerButtonTextColor: form.footerButtonTextColor ?? null,
    footerShowNoise: form.footerShowNoise ?? true,
    footerPaddingTopHome: form.footerPaddingTopHome ?? FOOTER_DEFAULTS.paddingTopHome,
    footerPaddingTopDefault: form.footerPaddingTopDefault ?? FOOTER_DEFAULTS.paddingTopDefault,
    footerCategoryColumnTitle: form.footerCategoryColumnTitle ?? null,
    footerSupportColumnTitle: form.footerSupportColumnTitle ?? null,
    socialFacebook: form.socialFacebook ?? null,
    socialInstagram: form.socialInstagram ?? null,
    socialTwitter: form.socialTwitter ?? null,
    socialLinkedin: form.socialLinkedin ?? null,
    socialYoutube: form.socialYoutube ?? null,
    socialLinks: form.socialLinks ?? null,
    footerCategoryLinks: form.footerCategoryLinks ?? null,
    footerSupportLinks: form.footerSupportLinks ?? null,
    footerLegalLinks: form.footerLegalLinks ?? null,
    topBarEnabled: null,
    topBarText: null,
    topBarLinkUrl: null,
    topBarBackgroundColor: null,
    topBarTextColor: null,
    topBarDismissible: null,
    maintenanceModeEnabled: null,
    maintenanceTitle: null,
    maintenanceMessage: null,
    maintenanceImageUrl: null,
    page404Title: null,
    page404Message: null,
    page404ButtonLabel: null,
    page404ButtonHref: null,
    homeReviewsEnabled: null,
    homeReviewsBadgeLabel: null,
    homeReviewsTitle: null,
    homeReviewsAverageRating: null,
    homeReviewsTotalCount: null,
    homeReviewsGoogleMapsUrl: null,
    homeReviewsLinkLabel: null,
    homeShowcaseEnabled: null,
    homeShowcaseTitle: null,
    homeShowcaseSubtitle: null,
    popupEnabled: null,
    popupTitle: null,
    popupDescription: null,
    popupImageUrl: null,
    popupCtaLabel: null,
    popupCtaLink: null,
    popupTrigger: null,
    popupDelay: null,
  };
}

type TabId = "aparencia" | "sobre" | "colunas" | "barra-inferior" | "redes-sociais";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "aparencia", label: "Aparência", icon: Palette },
  { id: "sobre", label: "Sobre a Loja", icon: AlignLeft },
  { id: "colunas", label: "Colunas de Links", icon: LayoutList },
  { id: "barra-inferior", label: "Barra Inferior", icon: AlignJustify },
  { id: "redes-sociais", label: "Redes Sociais", icon: Share2 },
];

export function FooterSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<SiteConfigRecord>>({});
  const [activeTab, setActiveTab] = useState<TabId>("aparencia");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  useEffect(() => {
    if (data?.config) setForm(data.config);
  }, [data?.config]);

  const previewFooter = useMemo(
    () => resolveFooterConfig(formToPublicConfig(form)),
    [form]
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      siteSettingsApi.update({
        footerAboutTitle: form.footerAboutTitle ?? null,
        footerAboutText: form.footerAboutText ?? null,
        footerCopyright: form.footerCopyright ?? null,
        footerNewsletterEnabled: form.footerNewsletterEnabled ?? true,
        footerNewsletterPlaceholder: form.footerNewsletterPlaceholder ?? null,
        footerNewsletterButtonLabel: form.footerNewsletterButtonLabel ?? null,
        footerLogoUrl: form.footerLogoUrl ?? null,
        footerLogoHref: form.footerLogoHref ?? null,
        footerLogoAlt: form.footerLogoAlt ?? null,
        footerBackgroundColor: form.footerBackgroundColor ?? null,
        footerButtonTextColor: form.footerButtonTextColor ?? null,
        footerShowNoise: form.footerShowNoise ?? true,
        footerPaddingTopHome: form.footerPaddingTopHome ?? FOOTER_DEFAULTS.paddingTopHome,
        footerPaddingTopDefault: form.footerPaddingTopDefault ?? FOOTER_DEFAULTS.paddingTopDefault,
        footerCategoryColumnTitle: form.footerCategoryColumnTitle ?? null,
        footerSupportColumnTitle: form.footerSupportColumnTitle ?? null,
        socialFacebook: form.socialFacebook ?? null,
        socialInstagram: form.socialInstagram ?? null,
        socialTwitter: form.socialTwitter ?? null,
        socialLinkedin: form.socialLinkedin ?? null,
        socialYoutube: form.socialYoutube ?? null,
        socialLinks: form.socialLinks ?? null,
        footerCategoryLinks: parseLinks(form.footerCategoryLinks),
        footerSupportLinks: parseLinks(form.footerSupportLinks),
        footerLegalLinks: parseLinks(form.footerLegalLinks),
      }),
    onSuccess: () => {
      toast.success("Configurações do rodapé salvas");
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
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">Rodapé</h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Configure cada elemento exibido no rodapé da loja — textos, cores, links e newsletter.
            </p>
          </div>
          <Button
            className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
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
            ) : null}
            Salvar alterações
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <FooterContent footer={previewFooter} compact />
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] max-h-[332px] overflow-y-auto">
        <div className="flex sticky z-10 top-0 bg-[#0A0A0A]/5 backdrop-blur-md items-center min-h-12 justify-center gap-2 border-b border-white/10 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap cursor-pointer rounded-lg
                  border-b-2 transition-all duration-200 shrink-0
                  ${isActive
                    ? "text-white bg-primary/80"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }
                `}
              >
                <Icon className={`h-4 w-4 sm:block hidden ${isActive ? "text-white" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 lg:p-6">
          {activeTab === "aparencia" && (
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Cores</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Personalize as cores do rodapé.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Cor de fundo <span className="text-zinc-500">(deixe vazio para usar a cor padrão).</span></Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.footerBackgroundColor ?? FOOTER_DEFAULTS.backgroundColor}
                        onChange={(e) => set("footerBackgroundColor", e.target.value)}
                        className="h-10 w-14 cursor-pointer border-white/10 bg-[#111] p-1"
                      />
                      <Input
                        value={form.footerBackgroundColor ?? ""}
                        onChange={(e) => set("footerBackgroundColor", e.target.value)}
                        placeholder="#A855F7"
                        className="bg-[#111] border-white/10 font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Cor do texto do botão newsletter <span className="text-zinc-500">(deixe vazio para usar a cor padrão).</span></Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.footerButtonTextColor ?? FOOTER_DEFAULTS.buttonTextColor}
                        onChange={(e) => set("footerButtonTextColor", e.target.value)}
                        className="h-10 w-14 cursor-pointer border-white/10 bg-[#111] p-1"
                      />
                      <Input
                        value={form.footerButtonTextColor ?? ""}
                        onChange={(e) => set("footerButtonTextColor", e.target.value)}
                        placeholder="#A855F7"
                        className="bg-[#111] border-white/10 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Efeitos e Newsletter</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Controle os elementos visuais do rodapé.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Textura de ruído</p>
                      <p className="text-xs text-zinc-500">Efeito visual granulado no fundo roxo.</p>
                    </div>
                    <Switch
                      checked={form.footerShowNoise ?? true}
                      onCheckedChange={(v) => set("footerShowNoise", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">Newsletter</p>
                      <p className="text-xs text-zinc-500">Barra de inscrição no canto superior direito.</p>
                    </div>
                    <Switch
                      checked={form.footerNewsletterEnabled ?? true}
                      onCheckedChange={(v) => set("footerNewsletterEnabled", v)}
                    />
                  </div>
                </div>
                {(form.footerNewsletterEnabled ?? true) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Placeholder do campo e-mail <span className="text-zinc-500">(deixe vazio para usar o padrão).</span></Label>
                      <Input
                        value={form.footerNewsletterPlaceholder ?? ""}
                        onChange={(e) => set("footerNewsletterPlaceholder", e.target.value)}
                        className="bg-[#111] border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Texto do botão <span className="text-zinc-500">(deixe vazio para usar o padrão).</span></Label>
                      <Input
                        value={form.footerNewsletterButtonLabel ?? ""}
                        onChange={(e) => set("footerNewsletterButtonLabel", e.target.value)}
                        className="bg-[#111] border-white/10"
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Logo do Rodapé</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Configure o logo exibido no rodapé.</p>
                </div>
                <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
                  <ImageUpload
                    value={form.footerLogoUrl ?? form.logoUrl ?? null}
                    onChange={(url) => set("footerLogoUrl", url)}
                    recommendation="PNG transparente, ~180×70px"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-white/80">Link ao clicar no logo <span className="text-zinc-500">(deixe vazio para ir para a página inicial)</span></Label>
                      <Input
                        value={form.footerLogoHref ?? ""}
                        onChange={(e) => set("footerLogoHref", e.target.value)}
                        placeholder="/"
                        className="bg-[#111] border-white/10"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label className="text-zinc-300">Texto alternativo (acessibilidade)</Label>
                      <Input
                        value={form.footerLogoAlt ?? ""}
                        onChange={(e) => set("footerLogoAlt", e.target.value)}
                        placeholder="Space Point"
                        className="bg-[#111] border-white/10"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === "sobre" && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-sm font-semibold text-white">Sobre a Loja</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Texto exibido no lado esquerdo do rodapé.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Título da seção</Label>
                <Input
                  value={form.footerAboutTitle ?? ""}
                  onChange={(e) => set("footerAboutTitle", e.target.value)}
                  placeholder="Sobre a loja:"
                  className="bg-[#111] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Texto descritivo</Label>
                <textarea
                  rows={6}
                  value={form.footerAboutText ?? ""}
                  onChange={(e) => set("footerAboutText", e.target.value)}
                  placeholder="Espaço para descrever a loja..."
                  className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#9333EA]/60 resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === "colunas" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Colunas de Links</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Links exibidos nas colunas centrais do rodapé.</p>
              </div>
              <FooterLinksEditor
                label="Coluna Categorias"
                showColumnTitle
                columnTitle={form.footerCategoryColumnTitle ?? ""}
                onColumnTitleChange={(v) => set("footerCategoryColumnTitle", v)}
                links={parseLinks(form.footerCategoryLinks)}
                onChange={(links) => set("footerCategoryLinks", links)}
              />
              <FooterLinksEditor
                label="Coluna Suporte"
                showColumnTitle
                columnTitle={form.footerSupportColumnTitle ?? ""}
                onColumnTitleChange={(v) => set("footerSupportColumnTitle", v)}
                links={parseLinks(form.footerSupportLinks)}
                onChange={(links) => set("footerSupportLinks", links)}
              />
            </div>
          )}

          {activeTab === "barra-inferior" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Barra Inferior</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Copyright e links legais exibidos na barra inferior do rodapé.</p>
              </div>
              <div className="space-y-2 max-w-2xl">
                <Label className="text-zinc-300">Texto de copyright / CNPJ</Label>
                <Input
                  value={form.footerCopyright ?? ""}
                  onChange={(e) => set("footerCopyright", e.target.value)}
                  placeholder="SPACE POINT BR LTDA – CNPJ: ... © Todos os direitos reservados, {year}."
                  className="bg-[#111] border-white/10"
                />
                <p className="text-[11px] text-zinc-500">
                  Use <code className="text-zinc-400">{"{year}"}</code> para inserir o ano atual automaticamente.
                </p>
              </div>
              <FooterLinksEditor
                label="Links legais (barra inferior)"
                links={parseLinks(form.footerLegalLinks)}
                onChange={(links) => set("footerLegalLinks", links)}
              />
            </div>
          )}

          {activeTab === "redes-sociais" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Redes Sociais</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Ícones aparecem à direita na barra inferior quando a URL estiver preenchida.</p>
              </div>
              <SocialLinksEditor
                links={form.socialLinks ?? []}
                onChange={(links) => set("socialLinks", links)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};