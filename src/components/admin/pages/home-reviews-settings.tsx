"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Pencil } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { TbGridDots } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import {
  homeReviewsApi,
  siteSettingsApi,
  type HomeReviewRecord,
  type SiteConfigRecord,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type ReviewForm = {
  name: string;
  comment: string;
  avatarUrl: string;
  rating: number;
  dateLabel: string;
  isPublished: boolean;
};

const emptyReviewForm: ReviewForm = {
  name: "",
  comment: "",
  avatarUrl: "",
  rating: 5,
  dateLabel: "",
  isPublished: true,
};

export function HomeReviewsSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [configForm, setConfigForm] = useState<Partial<SiteConfigRecord>>({});
  const [localReviews, setLocalReviews] = useState<HomeReviewRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>(emptyReviewForm);

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  const { data: reviewsData, isLoading: reviewsLoading } = useQuery({
    queryKey: ["admin", "home-reviews"],
    queryFn: () => homeReviewsApi.list(),
  });

  useEffect(() => {
    if (settingsData?.config) setConfigForm(settingsData.config);
  }, [settingsData?.config]);

  useEffect(() => {
    if (reviewsData?.reviews) setLocalReviews(reviewsData.reviews);
  }, [reviewsData?.reviews]);

  const saveConfigMutation = useMutation({
    mutationFn: () =>
      siteSettingsApi.update({
        homeReviewsEnabled: configForm.homeReviewsEnabled ?? true,
        homeReviewsBadgeLabel: configForm.homeReviewsBadgeLabel ?? null,
        homeReviewsTitle: configForm.homeReviewsTitle ?? null,
        homeReviewsAverageRating: configForm.homeReviewsAverageRating ?? null,
        homeReviewsTotalCount: configForm.homeReviewsTotalCount ?? null,
        homeReviewsGoogleMapsUrl: configForm.homeReviewsGoogleMapsUrl ?? null,
        homeReviewsLinkLabel: configForm.homeReviewsLinkLabel ?? null,
      }),
    onSuccess: () => {
      toast.success("Configurações da seção salvas");
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string }[]) => homeReviewsApi.reorder(items),
    onSuccess: () => {
      toast.success("Ordem atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin", "home-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveReviewMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: reviewForm.name.trim(),
        comment: reviewForm.comment.trim(),
        avatarUrl: reviewForm.avatarUrl.trim() || null,
        rating: reviewForm.rating,
        dateLabel: reviewForm.dateLabel.trim() || null,
        isPublished: reviewForm.isPublished,
      };
      if (editingId) return homeReviewsApi.update(editingId, payload);
      return homeReviewsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Avaliação atualizada" : "Avaliação criada");
      setDialogOpen(false);
      setEditingId(null);
      setReviewForm(emptyReviewForm);
      queryClient.invalidateQueries({ queryKey: ["admin", "home-reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: homeReviewsApi.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "home-reviews"] });
      const previous = localReviews;
      setLocalReviews((prev) => prev.filter((r) => r.id !== id));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Avaliação removida");
      queryClient.invalidateQueries({ queryKey: ["admin", "home-reviews"] });
    },
    onError: (e: Error, _id, context) => {
      if (context?.previous) setLocalReviews(context.previous);
      toast.error(e.message);
    },
  });

  const setConfig = <K extends keyof SiteConfigRecord>(
    key: K,
    value: SiteConfigRecord[K]
  ) => {
    setConfigForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setReviewForm(emptyReviewForm);
    setDialogOpen(true);
  };

  const openEdit = (review: HomeReviewRecord) => {
    setEditingId(review.id);
    setReviewForm({
      name: review.name,
      comment: review.comment,
      avatarUrl: review.avatarUrl ?? "",
      rating: review.rating,
      dateLabel: review.dateLabel ?? "",
      isPublished: review.isPublished,
    });
    setDialogOpen(true);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const next = Array.from(localReviews);
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    setLocalReviews(next);
    reorderMutation.mutate(next.map((r) => ({ id: r.id })));
  };

  if (settingsLoading || reviewsLoading) {
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
              Avaliações na home
            </h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Carrossel de depoimentos exibido na página inicial.
            </p>
          </div>
          <Button
            className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto"
            disabled={saveConfigMutation.isPending}
            onClick={() => saveConfigMutation.mutate()}
          >
            {saveConfigMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar seção
          </Button>
        </div>
      )}

      {hideHeader && (
        <div className="flex justify-end mb-4">
          <Button
            className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto"
            disabled={saveConfigMutation.isPending}
            onClick={() => saveConfigMutation.mutate()}
          >
            {saveConfigMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar seção
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Exibir na home</p>
            <p className="text-xs text-zinc-500">Oculta o bloco inteiro quando desativado.</p>
          </div>
          <Switch
            checked={configForm.homeReviewsEnabled ?? true}
            onCheckedChange={(v) => setConfig("homeReviewsEnabled", v)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Badge</Label>
            <Input
              value={configForm.homeReviewsBadgeLabel ?? ""}
              onChange={(e) => setConfig("homeReviewsBadgeLabel", e.target.value)}
              placeholder="Google Reviews"
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Título da seção</Label>
            <Input
              value={configForm.homeReviewsTitle ?? ""}
              onChange={(e) => setConfig("homeReviewsTitle", e.target.value)}
              placeholder="O que nossos clientes dizem"
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Nota média exibida</Label>
            <Input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={configForm.homeReviewsAverageRating ?? ""}
              onChange={(e) =>
                setConfig(
                  "homeReviewsAverageRating",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Total de avaliações (texto)</Label>
            <Input
              type="number"
              min={0}
              value={configForm.homeReviewsTotalCount ?? ""}
              onChange={(e) =>
                setConfig(
                  "homeReviewsTotalCount",
                  e.target.value === "" ? null : Number(e.target.value)
                )
              }
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-zinc-300">URL Google Maps</Label>
            <Input
              value={configForm.homeReviewsGoogleMapsUrl ?? ""}
              onChange={(e) => setConfig("homeReviewsGoogleMapsUrl", e.target.value)}
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Texto do link</Label>
            <Input
              value={configForm.homeReviewsLinkLabel ?? ""}
              onChange={(e) => setConfig("homeReviewsLinkLabel", e.target.value)}
              placeholder="Ver todas"
              className="bg-[#111] border-white/10"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Depoimentos
        </h2>
        <Button size="sm" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova avaliação
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="home-reviews">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {localReviews.map((review, index) => (
                <Draggable key={review.id} draggableId={review.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border border-white/10 bg-[#0A0A0A] p-4",
                        snapshot.isDragging && "border-[#9333EA]/50"
                      )}
                    >
                      <span
                        {...dragProvided.dragHandleProps}
                        className="cursor-grab text-zinc-500 hover:text-white"
                      >
                        <TbGridDots className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{review.name}</p>
                        <p className="text-xs text-zinc-500 line-clamp-1">{review.comment}</p>
                      </div>
                      {!review.isPublished && (
                        <span className="text-[10px] uppercase tracking-wider text-amber-400">
                          Rascunho
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(review)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(review.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar avaliação" : "Nova avaliação"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={reviewForm.name}
                onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                className="bg-[#111] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label>Comentário</Label>
              <Textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={3}
                className="bg-[#111] border-white/10"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nota (1–5)</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, rating: Number(e.target.value) || 5 })
                  }
                  className="bg-[#111] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Data (texto)</Label>
                <Input
                  value={reviewForm.dateLabel}
                  onChange={(e) => setReviewForm({ ...reviewForm, dateLabel: e.target.value })}
                  placeholder="há 2 semanas"
                  className="bg-[#111] border-white/10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <ImageUpload
                value={reviewForm.avatarUrl}
                onChange={(url) =>
                  setReviewForm({ ...reviewForm, avatarUrl: url ?? "" })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
              <span className="text-sm">Publicada na loja</span>
              <Switch
                checked={reviewForm.isPublished}
                onCheckedChange={(v) => setReviewForm({ ...reviewForm, isPublished: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => saveReviewMutation.mutate()}
              disabled={saveReviewMutation.isPending || !reviewForm.name.trim()}
            >
              {saveReviewMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
