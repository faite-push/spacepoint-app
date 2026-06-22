"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Plus, Pencil, Trash2, Loader2, PlusCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { bannersApi, type Banner } from "@/lib/admin-api";
import { Can } from "@/providers/PermissionProvider";
import { TbGridDots } from "react-icons/tb";
import { cn } from "@/lib/utils";

export function HomePageSettings({ hideHeader = false }: { hideHeader?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null);
  const [localBanners, setLocalBanners] = useState<Banner[]>([]);

  const { data: resp, isLoading } = useQuery({
    queryKey: ["admin", "banners"],
    queryFn: () => bannersApi.list(),
  });

  useEffect(() => {
    if (resp?.banners) {
      setLocalBanners(resp.banners);
    }
  }, [resp?.banners]);

  const removeMutation = useMutation({
    mutationFn: bannersApi.remove,
    onSuccess: () => {
      toast.success("Banner removido com sucesso");
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: bannersApi.reorder,
    onSuccess: () => {
      toast.success("Ordem dos banners atualizada");
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    if (source.index === destination.index) return;

    const newBanners = Array.from(localBanners);
    const [moved] = newBanners.splice(source.index, 1);
    newBanners.splice(destination.index, 0, moved);

    setLocalBanners(newBanners);

    const orderedIds = newBanners.map((b) => b.id);
    reorderMutation.mutate(orderedIds);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/admin/banners/${id}/edit`);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  };

  const isEmpty = localBanners.length === 0;

  return (
    <div className="space-y-3">
      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">Página Inicial</h1>
            <p className="text-sm text-muted-foreground mt-1 lg:text-base">
              Configure o banner principal e outros elementos exibidos na home da loja.
            </p>
          </div>
          <Can I="settings:manage">
            <Button asChild className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto">
              <Link href="/dashboard/admin/banners/new">
                <PlusCircle className="h-4 w-4" />
                Adicionar Banner
              </Link>
            </Button>
          </Can>
        </div>
      )}

      <div className="rounded-md overflow-hidden">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center p-12 text-center mt-34">
            <div className="flex h-16 w-16 items-center justify-center rounded-full mb-4">
              <PlusCircle className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum banner cadastrado</h3>
            <p className="text-sm text-zinc-400 max-w-sm mb-6">
              Adicione banners para chamar atenção na página principal da sua loja.
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/dashboard/admin/banners/new">Criar primeiro banner</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col border border-white/5 p-4">
            {hideHeader && (
              <div className="flex justify-end mb-4">
                <Can I="settings:manage">
                  <Button asChild className="gap-2 w-full shrink-0 px-4 py-5 sm:w-auto">
                    <Link href="/dashboard/admin/banners/new">
                      <PlusCircle className="h-4 w-4" />
                      Adicionar Banner
                    </Link>
                  </Button>
                </Can>
              </div>
            )}

            <div className="rounded-md border border-white/5 bg-transparent overflow-hidden">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="banners-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-white/5">
                      {localBanners.map((banner, index) => (
                        <Draggable key={banner.id} draggableId={banner.id} index={index}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} className={cn("flex flex-col sm:flex-row sm:items-center gap-4 p-4 transition-colors hover:bg-white/[0.02]", snapshot.isDragging && "bg-[#111] shadow-2xl ring-1 ring-white/10 z-50 rounded-lg")}>
                              <div {...provided.dragHandleProps} className="flex items-center justify-center w-8 h-8 rounded-md text-white/75 hover:text-white cursor-grab active:cursor-grabbing self-start sm:self-auto shrink-0">
                                <TbGridDots className="h-5 w-5" />
                              </div>

                              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                                <div className="relative w-full h-auto sm:w-48 aspect-[13/4] rounded-md overflow-hidden bg-[#1A1A1A] shrink-0 border border-white/10">
                                  {banner.imageUrl ? (
                                    <Image
                                      src={banner.imageUrl}
                                      alt="Banner"
                                      fill
                                      className="object-cover select-none pointer-events-none"
                                    />
                                  ) : (
                                    <div className="absolute select-none pointer-events-none inset-0 flex items-center justify-center text-xs text-zinc-500">
                                      Sem imagem
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex flex-row items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className={cn("px-2 py-1 rounded text-xs font-medium", banner.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
                                      {banner.isActive ? "Ativo" : "Inativo"}
                                    </div>
                                  </div>

                                  <div className="cursor-pointer rounded hover:underline bg-blue-500/10 px-2 py-1 text-xs truncate">
                                    {banner.linkUrl ? (
                                      <a
                                        href={banner.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline text-blue-500"
                                      >
                                        {banner.linkUrl}
                                      </a>
                                    ) : (
                                      <span className="text-blue-500 text-xs font-medium">Nenhum link associado</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 mt-4 sm:mt-0">
                                <Can I="settings:manage">
                                  <Tooltip>
                                    <TooltipTrigger render={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="cursor-pointer"
                                        onClick={() => handleEdit(banner.id)}
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    }>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar banner</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger render={
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => setDeleteTarget(banner)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    }>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Excluir banner</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </Can>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Você tem certeza?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O banner será excluído permanentemente da sua vitrine.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={removeMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => {
                if (deleteTarget) removeMutation.mutate(deleteTarget.id);
              }}
            >
              {removeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sim, excluir banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};