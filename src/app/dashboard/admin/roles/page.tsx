"use client";

import { useState, useEffect, useMemo, Suspense, type CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Shield, Loader2, Plus, X, ChevronLeft, ChevronDown, GripVertical, Lock, Users, KeyRound, FolderOpen, Check, } from "lucide-react";
import { TbGridDots } from "react-icons/tb";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { TeamNav } from "@/components/admin/layout/team-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { cn, getCsrfToken } from "@/lib/utils";
import { Can } from "@/providers/PermissionProvider";
import { UserPickerDialog } from "@/components/admin/team/user-picker-dialog";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";

interface Permission {
  key: string;
  name: string;
  category: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isProtected: boolean;
  sortOrder: number;
  userCount: number;
  permissions: Permission[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const FULL_ACCESS_KEY = "system:admin";

const CATEGORY_LABELS: Record<string, string> = {
  system: "System",
  analytics: "Dashboard",
  products: "Produtos",
  codes: "Códigos",
  orders: "Vendas",
  coupons: "Cupom",
  media: "Galeria",
  clients: "Clientes",
  reviews: "Avaliações",
  audit: "Registros de Auditoria",
  chats: "Space Chat",
  plugins: "Plugins",
  users: "Equipe",
  roles: "Cargos",
  gateways: "Gateways",
  pages: "Páginas do site",
  settings: "Configurações",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  system: "Configurações do sistema",
  analytics: "Dashboard e relatórios",
  products: "Gerenciamento de produtos, variantes e estoque",
  codes: "Códigos digitais e inventário",
  orders: "Pedidos, vendas e reembolsos",
  coupons: "Cupons de desconto",
  media: "Galeria de mídia",
  clients: "Lista de clientes da loja",
  reviews: "Moderação de avaliações",
  audit: "Histórico de ações administrativas",
  chats: "Atendimento via Space Chat",
  plugins: "Integrações e plugins",
  users: "Equipe e membros",
  roles: "Cargos e permissões",
  gateways: "Gateways de pagamento",
  pages: "Páginas e aparência do site",
  settings: "Configurações gerais",
};

const CATEGORY_MASTER: Record<string, { title: string; description: string }> = {
  system: {
    title: "Administrator",
    description: "Acesso total ao sistema com todas as permissões",
  },
  analytics: {
    title: "Manage Dashboard",
    description: "Gerenciar dashboard com acesso total às funcionalidades",
  },
  products: {
    title: "Manage Products",
    description: "Gerenciar produtos com acesso total às funcionalidades",
  },
  codes: {
    title: "Manage Codes",
    description: "Gerenciar códigos digitais com acesso total às funcionalidades",
  },
  orders: {
    title: "Manage Orders",
    description: "Gerenciar pedidos com acesso total às funcionalidades",
  },
  coupons: {
    title: "Manage Coupons",
    description: "Gerenciar cupons com acesso total às funcionalidades",
  },
  media: {
    title: "Manage Gallery",
    description: "Gerenciar galeria com acesso total às funcionalidades",
  },
  clients: {
    title: "View Clients",
    description: "Visualizar lista de clientes da loja",
  },
  reviews: {
    title: "Manage Reviews",
    description: "Moderar avaliações com acesso total às funcionalidades",
  },
  audit: {
    title: "View Audit Logs",
    description: "Visualizar registros de auditoria do sistema",
  },
  chats: {
    title: "Manage Space Chat",
    description: "Gerenciar atendimento com acesso total às funcionalidades",
  },
  plugins: {
    title: "Manage Plugins",
    description: "Gerenciar plugins e integrações",
  },
  users: {
    title: "Manage Team",
    description: "Gerenciar equipe com acesso total às funcionalidades",
  },
  roles: {
    title: "Manage Roles",
    description: "Gerenciar cargos e permissões com acesso total",
  },
  gateways: {
    title: "Manage Gateways",
    description: "Gerenciar gateways de pagamento",
  },
  pages: {
    title: "Manage Pages",
    description: "Gerenciar páginas e aparência do site",
  },
  settings: {
    title: "Manage Settings",
    description: "Gerenciar configurações gerais da loja",
  },
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "system:admin": "Acesso total ao sistema com todas as permissões",
  "analytics:view": "Acessar métricas e relatórios",
  "products:view": "Visualizar lista de produtos e detalhes",
  "products:create": "Criar produtos, categorias e variantes",
  "products:edit": "Editar produtos, categorias e variantes",
  "products:delete": "Excluir produtos, categorias e variantes",
  "codes:view": "Visualizar códigos e inventário",
  "codes:upload": "Fazer upload de códigos digitais",
  "codes:delete": "Excluir códigos do inventário",
  "orders:view": "Visualizar pedidos e detalhes",
  "orders:manage": "Alterar status e gerenciar pedidos",
  "orders:refund": "Processar reembolsos",
  "coupons:view": "Visualizar cupons",
  "coupons:manage": "Criar, editar e excluir cupons",
  "media:view": "Visualizar galeria de mídia",
  "media:manage": "Enviar e gerenciar arquivos",
  "clients:view": "Visualizar lista de clientes",
  "reviews:view": "Visualizar avaliações",
  "reviews:manage": "Moderar e publicar avaliações",
  "audit:view": "Visualizar registros de auditoria",
  "chats:view": "Visualizar conversas do Space Chat",
  "chats:manage": "Responder e gerenciar chats",
  "plugins:manage": "Instalar e configurar plugins",
  "users:view": "Visualizar membros da equipe",
  "users:edit": "Editar usuários da equipe",
  "users:ban": "Banir ou desbanir usuários",
  "roles:view": "Visualizar cargos",
  "roles:manage": "Criar, editar e atribuir cargos",
  "gateways:manage": "Configurar gateways de pagamento",
  "pages:manage": "Editar páginas, aparência e configurações do site",
  "settings:manage": "Gerenciar configurações gerais da loja",
};

async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`${API_URL}/api/admin/roles`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao buscar cargos");
  const data = await res.json();
  return data.roles;
}

async function fetchPermissions() {
  const res = await fetch(`${API_URL}/api/admin/permissions`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao buscar permissões");
  return res.json();
}

async function fetchUsers() {
  const res = await fetch(`${API_URL}/v2/api/admin/users`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao buscar usuários");
  const data = await res.json();
  return data.users;
}

async function createRole(payload: { name: string; description: string; permissionKeys: string[] }) {
  const res = await fetch(`${API_URL}/api/admin/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Falha ao criar cargo");
  }
  return res.json();
}

async function updateRole(id: string, payload: { name: string; description: string; permissionKeys: string[] }) {
  const res = await fetch(`${API_URL}/api/admin/roles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Falha ao atualizar cargo");
  }
  return res.json();
}

async function deleteRole(id: string) {
  const res = await fetch(`${API_URL}/api/admin/roles/${id}`, {
    method: "DELETE",
    headers: { "X-CSRF-Token": getCsrfToken() },
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Falha ao excluir cargo");
  }
  return res.json();
}

async function reorderRoles(roles: { id: string; sortOrder: number }[]) {
  const res = await fetch(`${API_URL}/api/admin/roles/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) throw new Error("Falha ao reordenar");
  return res.json();
}

async function assignRole({ userId, roleId }: { userId: string; roleId: string | null }) {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": getCsrfToken() },
    credentials: "include",
    body: JSON.stringify({ roleId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Falha ao atribuir cargo");
  }
  return res.json();
}

function PermissionToggle({ title, description, checked, disabled, onToggle, }: { title: string; description?: string; checked: boolean; disabled?: boolean; onToggle: (next: boolean) => void; }) {
  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-sm border border-white/5 bg-white/[0.02] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{title}</p>
        {description && <p className="text-xs text-zinc-500">{description}</p>}
      </div>
      <Toggle
        pressed={checked}
        onPressedChange={onToggle}
        disabled={disabled}
        size="sm"
        className="h-8 w-8 shrink-0 p-0 data-[state=on]:bg-primary data-[state=on]:text-black"
        aria-label={title}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </Toggle>
    </div>
  );
}

function isCategoryFullyEnabled(keys: string[], selectedKeys: string[]) {
  return keys.length > 0 && keys.every((k) => selectedKeys.includes(k));
}

function toggleCategoryKeys(
  keys: string[],
  selectedKeys: string[],
  enable: boolean
): string[] {
  if (enable) {
    return [...new Set([...selectedKeys, ...keys])];
  }
  return selectedKeys.filter((k) => !keys.includes(k));
}

function RolesDraggableList({ droppableId, roles, dragEnabled, selectedId, onDragEnd, onSelect, onDelete, variant = "list", }: { droppableId: string; roles: Role[]; dragEnabled: boolean; selectedId?: string | null; onDragEnd: (result: DropResult) => void; onSelect: (id: string) => void; onDelete?: (role: Role) => void; variant?: "list" | "sidebar"; }) {
  const isSidebar = variant === "sidebar";

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={droppableId} isDropDisabled={!dragEnabled}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              isSidebar ? "flex-1 space-y-0.5 overflow-y-auto px-2 pb-2" : "space-y-1"
            )}
          >
            {roles.map((role, index) => (
              <Draggable
                key={role.id}
                draggableId={role.id}
                index={index}
                isDragDisabled={!dragEnabled || role.isProtected}
              >
                {(dragProvided, snapshot) => {
                  const { style, ...draggableProps } = dragProvided.draggableProps;
                  return (
                    <div
                      ref={dragProvided.innerRef}
                      {...draggableProps}
                      style={style as CSSProperties}
                      className={cn("group flex items-center gap-3 transition-colors cursor-pointer select-none",
                        isSidebar ? "rounded-md px-2 py-2.5" : "rounded-md border border-white/5 bg-card px-3 py-3",
                        selectedId === role.id ? "bg-white/10" : "hover:bg-white/2 cursor-pointer",
                        snapshot.isDragging && "opacity-70 shadow-lg ring-1 ring-white/50",
                        !dragEnabled && !role.isProtected && "opacity-80 cursor-not-allowed"
                      )}
                    >
                      {role.isProtected ? (
                        <Lock className={cn("shrink-0 text-zinc-500", isSidebar ? "h-4 w-4" : "h-4 w-4")} />
                      ) : (
                        <div
                          {...(dragEnabled ? dragProvided.dragHandleProps : {})}
                          className={cn(
                            "shrink-0 text-zinc-600",
                            dragEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed opacity-40"
                          )}
                        >
                          {isSidebar ? (
                            <TbGridDots className="h-4 w-4" />
                          ) : (
                            <GripVertical className="h-4 w-4" />
                          )}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelect(role.id)}
                        className="flex min-w-0 cursor-pointer flex-1 items-center gap-2 text-left"
                      >
                        <Shield className={cn("shrink-0 text-zinc-500", isSidebar ? "h-3.5 w-3.5" : "h-4 w-4")} />
                        <span className={cn("truncate text-white", isSidebar ? "text-sm" : "text-sm")}>
                          {role.name}
                        </span>
                      </button>
                      {!role.isProtected && role.userCount === 0 && onDelete && (
                        <Can I="roles:manage">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(role);
                            }}
                            className={cn(
                              "shrink-0 text-zinc-500 hover:text-red-400",
                              isSidebar ? "rounded p-1 text-zinc-600 opacity-0 group-hover:opacity-100" : "p-1"
                            )}
                          >
                            <X className={isSidebar ? "h-3.5 w-3.5" : "h-4 w-4"} />
                          </Button>
                        </Can>
                      )}
                    </div>
                  );
                }}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

function RolesSidebar({ roles, selectedId, search, onSearchChange, onSelect, onCreate, onDelete, onDragEnd, }: { roles: Role[]; selectedId: string | null; search: string; onSearchChange: (v: string) => void; onSelect: (id: string) => void; onCreate: () => void; onDelete: (role: Role) => void; onDragEnd: (result: DropResult, displayRoles: Role[]) => void; }) {
  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );
  const dragEnabled = !search.trim();

  return (
    <div className="hidden md:flex h-[500px] max-h-[500px] flex-col rounded-md border border-white/5 bg-card">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-sm font-semibold text-muted-foreground">Cargos</span>
        <Can I="roles:manage">
          <button
            type="button"
            onClick={onCreate}
            className="rounded-md p-1 text-zinc-400 hover:bg-white/5 hover:text-white"
          >
            <Plus className="h-4 w-4" />
          </button>
        </Can>
      </div>
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Pesquisar"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        {!dragEnabled && (
          <p className="mt-2 text-[10px] text-zinc-500">Limpe a pesquisa para reordenar.</p>
        )}
      </div>
      <RolesDraggableList
        droppableId="roles-sidebar"
        roles={filtered}
        dragEnabled={dragEnabled}
        selectedId={selectedId}
        onDragEnd={(result) => onDragEnd(result, filtered)}
        onSelect={onSelect}
        onDelete={onDelete}
        variant="sidebar"
      />
    </div>
  );
}

function RolesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedRoleId = searchParams.get("role");
  const queryClient = useQueryClient();

  const [sidebarSearch, setSidebarSearch] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"cargo" | "permissoes" | "usuarios">("cargo");
  const [permSearch, setPermSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [addUserOpen, setAddUserOpen] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
  });

  const { data: allUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
    enabled: activeTab === "usuarios" && !!selectedRoleId,
  });

  const selectedRole = roles?.find((r) => r.id === selectedRoleId);

  useEffect(() => {
    if (selectedRoleId === "new") {
      setIsCreating(true);
    }
  }, [selectedRoleId]);

  useEffect(() => {
    if (selectedRole) {
      setName(selectedRole.name);
      setDescription(selectedRole.description || "");
      setSelectedKeys(selectedRole.permissions.map((p) => p.key));
      setIsCreating(false);
    } else if (isCreating) {
      setName("");
      setDescription("");
      setSelectedKeys([]);
    }
  }, [selectedRole, isCreating]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name, description, permissionKeys: selectedKeys };
      if (isCreating || selectedRoleId === "new") {
        return createRole(payload);
      }
      return updateRole(selectedRoleId!, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Cargo salvo!");
      if (isCreating && data?.role?.id) {
        setIsCreating(false);
        router.push(`/dashboard/admin/roles?role=${data.role.id}`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Cargo excluído");
      setDeleteConfirm(null);
      router.push("/dashboard/admin/roles");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderRoles,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Usuário atribuído ao cargo");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDragEnd = (result: DropResult, displayRoles: Role[]) => {
    if (!result.destination || !roles) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(displayRoles);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    queryClient.setQueryData(
      ["roles"],
      items.map((r, i) => ({ ...r, sortOrder: i }))
    );
    reorderMutation.mutate(items.map((r, i) => ({ id: r.id, sortOrder: i })));
  };

  const listDragEnabled = !listSearch.trim();

  const grouped = (permissionsData?.grouped ?? {}) as Record<string, Permission[]>;
  const filteredGrouped = useMemo((): Record<string, Permission[]> => {
    if (!permSearch.trim()) return grouped;
    const q = permSearch.toLowerCase();
    const result: Record<string, Permission[]> = {};
    for (const [cat, perms] of Object.entries(grouped) as [string, Permission[]][]) {
      const filtered = perms.filter(
        (p) => p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
      );
      if (filtered.length) result[cat] = filtered;
    }
    return result;
  }, [grouped, permSearch]);

  const roleUsers = allUsers?.filter((u: { roleId?: string | null }) => u.roleId === selectedRoleId) ?? []
  const availableUsers = allUsers?.filter((u: { roleId?: string | null; name?: string | null; email: string }) => u.roleId !== selectedRoleId && (u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))) ?? [];
  const listFilteredRoles = roles?.filter((r) => r.name.toLowerCase().includes(listSearch.toLowerCase())) ?? [];

  const isEditing = !!selectedRoleId;
  const isProtected = selectedRole?.isProtected;
  const hasFullAccess = selectedKeys.includes(FULL_ACCESS_KEY);

  const togglePermission = (key: string, enabled: boolean) => {
    if (isProtected) return;
    if (hasFullAccess && key !== FULL_ACCESS_KEY) return;
    setSelectedKeys((prev) =>
      enabled ? [...new Set([...prev, key])] : prev.filter((k) => k !== key)
    );
  };

  const toggleMasterCategory = (perms: Permission[]) => {
    if (isProtected) return;
    const keys = perms.map((p) => p.key);
    const isSystemCategory = keys.includes(FULL_ACCESS_KEY);
    if (hasFullAccess && !isSystemCategory) return;
    const allEnabled = isCategoryFullyEnabled(keys, selectedKeys);
    setSelectedKeys((prev) => toggleCategoryKeys(keys, prev, !allEnabled));
  };

  const toggleCategoryExpanded = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !(prev[cat] ?? false) }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="relative space-y-6">
        <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute top-[85%] left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Cargos</h1>
          <p className="text-muted-foreground">Defina as permissões e hierarquia da equipe.</p>
        </div>

        <TeamNav />

        <div className="flex flex-row gap-4">
          <Can I="roles:manage">
            <Button
              variant="default"
              onClick={() => {
                setIsCreating(true);
                router.push("/dashboard/admin/roles?role=new");
              }}
              className="h-10 px-6"
            >
              Criar cargo
            </Button>
          </Can>

          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Pesquisar"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>

        {!listDragEnabled && (
          <p className="text-xs text-zinc-500">Limpe a pesquisa para reordenar os cargos.</p>
        )}

        <RolesDraggableList
          droppableId="roles-list"
          roles={listFilteredRoles}
          dragEnabled={listDragEnabled}
          onDragEnd={(result) => handleDragEnd(result, listFilteredRoles)}
          onSelect={(id) => router.push(`/dashboard/admin/roles?role=${id}`)}
          onDelete={setDeleteConfirm}
          variant="list"
        />

        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="border-white/10 bg-[#111111] text-white">
            <DialogHeader>
              <DialogTitle>Excluir cargo</DialogTitle>
              <DialogDescription className="text-zinc-400">
                Excluir o cargo <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Cargos</h1>
        <p className="text-sm text-zinc-500">Gerencie os cargos dos usuários</p>
      </div>

      <div className="flex flex-row gap-6">
        <TeamNav />

        <Can I="roles:manage">
          <Button
            size="lg"
            className={cn("px-5 md:hidden flex", saveMutation.isPending && "opacity-50 cursor-not-allowed")}
            onClick={() => saveMutation.mutate()}
            disabled={!name.trim() || isProtected || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </Can>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => {
            setIsCreating(false);
            router.push("/dashboard/admin/roles");
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center bg-card rounded-md px-3 py-1 flex gap-6">
          {[
            { id: "cargo" as const, label: "Cargo", icon: FolderOpen },
            { id: "permissoes" as const, label: "Permissões", icon: KeyRound },
            { id: "usuarios" as const, label: "Usuários", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative cursor-pointer flex items-center px-4 py-1 rounded-sm gap-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-black" : "text-muted-foreground hover:text-white"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <Can I="roles:manage">
          <Button
            size="lg"
            className={cn("px-5 md:flex hidden", saveMutation.isPending && "opacity-50 cursor-not-allowed")}
            onClick={() => saveMutation.mutate()}
            disabled={!name.trim() || isProtected || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </Can>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="w-full lg:w-96 lg:shrink-0 lg:order-2">
          <RolesSidebar
            roles={roles ?? []}
            selectedId={selectedRoleId === "new" ? null : selectedRoleId}
            search={sidebarSearch}
            onSearchChange={setSidebarSearch}
            onSelect={(id) => router.push(`/dashboard/admin/roles?role=${id}`)}
            onCreate={() => {
              setIsCreating(true);
              router.push("/dashboard/admin/roles?role=new");
            }}
            onDelete={setDeleteConfirm}
            onDragEnd={handleDragEnd}
          />
        </div>

        <div className="flex flex-col bg-card border border-white/5 p-4 rounded-md">
          {activeTab === "cargo" && (
            <div className="flex flex-col space-y-4 max-w-full">
              <div className="space-y-2">
                <Label>Nome do cargo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isProtected}
                  placeholder="Nome do cargo"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isProtected}
                  placeholder="Descreva as responsabilidades deste cargo..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === "permissoes" && (
            <div className="space-y-4">
              <div className="relative max-w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Pesquisar permissão"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="space-y-6">
                {Object.entries(filteredGrouped).map(([category, perms]) => {
                  const expanded = expandedCategories[category] ?? false;
                  const categoryKeys = perms.map((p) => p.key);
                  const master = CATEGORY_MASTER[category] ?? {
                    title: perms[0]?.name ?? category,
                    description: CATEGORY_DESCRIPTIONS[category] ?? "",
                  };
                  const isSystemCategory = category === "system";
                  const lockedByAdmin = hasFullAccess && !isSystemCategory;
                  const masterChecked =
                    lockedByAdmin || isCategoryFullyEnabled(categoryKeys, selectedKeys);
                  const hasAdvanced = perms.length > 1;

                  return (
                    <div key={category} className="space-y-3">
                      <div className="space-y-2 rounded-md border border-white/5 bg-black/20 p-4">
                        <div>
                          <h3 className="text-sm font-medium text-white">
                            {CATEGORY_LABELS[category] || category}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {CATEGORY_DESCRIPTIONS[category] || ""}
                          </p>
                        </div>

                        <Separator className="bg-white/5" />

                        <PermissionToggle
                          title={master.title}
                          description={master.description}
                          checked={masterChecked}
                          disabled={isProtected || lockedByAdmin}
                          onToggle={() => toggleMasterCategory(perms)}
                        />

                        {hasAdvanced && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpanded(category)}
                              className="flex w-full items-center justify-between rounded-sm border border-white/5 bg-transparent px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.02] hover:text-zinc-300"
                            >
                              Permissões avançadas
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 shrink-0 transition-transform duration-200",
                                  expanded && "rotate-180"
                                )}
                              />
                            </button>
                            {expanded && (
                              <div className="space-y-2">
                                {perms.map((perm) => (
                                  <PermissionToggle
                                    key={perm.key}
                                    title={perm.name}
                                    description={PERMISSION_DESCRIPTIONS[perm.key]}
                                    checked={lockedByAdmin || selectedKeys.includes(perm.key)}
                                    disabled={isProtected || lockedByAdmin}
                                    onToggle={(enabled) => togglePermission(perm.key, enabled)}
                                  />
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "usuarios" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    placeholder="Pesquisar usuário"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="h-10 border-white/10 bg-white/[0.03] pl-9"
                  />
                </div>
                <Can I="roles:manage">
                  <Button
                    className="bg-white text-black hover:bg-white/90 shrink-0"
                    onClick={() => setAddUserOpen(true)}
                    disabled={selectedRoleId === "new"}
                  >
                    Adicionar
                  </Button>
                </Can>
              </div>
              {roleUsers.length === 0 ? (
                <p className="py-8 text-sm text-zinc-500">Nenhum usuário encontrado</p>
              ) : (
                <div className="space-y-2">
                  {roleUsers.map((u: { id: string; name?: string | null; email: string }) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between rounded-lg border border-white/5 bg-[#111111] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
                          {(u.name || u.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name || u.email}</p>
                          <p className="text-xs text-zinc-500">{u.email}</p>
                        </div>
                      </div>
                      <Can I="roles:manage">
                        <button
                          type="button"
                          onClick={() =>
                            assignMutation.mutate({ userId: u.id, roleId: null })
                          }
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Can>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <UserPickerDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        users={availableUsers}
        title="Adicionar usuário ao cargo"
        onSelect={(userId) => {
          if (selectedRoleId && selectedRoleId !== "new") {
            assignMutation.mutate({ userId, roleId: selectedRoleId });
          }
        }}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="border-white/10 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>Excluir cargo</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Excluir o cargo <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <RolesPageContent />
    </Suspense>
  );
}