'use client';

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Hand, Info, Package, ShoppingCart, Tag, X, Plus, Loader2, Copy, Pencil, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { chatApi, type Chat, type DeliveryType } from '@/lib/admin-api';
import { formatPrice } from '@/lib/shop-api';
import { cn } from '@/lib/utils';
import { getDeliveredContents } from '@/lib/chat-utils';
import { DeliverProductDialog } from '@/components/admin/chat/deliver-product-dialog';

type Tab = 'info' | 'cart' | 'tags';

interface ChatOrderPanelProps {
  chat: Chat;
  allLabels: Array<{ id: string; name: string; color: string }>;
  onToggleLabel: (labelId: string) => void;
}

function getItemDeliveryType(item: Chat['order']['items'][0]): DeliveryType {
  return (item.variant?.deliveryType ?? item.product.deliveryType ?? 'manual') as DeliveryType;
}

function getDeliveredCount(item: Chat['order']['items'][0]) {
  return item.codes?.filter((c) => c.status === 'DELIVERED').length ?? 0;
}

function formatPaymentMethod(method: string | null | undefined) {
  if (!method) return 'N/A';
  const map: Record<string, string> = { PIX: 'Pix', CARD: 'Cartão de Crédito', BOLETO: 'Boleto' };
  return map[method.toUpperCase()] || method;
}

function getDeliveryLabel(type: DeliveryType) {
  if (type === 'automatic_lines') return 'Automático';
  if (type === 'automatic_text') return 'Texto';
  if (type === 'file') return 'Arquivo';
  return 'Manual';
}

