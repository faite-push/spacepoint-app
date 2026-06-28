"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TbGridDots } from "react-icons/tb";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, Users, Shield, Crown, Loader2, GripVertical, PlusCircle } from "lucide-react";
import { TeamNav } from "@/components/admin/layout/team-nav";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, getCsrfToken } from "@/lib/utils";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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
  createdAt: string;
  updatedAt: string;
  userCount: number;
  permissions: Permission[];
}

interface GroupedPermissions {
  [category: string]: Permission[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchRoles(): Promise<Role[]> {
  const res = await fetch(`${API_URL}/api/admin/roles`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch roles");
  const data = await res.json();
  return data.roles;
}

async function fetchPermissions(): Promise<{ permissions: Permission[]; grouped: GroupedPermissions }> {
  const res = await fetch(`${API_URL}/api/admin/permissions`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch permissions");
  return res.json();
}

async function createRole(payload: { name: string; description: string; permissionKeys: string[] }) {
  const res = await fetch(`${API_URL}/api/admin/roles`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken()
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create role");
  }
  return res.json();
}

async function updateRole(id: string, payload: { name: string; description: string; permissionKeys: string[] }) {
  const res = await fetch(`${API_URL}/api/admin/roles/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken()
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update role");
  }
  return res.json();
}

async function deleteRole(id: string) {
  const res = await fetch(`${API_URL}/api/admin/roles/${id}`, {
    method: "DELETE",
    headers: {
      "X-CSRF-Token": getCsrfToken()
    },
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete role");
  }
  return res.json();
}

async function reorderRoles(roles: { id: string; sortOrder: number }[]) {
  const res = await fetch(`${API_URL}/api/admin/roles/reorder`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken()
    },
    credentials: "include",
    body: JSON.stringify({ roles }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to reorder roles");
  }
  return res.json();
}

const CATEGORY_LABELS: Record<string, string> = {
  products: "Produtos",
  codes: "Códigos",
  orders: "Pedidos",
  users: "Usuários",
  roles: "Cargos",
  settings: "Configurações",
  analytics: "Analytics",
};

function PermissionCategory({ category, permissions, selectedKeys, onToggle, }: { category: string; permissions: Permission[]; selectedKeys: string[]; onToggle: (key: string) => void; }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[#9333EA]">
        {CATEGORY_LABELS[category] || category}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {permissions.map((perm) => (
          <div key={perm.key} className="flex items-center space-x-2">
            <Checkbox
              id={perm.key}
              checked={selectedKeys.includes(perm.key)}
              onCheckedChange={() => onToggle(perm.key)}
            />
            <Label
              htmlFor={perm.key}
              className="text-sm font-normal cursor-pointer text-zinc-300"
            >
              {perm.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleModal({
  role,
  groupedPermissions,
  onSave,
  onClose,
  isOpen,
  isLoading,
}: {
  role?: Role;
  groupedPermissions: GroupedPermissions;
  onSave: (data: { name: string; description: string; permissionKeys: string[] }) => void;
  onClose: () => void;
  isOpen: boolean;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setName(role?.name || "");
      setDescription(role?.description || "");
      setSelectedKeys(role?.permissions.map((p) => p.key) || []);
    }
  }, [isOpen, role]);

  const isEditing = !!role;
  const isProtected = role?.isProtected;

  const handleToggle = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    onSave({ name, description, permissionKeys: selectedKeys });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-[#111111] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isProtected && <Crown className="h-5 w-5 text-yellow-500" />}
            {isEditing ? "Editar Cargo" : "Novo Cargo"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {isProtected
              ? "Este é o cargo do Dono Supremo e não pode ser alterado."
              : "Configure as informações e permissões do cargo."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Cargo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Administrador"
                disabled={isProtected || isLoading}
                className="bg-black/50 border-white/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva as responsabilidades deste cargo..."
                disabled={isProtected || isLoading}
                rows={2}
                className="bg-black/50 border-white/10 focus:outline-none focus:ring-none resize-none"
              />
            </div>

            <Separator className="bg-white/5" />

            <div className="space-y-4">
              <Label className="text-lg">Permissões</Label>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <PermissionCategory
                  key={category}
                  category={category}
                  permissions={perms}
                  selectedKeys={selectedKeys}
                  onToggle={isProtected ? () => { } : handleToggle}
                />
              ))}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-white/5 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="py-4 px-5 text-zinc-400">
            Cancelar
          </Button>
          {!isProtected && (
            <Button onClick={handleSave} disabled={!name || isLoading} className="bg-[#9333EA] hover:bg-[#7e22ce] min-w-[120px] py-4 px-5">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? "Salvar Alterações" : "Criar Cargo")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RolesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);

  const queryClient = useQueryClient();

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const { data: permissionsData, isLoading: permissionsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: fetchPermissions,
  });

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Cargo criado com sucesso!");
      setIsModalOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Cargo atualizado com sucesso!");
      setIsModalOpen(false);
      setEditingRole(undefined);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Cargo excluído com sucesso!");
      setDeleteConfirm(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderRoles,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !roles) return;

    const items = Array.from(roles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedRoles = items.map((role, index) => ({
      id: role.id,
      sortOrder: index,
    }));

    queryClient.setQueryData(["roles"], items.map((r, i) => ({ ...r, sortOrder: i })));

    reorderMutation.mutate(updatedRoles);
  };

  const handleSave = (data: any) => {
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingRole(undefined);
    setIsModalOpen(true);
  };

  const isLoading = rolesLoading || permissionsLoading;

  return (
    <div className="space-y-6">
      <TeamNav />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Cargos e Permissões</h1>
          <p className="text-muted-foreground">Gerencie a hierarquia e os acessos da equipe</p>
        </div>
        <Can I="roles:manage">
          <Button variant="default" onClick={handleCreate} className="bg-primary hover:bg-primary/80 gap-2 py-5 px-4 shrink-0">
            <PlusCircle className="h-4 w-4" />
            Novo Cargo
          </Button>
        </Can>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#111111] overflow-hidden shadow-2xl">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5">
                <TableHead className="w-[40px]"></TableHead>
                <TableHead className="text-xs font-semibold text-white/75">Cargo</TableHead>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/75">Usuários</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/75">Permissões</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-white/75">Criado em</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-white/75">Ações</th>
              </TableRow>
            </TableHeader>
            <Droppable droppableId="roles">
              {(provided) => (
                <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-primary">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : roles?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                        Nenhum cargo encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    roles?.map((role, index) => (
                      <Draggable key={role.id} draggableId={role.id} index={index}>
                        {(provided, snapshot) => (
                          <TableRow
                            ref={provided.innerRef}
                            {...(provided.draggableProps as any)}
                            className={cn(
                              "border-white/5 transition-colors cursor-pointer select-none",
                              snapshot.isDragging ? "bg-[#111111] opacity-50 shadow-2xl scale-[1.01]" : "hover:bg-white/[0.02]"
                            )}
                          >
                            <TableCell className="w-[40px] pl-4 text-center">
                              <Can I="roles:manage">
                                <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 flex justify-center">
                                  <TbGridDots className="h-5 w-5" />
                                </div>
                              </Can>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {role.isProtected ? (
                                  <Crown className="h-5 w-5 text-yellow-500" />
                                ) : (
                                  <Shield className="h-5 w-5 text-primary" /> 
                                )}
                                <span className="font-semibold text-white">{role.name}</span>
                                {role.isProtected && (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border-emerald-500/ hover:bg-emerald-500/20">
                                    Dono
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-zinc-300">
                              <div className="flex items-center gap-1.5">
                                <Users className="h-4 w-4 text-zinc-500" />
                                <span className="text-sm">{role.userCount}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-white/10 text-zinc-400 font-normal">
                                {role.permissions.length} permissões
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-zinc-500">
                              {format(new Date(role.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1">
                                <Can I="roles:manage">
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon-lg"
                                      onClick={() => handleEdit(role)}
                                      disabled={role.isProtected}
                                      className="flex cursor-pointer"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="icon-lg"
                                      onClick={() => setDeleteConfirm(role)}
                                      disabled={role.isProtected || role.userCount > 0}
                                      className={cn("flex cursor-pointer", (!role.isProtected && role.userCount === 0) ? "" : "text-red-600/40")}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                </Can>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </TableBody>
              )}
            </Droppable>
          </Table>
        </DragDropContext>
      </div>

      {permissionsData && (
        <RoleModal
          role={editingRole}
          groupedPermissions={permissionsData.grouped}
          onSave={handleSave}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRole(undefined);
          }}
          isOpen={isModalOpen}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#111111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Excluir Cargo</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tem certeza que deseja excluir o cargo <strong>{deleteConfirm?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="text-zinc-500">Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
