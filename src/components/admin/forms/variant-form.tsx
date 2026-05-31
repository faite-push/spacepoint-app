"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichEditor } from "@/components/admin/shared/rich-editor";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { ProductPackageNav } from "@/components/admin/layout/product-package-nav";
import { variantsApi, type ProductVariant, type ProductVariantPayload, type DeliveryType } from "@/lib/admin-api";
import { API_URL, getCsrfToken } from "@/lib/api";

const variantSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  sku: z.string().max(64).optional().nullable(),
  description: z.any().optional().nullable(),
  price: z.number({ invalid_type_error: "Preço obrigatório" }).min(0),
  comparePrice: z.union([z.number().min(0), z.literal(""), z.null()]).optional(),
  imageUrl: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional(),
  isVisible: z.boolean(),
  isActive: z.boolean(),
  stockEnabled: z.boolean(),
  stockQuantity: z.union([z.number().int().min(0), z.null()]).optional(),
  minQuantityEnabled: z.boolean(),
  minPurchaseQuantity: z.union([z.number().int().min(1), z.null()]).optional(),
  limitMaxEnabled: z.boolean(),
  maxPurchaseQuantity: z.union([z.number().int().min(1), z.literal(""), z.null()]).optional(),
  onePurchasePerUser: z.boolean(),
  deliveryType: z.enum(["automatic_lines", "file", "manual_chat", "mixed"]),
  digitalLines: z.string().optional(),
  digitalFileUrl: z.string().nullable().optional(),
  manualDeliveryNote: z.string().optional(),
  postPurchaseInstructions: z.any().optional().nullable(),
});

type VariantFormValues = z.infer<typeof variantSchema>;

function buildDefaults(v: ProductVariant | null | undefined): VariantFormValues {
  return {
    name: v?.name ?? "",
    sku: v?.sku ?? "",
    description: v?.description ?? null,
    price: v ? Number(v.price) : (0 as number),
    comparePrice: v?.comparePrice != null ? Number(v.comparePrice) : "",
    imageUrl: v?.imageUrl ?? null,
    gallery: v?.gallery ?? [],
    isVisible: v?.isVisible ?? true,
    isActive: v?.isActive ?? true,
    stockEnabled: v ? v.stockQuantity > 0 : false,
    stockQuantity: v?.stockQuantity ?? 0,
    minQuantityEnabled: v ? v.minPurchaseQuantity > 1 : false,
    minPurchaseQuantity: v?.minPurchaseQuantity ?? 1,
    limitMaxEnabled: v?.maxPurchaseQuantity != null,
    maxPurchaseQuantity: v?.maxPurchaseQuantity ?? "",
    onePurchasePerUser: v?.onePurchasePerUser ?? false,
    deliveryType: v?.deliveryType ?? "automatic_lines",
    digitalLines: v?.digitalLines?.join("\n") ?? "",
    digitalFileUrl: v?.digitalFileUrl ?? null,
    manualDeliveryNote: v?.manualDeliveryNote ?? "",
    postPurchaseInstructions: v?.postPurchaseInstructions ?? null,
  };
}

