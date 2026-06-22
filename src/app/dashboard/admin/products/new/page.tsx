"use client";

import { ProductForm } from "@/components/admin/forms/product-form";
import { Can } from "@/providers/PermissionProvider";

export default function NewProductPage() {
  return (
    <Can I="products:create" message="Você não tem permissão para criar produtos.">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <ProductForm product={null} />
    </Can>
  );
};