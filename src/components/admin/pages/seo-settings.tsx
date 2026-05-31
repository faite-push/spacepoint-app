"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import {
  PAGE_SEO_LABELS,
  pageSeoApi,
  type PageSeoRecord,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export function SeoSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [activeKey, setActiveKey] = useState("home");
  const [draft, setDraft] = useState<PageSeoRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "page-seo"],
    queryFn: () => pageSeoApi.list(),
  });

  const pages = data?.pages ?? [];

  useEffect(() => {
    if (!pages.length) return;
    const page = pages.find((p) => p.pageKey === activeKey) ?? pages[0];
    setActiveKey(page.pageKey);
    setDraft({ ...page });
  }, [pages, activeKey]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Nenhuma página selecionada");
      return pageSeoApi.update(draft.pageKey, {
        metaTitle: draft.metaTitle,
        metaDescription: draft.metaDescription,
        ogImageUrl: draft.ogImageUrl,
      });
    },
    onSuccess: () => {
      toast.success("SEO salvo");
      queryClient.invalidateQueries({ queryKey: ["admin", "page-seo"] });
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

  const isTemplate = draft.pageKey === "category" || draft.pageKey === "product";

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">SEO por página</h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Títulos e descrições para mecanismos de busca e compartilhamento.
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

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:w-56 lg:overflow-visible lg:pb-0">
          {pages.map((page) => (
            <button
              key={page.pageKey}
              type="button"
              onClick={() => {
                setActiveKey(page.pageKey);
                setDraft({ ...page });
              }}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                activeKey === page.pageKey
                  ? "bg-[#9333EA]/15 text-[#c084fc]"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {PAGE_SEO_LABELS[page.pageKey] ?? page.pageKey}
            </button>
          ))}
        </aside>

        <div className="flex-1 rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-6">
          {isTemplate && (
            <p className="text-xs text-zinc-500 rounded-lg border border-white/10 bg-[#111] px-3 py-2">
              Use <code className="text-[#c084fc]">{"{name}"}</code> no título ou descrição para
              substituir pelo nome da categoria ou produto. SEO específico por item pode ser
              definido no cadastro da categoria/produto.
            </p>
          )}

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
            <Textarea
              value={draft.metaDescription ?? ""}
              onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })}
              rows={4}
              className="bg-[#111] border-white/10 resize-y"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Imagem Open Graph (opcional)</Label>
            <ImageUpload
              value={draft.ogImageUrl ?? ""}
              onChange={(url) => setDraft({ ...draft, ogImageUrl: url || null })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
