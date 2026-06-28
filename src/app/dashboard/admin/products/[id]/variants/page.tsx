"use client";

import { use, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Package, Copy, GripVertical, PlusCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { TbCactusFilled } from "react-icons/tb";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TbGridDots } from "react-icons/tb";

import { cn } from "@/lib/utils";
import { variantsApi, productsApi, type ProductVariant } from "@/lib/admin-api";
import { ProductPackageNav } from "@/components/admin/layout/product-package-nav";
import { VariantForm } from "@/components/admin/forms/variant-form";

function getVariantStockLabel(v: ProductVariant) {
  if (v.deliveryType === "automatic_lines") {
    const lineStock = v.digitalLines?.length ?? 0;
    const stock = Math.max(lineStock, v.stockQuantity ?? 0);
    return { stock, label: stock === 0 ? "sem estoque" : String(stock) };
  }
  const stock = v.stockQuantity ?? 0;
  return { stock, label: stock === 0 ? "sem estoque" : String(stock) };
}

export default function VariantsListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteVariant, setDeleteVariant] = useState<ProductVariant | null>(null);
  const [localVariants, setLocalVariants] = useState<ProductVariant[] | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);

  const { data: productData, isLoading: prodLoading } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => productsApi.get(productId),
    retry: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "variants", productId],
    queryFn: () => variantsApi.list(productId),
  });

  const deleteMut = useMutation({
    mutationFn: (variantId: string) => variantsApi.remove(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setLocalVariants(null);
      toast.success("Variante removida");
      setDeleteVariant(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMut = useMutation({
    mutationFn: (variantId: string) => variantsApi.duplicate(productId, variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setLocalVariants(null);
      toast.success("Variante duplicada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMut = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) =>
      variantsApi.reorder(productId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setLocalVariants(null);
    },
  });

  const serverVariants: ProductVariant[] = data?.variants ?? [];
  const variants: ProductVariant[] = localVariants ?? serverVariants;

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const src = result.source.index;
      const dst = result.destination.index;
      if (src === dst) return;

      const reordered = Array.from(variants);
      const [moved] = reordered.splice(src, 1);
      reordered.splice(dst, 0, moved);
      setLocalVariants(reordered);

      reorderMut.mutate(
        reordered.map((v, i) => ({ id: v.id, sortOrder: i }))
      );
    },
    [variants, reorderMut]
  );

  return (
    <div className="space-y-6">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />

      <ProductPackageNav productId={productId} />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-transparent">
            <Link href="/dashboard/admin/products" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Editar pacote
            </h1>
            {!prodLoading && productData?.name && (
              <p className="text-xs text-zinc-500 mt-0.5">{productData.name}</p>
            )}
          </div>
        </div>

        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2"
          size="lg"
        >
          <PlusCircle className="h-4 w-4" /> Nova Variante
        </Button>
      </div>

      <div className="rounded-md border border-white/5 bg-transparent overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <TbCactusFilled className="h-12 w-12" />
            <div>
              <p className="text-sm font-medium text-white/70">Nenhuma variante criada no momento</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="variants-list">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {variants.map((v, index) => (
                      <Draggable key={v.id} draggableId={v.id} index={index}>
                        {(drag, snapshot) => (
                          <div ref={drag.innerRef} {...(drag.draggableProps as any)} className={cn("flex items-center gap-3 px-6 py-4 bg-transparent hover:bg-black/20 transition-colors group", snapshot.isDragging && "rounded-md border border-white/10")}>
                            <div
                              {...drag.dragHandleProps}
                              className="text-white/60 shrink-0 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 p-1"
                            >
                              <TbGridDots className="h-5 w-5" />
                            </div>

                            <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded border border-white/10 bg-white/5 overflow-hidden">
                              {v.imageUrl
                                ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover select-none pointer-events-none" />
                                : <Package className="h-4 w-4 text-zinc-600" />}
                            </div>

                            <div className="min-w-0 flex-1 flex items-center justify-between">
                              <div className="min-w-0 gap-36 flex">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingVariant(v);
                                  }}
                                  className="font-semibold text-sm text-white/80 truncate text-left transition-colors cursor-pointer block"
                                >
                                  {v.name}
                                </button>

                                <span className={cn("text-xs font-medium px-2 py-1 rounded-sm", v.isVisible ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-500")}>
                                  {v.isVisible ? "on" : "off"}
                                </span>

                                <Badge variant="secondary" className="bg-white/5 rounded-sm text-zinc-400 text-xs px-2 py-1 font-medium">
                                  {v.deliveryType === "automatic_lines" ? "linhas"
                                    : v.deliveryType === "file" ? "arquivo"
                                      : v.deliveryType === "manual" ? "manual"
                                        : v.deliveryType === "manual_chat" ? "manual chat"
                                          : v.deliveryType === "automatic_text" ? "texto"
                                            : "misto"}
                                </Badge>

                                {(v.minPurchaseQuantity > 1 || v.maxPurchaseQuantity || v.onePurchasePerUser) && (
                                  <div className="flex items-center gap-2">
                                    {v.minPurchaseQuantity > 1 && (
                                      <Badge className="text-xs bg-white/5 text-zinc-500 rounded-sm px-2 py-1">
                                        min: {v.minPurchaseQuantity}
                                      </Badge>
                                    )}
                                    {v.maxPurchaseQuantity && (
                                      <Badge className="text-xs bg-white/5 text-zinc-500 rounded-sm px-2 py-1">
                                        max: {v.maxPurchaseQuantity}
                                      </Badge>
                                    )}
                                    {v.onePurchasePerUser && (
                                      <Badge className="text-xs bg-white/5 text-zinc-500 rounded-sm px-2 py-1">
                                        1 p/ user
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-6 shrink-0 pr-4">
                                <div className="flex flex-col items-end">
                                  {(() => {
                                    const { stock, label } = getVariantStockLabel(v);
                                    return (
                                      <span className={cn(
                                        "text-sm font-medium",
                                        stock <= 0 ? "text-red-500" : "text-zinc-300"
                                      )}>
                                        {label}
                                      </span>
                                    );
                                  })()}
                                </div>

                                <div className="flex flex-col items-end min-w-[70px]">
                                  <div className="flex items-center gap-1.5">
                                    {v.comparePrice && Number(v.comparePrice) > 0 && (
                                      <span className="text-sm text-zinc-500 line-through">
                                        R${Number(v.comparePrice).toFixed(2)}
                                      </span>
                                    )}
                                    <span className="text-sm font-medium text-white">
                                      R${Number(v.price).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-zinc-400 hover:text-white cursor-pointer"
                                      disabled={duplicateMut.isPending}
                                      onClick={() => duplicateMut.mutate(v.id)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  }
                                >
                                </TooltipTrigger>
                                <TooltipContent side="top">Duplicar</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-zinc-400 hover:text-white cursor-pointer"
                                      onClick={() => setEditingVariant(v)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  }
                                >
                                </TooltipTrigger>
                                <TooltipContent side="top">Editar</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger
                                  render={
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      onClick={() => setDeleteVariant(v)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  }
                                >
                                </TooltipTrigger>
                                <TooltipContent side="top">Excluir</TooltipContent>
                              </Tooltip>
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
          </div>
        )}
      </div>

      <Dialog open={!!deleteVariant} onOpenChange={() => setDeleteVariant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir variante</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteVariant?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVariant(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={() => deleteVariant && deleteMut.mutate(deleteVariant.id)}
            >
              {deleteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Nova Variante</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar uma nova variante do produto.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
            <VariantForm
              productId={productId}
              productName={productData?.name ?? ""}
              isModal
              onSuccess={() => setIsCreateModalOpen(false)}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVariant} onOpenChange={(open) => !open && setEditingVariant(null)}>
        <DialogContent className="max-w-6xl p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Editar Variante</DialogTitle>
            <DialogDescription>
              Ajuste as informações da variante abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6 overflow-y-auto max-h-[80vh]">
            <VariantForm
              productId={productId}
              productName={productData?.name ?? ""}
              variant={editingVariant}
              isModal
              onSuccess={() => setEditingVariant(null)}
              onCancel={() => setEditingVariant(null)}
            />
          </div>
        </DialogContent>
      </Dialog>


    </div>
  );
};