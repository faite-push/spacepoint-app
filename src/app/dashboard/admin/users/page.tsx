"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Shield,
  Loader2,
  Plus,
  X,
  MoreVertical,
  Trash2,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { TeamNav } from "@/components/admin/layout/team-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getCsrfToken } from "@/lib/utils";
import { Can } from "@/providers/PermissionProvider";
import { useAuth } from "@/context/auth-context";

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
}

async function fetchRoles() {
  const res = await fetch(`${API_URL}/api/admin/roles`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao buscar cargos");
  const data = await res.json();
  return data.roles;
}

async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `${API_URL}/v2/api/admin/users/search?query=${encodeURIComponent(query)}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Erro ao buscar usuários");
  const data = await res.json();
  return data.users;
}

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
}

function UserAvatar({ user }: { user: StoreUser }) {
  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-white">
      {user.image ? (
        <img src={user.image} alt="" className="h-full w-full rounded-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

function RoleBadge({
  roleName,
  onRemove,
  canRemove,
}: {
  roleName: string;
  onRemove?: () => void;
  canRemove?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white">
      <Shield className="h-3 w-3 shrink-0 text-zinc-400" />
      <span className="truncate max-w-[120px]">{roleName}</span>
      {canRemove && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-0.5 text-zinc-500 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [rolePickerUserId, setRolePickerUserId] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
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
      setRoleSearch("");
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

  const filteredRoles =
    roles?.filter((r: { name: string }) =>
      r.name.toLowerCase().includes(roleSearch.toLowerCase())
    ) ?? [];

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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white">Usuários</h1>
        <p className="text-sm text-zinc-500">Lista de usuários adicionados a loja</p>
      </div>

      <TeamNav />

      <Can I="roles:manage">
        <Button
          onClick={() => setAddOpen(true)}
          className="bg-white text-black hover:bg-white/90 h-10 px-5 font-medium"
        >
          Adicionar usuário
        </Button>
      </Can>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Pesquisar"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 border-white/10 bg-white/[0.03] pl-9"
        />
      </div>

      <div className="space-y-3">
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
                className="rounded-xl border border-white/5 bg-[#111111] p-4"
              >
                <div className="flex items-start gap-3">
                  <UserAvatar user={member} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold text-white">
                        {member.name || member.email.split("@")[0]}
                      </span>
                      {isOwner && (
                        <span className="text-sm text-[#fcb64c]">· Dono</span>
                      )}
                      {isYou && !isOwner && (
                        <span className="text-sm text-blue-400">· Você</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {member.email} ·{" "}
                      {format(new Date(member.createdAt), "d, MMM yyyy", { locale: ptBR })}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Can I="roles:manage">
                        {canManage && (
                          <Popover
                            open={rolePickerUserId === member.id}
                            onOpenChange={(open) => {
                              setRolePickerUserId(open ? member.id : null);
                              if (!open) setRoleSearch("");
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="start"
                              className="w-64 border-white/10 bg-[#161616] p-2"
                            >
                              <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                                <Input
                                  placeholder="Pesquisar cargo"
                                  value={roleSearch}
                                  onChange={(e) => setRoleSearch(e.target.value)}
                                  className="h-8 border-white/10 bg-black/40 pl-8 text-sm"
                                />
                              </div>
                              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                                {filteredRoles.map((role: { id: string; name: string; isProtected?: boolean }) => (
                                  <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => handleAssignRole(member.id, role.id)}
                                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-zinc-300 hover:bg-white/5"
                                  >
                                    <Shield className="h-3.5 w-3.5 text-zinc-500" />
                                    {role.name}
                                  </button>
                                ))}
                                {filteredRoles.length === 0 && (
                                  <p className="px-2 py-3 text-center text-xs text-zinc-500">
                                    Nenhum cargo encontrado
                                  </p>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
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
                  </div>

                  {canManage && (
                    <Can I="roles:manage">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="rounded-md p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="border-white/10 bg-[#161616]"
                        >
                          <DropdownMenuItem
                            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                            onClick={() => setRemoveTarget(member)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
        <DialogContent className="border-white/10 bg-[#111111] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Usuário</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Preencha as informações para adicionar um novo usuário
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!selectedAddUser ? (
              <>
                <div className="space-y-2">
                  <Label>Nome do usuário</Label>
                  <Input
                    placeholder="usuário"
                    value={inviteName}
                    onChange={(e) => {
                      setInviteName(e.target.value);
                      setAddSearchQuery(e.target.value);
                    }}
                    className="border-white/10 bg-black/40"
                  />
                </div>
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
                      className="border-white/10 bg-black/40"
                    />
                    {addSearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" />
                    )}
                  </div>
                  {addSearchResults.length > 0 && (
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-[#0a0a0a] p-1">
                      {addSearchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddUser(u);
                            setInviteName(u.name || "");
                            setInviteEmail(u.email);
                          }}
                          className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-white/5"
                        >
                          <User className="h-4 w-4 text-zinc-500" />
                          <div className="min-w-0">
                            <p className="truncate text-sm">{u.name || u.email}</p>
                            <p className="truncate text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.02] p-3">
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
                  <Label className="text-xs text-zinc-400">Cargo</Label>
                  <select
                    value={selectedAddRoleId}
                    onChange={(e) => setSelectedAddRoleId(e.target.value)}
                    className="h-10 w-full rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white"
                  >
                    <option value="">Selecione um cargo...</option>
                    {roles?.map((r: { id: string; name: string }) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setAddOpen(false)} className="text-zinc-400">
              Cancelar
            </Button>
            <Button
              onClick={handleAddUserSubmit}
              disabled={
                assignMutation.isPending ||
                (selectedAddUser ? !selectedAddRoleId : !inviteEmail.trim())
              }
              className="bg-white text-black hover:bg-white/90"
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

      <Dialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <DialogContent className="border-white/10 bg-[#111111] text-white">
          <DialogHeader>
            <DialogTitle>Remover usuário</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Remover o cargo de <strong>{removeTarget?.name || removeTarget?.email}</strong>?
              O acesso administrativo será revogado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setRemoveTarget(null)} className="text-zinc-500">
              Cancelar
            </Button>
            <Button
              variant="destructive"
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
}
