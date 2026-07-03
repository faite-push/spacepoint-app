"use client";

import { useState, useEffect, useMemo, Suspense, type CSSProperties } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Shield,
  Loader2,
  Plus,
  X,
  ChevronLeft,
  GripVertical,
  Lock,
  Users,
  KeyRound,
  FolderOpen,
  Check,
} from "lucide-react";
import { TbGridDots } from "react-icons/tb";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { TeamNav } from "@/components/admin/layout/team-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, getCsrfToken } from "@/lib/utils";
import { Can } from "@/providers/PermissionProvider";

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

const CATEGORY_LABELS: Record<string, string> = {
  products: "Produtos",
  codes: "Códigos",
  orders: "Pedidos",
  coupons: "Cupons",
  chats: "Space Chat",
  clients: "Clientes",
  reviews: "Avaliações",
  media: "Galeria",
  users: "Usuários",
  roles: "Cargos",
  pages: "Páginas do site",
  gateways: "Gateways",
  plugins: "Plugins",
  settings: "Configurações",
  analytics: "Analytics",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  products: "Gerenciamento de produtos, variantes e estoque",
  codes: "Códigos digitais e inventário",
  orders: "Pedidos, vendas e reembolsos",
  coupons: "Cupons de desconto",
  chats: "Atendimento via Space Chat",
  clients: "Lista de clientes da loja",
  reviews: "Moderação de avaliações",
  media: "Galeria de mídia",
  users: "Equipe e membros",
  roles: "Cargos e permissões",
  pages: "Páginas e aparência do site",
  gateways: "Gateways de pagamento",
  plugins: "Integrações e plugins",
  settings: "Configurações gerais",
  analytics: "Dashboard e relatórios",
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

function PermissionToggle({
  perm,
  checked,
  disabled,
  onToggle,
}: {
  perm: Permission;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:bg-white/[0.04] disabled:opacity-50"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{perm.name}</p>
        <p className="text-xs text-zinc-500">{perm.key}</p>
      </div>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded border",
          checked
            ? "border-[#fcb64c] bg-[#fcb64c] text-black"
            : "border-white/15 bg-transparent text-zinc-500"
        )}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}

