"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

import { ProductForm } from "@/components/admin/forms/product-form";
import { Button } from "@/components/ui/button";
import { productsApi, variantsApi } from "@/lib/admin-api";
import { Can } from "@/providers/PermissionProvider";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => productsApi.get(id),
    retry: false,
  });

  const { data: variantsData } = useQuery({
    queryKey: ["admin", "variants", id],
    queryFn: () => variantsApi.list(id),
    enabled: !!data,
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
          <p className="text-sm text-muted-foreground">
            O produto que você está tentando editar não existe ou foi removido.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/products">Voltar para produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <Can I="products:edit" message="Você não tem permissão para editar produtos.">
      <div className="relative space-y-6">
        <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />

        <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />

        <ProductForm
          product={data}
          variantCount={variantsData?.variants?.length ?? 0}
        />
      </div>
    </Can>
  );
}
