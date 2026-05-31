"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { categoriesApi, type Category } from "@/lib/admin-api";


const slugify = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-\s]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(80, "Máximo 80 caracteres"),
  parentId: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  showInNavbar: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  category?: Category | null;
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories", "flat"],
    queryFn: () => categoriesApi.listFlat(),
  });

  const availableParents = useMemo(() => {
    const all = catData?.categories ?? [];
    return all.filter((c) => c.id !== category?.id && !c.parentId);
  }, [catData, category]);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: category ? {
      name: category.name,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
      bannerUrl: category.bannerUrl,
      showInNavbar: category.showInNavbar,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    } : {
      name: "",
      parentId: null,
      imageUrl: null,
      bannerUrl: null,
      showInNavbar: false,
      isActive: true,
      sortOrder: 0,
    },
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const nameValue = form.watch("name");
  const slugPreview = useMemo(
    () => (isEditing ? category!.slug : slugify(nameValue || "")),
    [nameValue, isEditing, category]
  );

  const mutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      isEditing && category
        ? categoriesApi.update(category.id, values)
        : categoriesApi.create(values),
    onSuccess: () => {
      toast.success(isEditing ? "Categoria atualizada" : "Categoria criada");
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      if (category?.id) {
        queryClient.invalidateQueries({ queryKey: ["admin", "category", category.id] });
      }
      router.push("/dashboard/admin/products");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (values: CategoryFormValues) => {
    mutation.mutate(values);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/dashboard/admin/products" aria-label="Voltar">
              <ChevronLeft className="h-4 w-4 text-white" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? "Editar categoria" : "Nova categoria"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing
                ? ``
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="px-5 py-4 cursor-pointer" onClick={() => router.push("/dashboard/admin/products")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="gap-2 px-5 py-4 cursor-pointer">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 hidden" />
            )}
            {isEditing ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Informações</h2>
              <p className="text-xs text-muted-foreground">
                Identidade e hierarquia da categoria
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <input
                id="name"
                placeholder="Ex: PlayStation"
                className="w-full rounded-lg mt-1 border border-white/10 bg-card px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-none transition-all duration-300"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Vincular a uma categoria</Label>
              <Controller
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  >
                    <SelectTrigger className="w-full cursor-pointer rounded-lg mt-1 border border-white/10 bg-card px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-none transition-all duration-300">
                      <SelectValue placeholder="Nenhuma categoria selecionada" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="cursor-pointer">Nenhuma categoria selecionada</SelectItem>
                      {availableParents.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="cursor-pointer">
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-zinc-500">
                Selecionar um pai transforma esta categoria em uma subcategoria.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Imagens</h2>
              <p className="text-xs text-muted-foreground">
                Miniatura (navbar) e banner horizontal do carousel de subcategorias
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Miniatura</Label>
                <Controller
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      aspectRatio="portrait"
                      uploadType="product"
                      recommendation="Navbar / listagens — 190×255px (máx. 10MB)"
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400">Banner horizontal</Label>
                <Controller
                  control={form.control}
                  name="bannerUrl"
                  render={({ field }) => (
                    <ImageUpload
                      value={field.value}
                      onChange={field.onChange}
                      aspectRatio="banner"
                      uploadType="banner"
                      recommendation="Carousel — 820×200px ou 1200×300px (máx. 10MB)"
                    />
                  )}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Exibição</h2>
              <p className="text-xs text-muted-foreground">
                Controle onde a categoria aparece
              </p>
            </div>

            <Controller
              control={form.control}
              name="showInNavbar"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                  <div>
                    <Label htmlFor="show-navbar">Exibir na Navbar</Label>
                    <p className="text-xs text-zinc-500 mt-1">
                      A categoria só aparece no menu se ativado
                    </p>
                  </div>
                  <Switch
                    id="show-navbar"
                    checked={!!field.value}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                  <div>
                    <Label htmlFor="active">Ativa</Label>
                    <p className="text-xs text-zinc-500 mt-1">
                      Desativada não aparece em nenhuma listagem
                    </p>
                  </div>
                  <Switch
                    id="active"
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                  />
                </div>
              )}
            />
          </section>
        </div>
      </div>
    </form>
  );
}
