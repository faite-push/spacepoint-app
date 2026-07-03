import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/shop-api';

export interface OrderApprovedPayload {
  title: string;
  description: string;
  products: Array<{ name: string; imageUrl: string | null; quantity: number; unitPrice: number }>;
};

export interface DeliveryPayload {
  title?: string;
  description?: string;
  productName: string;
  productImageUrl: string | null;
  deliveryContent: string;
  quantity?: number;
};

export function parseOrderApproved(content: string): OrderApprovedPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.title && parsed?.products) return parsed as OrderApprovedPayload;
  } catch {
  }
  return null;
};

export function parseDelivery(content: string): DeliveryPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.productName && parsed?.deliveryContent) return parsed as DeliveryPayload;
  } catch { }
  return null;
};

export function OrderApprovedCard({ payload, className, }: { payload: OrderApprovedPayload; className?: string; }) {
  return (
    <div className={cn('rounded-md bg-blue-500/10 p-4 max-w-sm', className)}>
      <p className="text-sm font-semibold text-blue-400">{payload.title}</p>
      <p className="text-xs text-muted-foreground">{payload.description}</p>

      <div className="mt-2 space-y-2">
        {payload.products.map((product, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-10 w-10 rounded bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover select-none pointer-events-none" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-zinc-600" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xs text-white/90 line-clamp-2">{product.name}</p>
              {product.unitPrice != null && Number.isFinite(Number(product.unitPrice)) && (
                <p className="text-xs text-white/90">
                  Preço: {formatPrice(product.unitPrice)}
                  {product.quantity > 1 ? ` · Qtd: ${product.quantity}` : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export function DeliveryCard({ payload, className, }: { payload: DeliveryPayload; className?: string; }) {
  return (
    <div className={cn('rounded-md bg-blue-500/10 p-4 max-w-sm', className)}>
      <p className="text-sm font-semibold text-blue-400">{payload.title || 'Produto entregue'}</p>
      {payload.description && (
        <p className="text-xs text-muted-foreground">{payload.description}</p>
      )}
      <div className="flex items-center gap-2 mt-2">
        <div className="h-10 w-10 rounded bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
          {payload.productImageUrl ? (
            <img src={payload.productImageUrl} alt={payload.productName} className="h-full w-full object-cover select-none pointer-events-none" />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-4 w-4 text-zinc-600" />
            </div>
          )}
        </div>
        <p className="text-xs text-white/90 line-clamp-2">{payload.productName}</p>
      </div>
      <p className="text-xs text-zinc-500 mt-3 mb-1">Produto enviado</p>
      <div className="rounded-md bg-black/40 border border-white/5 p-2">
        <p className="text-xs text-blue-400 whitespace-pre-wrap break-words">{payload.deliveryContent}</p>
      </div>
    </div>
  );
}
