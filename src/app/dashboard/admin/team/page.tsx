"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, Loader2, Plus, X, MoreVertical, Trash2, User, ScanFace, ScanFaceIcon, } from "lucide-react";

import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { TeamNav } from "@/components/admin/layout/team-nav";
import { RolePickerDialog } from "@/components/admin/team/role-picker-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Can } from "@/providers/PermissionProvider";
import { useAuth } from "@/context/auth-context";
import { cn, getCsrfToken } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type StoreUser = {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  isAdmin?: boolean;
  isSuperOwner?: boolean;
  createdAt: string;
  roleId?: string | null;
  role?: { id: string; name: string; isProtected?: boolean } | null;
};

async function fetchTeamMembers(): Promise<StoreUser[]> {
  const res = await fetch(`${API_URL}/v2/api/admin/team`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao buscar equipe");
  const data = await res.json();
  return data.users;
};

async function fetchRoles() {
  const res = await fetch(`${API_URL}/api/admin/roles`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao buscar cargos");
  const data = await res.json();
  return data.roles;
};

async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `${API_URL}/v2/api/admin/users/search?query=${encodeURIComponent(query)}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Erro ao buscar usuários");
  const data = await res.json();
  return data.users;
};

async function assignRole({ userId, roleId }: { userId: string; roleId: string | null }) {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken(),
    },
    credentials: "include",
    body: JSON.stringify({ roleId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Falha ao atribuir cargo");
  }
  return res.json();
};

function UserAvatar({ user }: { user: StoreUser }) {
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 md:h-13 md:w-13 shrink-0 items-center justify-center">
      {user.image ? (
        <div className="h-8 w-8 flex items-center justify-center shrink-0">
          <ScanFaceIcon className="h-full w-full text-white" />
        </div>
      ) : (
        initial
      )}
    </div>
  );
};

function RoleBadge({ roleName, onRemove, canRemove, }: { roleName: string; onRemove?: () => void; canRemove?: boolean; }) {
  return (
    <span className="inline-flex select-none items-center gap-1.5 rounded-sm bg-blue-500/10 px-2.5 py-2 text-xs text-blue-500">
      <Shield className="h-3 w-3 shrink-0 text-blue-500" />
      <span className="truncate max-w-[120px]">{roleName}</span>
      {canRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [rolePickerUserId, setRolePickerUserId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<StoreUser | null>(null);
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [addSearchResults, setAddSearchResults] = useState<StoreUser[]>([]);
  const [addSearching, setAddSearching] = useState(false);
  const [selectedAddUser, setSelectedAddUser] = useState<StoreUser | null>(null);
  const [selectedAddRoleId, setSelectedAddRoleId] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-team"],
    queryFn: fetchTeamMembers,
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const assignMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-team"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success("Cargo atualizado!");
      setRolePickerUserId(null);
      setRemoveTarget(null);
      setAddOpen(false);
      resetAddModal();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const resetAddModal = () => {
    setInviteName("");
    setInviteEmail("");
    setAddSearchQuery("");
    setAddSearchResults([]);
    setSelectedAddUser(null);
    setSelectedAddRoleId("");
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (addSearchQuery.length >= 2 && !selectedAddUser) {
        setAddSearching(true);
        try {
          const results = await searchUsers(addSearchQuery);
          setAddSearchResults(results);
        } catch {
          setAddSearchResults([]);
        } finally {
          setAddSearching(false);
        }
      } else {
        setAddSearchResults([]);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [addSearchQuery, selectedAddUser]);

  const filteredUsers = users?.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoles = roles ?? [];

  const handleAssignRole = (userId: string, roleId: string) => {
    assignMutation.mutate({ userId, roleId });
  };

  const handleRemoveRole = (user: StoreUser) => {
    if (user.isSuperOwner) return;
    assignMutation.mutate({ userId: user.id, roleId: null });
  };

  const handleAddUserSubmit = () => {
    if (selectedAddUser && selectedAddRoleId) {
      assignMutation.mutate({ userId: selectedAddUser.id, roleId: selectedAddRoleId });
      return;
    }
    if (inviteEmail.trim()) {
      toast.info("Convite por e-mail em breve. Busque o usuário pelo e-mail para atribuir um cargo.");
    }
  };

  return (
    <div className="relative space-y-6">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-[85%] left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Equipe</h1>
        <p className="text-muted-foreground">Gerencie os membros e permissões da sua equipe.</p>
      </div>

      <TeamNav />

      <div className="flex flex-row gap-4">
        <Can I="roles:manage">
          <Button
            variant="default"
            onClick={() => setAddOpen(true)}
            className="h-10 px-5"
          >
            Adicionar usuário
          </Button>
        </Can>

        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Pesquisar usuário"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div>

      <div className="hidden md:flex flex-col space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#fcb64c]" />
          </div>
        ) : filteredUsers?.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">Nenhum usuário encontrado</p>
        ) : (
          filteredUsers?.map((member) => {
            const isYou = member.id === currentUser?.id;
            const isOwner = member.isSuperOwner;
            const canManage = !isOwner && !member.isSuperOwner;

            return (
              <div
                key={member.id}
                className="rounded-md border border-white/5 bg-transparent p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <UserAvatar user={member} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-white">
                        {member.name || member.email.split("@")[0]}
                      </span>

                      {isOwner && (
                        <span className="text-sm text-muted-foreground">· Dono</span>
                      )}

                      {isYou && !isOwner && (
                        <span className="text-sm text-blue-400">· Você</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {member.email} ·{" "}
                      {format(new Date(member.createdAt), "d, MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Can I="roles:manage">
                      {canManage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setRolePickerUserId(member.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </Can>

                    {member.role ? (
                      <RoleBadge
                        roleName={member.role.name}
                        canRemove={canManage}
                        onRemove={
                          canManage ? () => handleRemoveRole(member) : undefined
                        }
                      />
                    ) : canManage ? (
                      <Can I="roles:manage">
                        <button
                          type="button"
                          onClick={() => setRolePickerUserId(member.id)}
                          className="text-xs text-blue-400 hover:underline"
                        >
                          Adicionar cargo
                        </button>
                      </Can>
                    ) : null}
                  </div>

                  {canManage && (
                    <Can I="roles:manage">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-full rounded-md"
                        >
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer rounded-sm"
                            variant="destructive"
                            onClick={() => setRemoveTarget(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Can>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#fcb64c]" />
          </div>
        ) : filteredUsers?.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">Nenhum usuário encontrado</p>
        ) : (
          filteredUsers?.map((member) => {
            const isYou = member.id === currentUser?.id;
            const isOwner = member.isSuperOwner;
            const canManage = !isOwner && !member.isSuperOwner;

            return (
              <div
                key={member.id}
                className="rounded-md border border-white/5 bg-transparent p-4"
              >
                <div className="flex items-center gap-2">
                  <UserAvatar user={member} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-white">
                        {member.name || member.email.split("@")[0]}
                      </span>

                      {isOwner && (
                        <span className="text-sm text-muted-foreground">· Dono</span>
                      )}

                      {isYou && !isOwner && (
                        <span className="text-sm text-blue-400">· Você</span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {member.email} ·{" "}
                      {format(new Date(member.createdAt), "d, MMM yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  {canManage && (
                    <Can I="roles:manage">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-white/10 bg-[#161616] z-[100]"
                        >
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            onClick={() => setRemoveTarget(member)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover usuário
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Can>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetAddModal();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Usuário</DialogTitle>
            <DialogDescription>
              Preencha as informações para adicionar um novo usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!selectedAddUser ? (
              <>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <div className="relative">
                    <Input
                      placeholder="exemplo@gmail.com"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setAddSearchQuery(e.target.value);
                      }}
                    />
                    {addSearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
                    )}
                  </div>
                  {addSearchResults.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-white/5 bg-background p-1">
                      {addSearchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddUser(u);
                            setInviteName(u.name || "");
                            setInviteEmail(u.email);
                          }}
                          className="flex w-full cursor-pointer select-none items-center gap-2 rounded-md p-2 text-left hover:bg-white/5"
                        >
                          <ScanFaceIcon className="h-6 w-6 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm">{u.name || u.email}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-2 rounded-md border border-white/5 bg-card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedAddUser.name || selectedAddUser.email}</p>
                    <p className="text-xs text-zinc-500">{selectedAddUser.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedAddUser(null)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Cargo</Label>
                  <Select
                    value={selectedAddRoleId}
                    onValueChange={(value) => setSelectedAddRoleId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cargo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {roles?.map((r: { id: string; name: string }) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-row gap-2">
            <Button variant="ghost" size="lg" onClick={() => setAddOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              size="lg"
              onClick={handleAddUserSubmit}
              disabled={
                assignMutation.isPending ||
                (selectedAddUser ? !selectedAddRoleId : !inviteEmail.trim())
              }
              className="flex-1"
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Enviar solicitação"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RolePickerDialog
        open={!!rolePickerUserId}
        onOpenChange={(open) => !open && setRolePickerUserId(null)}
        roles={filteredRoles}
        selectedRoleId={users?.find((u) => u.id === rolePickerUserId)?.roleId}
        onSelect={(roleId) => {
          if (rolePickerUserId) handleAssignRole(rolePickerUserId, roleId);
        }}
      />

      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover usuário</DialogTitle>
            <DialogDescription>
              Remover o cargo de <strong>{removeTarget?.name || removeTarget?.email}</strong>?
              O acesso administrativo será revogado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setRemoveTarget(null)}
              className="flex-1">
              Cancelar
            </Button>
            <Button
              className="flex-1 text-black"
              variant="destructive"
              size="lg"
              onClick={() => removeTarget && handleRemoveRole(removeTarget)}
              disabled={assignMutation.isPending}
            >
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};