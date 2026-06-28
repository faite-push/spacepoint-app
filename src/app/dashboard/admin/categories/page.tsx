"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Eye, EyeOff, Loader2, FolderTree, Package, Layers, ImageIcon, PlusCircle, GripVertical, MoreHorizontal, Copy, Hash } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TbGridDots } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { categoriesApi, type Category } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { extractSortOrders, reorderTree } from "@/lib/utils-dnd";

export default function CategoriesListPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => categoriesApi.list(),
  });

  useEffect(() => {
    if (data?.categories) {
      setLocalCategories(data.categories);
    }
  }, [data?.categories]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.success("Categoria excluída");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setDeleteTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMutation = useMutation({
    mutationFn: (updates: { id: string; sortOrder: number }[]) => categoriesApi.reorder(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: (e: Error) => toast.error("Erro ao salvar ordem: " + e.message),
  });

  const toggleExpand = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    const newTree = reorderTree(
      localCategories,
      source.droppableId,
      destination.droppableId,
      source.index,
      destination.index
    );
    setLocalCategories(newTree);
    
    const updates = extractSortOrders(newTree);
    reorderMutation.mutate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-3xl">Categorias</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie categorias e subcategorias dos produtos
          </p>
        </div>
        <Button asChild size="lg" className="gap-2 py-5 px-4 w-full sm:w-auto">
                <Link href="/dashboard/admin/categories/new">
            <PlusCircle className="h-4 w-4" />
            Nova Categoria
          </Link>
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
          <div className="hidden lg:grid grid-cols-[2fr_140px_120px_80px_80px_100px_120px] gap-2 border-b border-white/10 px-4 py-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
            <span>Nome</span>
            <span>Slug</span>
            <span>Tipo</span>
            <span>Imagem</span>
            <span>Banner</span>
            <span>Navbar</span>
            <span className="text-right">Ações</span>
          </div>

          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !localCategories.length ? (
            <div className="flex h-60 flex-col items-center justify-center gap-3 px-6 text-center">
              <FolderTree className="h-10 w-10 text-zinc-600" />
              <div>
                <p className="text-white font-medium">Nenhuma categoria cadastrada</p>
                <p className="text-sm text-muted-foreground">
                  Crie sua primeira categoria para começar a organizar os produtos.
                </p>
              </div>
              <Button asChild className="mt-2 gap-2">
                      <Link href="/dashboard/admin/categories/new">
                  <Plus className="h-4 w-4" />
                  Nova Categoria
                </Link>
              </Button>
            </div>
          ) : (
            <Droppable droppableId="root" type="GROUP">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps}>
                  {localCategories.map((cat, index) => (
                    <CategoryRow
                      key={cat.id}
                      category={cat}
                      depth={0}
                      index={index}
                      expanded={expanded}
                      onToggle={toggleExpand}
                      onEdit={(c) => router.push(`/dashboard/admin/categories/${c.id}/edit`)}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      </DragDropContext>

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryRow({ category, depth, index, expanded, onToggle, onEdit, onDelete, }: {
  category: Category;
  depth: number;
  index: number;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const subcategories = category.subcategories ?? [];
  const hasChildren = subcategories.length > 0;
  const isOpen = expanded[category.id] ?? true;
  const productCount = category._count?.products ?? 0;
  const isSubcategory = !!category.parentId;

  return (
    <Draggable draggableId={category.id} index={index}>
      {(dragProv) => (
        <div ref={dragProv.innerRef} {...(dragProv.draggableProps as any)}>
          <div
            className="lg:hidden border-b border-white/5 px-3 py-3 transition-colors hover:bg-white/5"
            style={{ marginLeft: depth * 12 }}
            onClick={() => onEdit(category)}
          >
            <div className="flex items-start gap-2">
              <div
                {...dragProv.dragHandleProps}
                className="cursor-grab rounded p-1 text-zinc-500 shrink-0 mt-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                <TbGridDots className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {hasChildren ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(category.id);
                      }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-400"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : null}
                  <p className="font-medium text-white text-sm truncate">{category.name}</p>
                </div>
                <p className="text-xs text-zinc-500 font-mono mt-0.5">/{category.slug}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {isSubcategory ? (
                    <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[10px]">
                      Subcategoria
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[10px]">
                      Categoria
                    </Badge>
                  )}
                  {category.showInNavbar ? (
                    <Badge className="bg-green-500/15 text-green-400 text-[10px]">Navbar</Badge>
                  ) : null}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-zinc-400"
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={productCount > 0 || hasChildren}
                    onClick={() => onDelete(category)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div
            className="hidden lg:grid grid-cols-[2fr_140px_120px_80px_80px_100px_120px] items-center gap-2 px-4 py-3 transition-colors hover:bg-white/5 cursor-pointer"
            style={{ paddingLeft: 16 + depth * 24 }}
            onClick={() => onEdit(category)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                {...dragProv.dragHandleProps}
                className="cursor-grab hover:bg-white/10 p-1 rounded text-zinc-500"
                onClick={(e) => e.stopPropagation()}
              >
                <TbGridDots className="h-5 w-5" />
              </div>

              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggle(category.id);
                  }}
                  className="flex h-8 w-8 items-center cursor-pointer justify-center rounded text-zinc-400 hover:bg-white/5"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              ) : (
                <span className="w-6" />
              )}

              <div className="min-w-0 flex flex-col justify-center">
                <div className="text-white text-sm truncate">{category.name}</div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 font-mono truncate">/{category.slug}</div>

            <div>
              {isSubcategory ? (
                <Badge variant="outline" className="border-purple-500/30 text-purple-400">
                  <Layers className="mr-1 h-3 w-3" />
                  Subcategoria
                </Badge>
              ) : (
                <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                  <FolderTree className="mr-1 h-3 w-3" />
                  Categoria
                </Badge>
              )}
            </div>

            <div className="flex justify-center">
              {category.imageUrl ? (
                <Badge variant="outline" className="border-green-500/30 text-green-400">
                  ✓
                </Badge>
              ) : (
                <ImageIcon className="h-4 w-4 text-zinc-700" />
              )}
            </div>

            <div className="flex justify-center">
              {category.bannerUrl ? (
                <Badge variant="outline" className="border-green-500/30 text-green-400">
                  ✓
                </Badge>
              ) : (
                <ImageIcon className="h-4 w-4 text-zinc-700" />
              )}
            </div>

            <div>
              {category.showInNavbar ? (
                <Badge className="bg-green-500/15 text-green-400 hover:bg-green-500/15">
                  <Eye className="mr-1 h-3 w-3" />
                  Sim
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <EyeOff className="mr-1 h-3 w-3" />
                  Não
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Categoria
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toast.info("Em breve: Clonar categoria", { description: "Funcionalidade de clonagem será adicionada na próxima sprint." });
                  }}>
                    <Copy className="mr-2 h-4 w-4" />
                    Clonar Categoria
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    navigator.clipboard.writeText(category.id);
                    toast.success("ID copiado para a área de transferência!");
                  }}>
                    <Hash className="mr-2 h-4 w-4" />
                    Copiar ID do Pacote
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={productCount > 0 || hasChildren}
                    onClick={() => onDelete(category)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {hasChildren && isOpen && (
            <Droppable droppableId={category.id} type="GROUP">
              {(dropProv) => (
                <div ref={dropProv.innerRef} {...dropProv.droppableProps}>
                  {subcategories.map((child, i) => (
                    <CategoryRow
                      key={child.id}
                      category={child}
                      depth={depth + 1}
                      index={i}
                      expanded={expanded}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                  {dropProv.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
}