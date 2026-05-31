"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { VariantForm } from "@/components/admin/forms/variant-form";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/lib/admin-api";

export default function NewVariantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "product", productId],
    queryFn: () => productsApi.get(productId),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <p className="text-lg font-semibold text-white">Produto não encontrado</p>
          <p className="text-sm text-muted-foreground">O produto pai não existe ou foi removido.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/products">Voltar para produtos</Link>
        </Button>
      </div>
    );
  }

  return <VariantForm productId={productId} productName={data.name} />;
}
