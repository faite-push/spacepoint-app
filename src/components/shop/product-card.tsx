"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { HiHeart } from "react-icons/hi2";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { formatPrice, formatPriceLabel } from "@/lib/shop-api";
import { resolveMediaUrl } from "@/lib/media";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/shop";
import { cn } from "@/lib/utils";

function discountPercent(price: number, comparePrice: number | null): number | null {
  if (!comparePrice || comparePrice <= price) return null;
  return Math.round((1 - price / comparePrice) * 100);
}

function displayComparePrice(product: Product): number | null {
  if (product.comparePrice && product.comparePrice > product.price) {
    return product.comparePrice;
  }
  if (product.hasVariants && product.variants.length > 0) {
    const compares = product.variants
      .map((v) => v.comparePrice)
      .filter((c): c is number => c != null && c > 0);
    if (compares.length === 0) return null;
    return Math.max(...compares);
  }
  return null;
}

export function ProductCard({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false);
  const addProduct = useCartStore((state) => state.addProduct);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const isInWishlistRaw = useWishlistStore((state) => state.isInWishlist(product.id));
  const isInWishlist = mounted ? isInWishlistRaw : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  const image = resolveMediaUrl(product.imageUrl || product.images[0]) || "/placeholder.svg";
  const compare = displayComparePrice(product);
  const discount = discountPercent(product.price, compare);

  function handleBuy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.hasVariants) addProduct(product);
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  }

  const buyButtonClass = cn(
    "flex w-full md:w-auto justify-center items-center shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white cursor-pointer",
    "transition-all hover:bg-primary/80 sm:px-8 sm:py-3"
  );

  return (
    <article className="group flex h-full flex-col rounded-xl border border-white/[0.06] bg-[#ffffff03] p-2 md:p-4 transition-colors hover:border-white/10 transition-all duration-300 object-cover select-none hover:translate-y-[-4px] transition-transform duration-300 relative">
      <Link href={`/product/${product.slug}`} className="block relative">
        <div className="relative aspect-[4/4] w-full overflow-hidden rounded-md bg-[#111]">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 pointer-events-none select-none"
            sizes="(max-width: 768px) 45vw, (max-width: 1200px) 33vw, 280px"
          />
        </div>
      </Link>

      <Tooltip>
        <TooltipTrigger render={
          <button
            type="button"
            onClick={handleWishlist}
            className={cn(
              "cursor-pointer absolute top-2 right-2 md:top-4 md:right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all duration-300 sm:h-9 sm:w-9",
              "md:opacity-0 md:group-hover:opacity-100",
              isInWishlist && "bg-[#f5495a] md:opacity-100"
            )}
          >
            <HiHeart className={cn("h-4 w-4 transition-colors", isInWishlist ? "fill-white text-white" : "text-white/80")} />
          </button>
        }>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isInWishlist ? "Remover dos favoritos" : "Adicionar aos favoritos"}</p>
        </TooltipContent>
      </Tooltip>

      <Link href={`/product/${product.slug}`} className="mt-3 block">
        <h3 className="line-clamp-2 md:line-clamp-2 text-sm md:text-base font-bold leading-snug tracking-tight text-white">
          {product.name}
        </h3>
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-3 mt-0 md:mt-2">
        <div className="min-w-0 w-full md:w-auto">
          <div className="flex items-center gap-2">
            {compare != null && compare > product.price && (
              <p className="text-xs md:text-sm text-white/40 line-through">{formatPrice(compare)}</p>
            )}
            {discount != null && discount > 0 && (
              <div className="flex items-center justify-center rounded-sm bg-primary/15 h-6 px-3 text-[11px] font-bold text-primary shrink-0 whitespace-nowrap">
                {discount}% OFF
              </div>
            )}
          </div>

          <p className="mb-0 md:mb-0 text-xl md:text-2xl font-bold text-white">
            {formatPriceLabel(product)}
            {product.hasVariants && "+"}
          </p>
          <p className="text-[11px] md:text-xs text-white/60">À vista no Pix</p>
        </div>

        {product.hasVariants ? (
          <Link href={`/product/${product.slug}`} className={buyButtonClass}>
            Comprar
          </Link>
        ) : (
          <button type="button" onClick={handleBuy} className={buyButtonClass}>
            Comprar
          </button>
        )}
      </div>
    </article>
  );
}