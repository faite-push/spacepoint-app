'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Search, ScanFace, MoreVertical, Shield, Copy, ShoppingBag, MessageSquare, UserMinus } from 'lucide-react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi, type AdminClient } from '@/lib/admin-api';
import { formatPrice } from '@/lib/shop-api';
import { cn, getCsrfToken } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Can } from '@/providers/PermissionProvider';
import { RolePickerDialog } from '@/components/admin/team/role-picker-dialog';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchRoles() {
  const res = await fetch(`${API_URL}/api/admin/roles`, { credentials: 'include' });
  if (!res.ok) throw new Error('Falha ao buscar cargos');
  const data = await res.json();
  return data.roles as Array<{ id: string; name: string; isProtected?: boolean }>;
}

async function assignRole({ userId, roleId }: { userId: string; roleId: string | null }) {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken(),
    },
    credentials: 'include',
    body: JSON.stringify({ roleId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Falha ao atribuir cargo');
  }
  return res.json();
}

function getClientTypeLabel(client: AdminClient) {
  if (client.role?.name) return client.role.name;
  if (client.isAdmin) return 'Admin';
  return 'Cliente';
}

function getClientTypeClass(client: AdminClient) {
  if (client.role?.name || client.isAdmin) return 'bg-violet-500/10 text-violet-400';
  return 'bg-orange-500/10 text-orange-500';
}

export default function AdminClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rolePickerClient, setRolePickerClient] = useState<AdminClient | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clients', search, page],
    queryFn: () => chatApi.listClients({ search: search || undefined, page }),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const assignRoleMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      toast.success('Cargo atualizado!');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleCopyEmail = (email: string | null) => {
    if (!email) return;
    void navigator.clipboard.writeText(email);
    toast.success('E-mail copiado!');
  };

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
        <p className="text-muted-foreground">Todos os usuários cadastrados na loja</p>
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
                <div key={client.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-6.5 w-6.5 flex items-center justify-center shrink-0">
                      <ScanFace className="h-full w-full text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{client.name || client.email || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.email || 'Sem email'}</p>
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center gap-16 xl:gap-24 shrink-0">
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-white">Compras</p>
                      <p className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-1 rounded">{client.ordersCount} compra(s)</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-white">Quantidade</p>
                      <p className="bg-blue-500/10 text-blue-500 text-xs px-2 py-1 rounded">{client.totalItemsCount} item(s)</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-white">Tipo</p>
                      <p className={cn('text-xs px-2 py-1 rounded', getClientTypeClass(client))}>{getClientTypeLabel(client)}</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-white">Descontos</p>
                      <p className="bg-[#c558e0]/10 text-[#c558e0] text-xs px-2 py-1 rounded">{formatPrice(client.totalDiscounts)}</p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium text-white">Gastos</p>
                      <p className="bg-[#c94444]/10 text-[#c94444] text-xs px-2 py-1 rounded">{formatPrice(client.totalSpent)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <div className="text-xs text-muted-foreground hidden md:block whitespace-nowrap">
                      Registrado em {format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" className="min-w-[200px] rounded-md">
                        <DropdownMenuItem asChild className="gap-2 cursor-pointer focus:bg-white/5 rounded-sm px-3 py-2">
                          <Link href={`/dashboard/admin/orders?search=${encodeURIComponent(client.email || client.id)}`}>
                            Ver pedidos
                          </Link>
                        </DropdownMenuItem>

                        {client.recentOrders?.[0] && (
                          <DropdownMenuItem asChild className="gap-2 cursor-pointer focus:bg-white/5 rounded-sm px-3 py-2">
                            <Link href={`/dashboard/admin/chats?q=${encodeURIComponent(client.email || client.name || '')}`}>
                              Ver chats
                            </Link>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          className="gap-2 cursor-pointer focus:bg-white/5 rounded-sm px-3 py-2"
                          onClick={() => handleCopyEmail(client.email)}
                          disabled={!client.email}
                        >
                          Copiar e-mail
                        </DropdownMenuItem>

                        <Can I="roles:manage">
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer focus:bg-white/5 rounded-sm px-3 py-2"
                            onClick={() => setRolePickerClient(client)}
                          >
                            Atribuir cargo
                          </DropdownMenuItem>
                          {client.roleId && (
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-400 rounded-sm px-3 py-2"
                              onClick={() => assignRoleMutation.mutate({ userId: client.id, roleId: null })}
                            >
                              Remover cargo
                            </DropdownMenuItem>
                          )}
                        </Can>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {!data?.clients.length && (
                <p className="p-8 text-center text-zinc-500">Nenhum usuário encontrado</p>
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

      <RolePickerDialog
        open={!!rolePickerClient}
        onOpenChange={(open) => !open && setRolePickerClient(null)}
        roles={roles ?? []}
        selectedRoleId={rolePickerClient?.roleId}
        onSelect={(roleId) => {
          if (rolePickerClient) {
            assignRoleMutation.mutate({ userId: rolePickerClient.id, roleId });
            setRolePickerClient(null);
          }
        }}
      />
    </div>
  );
}
