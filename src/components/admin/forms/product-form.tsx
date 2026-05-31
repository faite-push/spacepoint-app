"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm, Controller, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, Save, X, Info } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { RichEditor } from "@/components/admin/shared/rich-editor";
import { ProductPackageNav } from "@/components/admin/layout/product-package-nav";
import { categoriesApi, productsApi, type AdminProduct, type Category, type ProductPayload } from "@/lib/admin-api";
import { API_URL, getCsrfToken } from "@/lib/api";

const slugify = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  comparePrice: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  imageUrl: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional(),
  isVisible: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.any().nullable().optional(),
  stockEnabled: z.boolean().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  minQuantityEnabled: z.boolean().optional(),
  minPurchaseQuantity: z.coerce.number().int().min(1).optional(),
  limitMaxEnabled: z.boolean().optional(),
  maxPurchaseQuantity: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  onePurchasePerUser: z.boolean().optional(),
  deliveryType: z.enum(["automatic_lines", "file", "manual_chat", "mixed"]),
  digitalLines: z.string().optional(),
  digitalFileUrl: z.string().nullable().optional(),
  manualDeliveryNote: z.string().optional(),
  postPurchaseInstructions: z.any().nullable().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function buildDefaults(p: AdminProduct | null): ProductFormValues {
  return {
    name: p?.name ?? "",
    price: p ? Number(p.price) : (undefined as unknown as number),
    comparePrice: p?.comparePrice ? Number(p.comparePrice) : "",
    imageUrl: p?.imageUrl ?? null,
    gallery: p?.gallery ?? [],
    isVisible: p?.isVisible ?? true,
    categoryId: p?.categoryId ?? p?.category?.id ?? null,
    description: p?.description ?? null,
    stockEnabled: (p?.stockQuantity ?? 0) > 0,
    stockQuantity: p?.stockQuantity ?? 0,
    minQuantityEnabled: (p?.minPurchaseQuantity ?? 1) > 1,
    minPurchaseQuantity: p?.minPurchaseQuantity ?? 1,
    limitMaxEnabled: p?.maxPurchaseQuantity != null,
    maxPurchaseQuantity: p?.maxPurchaseQuantity ?? "",
    onePurchasePerUser: p?.onePurchasePerUser ?? false,
    deliveryType: p?.deliveryType ?? "automatic_lines",
    digitalLines: (p?.digitalLines ?? []).join("\n"),
    digitalFileUrl: p?.digitalFileUrl ?? null,
    manualDeliveryNote: p?.manualDeliveryNote ?? "",
    postPurchaseInstructions: p?.postPurchaseInstructions ?? null,
  };
}

