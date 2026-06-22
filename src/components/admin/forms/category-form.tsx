"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

import { ArrowLeft, Check, ChevronLeft, Loader2, Save, X, } from "lucide-react";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { Switch } from "@/components/ui/switch";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={() => router.push("/dashboard/admin/products")}>
            Cancelar
          </Button>

          <Button
            type="submit"
            size="lg"
            disabled={mutation.isPending}>
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
        <section className="rounded-md border border-white/5 bg-card">
          <div className="border-b border-white/5 py-3 px-4">
            <h2 className="text-sm font-semibold text-white">Informações</h2>
          </div>

          <div className="px-4 py-3">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Ex: PlayStation"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="px-4 py-2">
            <Label>Atribuir categoria <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Controller
              control={form.control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                >
                  <SelectTrigger>
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
          </div>

          <div className="flex flex-col sm:flex-row gap-4 p-4">
            <div className="flex-1 space-y-2">
              <Label className="text-white/80">Miniatura</Label>
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    aspectRatio="square"
                    uploadType="product"
                    recommendation="190×255px (máx. 10MB)"
                  />
                )}
              />
            </div>

            <div className="flex-2 space-y-2">
              <Label className="text-white/80">Banner horizontal</Label>
              <Controller
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    aspectRatio="auto"
                    uploadType="banner"
                    recommendation="820×200px ou 1200×300px (máx. 10MB)"
                  />
                )}
              />
            </div>
          </div>
        </section>

        <div className="space-y-2">
          <section className="rounded-md border border-white/5 bg-card">
            <div className="border-b border-white/5 py-3 px-4">
              <h2 className="text-sm font-semibold text-white">Configurações</h2>
            </div>

            <div className="px-4 py-3 space-y-4">
              <Controller
                control={form.control}
                name="showInNavbar"
                render={({ field }) => (
                  <div className="flex items-center gap-4 rounded-md">
                    <Toggle
                      id="show-navbar"
                      variant="default"
                      size="sm"
                      pressed={field.value ?? false}
                      onPressedChange={field.onChange}
                    >
                      {field.value ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Toggle>

                    <div>
                      <Label htmlFor="show-navbar" className="cursor-pointer">
                        {field.value ? "Exibindo na Navbar" : "Oculto na Navbar"}
                      </Label>
                      <p className="text-xs text-white/50">
                        Controla se a categoria aparece no menu superior da loja.
                      </p>
                    </div>
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center rounded-md gap-4">
                    <Toggle
                      id="active"
                      variant="default"
                      size="sm"
                      pressed={field.value ?? false}
                      onPressedChange={field.onChange}
                    >
                      {field.value ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Toggle>

                    <div>
                      <Label htmlFor="active" className="cursor-pointer">
                        {field.value ? "Categoria Ativa" : "Categoria Inativa"}
                      </Label>
                      <p className="text-xs text-white/50">
                        {field.value 
                          ? "A categoria e seus produtos estão visíveis na loja." 
                          : "A categoria está oculta e os produtos não serão exibidos."}
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
