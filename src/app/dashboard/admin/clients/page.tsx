'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, UserRound, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/lib/admin-api';
import { formatPrice } from '@/lib/shop-api';

export default function AdminClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clients', search, page],
    queryFn: () => chatApi.listClients({ search: search || undefined, page }),
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-sm text-muted-foreground">Compradores e histórico de pedidos</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input
          placeholder="Buscar por nome ou email..."
          className="pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="rounded-md border border-white/5 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-220px)]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data?.clients.map((client) => (
                <div key={client.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02]">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    {client.image ? (
                      <img src={client.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <UserRound className="h-5 w-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{client.name || 'Sem nome'}</p>
                    <p className="text-xs text-zinc-500 truncate">{client.email || 'Sem email'}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-emerald-400">{formatPrice(client.totalSpent)}</p>
                    <p className="text-xs text-zinc-500">{client.ordersCount} pedido(s)</p>
                  </div>
                  <div className="text-xs text-zinc-600 hidden md:block">
                    Desde {format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={`/dashboard/admin/orders?search=${encodeURIComponent(client.email || client.id)}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
              {!data?.clients.length && (
                <p className="p-8 text-center text-zinc-500">Nenhum cliente encontrado</p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-zinc-400 self-center">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}
    </div>
  );
}
