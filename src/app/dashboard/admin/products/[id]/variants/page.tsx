"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Package, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { variantsApi, productsApi, type ProductVariant } from "@/lib/admin-api";
import { ProductPackageNav } from "@/components/admin/layout/product-package-nav";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function VariantsListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteVariant, setDeleteVariant] = useState<ProductVariant | null>(null);

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
      toast.success("Variante duplicada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const variants: ProductVariant[] = data?.variants ?? [];

  return (
    <div className="space-y-6">
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
          onClick={() => router.push(`/dashboard/admin/products/${productId}/variants/new`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Nova Variante
        </Button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
          </div>
        ) : variants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Package className="h-12 w-12 text-white/5" />
            <div>
              <p className="text-sm font-medium text-zinc-300">Nenhuma variante criada</p>
              <p className="text-xs text-zinc-600 mt-1">Clique em "Nova Variante" para começar.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Variante</span>
              <span>Preço</span>
              <span>Estoque</span>
              <span>Status</span>
              <span />
            </div>

            {variants.map((v) => (
              <div
                key={v.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded border border-white/10 bg-white/5 overflow-hidden">
                    {v.imageUrl
                      ? <img src={v.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                      : <Package className="h-4 w-4 text-zinc-600" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{v.name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{
                      v.deliveryType === "automatic_lines" ? "Linhas" :
                      v.deliveryType === "file" ? "Arquivo" :
                      v.deliveryType === "manual_chat" ? "Manual" : "Misto"
                    }</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-white">
                  R$ {Number(v.price).toFixed(2)}
                  {v.comparePrice && (
                    <span className="block text-xs text-zinc-600 line-through font-normal">
                      R$ {Number(v.comparePrice).toFixed(2)}
                    </span>
                  )}
                </span>
                <span className="text-sm text-zinc-400">{v.stockQuantity}</span>
                <div className="flex flex-col gap-1">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "w-fit text-[10px] uppercase font-bold tracking-wider border-transparent",
                      v.isVisible ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-500"
                    )}
                  >
                    {v.isVisible ? "Visível" : "Oculto"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white cursor-pointer"
                    disabled={duplicateMut.isPending}
                    onClick={() => duplicateMut.mutate(v.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-white cursor-pointer"
                    onClick={() => router.push(`/dashboard/admin/products/${productId}/variants/${v.id}/edit`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-600 hover:text-red-400 cursor-pointer"
                    onClick={() => setDeleteVariant(v)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete dialog */}
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
    </div>
  );
}
