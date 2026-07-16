"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Check, Loader2, Pencil, Plus, PlusCircle, Save, Star, Trash2, X, } from "lucide-react";
import { TbGridDots } from "react-icons/tb";

import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { homeShowcaseApi, type HomeShowcaseSectionRecord, } from "@/lib/admin-api";
import { cn, decodeHtmlEntities } from "@/lib/utils";

type SectionForm = {
  title: string;
  subtitle: string;
  enabled: boolean;
  maxItems: number;
};

const emptySectionForm: SectionForm = {
  title: "",
  subtitle: "",
  enabled: true,
  maxItems: 12,
};

export function HomeShowcaseSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [localSections, setLocalSections] = useState<HomeShowcaseSectionRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState<SectionForm>(emptySectionForm);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ["admin", "home-showcase-sections"],
    queryFn: () => homeShowcaseApi.list(),
  });

  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ["admin", "home-showcase-featured-products"],
    queryFn: () => homeShowcaseApi.listFeaturedProducts(),
  });

  useEffect(() => {
    if (sectionsData?.sections) setLocalSections(sectionsData.sections);
  }, [sectionsData?.sections]);

  const featuredProducts = featuredData?.products ?? [];

  const saveSectionMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: sectionForm.title.trim(),
        subtitle: sectionForm.subtitle.trim() || null,
        enabled: sectionForm.enabled,
        maxItems: sectionForm.maxItems,
        productIds: selectedProductIds,
      };

      if (editingId) return homeShowcaseApi.update(editingId, payload);
      return homeShowcaseApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Seção atualizada" : "Seção criada");
      setDialogOpen(false);
      setEditingId(null);
      setSectionForm(emptySectionForm);
      setSelectedProductIds([]);
      queryClient.invalidateQueries({ queryKey: ["admin", "home-showcase-sections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: homeShowcaseApi.remove,
    onSuccess: () => {
      toast.success("Seção removida");
      queryClient.invalidateQueries({ queryKey: ["admin", "home-showcase-sections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string }[]) => homeShowcaseApi.reorder(items),
    onSuccess: () => {
      toast.success("Ordem atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin", "home-showcase-sections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleSectionEnabled = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      homeShowcaseApi.update(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "home-showcase-sections"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditingId(null);
    setSectionForm(emptySectionForm);
    setSelectedProductIds([]);
    setDialogOpen(true);
  };

  const openEdit = (section: HomeShowcaseSectionRecord) => {
    setEditingId(section.id);
    setSectionForm({
      title: section.title,
      subtitle: section.subtitle || "",
      enabled: section.enabled,
      maxItems: section.maxItems,
    });
    setSelectedProductIds((section.products || []).map((row) => row.productId));
    setDialogOpen(true);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(localSections);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setLocalSections(items);
    reorderMutation.mutate(items.map((item) => ({ id: item.id })));
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const isLoading = sectionsLoading || featuredLoading;
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  };

  return (
    <div className="space-y-6 rounded-md border border-white/5 bg-transparent p-4">
      {!hideHeader && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">
              Vitrine de Produtos
            </h1>
            <p className="text-sm text-muted-foreground lg:text-base">
              Crie seções na home e escolha quais produtos com estrela aparecem em cada uma.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-white">Seções da vitrine</p>
          <p className="text-sm text-zinc-500">
            Marque produtos com a estrela na listagem e depois associe-os às seções abaixo.
          </p>
        </div>
        <Button type="button" className="px-6 py-5" onClick={openCreate}>
          <PlusCircle className="h-4 w-4" />
          Adicionar seção
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="showcase-sections">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {localSections.map((section, index) => (
                <Draggable key={section.id} draggableId={section.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}
                      className={cn(
                        "rounded-md border border-white/5 bg-white/[0.02] px-4 py-3",
                        snapshot.isDragging && "border-primary/30 bg-primary/5"
                      )}
                      style={dragProvided.draggableProps.style as React.CSSProperties}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <button type="button" {...dragProvided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white">
                            <TbGridDots className="h-5 w-5" />
                          </button>

                          <div className="min-w-0">
                            <p className="font-semibold text-white">{section.title}</p>
                            {section.subtitle ? (
                              <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                              {section._count?.products ?? section.products?.length ?? 0} produto(s) · máx. {section.maxItems}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Toggle
                            size="sm"
                            pressed={section.enabled}
                            onPressedChange={(pressed) =>
                              toggleSectionEnabled.mutate({ id: section.id, enabled: pressed })
                            }
                          >
                            {section.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Toggle>

                          <Button type="button" variant="outline" size="icon-lg" onClick={() => openEdit(section)}>
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-lg"
                            className="bg-red-500/10 text-red-400 hover:bg-red-500/30 hover:text-red-500"
                            onClick={() => removeMutation.mutate(section.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {localSections.length === 0 && (
        <div className="rounded-md border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
          Nenhuma seção criada ainda. Clique em &quot;Nova seção&quot; para começar.
        </div>
      )}

      <div className="rounded-md border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm text-white">
          <span>
            Produtos com estrela disponíveis: <strong>{featuredProducts.length}</strong>
          </span>
        </div>
        <p className="mt-2 text-xs text-zinc-400">
          Para adicionar produtos à vitrine, marque-os com a estrela em Produtos e depois selecione-os ao editar uma seção.
        </p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar seção" : "Nova seção"}</DialogTitle>
            <DialogDescription>Crie seções na home e escolha quais produtos com estrela aparecem em cada uma.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="flex items-center justify-center gap-2">
              <div className="space-y-2 flex-1">
                <Label>Título</Label>
                <Input
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Mais Vendidos"
                />
              </div>

              <div className="space-y-2">
                <Label>Máximo de produtos</Label>
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={sectionForm.maxItems}
                  onChange={(e) =>
                    setSectionForm((prev) => ({
                      ...prev,
                      maxItems: Math.max(1, Math.min(24, Number(e.target.value) || 12)),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subtítulo (opcional)</Label>
              <Input
                value={sectionForm.subtitle}
                onChange={(e) => setSectionForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Ex: Os favoritos da comunidade"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center border border-white/5 rounded-md p-3 gap-2">
                <Toggle
                  size="sm"
                  pressed={sectionForm.enabled}
                  onPressedChange={(pressed) =>
                    setSectionForm((prev) => ({ ...prev, enabled: pressed }))
                  }
                >
                  {sectionForm.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </Toggle>
                <div>
                  <p className="text-sm font-medium text-white">
                    {sectionForm.enabled ? "Seção ativa" : "Seção inativa"}
                  </p>
                  <p className="text-xs text-muted-foreground">Controla se aparece na home.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Produtos com estrela nesta seção</Label>
              {selectedProductIds.length > 0 && (
                <span className="text-xs text-primary font-medium">
                  {selectedProductIds.length} selecionado(s)
                </span>
              )}
            </div>

            {featuredProducts.length === 0 ? (
              <div className="rounded-md border border-dashed border-white/10 p-4 text-center text-sm text-muted-foreground">
                Nenhum produto marcado com estrela ainda. Vá em Produtos e marque os destaques.
              </div>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border border-white/5 p-3">
                {featuredProducts.map((product) => {
                  const selected = selectedProductIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors",
                        selected ? "border-primary/30 bg-primary/5" : "border-white/5"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Star
                          className={cn(
                            "size-4 shrink-0",
                            selected ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                          )}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {decodeHtmlEntities(product.name)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.isActive && product.isVisible
                              ? "Visível na loja"
                              : "Oculto ou inativo"}
                          </p>
                        </div>
                      </div>

                      <Toggle
                        size="sm"
                        pressed={selected}
                        onPressedChange={() => toggleProduct(product.id)}
                        aria-label={`Incluir ${decodeHtmlEntities(product.name)} na seção`}
                      >
                        {selected ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </Toggle>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="flex">
            <Button
              type="button"
              className="flex-1 px-6 py-4"
              disabled={saveSectionMutation.isPending || !sectionForm.title.trim()}
              onClick={() => saveSectionMutation.mutate()}
            >
              {saveSectionMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="flex-1 px-6 py-4"
              onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