export function ChatOrderPanel({ chat, allLabels, onToggleLabel }: ChatOrderPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [deliverItem, setDeliverItem] = useState<Chat['order']['items'][0] | null>(null);
  const [editDeliverItem, setEditDeliverItem] = useState<Chat['order']['items'][0] | null>(null);
  const [viewDelivered, setViewDelivered] = useState<string[] | null>(null);
  const [showAddLabel, setShowAddLabel] = useState(false);

  const pendingCount = chat.order?.items?.reduce((acc, item) => {
    const delivered = getDeliveredCount(item);
    return acc + Math.max(0, item.quantity - delivered);
  }, 0) ?? 0;

  const payment = chat.order?.payments?.[0];
  const transactionId = payment?.externalId || chat.order?.id || 'N/A';

  const deliverMutation = useMutation({
    mutationFn: ({ itemId, ...payload }: { itemId: string; content: string; mode: 'text' | 'lines'; useStock: boolean }) =>
      chatApi.deliverItem(chat.id, itemId, payload),
    onSuccess: () => {
      toast.success('Produto entregue com sucesso');
      setDeliverItem(null);
      setEditDeliverItem(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', chat.orderId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao entregar produto'),
  });

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'info', label: 'Informações', icon: Info },
    { id: 'cart', label: 'Carrinho', icon: ShoppingCart, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

  const assignedLabelIds = new Set(chat.labels?.map((l) => l.id) || []);

  return (
    <div className="w-110 flex flex-col rounded-md border border-white/5">
      <div className="border-b border-white/5">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-lg font-medium text-white">Detalhes do pedido</h3>
        </div>
        <div className="flex border-b border-white/5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-0.5 px-1 py-2.5 text-xs font-medium transition-colors relative',
                  activeTab === tab.id ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-white'
                )}
              >
                <div className="flex items-center gap-1">
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="text-[9px] font-bold text-primary whitespace-nowrap">
                    Pendentes {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <ScrollArea className="flex-1 max-h-[700px]">
        {activeTab === 'info' && (
          <div className="p-4 space-y-4">
            <div className="bg-card/30 border border-white/5 rounded-md p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 font-medium text-lg">
                  {chat.order?.user?.email?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">{chat.order?.user?.email || 'Sem email'}</span>
                  <span className="text-xs text-muted-foreground">
                    {chat.createdAt ? format(new Date(chat.createdAt), "dd, MMM yyyy HH:mm", { locale: ptBR }) : 'Recente'}
                  </span>
                </div>
              </div>
              <Separator className="bg-white/5" />
              <div className="grid grid-cols-3 gap-2">
                <div><p className="text-sm text-muted-foreground">Gastos</p><p className="text-sm font-medium text-white/80">{formatPrice(chat.userStats?.totalSpent || 0)}</p></div>
                <div><p className="text-sm text-muted-foreground">Compras</p><p className="text-sm font-medium text-white/80">{chat.userStats?.ordersCount || 0}</p></div>
                <div><p className="text-sm text-muted-foreground">Comprados</p><p className="text-sm font-medium text-white/80">{chat.userStats?.itemsCount || 0}</p></div>
              </div>
            </div>
            <div className="bg-card/30 border border-white/5 rounded-md p-4 space-y-3">
              <h4 className="text-sm font-medium text-white">Pagamento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Método</span><span className="text-white/90">{formatPaymentMethod(chat.order?.paymentMethod)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">ID da transação</span><span className="text-white/90 font-mono text-xs truncate max-w-[140px]" title={transactionId}>{transactionId}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground">Data da compra</span><span className="text-white/90">{chat.order?.createdAt ? format(new Date(chat.order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</span></div>
                {chat.order?.paidAt && <div className="flex justify-between gap-2"><span className="text-muted-foreground">Pagamento aprovado</span><span className="text-white/90">{format(new Date(chat.order.paidAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span></div>}
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{formatPrice(chat.order?.subtotal || 0)}</span></div>
              <div className="flex justify-between"><span>Desconto</span><span className="font-medium">{formatPrice(chat.order?.discount || 0)}</span></div>
              <div className="flex justify-between"><span>Valor Total</span><span className="font-medium">{formatPrice(chat.order?.total || 0)}</span></div>
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="p-4 space-y-4">
            {chat.order?.items?.map((item) => {
              const deliveryType = getItemDeliveryType(item);
              const delivered = getDeliveredCount(item);
              const pending = item.quantity - delivered;
              const deliveredContents = getDeliveredContents(item);

              return (
                <div key={item.id} className="relative border border-white/5 rounded-md overflow-hidden bg-white/[0.01]">
                  <Badge className="absolute top-2 left-2 z-10 bg-primary/20 text-primary border-0 text-[10px] gap-1">
                    <Hand className="h-3 w-3" />
                    {getDeliveryLabel(deliveryType)}
                  </Badge>

                  <div className="p-4 pt-8 space-y-3">
                    <div className="flex gap-3">
                      <div className="h-16 w-16 rounded-md bg-white/5 border border-white/5 overflow-hidden flex-shrink-0">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-zinc-700" /></div>
                        )}
                      </div>
                      <p className="text-sm font-bold text-white/90 line-clamp-3 flex-1 uppercase">{item.product.name}</p>
                    </div>

                    <div className="flex items-center gap-4 rounded-md bg-white/[0.03] border border-white/5 px-3 py-2 text-xs">
                      <div><span className="text-muted-foreground">Quantidade </span><span className="text-emerald-400 font-bold">{item.quantity}</span></div>
                      <div><span className="text-muted-foreground">Entregues </span><span className="text-blue-400 font-bold">{delivered}</span></div>
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

                    {pending > 0 && delivered === 0 && (
                      <div className="rounded-md border-l-2 border-primary bg-white/[0.02] px-3 py-2">
                        <p className="text-xs text-muted-foreground">Nenhum produto foi entregue ao cliente.</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {deliveredContents.length > 0 && (
                        <Button variant="outline" className="flex-1 border-white/10" onClick={() => setViewDelivered(deliveredContents)}>
                          <Eye className="h-4 w-4 mr-2" /> Visualizar
                        </Button>
                      )}
                      {pending > 0 && (
                        <Button className={cn('bg-blue-600 hover:bg-blue-700 text-white', deliveredContents.length > 0 ? 'flex-1' : 'w-full')} onClick={() => setDeliverItem(item)} disabled={deliverMutation.isPending}>
                          {deliveredContents.length > 0 ? 'Entregar +' : 'Entregar'}
                        </Button>
                      )}
                    </div>

                    {pending <= 0 && (
                      <div className="rounded-md border-l-2 border-emerald-500 bg-emerald-500/5 px-3 py-2">
                        <p className="text-xs text-emerald-400">Todos os produtos foram entregues.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="p-4 space-y-3">
            <h4 className="text-sm text-muted-foreground font-medium">Etiquetas do chat</h4>
            <div className="flex flex-wrap gap-2">
              {chat.labels?.map((label) => (
                <button key={label.id} onClick={() => onToggleLabel(label.id)} className="px-2 py-1 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: label.color }}>
                  {label.name} <X className="h-3 w-3 inline ml-1" />
                </button>
              ))}
            </div>
            <Separator className="bg-white/5" />
            <h4 className="text-sm text-muted-foreground font-medium">Adicionar etiqueta</h4>
            <div className="flex flex-wrap gap-2">
              {allLabels.filter((l) => !assignedLabelIds.has(l.id)).map((label) => (
                <button key={label.id} onClick={() => onToggleLabel(label.id)} className="px-2 py-1 rounded-full text-[10px] font-medium text-white opacity-60 hover:opacity-100 transition-opacity" style={{ backgroundColor: label.color }}>
                  <Plus className="h-3 w-3 inline mr-0.5" />{label.name}
                </button>
              ))}
              {allLabels.filter((l) => !assignedLabelIds.has(l.id)).length === 0 && (
                <p className="text-xs text-zinc-600">Todas as etiquetas já foram adicionadas</p>
              )}
            </div>
          </div>
        )}
      </ScrollArea>

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
