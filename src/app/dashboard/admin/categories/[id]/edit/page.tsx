"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

import { CategoryForm } from "@/components/admin/forms/category-form";
import { Button } from "@/components/ui/button";
import { categoriesApi } from "@/lib/admin-api";

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "category", id],
    queryFn: () => categoriesApi.get(id),
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
          <p className="text-lg font-semibold text-white">Categoria não encontrada</p>
          <p className="text-sm text-muted-foreground">
            A categoria que você está tentando editar não existe ou foi removida.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/categories">Voltar para categorias</Link>
        </Button>
      </div>
    );
  }

  return <CategoryForm category={data} />;
}
