"use client";

import { ProductForm } from "@/components/admin/forms/product-form";
import { Can } from "@/providers/PermissionProvider";

export default function NewProductPage() {
  return (
    <Can I="products:create" message="Você não tem permissão para criar produtos.">
      <ProductForm product={null} />
    </Can>
  );
}
