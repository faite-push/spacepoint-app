"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Shield, ShieldCheck, Ban, User, ChevronLeft, ChevronRight, Eye, Plus, Loader2, X, Check, Mail, Pencil, Trash2, PlusCircle } from "lucide-react";
import { TeamNav } from "@/components/admin/layout/team-nav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, getCsrfToken } from "@/lib/utils";
import { Can } from "@/providers/PermissionProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function fetchTeam() {
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
  const res = await fetch(`${API_URL}/v2/api/admin/users/search?query=${encodeURIComponent(query)}`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao buscar usuários");
  const data = await res.json();
  return data.users;
}

async function assignRole({ userId, roleId }: { userId: string; roleId: string | null }) {
  const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "X-CSRF-Token": getCsrfToken()
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

export default function TeamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [inviteQuery, setInviteQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
  });

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: fetchRoles,
  });

  const assignMutation = useMutation({
    mutationFn: assignRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team"] });
      toast.success(selectedRoleId ? "Cargo atribuído com sucesso!" : "Membro removido da equipe!");
      setIsAddModalOpen(false);
      setDeleteConfirm(null);
      resetAddModal();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (inviteQuery.length >= 2 && !selectedUser) {
        setIsSearching(true);
        try {
          const results = await searchUsers(inviteQuery);
          setSearchResults(results);
          setShowResults(true);
        } catch (err) {
          console.error(err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [inviteQuery, selectedUser]);

  const resetAddModal = () => {
    setInviteQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setSelectedRoleId("");
    setIsSearching(false);
    setShowResults(false);
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setSelectedRoleId(user.roleId || "");
    setShowResults(false);
    setInviteQuery(user.email);
  };

  const handleAddMember = () => {
    if (!selectedUser || !selectedRoleId) return;
    assignMutation.mutate({ userId: selectedUser.id, roleId: selectedRoleId });
  };

  const handleEditRole = (member: any) => {
    setSelectedUser(member);
    setSelectedRoleId(member.roleId || "");
    setInviteQuery(member.email);
    setIsAddModalOpen(true);
  };

  const handleRemoveMember = () => {
    if (!deleteConfirm) return;
    assignMutation.mutate({ userId: deleteConfirm.id, roleId: null });
  };

  const filteredTeam = team?.filter((user: any) => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <TeamNav />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Equipe</h1>
          <p className="text-muted-foreground">Gerencie os membros da sua equipe e seus acessos</p>
        </div>

        <Can I="roles:manage">
          <Dialog open={isAddModalOpen} onOpenChange={(open) => {
            setIsAddModalOpen(open);
            if (!open) resetAddModal();
          }}>
            <DialogTrigger asChild>
              <Button variant="default" className="bg-primary hover:bg-primary/80 gap-2 py-5 px-4 shrink-0">
                <PlusCircle className="h-4 w-4" />
                Adicionar à Equipe
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111111] border-white/10 text-white max-w-md">
              <DialogHeader>
                <DialogTitle>{selectedUser ? "Editar Cargo" : "Adicionar Membro"}</DialogTitle>
                <DialogDescription className="text-zinc-400">
                  {selectedUser ? "Altere o cargo administrativo deste membro." : "Busque um usuário pelo nome ou email e atribua um cargo."}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4 relative">
                {!selectedUser && (
                  <div className="space-y-2">
                    <Label>Buscar Usuário</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Nome ou email..." 
                        value={inviteQuery}
                        onChange={(e) => setInviteQuery(e.target.value)}
                        className="bg-black/50 border-white/10 pl-10"
                        autoComplete="off"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                        </div>
                      )}

                      {showResults && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-white/10 bg-[#161616] p-1 shadow-2xl animate-in fade-in zoom-in-95">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleSelectUser(user)}
                              className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-white/5 transition-colors"
                            >
                              <div className="h-8 w-8 rounded-full bg-[#9333EA]/20 flex items-center justify-center shrink-0">
                                {user.image ? (
                                  <img src={user.image} className="h-8 w-8 rounded-full" alt="" />
                                ) : (
                                  <User className="h-4 w-4 text-[#9333EA]" />
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{user.name || "Sem nome"}</p>
                                <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {showResults && inviteQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-white/10 bg-[#161616] p-4 text-center shadow-2xl">
                          <p className="text-sm text-zinc-500">Nenhum usuário encontrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedUser && (
                  <div className="rounded-xl border border-[#9333EA]/30 bg-[#9333EA]/5 p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[#9333EA]/20 flex items-center justify-center border border-[#9333EA]/30">
                          {selectedUser.image ? (
                            <img src={selectedUser.image} className="h-10 w-10 rounded-full" alt="" />
                          ) : (
                            <User className="h-5 w-5 text-[#9333EA]" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{selectedUser.name || "Sem nome"}</p>
                          <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                        </div>
                      </div>
                      {!inviteQuery && (
                        <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="h-8 w-8 text-zinc-500 hover:text-white">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-zinc-400">Cargo Atribuído</Label>
                      <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                        <SelectTrigger className="bg-black/50 border-white/10 text-white h-11">
                          <SelectValue placeholder="Selecione um cargo..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111111] border-white/10">
                          {roles?.map((role: any) => (
                            <SelectItem key={role.id} value={role.id} className="text-white hover:bg-white/10">
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="text-zinc-400">Cancelar</Button>
                <Button 
                  onClick={handleAddMember} 
                  className="bg-[#9333EA] hover:bg-[#7e22ce] min-w-[100px]"
                  disabled={!selectedUser || !selectedRoleId || assignMutation.isPending}
                >
                  {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Can>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Buscar na equipe..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-lg border border-white/10 bg-[#0A0A0A] pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-[#9333EA]/60 focus:outline-none focus:ring-none transition-all duration-300"
        />
      </div>

      <div className="rounded-lg border border-white/3 bg-background overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/3 bg-white/[0.01]">
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/75">Membro:</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/75">Cargo:</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/75">Status:</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-white/75">Desde:</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-white/75">Ações:</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {teamLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#9333EA]" />
                  </td>
                </tr>
              ) : filteredTeam?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-zinc-500">
                    Nenhum membro da equipe encontrado
                  </td>
                </tr>
              ) : (
                filteredTeam?.map((member: any) => (
                  <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors cursor-pointer select-none">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="h-11 w-11 rounded-full bg-white/3 p-[1px]">
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-[#111111]">
                              {member.image ? (
                                <img src={member.image} className="h-full w-full rounded-full object-cover pointer-events-none select-none" alt="" />
                              ) : (
                                <User className="h-5 w-5 text-[#9333EA]" />
                              )}
                            </div>
                          </div>
                          {member.isAdmin && (
                            <div className="absolute -right-1 -top-1 rounded-full bg-yellow-500 p-1 border-2 border-[#111111]">
                              <ShieldCheck className="h-2 w-2 text-black" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white transition-colors">{member.name || "Sem nome"}</p>
                          <p className="text-xs text-white/60">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.isAdmin && !member.role ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-3 py-1 text-[11px] font-bold tracking-wider text-yellow-500 border border-yellow-500/20">
                          Dono Supremo
                        </span>
                      ) : member.role ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/3 px-3 py-1 text-[11px] font-bold tracking-wider text-emerald-500 border border-emerald-500/20">
                          {member.role.name}
                        </span>
                      ) : (
                        <span className="text-sm text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <span className="text-sm text-zinc-300">Ativo</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-white/80">
                      {format(new Date(member.createdAt), "MMMM yyyy", { locale: ptBR })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {(!member.isAdmin || member.role) && (
                          <>
                            <Button 
                              onClick={() => handleEditRole(member)}
                              variant="outline"
                              size="icon-lg"
                              className="flex cursor-pointer"
                              title="Editar Cargo"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => setDeleteConfirm(member)}
                              variant="destructive"
                              size="icon-lg"
                              className="flex cursor-pointer"
                              title="Remover da Equipe"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {member.isAdmin && !member.role && (
                           <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-zinc-400 hover:border-zinc-300 hover:text-white transition-all cursor-not-allowed opacity-30">
                              <ShieldCheck className="h-4 w-4" />
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-[#111111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Remover Membro</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tem certeza que deseja remover <strong>{deleteConfirm?.name}</strong> da equipe? 
              O acesso administrativo deste usuário será revogado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} className="text-zinc-500">Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={assignMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {assignMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Revogar Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