function RolesSidebar({
  roles,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onCreate,
  onDelete,
  onDragEnd,
}: {
  roles: Role[];
  selectedId: string | null;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (role: Role) => void;
  onDragEnd: (result: DropResult) => void;
}) {
  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/5 bg-[#111111]">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
        <span className="text-xs font-semibold tracking-wider text-zinc-500">CARGOS</span>
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
            className="h-8 border-white/10 bg-black/30 pl-8 text-sm"
          />
        </div>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="roles-sidebar">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2"
            >
              {filtered.map((role, index) => (
                <Draggable
                  key={role.id}
                  draggableId={role.id}
                  index={index}
                  isDragDisabled={role.isProtected}
                >
                  {(dragProvided, snapshot) => {
                    const { style, ...draggableProps } = dragProvided.draggableProps;
                    return (
                    <div
                      ref={dragProvided.innerRef}
                      {...draggableProps}
                      style={style as CSSProperties}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-2 py-2.5 transition-colors",
                        selectedId === role.id
                          ? "bg-white/10"
                          : "hover:bg-white/[0.04]",
                        snapshot.isDragging && "opacity-70"
                      )}
                    >
                      {role.isProtected ? (
                        <Lock className="h-4 w-4 shrink-0 text-zinc-500" />
                      ) : (
                        <div
                          {...dragProvided.dragHandleProps}
                          className="cursor-grab text-zinc-600 active:cursor-grabbing"
                        >
                          <TbGridDots className="h-4 w-4" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => onSelect(role.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <Shield className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                        <span className="truncate text-sm text-white">{role.name}</span>
                      </button>
                      {!role.isProtected && role.userCount === 0 && (
                        <Can I="roles:manage">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(role);
                            }}
                            className="rounded p-1 text-zinc-600 opacity-0 hover:text-red-400 group-hover:opacity-100"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !roles) return;
    const items = Array.from(roles);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    queryClient.setQueryData(
      ["roles"],
      items.map((r, i) => ({ ...r, sortOrder: i }))
    );
    reorderMutation.mutate(items.map((r, i) => ({ id: r.id, sortOrder: i })));
  };

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

  const roleUsers =
    allUsers?.filter((u: { roleId?: string | null }) => u.roleId === selectedRoleId) ?? [];

  const availableUsers =
    allUsers?.filter(
      (u: { roleId?: string | null; name?: string | null; email: string }) =>
        u.roleId !== selectedRoleId &&
        (u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase()))
    ) ?? [];

  const listFilteredRoles =
    roles?.filter((r) => r.name.toLowerCase().includes(listSearch.toLowerCase())) ?? [];

  const isEditing = !!selectedRoleId;
  const isProtected = selectedRole?.isProtected;

  const togglePermission = (key: string) => {
    if (isProtected) return;
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#fcb64c]" />
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Cargos</h1>
          <p className="text-sm text-zinc-500">Gerencie os cargos dos usuários</p>
        </div>
        <TeamNav />
        <Can I="roles:manage">
          <Button
            onClick={() => {
              setIsCreating(true);
              router.push("/dashboard/admin/roles?role=new");
            }}
            className="bg-white text-black hover:bg-white/90 h-10 px-5"
          >
            Criar cargo
          </Button>
        </Can>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Pesquisar"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            className="h-10 border-white/10 bg-white/[0.03] pl-9"
          />
        </div>
        <div className="space-y-1">
          {listFilteredRoles.map((role, index) => (
            <div
              key={role.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#111111] px-3 py-3"
            >
              {role.isProtected ? (
                <Lock className="h-4 w-4 text-zinc-500" />
              ) : (
                <GripVertical className="h-4 w-4 text-zinc-600" />
              )}
              <button
                type="button"
                onClick={() => router.push(`/dashboard/admin/roles?role=${role.id}`)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <Shield className="h-4 w-4 text-zinc-500" />
                <span className="text-sm text-white">{role.name}</span>
              </button>
              {!role.isProtected && role.userCount === 0 && (
                <Can I="roles:manage">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(role)}
                    className="p-1 text-zinc-500 hover:text-red-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Can>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Cargos</h1>
        <p className="text-sm text-zinc-500">Gerencie os cargos dos usuários</p>
      </div>
      <TeamNav />

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsCreating(false);
            router.push("/dashboard/admin/roles");
          }}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Can I="roles:manage">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!name.trim() || isProtected || saveMutation.isPending}
            className="gap-2 border border-white/10 bg-transparent text-white hover:bg-white/5"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Salvar
          </Button>
        </Can>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full lg:w-64 lg:shrink-0 lg:order-2">
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

        <div className="min-w-0 flex-1 lg:order-1">
          <div className="mb-4 flex gap-4 border-b border-white/5">
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
                    "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors",
                    active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Icon className={cn("h-4 w-4", active && "text-[#fcb64c]")} />
                  {tab.label}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fcb64c]" />
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "cargo" && (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label>Nome do cargo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isProtected}
                  placeholder="Ex: Moderador"
                  className="border-white/10 bg-black/30"
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
                  className="resize-none border-white/10 bg-black/30"
                />
              </div>
            </div>
          )}

          {activeTab === "permissoes" && (
            <div className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  placeholder="Pesquisar permissão"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="h-10 border-white/10 bg-white/[0.03] pl-9"
                />
              </div>
              <div className="space-y-6">
                {Object.entries(filteredGrouped).map(([category, perms]) => {
                  const expanded = expandedCategories[category] ?? true;
                  const primary = perms[0];
                  const advanced = perms.slice(1);
                  return (
                    <div key={category} className="space-y-3">
                      <div>
                        <h3 className="text-sm font-semibold text-white">
                          {CATEGORY_LABELS[category] || category}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {CATEGORY_DESCRIPTIONS[category] || ""}
                        </p>
                      </div>
                      {primary && (
                        <PermissionToggle
                          perm={primary}
                          checked={selectedKeys.includes(primary.key)}
                          disabled={isProtected}
                          onToggle={() => togglePermission(primary.key)}
                        />
                      )}
                      {advanced.length > 0 && (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleCategory(category)}
                            className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm text-zinc-400"
                          >
                            Permissões avançadas
                            <span className="text-xs">{expanded ? "▲" : "▼"}</span>
                          </button>
                          {expanded && (
                            <div className="space-y-2 pl-2">
                              {advanced.map((perm) => (
                                <PermissionToggle
                                  key={perm.key}
                                  perm={perm}
                                  checked={selectedKeys.includes(perm.key)}
                                  disabled={isProtected}
                                  onToggle={() => togglePermission(perm.key)}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="bg-white text-black hover:bg-white/90 shrink-0">
                        Adicionar
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 border-white/10 bg-[#161616] p-2" align="start">
                      <p className="mb-2 px-1 text-xs font-medium text-zinc-400">Usuários</p>
                      <p className="mb-2 px-1 text-xs text-zinc-500">
                        Selecione o usuário que deseja associar.
                      </p>
                      <div className="max-h-48 space-y-0.5 overflow-y-auto">
                        {availableUsers.map(
                          (u: { id: string; name?: string | null; email: string }) => (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() =>
                                selectedRoleId &&
                                assignMutation.mutate({
                                  userId: u.id,
                                  roleId: selectedRoleId === "new" ? null : selectedRoleId,
                                })
                              }
                              disabled={selectedRoleId === "new"}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-white/5 disabled:opacity-50"
                            >
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                                {(u.name || u.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-white">{u.name || u.email}</p>
                                <p className="truncate text-xs text-zinc-500">{u.email}</p>
                              </div>
                            </button>
                          )
                        )}
                        {availableUsers.length === 0 && (
                          <p className="py-4 text-center text-xs text-zinc-500">
                            Nenhum usuário disponível
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
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
          <Loader2 className="h-8 w-8 animate-spin text-[#fcb64c]" />
        </div>
      }
    >
      <RolesPageContent />
    </Suspense>
  );
}
