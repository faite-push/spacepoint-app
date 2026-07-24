"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, ExternalLink } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichEditor } from "@/components/admin/shared/rich-editor";
import { HelpLayoutEditor } from "@/components/admin/pages/help-layout-editor";
import { DocumentLayoutEditor } from "@/components/admin/pages/document-layout-editor";
import { institutionalPagesApi, type InstitutionalPageRecord } from "@/lib/admin-api";
import { INSTITUTIONAL_PUBLIC_PATH } from "@/lib/institutional-routes";
import {
  isDocumentLayoutData,
  isHelpLayoutData,
  type DocumentLayoutData,
  type HelpLayoutData,
} from "@/lib/institutional-layout";
import { cn } from "@/lib/utils";

const HELP_SLUGS = new Set([
  "support",
  "fale-conosco",
  "como-comprar",
  "como-funciona",
  "envio-expresso",
]);

const FALLBACK_HELP: HelpLayoutData = {
  heroTitle: "Como podemos te ajudar?",
  heroSubtitle: "Nossa equipe está pronta para resolver seu problema.",
  channels: [],
  faq: [],
  hours: {
    title: "Horário de Atendimento",
    weekdays: "Segunda a Sexta: 09:00 - 18:00",
    weekend: "Finais de Semana: Suporte limitado",
    timezone: "Horário de Brasília (UTC-3)",
  },
};

const FALLBACK_DOCUMENT: DocumentLayoutData = {
  eyebrow: "",
  intro: "",
  showToc: true,
  updatedLabel: "",
};

function normalizeDraft(page: InstitutionalPageRecord): InstitutionalPageRecord {
  const layoutType =
    page.layoutType ||
    (HELP_SLUGS.has(page.slug) ? "help" : "document");

  let layoutData = page.layoutData;
  if (layoutType === "help" && !isHelpLayoutData(layoutData)) {
    layoutData = FALLBACK_HELP;
  }
  if (layoutType === "document" && !isDocumentLayoutData(layoutData)) {
    layoutData = FALLBACK_DOCUMENT;
  }

  return { ...page, layoutType, layoutData };
}

export function InstitutionalSettings() {
  const queryClient = useQueryClient();
  const [activeSlug, setActiveSlug] = useState<string>("about");
  const [draft, setDraft] = useState<InstitutionalPageRecord | null>(null);
  const initialized = useRef(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "institutional-pages"],
    queryFn: () => institutionalPagesApi.list(),
  });

  const pages = data?.pages ?? [];

  useEffect(() => {
    if (!pages.length || initialized.current) return;
    const page = pages.find((p) => p.slug === activeSlug) ?? pages[0];
    setActiveSlug(page.slug);
    setDraft(normalizeDraft(page));
    initialized.current = true;
  }, [pages, activeSlug]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Nenhuma página selecionada");
      return institutionalPagesApi.update(draft.slug, {
        title: draft.title,
        content: draft.content,
        layoutType: draft.layoutType,
        layoutData: draft.layoutData,
        isPublished: draft.isPublished,
        metaTitle: draft.metaTitle,
        metaDescription: draft.metaDescription,
      });
    },
    onSuccess: () => {
      toast.success("Página institucional salva");
      queryClient.invalidateQueries({ queryKey: ["admin", "institutional-pages"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !draft) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const publicPath = INSTITUTIONAL_PUBLIC_PATH[draft.slug] ?? `/${draft.slug}`;
  const helpLayout = isHelpLayoutData(draft.layoutData) ? draft.layoutData : FALLBACK_HELP;
  const documentLayout = isDocumentLayoutData(draft.layoutData)
    ? draft.layoutData
    : FALLBACK_DOCUMENT;

  return (
    <div className="relative space-y-6">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Páginas institucionais</h1>
          <p className="text-muted-foreground">
            Layout de ajuda (canais + FAQ) nas páginas de Confiança e layout documental nas de Empresa.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" size="lg" asChild className="gap-2">
            <Link href={publicPath} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Ver na loja
            </Link>
          </Button>
          <Button
            className="shrink-0"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar página
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <aside className="flex gap-2 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {pages.map((page) => (
            <button
              key={page.slug}
              type="button"
              onClick={() => {
                setActiveSlug(page.slug);
                setDraft(normalizeDraft(page));
              }}
              className={cn(
                "w-full shrink-0 cursor-pointer rounded-md px-4 py-2.5 text-left text-sm font-medium transition-colors lg:py-3",
                activeSlug === page.slug
                  ? "bg-[#9333EA]/15 text-[#c084fc]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {page.title}
              <span className="mt-0.5 block text-[10px] font-normal uppercase tracking-wide text-zinc-600">
                {HELP_SLUGS.has(page.slug) ? "Ajuda" : "Documento"}
              </span>
            </button>
          ))}
        </aside>

        <div className="flex-1 space-y-6 rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
          <div className="space-y-2">
            <Label className="text-zinc-300">Título da página</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="bg-[#111] border-white/10"
            />
            <p className="text-xs text-zinc-500">
              URL pública: <span className="font-mono text-zinc-400">{publicPath}</span>
              {" · "}
              Layout: <span className="text-zinc-400">{draft.layoutType}</span>
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Publicada</p>
              <p className="text-xs text-zinc-500">Páginas não publicadas retornam 404 na loja.</p>
            </div>
            <Switch
              checked={draft.isPublished}
              onCheckedChange={(v) => setDraft({ ...draft, isPublished: v })}
            />
          </div>

          <div className="space-y-4 rounded-lg border border-white/10 bg-[#111]/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">SEO</p>
            <div className="space-y-2">
              <Label className="text-zinc-300">Meta title</Label>
              <Input
                value={draft.metaTitle ?? ""}
                onChange={(e) => setDraft({ ...draft, metaTitle: e.target.value })}
                className="bg-[#111] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Meta description</Label>
              <Input
                value={draft.metaDescription ?? ""}
                onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })}
                className="bg-[#111] border-white/10"
              />
            </div>
          </div>

          {draft.layoutType === "help" ? (
            <HelpLayoutEditor
              value={helpLayout}
              onChange={(layoutData) =>
                setDraft({ ...draft, layoutType: "help", layoutData })
              }
            />
          ) : (
            <DocumentLayoutEditor
              value={documentLayout}
              onChange={(layoutData) =>
                setDraft({ ...draft, layoutType: "document", layoutData })
              }
            />
          )}

          <div className="space-y-2 border-t border-white/10 pt-6">
            <Label className="text-zinc-300">
              {draft.layoutType === "help"
                ? "Mais informações (opcional)"
                : "Conteúdo da página"}
            </Label>
            <p className="text-xs text-zinc-500">
              {draft.layoutType === "help"
                ? "Bloco TipTap exibido abaixo dos canais e do FAQ."
                : "Use headings H2/H3 para gerar o sumário automático."}
            </p>
            <RichEditor
              value={draft.content}
              onChange={(content) => setDraft({ ...draft, content })}
              placeholder="Escreva o conteúdo da página..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
