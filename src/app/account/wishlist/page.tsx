"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";

import { useWishlistStore } from "@/store/wishlist-store";
import { formatPrice, formatPriceLabel } from "@/lib/shop-api";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const addProduct = useCartStore((s) => s.addProduct);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useWishlistStore.persist.onFinishHydration(finish);
    if (useWishlistStore.persist.hasHydrated()) finish();
    return unsub;
  }, []);

  function handleAddToCart(product: (typeof items)[0]) {
    if (product.hasVariants) {
      toast.info("Selecione a variante na página do produto");
      return;
    }
    addProduct(product);
    toast.success("Adicionado ao carrinho");
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Lista de Desejos</h1>
        <p className="text-zinc-500 mt-1">Produtos salvos para comprar depois.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <Heart className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Sua lista está vazia</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Clique no coração nos produtos para salvá-los aqui.
          </p>
          <Button asChild className="rounded-xl">
            <Link href="/">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Explorar loja
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((product) => {
            const image = product.imageUrl || product.images?.[0] || "/placeholder.svg";
            return (
              <div
                key={product.id}
                className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4"
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white/5"
                >
                  <Image src={image} alt={product.name} fill className="object-cover" />
                </Link>
                <div className="flex flex-1 flex-col min-w-0">
                  <Link
                    href={`/product/${product.slug}`}
                    className="font-bold text-white hover:text-primary line-clamp-2 transition-colors"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-zinc-500 mt-1">{product.platform}</p>
                  <p className="text-lg font-black text-primary mt-auto">
                    {formatPriceLabel(product)}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      className="rounded-lg flex-1"
                      onClick={() => handleAddToCart(product)}
                    >
                      Adicionar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg border-white/10"
                      onClick={() => {
                        removeItem(product.id);
                        toast.success("Removido da lista");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
