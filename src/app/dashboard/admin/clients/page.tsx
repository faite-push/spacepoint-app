'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Search, ExternalLink, ScanFace } from 'lucide-react';
import { TbGridScan } from "react-icons/tb";

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/lib/admin-api';
import { formatPrice } from '@/lib/shop-api';
import { Separator } from '@/components/ui/separator';

export default function AdminClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clients', search, page],
    queryFn: () => chatApi.listClients({ search: search || undefined, page }),
  });

  return (
    <div className="relative flex flex-col gap-3 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div>
        <h1 className="text-2xl font-bold text-white">Clientes</h1>
        <p className="text-muted-foreground">Compradores e histórico de pedidos</p>
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
        <ScrollArea className="max-h-[720px] h-[calc(100vh-220px)]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data?.clients.map((client) => (
                <div key={client.id} className="p-4 cursor-pointer flex items-center justify-between hover:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="h-6.5 w-6.5 flex items-center justify-center">
                      <ScanFace className="h-full w-full text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{client.email || 'Sem email'}</p>
                      <p className="text-xs text-muted-foreground">ID: {client.id || 'Sem email'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-32">
                    <div className="flex items-center justify-center hidden sm:block">
                      <p className="text-center text-sm font-medium text-white">Compras</p>
                      <p className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded">{client.ordersCount} compra(s)</p>
                    </div>

                    <div className="flex items-center justify-center hidden sm:block">
                      <p className="text-center text-sm font-medium text-white">Quantidade</p>
                      <p className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded">{client.totalItemsCount} item(s)</p>
                    </div>
                  
                    <div className="flex items-center justify-center hidden sm:block">
                      <p className="text-center text-sm font-medium text-white">Tipo</p>
                      <p className="bg-orange-500/10 text-orange-500 text-xs px-2 py-1 rounded">Cliente</p>
                    </div>

                    <div className="flex items-center justify-center hidden sm:block">
                      <p className="text-center text-sm font-medium text-white">Descontos</p>
                      <p className="bg-[#c558e0]/10 text-[#c558e0] text-xs px-2 py-1 rounded">{formatPrice(client.totalDiscounts)}</p>
                    </div>

                    <div className="flex items-center justify-center hidden sm:block">
                      <p className="text-center text-sm font-medium text-white">Gastos</p>
                      <p className="bg-[#c94444]/10 text-[#c94444] text-xs px-2 py-1 rounded">{formatPrice(client.totalSpent)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0">
                    <div className="text-xs text-muted-foreground hidden md:block">
                      Registrado em {format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>
                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                      <Link href={`/dashboard/admin/orders?search=${encodeURIComponent(client.email || client.id)}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
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
