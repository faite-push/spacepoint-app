"use client";

import { CategoryForm } from "@/components/admin/forms/category-form";
import { Can } from "@/providers/PermissionProvider";

export default function NewCategoryPage() {
  return (
    <Can I="products:create" message="Você não tem permissão para criar categorias.">
      <CategoryForm category={null} />
    </Can>
  );
}
