"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import type { Product } from "@/types/shop";

export function AddToCartButton({ product }: { product: Product }) {
  const addProduct = useCartStore((state) => state.addProduct);

  return (
    <Button onClick={() => addProduct(product)} className="w-full">
      <ShoppingCart className="mr-2 h-4 w-4" />Adicionar ao carrinho
    </Button>
  );
}
