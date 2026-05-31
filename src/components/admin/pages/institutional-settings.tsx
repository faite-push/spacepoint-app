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
import { institutionalPagesApi, type InstitutionalPageRecord } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const SLUG_PATH: Record<string, string> = {
  about: "/about",
  privacy: "/privacy",
  refunds: "/refunds",
};

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
    setDraft({ ...page });
    initialized.current = true;
  }, [pages, activeSlug]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Nenhuma página selecionada");
      return institutionalPagesApi.update(draft.slug, {
        title: draft.title,
        content: draft.content,
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

  const publicPath = SLUG_PATH[draft.slug] ?? `/${draft.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">Páginas institucionais</h1>
          <p className="text-sm text-muted-foreground mt-1 lg:text-base">
            Edite o conteúdo de Quem somos, Privacidade e políticas da loja.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button variant="outline" asChild className="gap-2 w-full sm:w-auto">
            <Link href={publicPath} target="_blank">
              <ExternalLink className="h-4 w-4" />
              Ver na loja
            </Link>
          </Button>
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
                setDraft({ ...page });
              }}
              className={cn(
                "w-full shrink-0 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors lg:py-3",
                activeSlug === page.slug
                  ? "bg-[#9333EA]/15 text-[#c084fc]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {page.title}
            </button>
          ))}
        </aside>

        <div className="flex-1 rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-zinc-300">Título da página</Label>
            <Input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="bg-[#111] border-white/10"
            />
            <p className="text-xs text-zinc-500">
              URL pública: <span className="font-mono text-zinc-400">{publicPath}</span>
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

          <div className="space-y-2">
            <Label className="text-zinc-300">Conteúdo</Label>
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