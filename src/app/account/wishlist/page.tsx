"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { Heart, Loader2, ShoppingBag, Trash2 } from "lucide-react";
import { FaBasketShopping } from "react-icons/fa6";

import { formatPrice, formatPriceLabel } from "@/lib/shop-api";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import { WishlistSkeleton } from "../_components/account-skeletons";

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

  return (
    <div className="relative space-y-4">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div>
        <h1 className="text-2xl font-bold text-white">Lista de Desejos</h1>
        <p className="text-muted-foreground">Produtos salvos para comprar depois.</p>
      </div>

      {!hydrated ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <WishlistSkeleton />
          <WishlistSkeleton />
          <WishlistSkeleton />
          <WishlistSkeleton />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <Heart className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Sua lista está vazia</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Clique no coração nos produtos para salvá-los aqui.
          </p>
          <Button asChild className="px-6 py-4">
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
              <div key={product.id} className="flex gap-4 rounded-md border border-white/5 bg-black/10 p-3">
                <div className="flex items-center justify-center">
                  <Link href={`/product/${product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-white/5">
                    <Image src={image} alt={product.name} fill className="object-cover select-none pointer-events-none" />
                  </Link>
                </div>

                <div className="flex flex-col items-start w-full">
                  <Tooltip>
                    <TooltipTrigger render={
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-medium text-white line-clamp-1 w-full"
                      >
                        {product.name}
                      </Link>
                    }>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{product.name}</p>
                    </TooltipContent>
                  </Tooltip>

                  <p className="text-md font-semibold text-white/80">
                    {formatPriceLabel(product)}
                  </p>

                  <div className="flex w-full gap-2 mt-2">
                    <Button
                      size="sm"
                      className="rounded-md px-5 py-4 flex-1"
                      onClick={() => handleAddToCart(product)}
                    >
                      Adicionar ao carrinho
                    </Button>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-lg"
                          variant="outline"
                          className="rounded-md border-white/10"
                          onClick={() => {
                            removeItem(product.id);
                            toast.success("Removido da lista");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remover da lista</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};