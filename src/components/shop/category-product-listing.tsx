"use client";

import { ProductListing } from "@/components/shop/product-listing";

export function CategoryProductListing({
  categorySlug,
  showIncludeSubcategories,
}: {
  categorySlug: string;
  showIncludeSubcategories?: boolean;
}) {
  return (
    <ProductListing
      categorySlug={categorySlug}
      showIncludeSubcategories={showIncludeSubcategories}
      emptyTitle="Nenhum produto nesta categoria"
      emptyDescription="Não há produtos com os filtros selecionados. Tente incluir subcategorias ou ajustar os filtros."
    />
  );
}
