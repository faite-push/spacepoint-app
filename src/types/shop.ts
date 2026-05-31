export type ProductVariant = {
  id: string;
  productId: string;
  sku: string | null;
  name: string;
  price: number;
  comparePrice: number | null;
  imageUrl: string | null;
  stockQuantity: number;
  minPurchaseQuantity: number;
  maxPurchaseQuantity: number | null;
  onePurchasePerUser: boolean;
  deliveryType: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: unknown;
  price: number;
  comparePrice: number | null;
  priceFrom: boolean;
  hasVariants: boolean;
  variantCount: number;
  variants: ProductVariant[];
  images: string[];
  imageUrl?: string | null;
  platform: string;
  isDigital?: boolean;
  featured?: boolean;
  stockQuantity?: number;
  category?: { id: string; name: string; slug: string } | null;
};

export type CartItem = {
  cartKey: string;
  productId: string;
  variantId: string | null;
  variantName: string | null;
  slug: string;
  name: string;
  price: number;
  image?: string;
  platform: string;
  quantity: number;
};

export type OrderCode = {
  code: string;
  deliveredAt: string | null;
};

export type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  variantId: string | null;
  variantName: string | null;
  product: Pick<Product, "name" | "slug" | "platform" | "images"> & {
    imageUrl?: string | null;
  };
  variant?: { id: string; name: string; sku: string | null } | null;
  codes: OrderCode[];
};

export type Order = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  paidAt: string | null;
  items: OrderItem[];
};

export function cartItemKey(productId: string, variantId?: string | null) {
  return variantId ? `${productId}:${variantId}` : productId;
}
