"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Upload, Trash2, Check, Loader2, SortAsc, SortDesc, Image as ImageIcon, Plus, ArrowUpDown, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { mediaApi, type MediaItem } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { API_URL, getCsrfToken } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MediaGalleryProps {
  onSelect?: (urls: string[]) => void;
  allowMultiple?: boolean;
  maxSelections?: number;
  initialSelected?: string[];
  showActions?: boolean;
}

export function MediaGallery({ onSelect, allowMultiple = false, maxSelections = 1, initialSelected = [], showActions = true, }: MediaGalleryProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "media", search],
    queryFn: () => mediaApi.list({ search }),
  });

  const items = data?.items ?? [];

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [items, sortOrder]);

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      if (!allowMultiple) {
        setSelectedIds([id]);
      } else if (selectedIds.length < maxSelections) {
        setSelectedIds([...selectedIds, id]);
      } else {
        toast.error(`Máximo de ${maxSelections} seleções permitidas`);
      }
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => mediaApi.remove(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
      setSelectedIds([]);
      toast.success("Imagens removidas");
    },
    onError: () => toast.error("Erro ao remover imagens"),
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "general");

      try {
        const res = await fetch(`${API_URL}/v1/cdn/upload`, {
          method: "POST",
          credentials: "include",
          headers: { "X-CSRF-Token": getCsrfToken() },
          body: formData,
        });
        if (!res.ok) throw new Error();
      } catch (err) {
        toast.error(`Erro ao carregar ${file.name}`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["admin", "media"] });
    toast.success("Upload concluído");
    e.target.value = "";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar imagens..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                className="h-10 w-10"
                size="icon-lg"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? <ArrowUpDown className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />}
              </Button>
            }
          >
          </TooltipTrigger>
          <TooltipContent>
            <p>Ordenar por data {sortOrder === "asc" ? "crescente" : "decrescente"}</p>
          </TooltipContent>
        </Tooltip>

        <label className="flex items-center justify-center h-10 w-10 rounded-md bg-background border border-white/5 hover:bg-white/5 cursor-pointer transition-colors group">
          <Upload className="h-4 w-4 text-white transition-transform" />
          <input type="file" className="hidden" multiple accept="image/*" onChange={handleUpload} />
        </label>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="destructive"
                size="icon-lg"
                disabled={selectedIds.length === 0 || deleteMutation.isPending}
                className="text-red-500 h-10 w-10 hover:bg-red-500/20 border border-red-500/20"
                onClick={() => {
                  if (confirm(`Remover ${selectedIds.length} imagens?`)) {
                    deleteMutation.mutate(selectedIds);
                  }
                }}
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            }
          >
          </TooltipTrigger>
          <TooltipContent>
            <p>Apagar imagem</p>
          </TooltipContent>
        </Tooltip>

        {onSelect && (
          <Button
            disabled={selectedIds.length === 0}
            variant="default"
            size="default"
            onClick={() => {
              const selectedUrls = items.filter(i => selectedIds.includes(i.id)).map(i => i.url);
              onSelect(selectedUrls);
              setSelectedIds([]);
            }}
            className="h-10 px-4 flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Adicionar {selectedIds.length}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 py-20 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
            <ImageIcon className="h-16 w-16 text-zinc-800" />
            <div>
              <p className="text-white text-lg font-medium">Nenhuma imagem encontrada</p>
              <p className="text-sm text-zinc-500">Tente buscar por outro termo ou faça um upload para a biblioteca.</p>
            </div>
          </div>
        ) : (
          <ScrollArea>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {sortedItems.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={cn(
                      "group relative flex flex-col space-y-10 rounded-md border transition-all cursor-pointer overflow-hidden backdrop-blur-sm",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-white/5 bg-white/[0.03] hover:bg-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="aspect-square relative flex items-center justify-center bg-zinc-900/40 p-2">
                      <img
                        src={item.url}
                        alt={item.filename}
                        className="rounded-md object-contain select-none pointer-events-none h-full w-full"
                      />

                      {isSelected && (
                        <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-lg border border-white/20">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="absolute bottom-0 left-1/3 -translate-x-1/4 px-3 py-2">
                      <p className="text-xs text-zinc-400 font-medium text-center">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};