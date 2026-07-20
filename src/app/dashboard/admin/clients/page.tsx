'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Search, ScanFace, MoreVertical, Clock, Upload, ChevronRight, SlidersHorizontal } from 'lucide-react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { chatApi, type AdminClient, type ClientListFilters, type ClientListSort, } from '@/lib/admin-api';
import { formatPrice } from '@/lib/shop-api';
import { formatLastAccess } from '@/lib/client-format';
import { cn, getCsrfToken } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { Can } from '@/providers/PermissionProvider';
import { RolePickerDialog } from '@/components/admin/team/role-picker-dialog';
import { ClientImportDialog } from '@/components/admin/clients/client-import-dialog';
import { ClientDetailDialog } from '@/components/admin/clients/client-detail-dialog';

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

const SORT_OPTIONS: { value: ClientListSort; label: string }[] = [
  { value: 'spent_desc', label: 'Maior gasto' },
  { value: 'spent_asc', label: 'Menor gasto' },
  { value: 'orders_desc', label: 'Mais compras' },
  { value: 'last_access_desc', label: 'Acesso recente' },
  { value: 'created_desc', label: 'Cadastro recente' },
  { value: 'name_asc', label: 'Nome A–Z' },
];

export default function AdminClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ClientListSort>('created_desc');
  const [purchases, setPurchases] = useState<ClientListFilters['purchases']>('all');
  const [access, setAccess] = useState<ClientListFilters['access']>('all');
  const [roleType, setRoleType] = useState<ClientListFilters['roleType']>('all');
  const [selectedClient, setSelectedClient] = useState<AdminClient | null>(null);
  const [rolePickerClient, setRolePickerClient] = useState<AdminClient | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const filters: ClientListFilters = { search: search || undefined, page, sort, purchases, access, roleType };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clients', filters],
    queryFn: () => chatApi.listClients(filters),
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

  const resetPage = () => setPage(1);

  return (
    <div className="relative flex flex-col gap-3 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-muted-foreground">
            {data ? `${data.total} usuário(s) cadastrado(s)` : 'Todos os usuários cadastrados na loja'}
          </p>
        </div>
        <Can I="clients:view">
          <Button variant="outline" size="lg" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar planilha
          </Button>
        </Can>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center w-full">
        <div className="relative w-full flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, CPF ou celular..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
          <Select value={sort} onValueChange={(v) => { setSort(v as ClientListSort); resetPage(); }}>
            <SelectTrigger className="w-full sm:min-w-[150px] sm:w-[170px]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={purchases || 'all'} onValueChange={(v) => { setPurchases(v as ClientListFilters['purchases']); resetPage(); }}>
            <SelectTrigger className="w-full sm:min-w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Compras" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas compras</SelectItem>
              <SelectItem value="with">Com compras</SelectItem>
              <SelectItem value="without">Sem compras</SelectItem>
            </SelectContent>
          </Select>

          <Select value={access || 'all'} onValueChange={(v) => { setAccess(v as ClientListFilters['access']); resetPage(); }}>
            <SelectTrigger className="w-full sm:min-w-[140px] sm:w-[160px]">
              <SelectValue placeholder="Acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo acesso</SelectItem>
              <SelectItem value="recent">Ativos (7 dias)</SelectItem>
              <SelectItem value="never">Nunca acessou</SelectItem>
            </SelectContent>
          </Select>

          <Select value={roleType || 'all'} onValueChange={(v) => { setRoleType(v as ClientListFilters['roleType']); resetPage(); }}>
            <SelectTrigger className="w-full sm:min-w-[130px] sm:w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="customer">Clientes</SelectItem>
              <SelectItem value="team">Equipe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border border-white/5 overflow-hidden select-none">
        <ScrollArea className="max-h-[720px] h-[calc(100vh-280px)]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data?.clients.map((client) => (
                <div
                  key={client.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedClient(client)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedClient(client);
                  }}
                  className="group flex cursor-pointer items-center gap-2 p-4 transition-colors hover:bg-white/[0.03]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                    <ScanFace className="h-7 w-7 text-white/70" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        {client.name || client.email || 'Sem nome'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">{client.email || 'Sem email'}</p>
                  </div>

                  <div className="flex-1 hidden shrink-0 text-center sm:block">
                    <span className={cn('rounded px-2 py-1 text-xs font-medium', getClientTypeClass(client))}>
                      {getClientTypeLabel(client)}
                    </span>
                  </div>

                  <div className="flex-1 hidden shrink-0 text-center sm:block">
                    <p className="w-fit rounded px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-500 mx-auto">{formatPrice(client.totalSpent)}</p>
                    <p className="text-xs text-white/45">{client.ordersCount} compra(s)</p>
                  </div>

                  <div className="flex items-center justify-center gap-2 w-fit rounded px-2 py-1 text-xs font-medium bg-white/10 text-white mx-auto">
                    <Clock className="h-3.5 w-3.5 hidden sm:block" />
                    {formatLastAccess(client.lastAccessAt)}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity hover:bg-white/5 hover:text-white group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[200px] rounded-md">
                      <DropdownMenuItem
                        className="cursor-pointer py-2 px-3"
                        onClick={(e) => { e.stopPropagation(); setSelectedClient(client); }}
                      >
                        Ver detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer py-2 px-3">
                        <Link href={`/dashboard/admin/orders?search=${encodeURIComponent(client.email || client.id)}`}>
                          Ver pedidos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer py-2 px-3"
                        onClick={(e) => { e.stopPropagation(); handleCopyEmail(client.email); }}
                        disabled={!client.email}
                      >
                        Copiar e-mail
                      </DropdownMenuItem>
                      <Can I="roles:manage">
                        <DropdownMenuSeparator className="bg-white/5" />
                        <DropdownMenuItem
                          className="cursor-pointer py-2 px-3"
                          onClick={(e) => { e.stopPropagation(); setRolePickerClient(client); }}
                        >
                          Atribuir cargo
                        </DropdownMenuItem>
                      </Can>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
        <div className="flex items-center justify-center gap-4 md:gap-26">
          <Button variant="outline" size="lg" className="flex-1" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-zinc-400 self-center">Mostrando {page} de {data.totalPages} páginas</span>
          <Button variant="outline" size="lg" className="flex-1" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}

      <ClientDetailDialog
        client={selectedClient}
        open={!!selectedClient}
        onOpenChange={(open) => !open && setSelectedClient(null)}
        onAssignRole={(c) => { setSelectedClient(null); setRolePickerClient(c); }}
        onRemoveRole={(c) => assignRoleMutation.mutate({ userId: c.id, roleId: null })}
      />

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

      <ClientImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] })}
      />
    </div>
  );
}
