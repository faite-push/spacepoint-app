'use client';

import Link from 'next/link';
import Image from 'next/image';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Calendar, Clock, Copy, Fingerprint, Mail, Phone, UserRound } from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { formatDocument, formatLastAccess, formatPhone } from '@/lib/client-format';
import { Can } from '@/providers/PermissionProvider';
import type { AdminClient } from '@/lib/admin-api';
import { formatPrice } from '@/lib/shop-api';
import { cn } from '@/lib/utils';

type Props = {
  client: AdminClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignRole?: (client: AdminClient) => void;
  onRemoveRole?: (client: AdminClient) => void;
};

function getClientTypeLabel(client: AdminClient) {
  if (client.role?.name) return client.role.name;
  if (client.isAdmin) return 'Admin';
  return 'Cliente';
}

function StatCard({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-md border border-white/5 bg-transparent px-3 py-2', className)}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-medium text-white">{value}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  onCopy,
  onWhatsapp,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onCopy?: () => void;
  onWhatsapp?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/5 bg-transparent px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/40" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-all text-sm text-white">{value}</p>
      </div>
      {onCopy && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-white/50 hover:text-white"
          onClick={onCopy}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      )}
      {onWhatsapp && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-white/50 hover:text-white"
          onClick={onWhatsapp}
        >
          <FaWhatsapp className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export function ClientDetailDialog({ client, open, onOpenChange, onAssignRole }: Props) {
  if (!client) return null;

  const initials = (client.name || client.email || '?').trim().charAt(0).toUpperCase();
  const isImported = client.provider === 'import';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl rounded-lg flex-col gap-4 overflow-hidden">
        <DialogHeader className="shrink-0 text-left">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0">
              {client.image ? (
                <Image src={client.image} alt="" fill className="object-cover select-none pointer-events-none rounded-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full text-lg font-bold text-white/70 border border-white/10 bg-white/5">
                  {initials}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{client.name || 'Sem nome'}</DialogTitle>
              <DialogDescription className="break-all">{client.email || 'Sem e-mail'}</DialogDescription>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge className="rounded px-2 py-1 text-xs font-medium bg-white/5 text-white/80">
                  {getClientTypeLabel(client)}
                </Badge>
                {isImported && (
                  <Badge className="rounded px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-500">
                    Importado
                  </Badge>
                )}
                {client.ordersCount > 0 && (
                  <Badge className="rounded px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500">
                    {client.ordersCount} compra(s)
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          <div className="space-y-4 pb-1">
            <section className="space-y-2">
              <h3 className="text-sm font-medium text-white">Informações financeiras</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Gastos" value={formatPrice(client.totalSpent)} className="text-emerald-500" />
                <StatCard label="Compras" value={client.ordersCount} />
                <StatCard label="Itens" value={client.totalItemsCount} />
                <StatCard label="Descontos" value={formatPrice(client.totalDiscounts)} />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-white">Informações de contato</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoRow
                  icon={Mail}
                  label="E-mail"
                  value={client.email || '—'}
                  onCopy={
                    client.email
                      ? () => {
                        void navigator.clipboard.writeText(client.email!);
                        toast.success('E-mail copiado!');
                      }
                      : undefined
                  }
                />
                <InfoRow icon={Fingerprint} label="CPF/CNPJ" value={formatDocument(client.document)} />
                <InfoRow
                  icon={Phone}
                  label="Celular"
                  value={formatPhone(client.phone)}
                  onWhatsapp={() => {
                    window.open(`https://wa.me/${client.phone}`, '_blank');
                  }}
                />
                <InfoRow icon={Clock} label="Último acesso" value={formatLastAccess(client.lastAccessAt)} />
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-white">Informações de cadastro</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <InfoRow
                  icon={Calendar}
                  label="Registrado em"
                  value={format(new Date(client.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                />
                <InfoRow icon={UserRound} label="ID" value={client.id} />
              </div>
            </section>
          </div>
        </div>

        <DialogFooter className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:gap-0">
          <Button asChild variant="outline" className="w-full sm:flex-1" size="lg">
            <Link href={`/dashboard/admin/orders?search=${encodeURIComponent(client.email || client.id)}`}>
              Ver pedidos
            </Link>
          </Button>

          {client.recentOrders?.[0] && (
            <Button asChild variant="default" className="w-full sm:flex-1" size="lg">
              <Link href={`/dashboard/admin/chats?q=${encodeURIComponent(client.email || client.name || '')}`}>
                Ver chats
              </Link>
            </Button>
          )}

          <Can I="roles:manage">
            <Button
              variant="outline"
              className="w-full sm:flex-1"
              size="lg"
              onClick={() => onAssignRole?.(client)}
            >
              Atribuir cargo
            </Button>
          </Can>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
