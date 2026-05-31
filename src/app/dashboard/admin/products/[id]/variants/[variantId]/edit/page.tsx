"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { VariantForm } from "@/components/admin/forms/variant-form";
import { Button } from "@/components/ui/button";
import { variantsApi, productsApi } from "@/lib/admin-api";

export default function EditVariantPage({ params }: { params: Promise<{ id: string; variantId: string }> }) {
  const { id: productId, variantId } = use(params);

  const { data: productData, isLoading: prodLoading } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => productsApi.get(productId),
    retry: false,
  });

  const { data: variantData, isLoading: varLoading, error } = useQuery({
    queryKey: ["admin", "variant", productId, variantId],
    queryFn: () => variantsApi.get(productId, variantId),
    retry: false,
  });

  const isLoading = prodLoading || varLoading;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !variantData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="text-lg font-semibold text-white">Variante não encontrada</p>
          <p className="text-sm text-muted-foreground">A variante que você está tentando editar não existe ou foi removida.</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard/admin/products/${productId}/variants`}>Voltar para variantes</Link>
        </Button>
      </div>
    );
  }

  return (
    <VariantForm
      productId={productId}
      productName={productData?.name ?? ""}
      variant={variantData}
    />
  );
}
