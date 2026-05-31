"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, BadgeDollarSign, Percent } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice, formatPriceLabel } from "@/lib/shop-api";
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
  const addProduct = useCartStore((state) => state.addProduct);
  const image = product.imageUrl || product.images[0] || "/placeholder.svg";
  const compare = displayComparePrice(product);
  const discount = discountPercent(product.price, compare);

  function handleBuy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.hasVariants) addProduct(product);
  }

  const buyButtonClass = cn(
    "shrink-0 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white",
    "transition-all hover:bg-primary/80 sm:px-8 sm:py-3"
  );

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-white/[0.06] bg-[#ffffff03] p-2 md:p-4 transition-colors hover:border-white/10 transition-all duration-300 object-cover select-none">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[4/4] w-full overflow-hidden rounded-xl bg-[#111]">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 object-cover pointer-events-none select-none"
            sizes="(max-width: 768px) 45vw, (max-width: 1200px) 33vw, 280px"
          />

          {discount != null && discount > 0 && (
            <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-full border border-primary/80 bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary backdrop-blur-sm">
              <Percent className="h-3 w-3 shrink-0" />
              {discount}% OFF
            </div>
          )}
        </div>
      </Link>

      <Link href={`/product/${product.slug}`} className="mt-3 block">
        <h3 className="line-clamp-3 text-sm md:text-base font-bold leading-snug tracking-tight text-white">
          {product.name}
        </h3>
      </Link>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {compare != null && compare > product.price && (
            <p className="text-xs md:text-sm text-white/40 line-through">{formatPrice(compare)}</p>
          )}
          <p className="mb-2 md:mb-0 text-xl md:text-2xl font-bold text-white">
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