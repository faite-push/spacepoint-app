'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Info, ShoppingCart, Tag, X, Plus, Loader2, ExternalLink, Clock, CheckCircle2, Truck, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import { ordersApi, type Chat } from '@/lib/admin-api';
import { formatPrice } from '@/lib/shop-api';
import { cn } from '@/lib/utils';
import { getDeliveryOptionLabel, isExpressDelivery, stripExpressAdminNote } from '@/lib/order-delivery';
import { OrderDeliveryCart } from '@/components/admin/orders/order-delivery-cart';

type Tab = 'info' | 'cart' | 'tags';

interface ChatOrderPanelProps {
  chat: Chat;
  allLabels: Array<{ id: string; name: string; color: string }>;
  onToggleLabel: (labelId: string) => void;
  className?: string;
  embedded?: boolean;
}

function formatPaymentMethod(method: string | null | undefined) {
  if (!method) return 'N/A';
  const map: Record<string, string> = { PIX: 'Pix', CARD: 'Cartão de Crédito', BOLETO: 'Boleto' };
  return map[method.toUpperCase()] || method;
}

export function ChatOrderPanel({ chat, allLabels, onToggleLabel, className, embedded = false }: ChatOrderPanelProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [adminNotes, setAdminNotes] = useState(stripExpressAdminNote(chat.order?.adminNotes));

  useEffect(() => {
    setAdminNotes(stripExpressAdminNote(chat.order?.adminNotes));
  }, [chat.order?.adminNotes, chat.order?.id]);

  const express = isExpressDelivery(chat.order);

  const notesMutation = useMutation({
    mutationFn: (notes: string) => {
      const base = notes.trim();
      const payload = express
        ? (base
          ? `[ENTREGA EXPRESSA] Priorizar atendimento e entrega deste pedido.\n\n${base}`
          : '[ENTREGA EXPRESSA] Priorizar atendimento e entrega deste pedido.')
        : base;
      return ordersApi.updateNotes(chat.order.id, payload);
    },
    onSuccess: () => {
      toast.success('Notas salvas');
      queryClient.invalidateQueries({ queryKey: ['chat', chat.orderId] });
    },
    onError: () => toast.error('Erro ao salvar notas'),
  });

  const pendingCount = chat.order?.items?.reduce((acc, item) => {
    const delivered = item.codes?.filter((c) => c.status === 'DELIVERED').length ?? 0;
    return acc + Math.max(0, item.quantity - delivered);
  }, 0) ?? 0;

  const payment = chat.order?.payments?.[0];
  const transactionId = payment?.externalId || chat.order?.id || 'N/A';

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'info', label: 'Pedido', icon: Info },
    { id: 'cart', label: 'Carrinho', icon: ShoppingCart, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'tags', label: 'Tags', icon: Tag },
  ];

  const assignedLabelIds = new Set(chat.labels?.map((l) => l.id) || []);

  return (
    <div className={cn(
      "flex min-h-0 flex-col rounded-md border border-white/5",
      embedded ? "h-full w-full border-0 rounded-none" : "w-110 h-full",
      className
    )}>
      <div className="shrink-0 border-b border-white/5">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-lg font-medium text-white">Detalhes do pedido</h3>
        </div>
        <div className="flex px-2 py-2 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center cursor-pointer gap-2 px-1 py-2 text-sm font-medium transition-colors relative',
                  activeTab === tab.id ? 'text-primary bg-primary/10 rounded-md' : 'text-muted-foreground hover:text-white hover:bg-white/5 rounded-md'
                )}
              >
                <div className="flex items-center justify-center w-full ">
                  {tab.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {activeTab === 'info' && (
          <div className="space-y-3 p-4">
            {express && (
              <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2.5 text-amber-200">
                <Zap className="h-4 w-4 shrink-0 text-[#fcb74e] fill-current" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#fcb74e]">Entrega expressa</p>
                  <p className="text-xs text-[#fcb74e]/80">Priorize o atendimento e a entrega deste pedido.</p>
                </div>
              </div>
            )}

            <div className="bg-card/30 border border-white/5 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 font-medium text-lg">
                    {chat.order?.user?.name?.[0]?.toUpperCase() || chat.order?.user?.email?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-white truncate">{chat.order?.user?.name || 'Cliente'}</span>
                    <span className="text-xs text-muted-foreground truncate">{chat.order?.user?.email || 'Sem email'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                    <Link href={`/dashboard/admin/orders?search=${encodeURIComponent(chat.order?.user?.email || chat.orderId)}`}>
                      <ExternalLink className="h-3 w-3 mr-1" /> Ver pedido
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 px-4 py-2">
                <div><p className="text-xs text-muted-foreground">Total gasto</p><p className="text-sm font-medium text-white">{formatPrice(chat.userStats?.totalSpent || 0)}</p></div>
                <div><p className="text-xs text-muted-foreground">Pedidos</p><p className="text-sm font-medium text-white">{chat.userStats?.ordersCount || 0}</p></div>
                <div><p className="text-xs text-muted-foreground">Itens</p><p className="text-sm font-medium text-white">{chat.userStats?.itemsCount || 0}</p></div>
              </div>
            </div>

            <div className="bg-card/30 border border-white/5 rounded-md">
              <div className="flex items-center justify-start px-4 py-2 mt-2">
                <h1 className="mx-auto text-sm font-medium text-white">Detalhes do Pagamento</h1>
              </div>

              <div className="text-sm px-4 py-2">
                <div className="flex justify-between"><span className='text-sm text-muted-foreground'>Subtotal</span><span className="text-sm text-white/90 font-medium">{formatPrice(chat.order?.subtotal || 0)}</span></div>
                <div className="flex justify-between"><span className='text-sm text-muted-foreground'>Desconto</span><span className="text-sm text-white/90 font-medium">{formatPrice(chat.order?.discount || 0)}</span></div>
                <div className="flex justify-between">
                  <span className='text-sm text-muted-foreground'>Entrega</span>
                  <span className={cn("text-sm font-medium", express ? "text-white/90" : "text-white/90")}>
                    {getDeliveryOptionLabel(chat.order)}
                  </span>
                </div>
                {(chat.order?.deliveryFee ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span className='text-sm text-muted-foreground'>Taxa de entrega</span>
                    <span className="text-sm text-white/90 font-medium">{formatPrice(chat.order?.deliveryFee ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between"><span className='text-sm text-muted-foreground'>Valor Total</span><span className="text-sm text-white/90 font-medium">{formatPrice(chat.order?.total || 0)}</span></div>
              </div>

              <div className="text-sm px-4 py-2">
                <div className="flex justify-between gap-2"><span className="text-sm text-muted-foreground">Método</span><span className="text-sm text-white/90">{formatPaymentMethod(chat.order?.paymentMethod)}</span></div>
                <div className="flex justify-between gap-2"><span className="text-sm text-muted-foreground">ID da transação</span><span className="text-sm text-white/90 font-mono text-sm truncate max-w-[140px]" title={transactionId}>{transactionId}</span></div>
                <div className="flex justify-between gap-2"><span className="text-sm text-muted-foreground">Data da compra</span><span className="text-sm text-white/90">{chat.order?.createdAt ? format(new Date(chat.order.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</span></div>
                {chat.order?.paidAt && <div className="flex justify-between gap-2"><span className="text-muted-foreground">Pagamento aprovado</span><span className="text-white/90">{format(new Date(chat.order.paidAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span></div>}
              </div>
            </div>

            <div className="bg-card/30 border border-white/5 rounded-md p-4 space-y-3">
              <h4 className="flex items-center justify-between gap-2 text-sm font-medium text-white">
                <span className="mx-auto">Timeline do pedido</span>
              </h4>
              <div className="space-y-3 pl-1">
                {[
                  { label: 'Pedido criado', date: chat.order?.createdAt, icon: Clock, done: true },
                  { label: 'Pagamento confirmado', date: chat.order?.paidAt, icon: CheckCircle2, done: !!chat.order?.paidAt },
                  { label: 'Entregue', date: chat.order?.status === 'DELIVERED' ? chat.updatedAt : null, icon: Truck, done: chat.order?.status === 'DELIVERED' },
                  { label: 'Chat encerrado', date: chat.status === 'CLOSED' ? chat.updatedAt : null, icon: CheckCircle2, done: chat.status === 'CLOSED' },
                ].map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-start gap-3">
                      <div className={cn('h-7 w-7 rounded-full flex items-center justify-center shrink-0', step.done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-zinc-600')}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={cn('text-xs font-medium text-white', step.done ? 'text-white' : 'text-zinc-500')}>{step.label}</p>
                        {step.date && <p className="text-[10px] text-zinc-500">{step.date ? format(new Date(step.date), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '-'}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {(chat.order?.clientIp || chat.order?.userAgent) && (
              <div className="bg-card/30 border border-white/5 rounded-md p-4 space-y-2">
                <h4 className="text-center text-sm font-medium text-white">Dispositivo / IP</h4>
                {chat.order.clientIp && <p className="text-xs text-zinc-400"><span className="text-zinc-500">IP:</span> {chat.order.clientIp}</p>}
                {chat.order.userAgent && <p className="text-xs text-zinc-400 break-all"><span className="text-zinc-500">User-Agent:</span> {chat.order.userAgent}</p>}
              </div>
            )}

            <div className="bg-card/30 border border-white/5 rounded-md p-4 space-y-2">
              <h4 className="text-center text-sm font-medium text-white">Notas internas</h4>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Visível apenas para a equipe..."
                className="min-h-[80px] text-sm"
              />
              <Button size="lg" className="w-full" onClick={() => notesMutation.mutate(adminNotes)} disabled={notesMutation.isPending}>
                {notesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar notas'}
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <OrderDeliveryCart
            chatId={chat.id}
            orderId={chat.orderId}
            items={chat.order?.items ?? []}
            className="p-4"
          />
        )}

        {activeTab === 'tags' && (
          <div className="p-4 space-y-3">
            <h4 className="text-sm text-muted-foreground font-medium">Etiquetas do chat</h4>
            <div className="flex flex-wrap gap-2">
              {chat.labels?.map((label) => (
                <Button key={label.id} size="xs" onClick={() => onToggleLabel(label.id)} className="rounded-sm font-medium text-white" style={{ backgroundColor: label.color }}>
                  {label.name} <X className="h-3 w-3 inline ml-1" />
                </Button>
              ))}
            </div>

            <Separator className="bg-white/5" />

            <h4 className="text-sm text-muted-foreground font-medium">Adicionar etiqueta</h4>
            <div className="flex flex-wrap gap-2">
              {allLabels.filter((l) => !assignedLabelIds.has(l.id)).map((label) => (
                <Button key={label.id} size="xs" onClick={() => onToggleLabel(label.id)} className="rounded-sm font-medium text-white transition-opacity" style={{ backgroundColor: label.color }}>
                  <Plus className="h-3 w-3" />{label.name}
                </Button>
              ))}
              {allLabels.filter((l) => !assignedLabelIds.has(l.id)).length === 0 && (
                <p className="text-xs text-zinc-600">Todas as etiquetas já foram adicionadas</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
