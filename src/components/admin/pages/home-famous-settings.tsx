"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PlusCircle, Save, Trash2, Pencil, X, Check } from "lucide-react";
import { TbGridDots } from "react-icons/tb";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { famousClientsApi, siteSettingsApi, type FamousClientRecord, type SiteConfigRecord, } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type ClientForm = {
  name: string;
  subtitle: string;
  avatarUrl: string;
  videoUrl: string;
  isActive: boolean;
};

const emptyForm: ClientForm = {
  name: "",
  subtitle: "",
  avatarUrl: "",
  videoUrl: "",
  isActive: true,
};

export function HomeFamousSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [configForm, setConfigForm] = useState<Partial<SiteConfigRecord>>({});
  const [localClients, setLocalClients] = useState<FamousClientRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState<ClientForm>(emptyForm);

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ["admin", "famous-clients"],
    queryFn: () => famousClientsApi.list(),
  });

  useEffect(() => {
    if (settingsData?.config) setConfigForm(settingsData.config);
  }, [settingsData?.config]);

  useEffect(() => {
    if (clientsData?.clients) setLocalClients(clientsData.clients);
  }, [clientsData?.clients]);

  const saveConfigMutation = useMutation({
    mutationFn: () =>
      siteSettingsApi.update({
        homeFamousEnabled: configForm.homeFamousEnabled ?? true,
        homeFamousTitlePrimary: configForm.homeFamousTitlePrimary ?? null,
        homeFamousTitleSecondary: configForm.homeFamousTitleSecondary ?? null,
      }),
    onSuccess: () => {
      toast.success("Configurações da seção salvas");
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (items: { id: string }[]) => famousClientsApi.reorder(items),
    onSuccess: () => {
      toast.success("Ordem atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin", "famous-clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveClientMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: clientForm.name.trim(),
        subtitle: clientForm.subtitle.trim() || null,
        avatarUrl: clientForm.avatarUrl.trim() || null,
        videoUrl: clientForm.videoUrl.trim() || null,
        isActive: clientForm.isActive,
      };
      if (editingId) return famousClientsApi.update(editingId, payload);
      return famousClientsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(editingId ? "Cliente atualizado" : "Cliente adicionado");
      setDialogOpen(false);
      setEditingId(null);
      setClientForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["admin", "famous-clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: famousClientsApi.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin", "famous-clients"] });
      const previous = localClients;
      setLocalClients((prev) => prev.filter((c) => c.id !== id));
      return { previous };
    },
    onSuccess: () => {
      toast.success("Cliente removido");
      queryClient.invalidateQueries({ queryKey: ["admin", "famous-clients"] });
    },
    onError: (e: Error, _id, context) => {
      if (context?.previous) setLocalClients(context.previous);
      toast.error(e.message);
    },
  });

  const setConfig = <K extends keyof SiteConfigRecord>(
    key: K,
    value: SiteConfigRecord[K]
  ) => {
    setConfigForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setClientForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (client: FamousClientRecord) => {
    setEditingId(client.id);
    setClientForm({
      name: client.name,
      subtitle: client.subtitle ?? "",
      avatarUrl: client.avatarUrl ?? "",
      videoUrl: client.videoUrl ?? "",
      isActive: client.isActive,
    });
    setDialogOpen(true);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;

    const next = Array.from(localClients);
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    setLocalClients(next);
    reorderMutation.mutate(next.map((c) => ({ id: c.id })));
  };

  if (settingsLoading || clientsLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">
              Clientes famosos
            </h1>
            <p className="mt-1 text-sm text-muted-foreground lg:text-base">
              Influenciadores que indicaram a loja em vídeos.
            </p>
          </div>
          <Button
            className="w-full shrink-0 gap-2 px-4 py-5 sm:w-auto"
            disabled={saveConfigMutation.isPending}
            onClick={() => saveConfigMutation.mutate()}
          >
            {saveConfigMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="hidden h-4 w-4" />
            )}
            Salvar Alterações
          </Button>
        </div>
      )}

      <div className="space-y-4 rounded-md bg-transparent">
        <div className="mb-4 flex flex-col items-center justify-between gap-4 sm:flex-col md:flex-col lg:flex-row">
          <div className="flex w-full items-center gap-2 rounded-md border border-white/5 px-3 py-2 md:w-3xl">
            <Toggle
              id="home-famous-enabled"
              size="sm"
              pressed={configForm.homeFamousEnabled ?? false}
              onPressedChange={(v) => setConfig("homeFamousEnabled", v)}
            >
              {configForm.homeFamousEnabled ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Toggle>
            <div>
              <p className="text-sm font-medium text-white">
                Exibir na home{" "}
                <span className="font-light text-blue-500">
                  {configForm.homeFamousEnabled ? "( Ativado )" : "( Desativado )"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Seção abaixo do banner com avatares e link para o vídeo.
              </p>
            </div>
          </div>

          {hideHeader && (
            <div className="mb-4 flex justify-end">
              <Button
                className="w-full shrink-0 gap-2 px-4 py-5 sm:w-auto"
                disabled={saveConfigMutation.isPending}
                onClick={() => saveConfigMutation.mutate()}
              >
                {saveConfigMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="hidden h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Título (linha 1)</Label>
            <Input
              value={configForm.homeFamousTitlePrimary ?? ""}
              onChange={(e) => setConfig("homeFamousTitlePrimary", e.target.value)}
              placeholder="Famosos"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Título (linha 2)</Label>
            <Input
              value={configForm.homeFamousTitleSecondary ?? ""}
              onChange={(e) => setConfig("homeFamousTitleSecondary", e.target.value)}
              placeholder="Que Indicam"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">Clientes</h2>
        <Button size="lg" onClick={openCreate}>
          <PlusCircle className="h-4 w-4" />
          Adicionar Cliente
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="famous-clients">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {localClients.map((client, index) => (
                <Draggable key={client.id} draggableId={client.id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...(dragProvided.draggableProps as any)}
                      className={cn(
                        "flex items-center gap-3 rounded-md border border-white/5 bg-transparent p-4",
                        snapshot.isDragging && "border-primary/50"
                      )}
                    >
                      <span
                        {...dragProvided.dragHandleProps}
                        className="cursor-grab text-zinc-500 hover:text-white"
                      >
                        <TbGridDots className="h-5 w-5" />
                      </span>
                      {client.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={client.avatarUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/50">
                          {client.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{client.name}</p>
                        <p className="line-clamp-1 text-xs text-zinc-500">
                          {client.subtitle || client.videoUrl || "Sem subtítulo"}
                        </p>
                      </div>
                      {!client.isActive && (
                        <span className="text-[10px] uppercase tracking-wider text-amber-400">
                          Oculto
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(client)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        disabled={removeMutation.isPending}
                        onClick={() => removeMutation.mutate(client.id)}
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              {localClients.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum cliente cadastrado ainda.
                </p>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar cliente" : "Novo cliente"}</DialogTitle>
            <DialogDescription>Avatar, nome e link do vídeo de indicação.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  placeholder="Nome do influenciador"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtítulo (ex.: seguidores)</Label>
                <Input
                  value={clientForm.subtitle}
                  onChange={(e) => setClientForm({ ...clientForm, subtitle: e.target.value })}
                  placeholder="2.1M"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL do vídeo</Label>
              <Input
                value={clientForm.videoUrl}
                onChange={(e) => setClientForm({ ...clientForm, videoUrl: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-3">
              <span className="text-sm">Visível na loja</span>
              <Switch
                checked={clientForm.isActive}
                onCheckedChange={(v) => setClientForm({ ...clientForm, isActive: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <ImageUpload
                aspectRatio="video"
                value={clientForm.avatarUrl}
                onChange={(url) =>
                  setClientForm({ ...clientForm, avatarUrl: url ?? "" })
                }
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => saveClientMutation.mutate()}
              disabled={saveClientMutation.isPending || !clientForm.name.trim()}
            >
              {saveClientMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
