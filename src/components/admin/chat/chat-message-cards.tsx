import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OrderApprovedPayload {
  title: string;
  description: string;
  products: Array<{ name: string; imageUrl: string | null }>;
}

export interface DeliveryPayload {
  title?: string;
  description?: string;
  productName: string;
  productImageUrl: string | null;
  deliveryContent: string;
  quantity?: number;
}

export function parseOrderApproved(content: string): OrderApprovedPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.title && parsed?.products) return parsed as OrderApprovedPayload;
  } catch {
    // not JSON
  }
  return null;
}

export function parseDelivery(content: string): DeliveryPayload | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed?.productName && parsed?.deliveryContent) return parsed as DeliveryPayload;
  } catch {
    // not JSON
  }
  return null;
}

export function OrderApprovedCard({
  payload,
  className,
}: {
  payload: OrderApprovedPayload;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border border-blue-500/20 bg-blue-500/10 p-4 max-w-sm', className)}>
      <p className="text-sm font-semibold text-blue-300">{payload.title}</p>
      <p className="text-xs text-blue-400/80 mt-1">{payload.description}</p>
      <div className="mt-3 space-y-2">
        {payload.products.map((product, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-4 w-4 text-zinc-600" />
                </div>
              )}
            </div>
            <p className="text-xs text-white/90 line-clamp-2">{product.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeliveryCard({
  payload,
  className,
}: {
  payload: DeliveryPayload;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border border-emerald-500/30 bg-[#0d1f17] p-4 max-w-sm border-l-4 border-l-emerald-500', className)}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-medium text-zinc-400 uppercase">Mensagem</span>
        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">BOT</span>
      </div>
      <p className="text-sm font-semibold text-white">{payload.title || 'Produto entregue'}</p>
      {payload.description && (
        <p className="text-xs text-zinc-400 mt-1">{payload.description}</p>
      )}
      <div className="flex items-center gap-2 mt-3">
        <div className="h-10 w-10 rounded-md bg-white/5 border border-white/10 overflow-hidden flex-shrink-0">
          {payload.productImageUrl ? (
            <img src={payload.productImageUrl} alt={payload.productName} className="h-full w-full object-cover" />
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