export function VariantForm({
  productId,
  productName,
  variant,
}: {
  productId: string;
  productName: string;
  variant?: ProductVariant | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!variant;

  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: buildDefaults(variant ?? null),
  });

  const mutation = useMutation({
    mutationFn: (values: VariantFormValues) => {
      const payload: ProductVariantPayload = {
        name: values.name,
        sku: values.sku?.trim() || null,
        description: values.description,
        price: values.price,
        comparePrice: typeof values.comparePrice === "number" ? values.comparePrice : null,
        imageUrl: values.imageUrl ?? null,
        gallery: values.gallery ?? [],
        isVisible: values.isVisible,
        isActive: values.isActive,
        stockQuantity: values.stockEnabled ? (values.stockQuantity ?? 0) : 0,
        minPurchaseQuantity: values.minQuantityEnabled ? (values.minPurchaseQuantity ?? 1) : 1,
        maxPurchaseQuantity:
          values.limitMaxEnabled && typeof values.maxPurchaseQuantity === "number"
            ? values.maxPurchaseQuantity
            : null,
        onePurchasePerUser: values.onePurchasePerUser,
        deliveryType: values.deliveryType as DeliveryType,
        digitalLines: (values.digitalLines ?? "")
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        digitalFileUrl: values.digitalFileUrl ?? null,
        manualDeliveryNote: values.manualDeliveryNote || null,
        postPurchaseInstructions: values.postPurchaseInstructions,
      };

      return isEditing && variant
        ? variantsApi.update(productId, variant.id, payload)
        : variantsApi.create(productId, payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Variante atualizada" : "Variante criada");
      queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      router.push(`/dashboard/admin/products/${productId}/variants`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (values: VariantFormValues) => mutation.mutate(values);
  const onInvalid = () => toast.error("Corrija os campos destacados antes de salvar");

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
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
      <div className="space-y-4">
        <ProductPackageNav productId={productId} />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 p-0 hover:bg-transparent">
              <Link href={`/dashboard/admin/products/${productId}/variants`} aria-label="Voltar">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Editar pacote
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isEditing ? "Editar variante" : "Nova variante"}
                {productName ? ` · ${productName}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
            type="button"
            variant="outline"
            className="px-5 py-4 cursor-pointer"
            onClick={() => router.push(`/dashboard/admin/products/${productId}/variants`)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="gap-2 px-5 py-4">
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 hidden" />}
            {isEditing ? "Salvar alterações" : "Criar variante"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Basic info */}
          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="v-name" className="text-zinc-400 font-medium tracking-wider">Nome:</Label>
                <Input
                  id="v-name"
                  placeholder="Nome da variante... (ex: 512GB Preto)"
                  className="bg-[#0A0A0A] border-white/10 h-10"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="v-sku" className="text-zinc-400 font-medium tracking-wider">SKU:</Label>
                <Input
                  id="v-sku"
                  placeholder="Ex: PS5-512-PRETO (opcional)"
                  className="bg-[#0A0A0A] border-white/10 h-10"
                  {...form.register("sku")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 font-medium tracking-wider">Preço (R$):</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    min="0"
                    className="bg-[#0A0A0A] border-white/10 h-10"
                    {...form.register("price", { valueAsNumber: true })}
                  />
                  {form.formState.errors.price && (
                    <p className="text-xs text-destructive">{form.formState.errors.price.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 font-medium tracking-wider">Preço original (riscado):</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    min="0"
                    className="bg-[#0A0A0A] border-white/10 h-10"
                    {...form.register("comparePrice", { setValueAs: (v) => (v === "" || v === null ? "" : Number(v)) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 font-medium tracking-wider">Descrição:</Label>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <RichEditor value={field.value} onChange={field.onChange} placeholder="Descrição da variante..." minHeight={120} />
                  )}
                />
              </div>
            </div>
          </section>

          {/* Delivery / Instructions tabs */}
          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
            <Tabs defaultValue="instrucoes" className="w-full">
              <TabsList className="w-full flex justify-start rounded-none border-b border-white/10 bg-[#0A0A0A] h-auto p-0">
                <TabsTrigger value="instrucoes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Instruções</TabsTrigger>
                <TabsTrigger value="linhas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Linhas</TabsTrigger>
                <TabsTrigger value="arquivo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Arquivo</TabsTrigger>
                <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-[#111] data-[state=active]:text-white px-6 py-4 shadow-none data-[state=active]:shadow-none text-white/90 font-medium cursor-pointer transition-none">Chat</TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="instrucoes" className="mt-0 space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-semibold text-white">Instruções pós-compra</h3>
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
                      <RichEditor value={field.value} onChange={field.onChange} placeholder="" minHeight={160} />
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
              </div>
            </Tabs>
          </section>
        </div>

        {/* Right column */}
        <aside className="space-y-4">
          {/* Image */}
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

          {/* Visibility */}
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

          {/* Stock */}
          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-4">
            <Controller
              control={form.control}
              name="stockEnabled"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="font-semibold text-sm">Estoque:</Label>
                    <p className="text-xs text-zinc-500">Ativar estoque desta variante</p>
                  </div>
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            {stockEnabled && (
              <div className="pt-4 border-t border-white/10 space-y-2">
                <Label>Quantidade em estoque:</Label>
                <Input type="number" min="0" className="bg-[#0A0A0A] border-white/10" {...form.register("stockQuantity", { valueAsNumber: true })} />
              </div>
            )}
          </section>

          {/* Min quantity */}
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

          {/* Max quantity */}
          <section className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6 space-y-4">
            <Controller
              control={form.control}
              name="limitMaxEnabled"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="font-semibold text-sm">Limite de quantidade</Label>
                    <p className="text-xs text-zinc-500">Não permite que o cliente aumente a quantidade no ato da compra.</p>
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
          </section>

          {/* One purchase per user */}
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