export function ProductForm({
  product,
  variantCount = 0,
}: {
  product?: AdminProduct | null;
  variantCount?: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories", "flat"],
    queryFn: () => categoriesApi.listFlat(),
  });
  const categories = catData?.categories ?? [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: buildDefaults(product ?? null),
  });

  useEffect(() => {
    if (product && categories.length > 0) {
      const currentCategoryId = form.getValues("categoryId");
      if (!currentCategoryId) {
        const resolvedCategoryId = product.categoryId ?? product.category?.id ?? null;
        form.setValue("categoryId", resolvedCategoryId, { shouldDirty: false });
      }
    }
  }, [categories.length, product, form]);

  const nameValue = form.watch("name");
  const slugPreview = useMemo(
    () => (isEditing ? product!.slug : slugify(nameValue || "")),
    [nameValue, isEditing, product]
  );

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const payload: ProductPayload = {
        name: values.name,
        price: values.price,
        comparePrice:
          typeof values.comparePrice === "number" ? values.comparePrice : null,
        imageUrl: values.imageUrl ?? null,
        gallery: values.gallery ?? [],
        isVisible: values.isVisible,
        categoryId: values.categoryId || null,
        description: values.description,
        stockQuantity: values.stockEnabled ? (values.stockQuantity ?? 0) : 0,
        minPurchaseQuantity: values.minQuantityEnabled
          ? values.minPurchaseQuantity ?? 1
          : 1,
        maxPurchaseQuantity:
          values.limitMaxEnabled && typeof values.maxPurchaseQuantity === "number"
            ? values.maxPurchaseQuantity
            : null,
        onePurchasePerUser: values.onePurchasePerUser,
        deliveryType: values.deliveryType,
        digitalLines: (values.digitalLines ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        digitalFileUrl: values.digitalFileUrl ?? null,
        manualDeliveryNote: values.manualDeliveryNote || null,
        postPurchaseInstructions: values.postPurchaseInstructions,
      };

      return isEditing && product
        ? productsApi.update(product.id, payload)
        : productsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Produto atualizado" : "Produto criado");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      router.push("/dashboard/admin/products");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (values: ProductFormValues) => {
    if (isEditing && variantCount > 0 && values.stockEnabled) {
      toast.warning(
        "Este pacote possui variantes. O estoque é controlado em cada variante."
      );
    }
    mutation.mutate(values);
  };

  const onInvalid = () => {
    toast.error("Corrija os campos destacados antes de salvar");
  };

  const categoryId = form.watch("categoryId");
  const rootCategories = useMemo(
    () => categories.filter((c) => !c.parentId),
    [categories]
  );
  const { selectedRootId, subCategories } = useMemo(() => {
    const current = categories.find((c) => c.id === categoryId);
    if (!current) return { selectedRootId: "none", subCategories: [] };
    if (!current.parentId) {
      return {
        selectedRootId: current.id,
        subCategories: categories.filter((c) => c.parentId === current.id),
      };
    }
    return {
      selectedRootId: current.parentId,
      subCategories: categories.filter((c) => c.parentId === current.parentId),
    };
  }, [categories, categoryId]);

  const handleRootCategoryChange = (v: string) => {
    if (v === "none") {
      form.setValue("categoryId", null, { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("categoryId", v, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handleSubCategoryChange = (v: string) => {
    if (v === "none" || v === selectedRootId) {
      form.setValue("categoryId", selectedRootId === "none" ? null : selectedRootId, { shouldValidate: true, shouldDirty: true });
    } else {
      form.setValue("categoryId", v, { shouldValidate: true, shouldDirty: true });
    }
  };

  const limitMax = form.watch("limitMaxEnabled");
  const stockEnabled = form.watch("stockEnabled");
  const minQEnabled = form.watch("minQuantityEnabled");
  
  const digitalLines = form.watch("digitalLines") ?? "";
  const digitalFileUrl = form.watch("digitalFileUrl");
  const lineCount = digitalLines.split("\n").filter((l) => l.trim()).length;

  const handleUploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo maior que 10MB");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API_URL}/v1/cdn/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": getCsrfToken() },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      form.setValue("digitalFileUrl", data.url);
      toast.success("Arquivo enviado");
    } catch {
      toast.error("Falha no upload");
    }
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="space-y-6"
    >
      <div className="space-y-4">
        {isEditing && product && <ProductPackageNav productId={product.id} />}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-transparent">
            <Link href="/dashboard/admin/products" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEditing ? "Editar pacote" : "Adicionar pacote"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && product?.slug && (
            <Button asChild type="button" variant="outline" className="px-5 py-4 gap-2">
              <Link href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Ver na loja
              </Link>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            className="px-5 py-4 cursor-pointer"
            onClick={() => router.push("/dashboard/admin/products")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="gap-2 px-5 py-4">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 hidden" />
            )}
            {isEditing ? "Salvar alterações" : "Criar produto"}
          </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name" className="text-zinc-400 font-medium tracking-wider">Nome:</Label>
                  <Input
                    id="p-name"
                    placeholder="Nome do produto..."
                    className="bg-[#0A0A0A] border-white/10 h-10"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 font-medium tracking-wider">Categoria:</Label>
                  <div className="flex flex-col gap-2">
                    <Select
                      value={selectedRootId}
                      onValueChange={handleRootCategoryChange}
                    >
                      <SelectTrigger className="bg-[#0A0A0A] border-white/10 h-10 w-full">
                        <SelectValue placeholder="Selecionar categoria principal..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {rootCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {subCategories.length > 0 && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-zinc-500 font-medium tracking-wider mb-1 block">Refinar por subcategoria: (opcional)</Label>
                        <Select
                          value={categoryId || selectedRootId}
                          onValueChange={handleSubCategoryChange}
                        >
                          <SelectTrigger className="bg-[#0A0A0A] border-white/10 h-10 w-full">
                            <SelectValue placeholder="Subcategoria..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={selectedRootId}>
                              Nenhuma (Manter {categories.find((c) => c.id === selectedRootId)?.name})
                            </SelectItem>
                            {subCategories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <RichEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Descreva o produto..."
                      minHeight={300}
                    />
                  )}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0A0A0A]">
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1 group relative w-max">
                    <Label htmlFor="p-compare" className="text-zinc-400 font-medium tracking-wider">Preço comparativo: <span className="text-zinc-500 font-normal underline decoration-dashed">(opcional)</span></Label>
                    <Info className="h-4 w-4 text-zinc-500 cursor-help transition-colors group-hover:text-zinc-300" />
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 rounded-lg bg-[#1A1A1A] border border-white/10 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-xs text-zinc-300 leading-relaxed font-normal whitespace-normal">
                        Preço original usado como referência para destacar descontos ou promoções.
                      </p>
                    </div>
                  </div>
                  <Input
                    id="p-compare"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    min="0"
                    className="bg-[#0A0A0A] border-white/10 h-10"
                    {...form.register("comparePrice", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-price" className="text-zinc-400 font-medium tracking-wider">Preço:</Label>
                  <Input
                    id="p-price"
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    min="0"
                    className="bg-[#0A0A0A] border-white/10 h-10"
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-white/10 w-full" />

              <Controller
                control={form.control}
                name="limitMaxEnabled"
                render={({ field }) => (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <Label className="font-semibold text-sm">Limite de quantidade</Label>
                      <p className="text-xs text-zinc-500">
                        Não permite que o cliente aumente a quantidade deste produto no ato da compra.
                      </p>
                    </div>
                    <Switch
                      checked={!!field.value}
                      onCheckedChange={(v) => {
                        field.onChange(v);
                        if (!v) form.setValue("maxPurchaseQuantity", "");
                      }}
                    />
                  </div>
                )}
              />
              {limitMax && (
                 <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                   <Label htmlFor="max-q">Quantidade máxima por pedido:</Label>
                   <Input id="max-q" type="number" placeholder="1" min="1" className="bg-[#0A0A0A] border-white/10" {...form.register("maxPurchaseQuantity", { valueAsNumber: true })} />
                 </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <Tabs defaultValue="instrucoes" className="w-full">
              <TabsList className="w-full flex justify-start rounded-none border-b border-white/10 bg-[#0A0A0A] h-auto p-0">
                <TabsTrigger value="instrucoes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Instruções</TabsTrigger>
                <TabsTrigger value="linhas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Linhas</TabsTrigger>
                <TabsTrigger value="arquivo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Arquivo</TabsTrigger>
                <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Chat</TabsTrigger>
                <TabsTrigger value="discord" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Discord</TabsTrigger>
              </TabsList>
              
              <div className="p-6">
                <TabsContent value="instrucoes" className="mt-0 space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-white">Instruções</h3>
                    <p className="text-xs text-zinc-500">Mostre o conteúdo ao comprador após a finalização da compra.</p>
                  </div>
                  
                  <div className="py-2 space-y-2">
                     <Label className="text-xs font-semibold text-zinc-400">TIPO DE ENTREGA (SISTEMA)</Label>
                     <Controller
                       control={form.control}
                       name="deliveryType"
                       render={({ field }) => (
                         <Select value={field.value} onValueChange={field.onChange}>
                           <SelectTrigger className="max-w-xs bg-[#0A0A0A] border-white/10">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="automatic_lines">Automática (linhas)</SelectItem>
                             <SelectItem value="file">Arquivo</SelectItem>
                             <SelectItem value="manual_chat">Manual via Chat</SelectItem>
                             <SelectItem value="mixed">Mista</SelectItem>
                           </SelectContent>
                         </Select>
                       )}
                     />
                  </div>

                  <Controller
                    control={form.control}
                    name="postPurchaseInstructions"
                    render={({ field }) => (
                      <RichEditor
                        value={field.value}
                        onChange={field.onChange}
                        placeholder=""
                        minHeight={160}
                      />
                    )}
                  />
                </TabsContent>

                <TabsContent value="linhas" className="mt-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Linhas digitais</h3>
                      <p className="text-xs text-zinc-500">1 código/item por linha</p>
                    </div>
                    <Badge variant="outline">{lineCount} linha(s)</Badge>
                  </div>
                  <Textarea
                    rows={8}
                    className="font-mono text-sm bg-[#0A0A0A] border-white/10"
                    placeholder={"XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY\n..."}
                    {...form.register("digitalLines")}
                  />
                </TabsContent>

                <TabsContent value="arquivo" className="mt-0 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Arquivo de entrega</h3>
                    <p className="text-xs text-zinc-500">Upload de arquivo para download do usuário</p>
                  </div>
                  {digitalFileUrl ? (
                    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                      <a href={digitalFileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary truncate hover:underline">{digitalFileUrl}</a>
                      <Button type="button" variant="ghost" size="icon" onClick={() => form.setValue("digitalFileUrl", null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 hover:border-primary/50 transition-colors duration-200">
                      <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); e.target.value = ""; }} />
                      <p className="text-sm text-zinc-300">Clique para enviar arquivo</p>
                      <p className="text-xs text-zinc-500">Máximo 10MB</p>
                    </label>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="mt-0 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Manual via Chat</h3>
                    <p className="text-xs text-zinc-500">Instruções para a equipe atender este pedido no chat.</p>
                  </div>
                  <Textarea rows={5} placeholder="Ex: Ao receber pedido, gerar código..." className="bg-[#0A0A0A] border-white/10" {...form.register("manualDeliveryNote")} />
                </TabsContent>
                
                <TabsContent value="discord" className="mt-0 space-y-4">
                  <p className="text-sm text-zinc-500">Integração do Discord ainda não configurada.</p>
                </TabsContent>

              </div>
            </Tabs>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
            <Label className="block mb-2 font-semibold text-sm">Imagem: <span className="text-zinc-500 font-normal">(opcional)</span></Label>
            <Controller
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  aspectRatio="square"
                  uploadType="product"
                  recommendation="Recomendado: 800x800px. Máximo 10MB."
                />
              )}
            />
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] px-6 py-4 space-y-4">
            <Label className="font-semibold text-sm">Visibilidade:</Label>
            <Controller
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <Select value={field.value ? "visible" : "hidden"} onValueChange={(v) => field.onChange(v === "visible")}>
                  <SelectTrigger className="bg-[#0A0A0A] border-white/10 h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visible">Visível</SelectItem>
                    <SelectItem value="hidden">Oculto</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-4">
            <Controller
              control={form.control}
              name="stockEnabled"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="font-semibold text-sm">Estoque:</Label>
                    <p className="text-xs text-zinc-500">Ativar estoque deste produto</p>
                  </div>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-4">
            <Controller
              control={form.control}
              name="minQuantityEnabled"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="font-semibold text-sm">Quantidade mínima:</Label>
                    <p className="text-xs text-zinc-500">Definir quantidade mínima de compra</p>
                  </div>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            {minQEnabled && (
               <div className="pt-4 border-t border-white/10 space-y-2">
                 <Label>Mínimo:</Label>
                 <Input type="number" min="1" className="bg-[#0A0A0A] border-white/10" {...form.register("minPurchaseQuantity", { valueAsNumber: true })} />
               </div>
            )}
          </section>

          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-4">
            <Controller
              control={form.control}
              name="onePurchasePerUser"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="font-semibold text-sm">Limites:</Label>
                    <p className="text-xs text-zinc-500">Permitir apenas uma compra por usuário</p>
                  </div>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </section>
        </aside>
      </div>
    </form>
  );
}
