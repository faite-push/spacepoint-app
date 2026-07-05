'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, Loader2, Package, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeliverProductDialog } from '@/components/admin/chat/deliver-product-dialog';
import { chatApi, type Chat, type DeliveryType } from '@/lib/admin-api';
import { getDeliveredContents } from '@/lib/chat-utils';
import { cn } from '@/lib/utils';

type OrderItem = Chat['order']['items'][0];

function getItemDeliveryType(item: OrderItem): DeliveryType {
  return (item.variant?.deliveryType ?? item.product.deliveryType ?? 'manual') as DeliveryType;
}

function getDeliveredCount(item: OrderItem) {
  return item.codes?.filter((c) => c.status === 'DELIVERED').length ?? 0;
}

function getDeliveryLabel(type: DeliveryType) {
  if (type === 'automatic_lines') return 'Automático';
  if (type === 'automatic_text') return 'Texto';
  if (type === 'file') return 'Arquivo';
  return 'Manual';
}

interface OrderDeliveryCartProps {
  chatId: string;
  orderId: string;
  items: OrderItem[];
  className?: string;
  onDelivered?: () => void;
}

export function OrderDeliveryCart({ chatId, orderId, items, className, onDelivered }: OrderDeliveryCartProps) {
  const queryClient = useQueryClient();
  const [deliverItem, setDeliverItem] = useState<OrderItem | null>(null);
  const [editDeliverItem, setEditDeliverItem] = useState<OrderItem | null>(null);
  const [viewDelivered, setViewDelivered] = useState<string[] | null>(null);

  const deliverMutation = useMutation({
    mutationFn: ({ itemId, ...payload }: { itemId: string; content: string; mode: 'text' | 'lines'; useStock: boolean }) =>
      chatApi.deliverItem(chatId, itemId, payload),
    onSuccess: () => {
      toast.success('Produto entregue com sucesso');
      setDeliverItem(null);
      setEditDeliverItem(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', 'detail', orderId] });
      onDelivered?.();
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao entregar produto'),
  });

  if (!items.length) {
    return (
      <div className={cn('text-center py-4 bg-card border border-white/5 rounded-md text-white/40 text-sm', className)}>
        Nenhum item neste pedido.
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => {
        const deliveryType = getItemDeliveryType(item);
        const delivered = getDeliveredCount(item);
        const pending = item.quantity - delivered;
        const deliveredContents = getDeliveredContents(item);

        return (
          <div key={item.id} className="relative border border-white/5 rounded-md overflow-hidden select-none">
            <Badge className="absolute top-2 left-5 z-10 bg-primary text-black border-0 text-[10px] gap-1">
              {getDeliveryLabel(deliveryType)}
            </Badge>

            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="h-16 w-16 rounded-sm bg-white/5 border border-white/5 overflow-hidden flex-shrink-0">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover select-none pointer-events-none" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-zinc-700" /></div>
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div>
                    <p className="text-sm font-medium text-white/90 line-clamp-1">{item.product.name}</p>
                    {item.variantName && <p className="text-xs text-white/60">{item.variantName}</p>}
                  </div>
                  <div className="flex gap-4 rounded-sm bg-card border border-white/5 px-3 py-2 text-xs">
                    <div><span className="text-muted-foreground">Quantidade: </span><span className="text-emerald-400 font-bold">{item.quantity}</span></div>
                    <div><span className="text-muted-foreground">Entregues: </span><span className="text-blue-400 font-bold">{delivered}</span></div>
                  </div>
                </div>
              </div>

              {deliveredContents.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10" onClick={() => setEditDeliverItem(item)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar All
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10" onClick={() => { navigator.clipboard.writeText(deliveredContents.join('\n')); toast.success('Copiado!'); }}>
                      <Copy className="h-3 w-3 mr-1" /> Copiar {deliveredContents.length}
                    </Button>
                  </div>
                  <div className="rounded-md border border-white/5 overflow-hidden">
                    {deliveredContents.map((line, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0 text-xs hover:bg-white/[0.02]">
                        <span className="text-zinc-600 w-4">{idx + 1}</span>
                        <button type="button" onClick={() => { navigator.clipboard.writeText(line); toast.success('Copiado!'); }} className="text-zinc-500 hover:text-white">
                          <Copy className="h-3 w-3" />
                        </button>
                        <span className="text-blue-400 flex-1 truncate">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {deliveredContents.length > 0 && (
                  <Button variant="outline" className="flex-1 border-white/10" onClick={() => setViewDelivered(deliveredContents)}>
                    <Eye className="h-4 w-4 mr-2" /> Visualizar
                  </Button>
                )}
                {pending > 0 && (
                  <Button className={cn('bg-blue-500 hover:bg-blue-500/80 text-black', deliveredContents.length > 0 ? 'flex-1' : 'w-full')} onClick={() => setDeliverItem(item)} disabled={deliverMutation.isPending}>
                    {deliverMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : deliveredContents.length > 0 ? 'Entregar +' : 'Entregar'}
                  </Button>
                )}
              </div>

              {pending <= 0 && deliveredContents.length > 0 && (
                <p className="text-xs text-emerald-400 text-center">Todos os produtos foram entregues.</p>
              )}
            </div>
          </div>
        );
      })}

      {deliverItem && (
        <DeliverProductDialog
          open={!!deliverItem}
          onOpenChange={(open) => !open && setDeliverItem(null)}
          productName={deliverItem.product.name}
          pendingCount={deliverItem.quantity - getDeliveredCount(deliverItem)}
          deliveryType={getItemDeliveryType(deliverItem)}
          isLoading={deliverMutation.isPending}
          onConfirm={(payload) => deliverMutation.mutate({ itemId: deliverItem.id, ...payload })}
        />
      )}

      {editDeliverItem && (
        <DeliverProductDialog
          open={!!editDeliverItem}
          onOpenChange={(open) => !open && setEditDeliverItem(null)}
          productName={editDeliverItem.product.name}
          pendingCount={editDeliverItem.quantity - getDeliveredCount(editDeliverItem)}
          deliveryType={getItemDeliveryType(editDeliverItem)}
          isLoading={deliverMutation.isPending}
          editMode
          initialContent={getDeliveredContents(editDeliverItem).join('\n')}
          onConfirm={(payload) => deliverMutation.mutate({ itemId: editDeliverItem.id, ...payload })}
        />
      )}

      <Dialog open={!!viewDelivered} onOpenChange={(open) => !open && setViewDelivered(null)}>
        <DialogContent className="bg-[#111] border-white/10">
          <DialogHeader><DialogTitle className="text-white">Produtos entregues</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {viewDelivered?.map((line, i) => (
              <div key={i} className="rounded-md bg-white/[0.03] border border-white/5 p-3 text-sm text-blue-400 font-mono">{line}</div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
