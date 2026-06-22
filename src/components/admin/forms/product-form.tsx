"use client";

import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { z } from "zod";

import { ArrowLeft, Loader2, Save, X, Check, AlertCircle, Hash, UploadCloud, Star } from "lucide-react";
import { FaShippingFast } from "react-icons/fa";
import { BiSolidZap } from "react-icons/bi";
import { toast } from "sonner";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";

import { ProductPackageNav } from "@/components/admin/layout/product-package-nav";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { RichEditor } from "@/components/admin/shared/rich-editor";

import { categoriesApi, productsApi, type AdminProduct, type ProductPayload } from "@/lib/admin-api";
import { API_URL, getCsrfToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const slugify = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-\s]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(120),
  price: z.coerce.number().positive("Preço deve ser maior que zero"),
  comparePrice: z.union([z.coerce.number().positive(), z.literal(""), z.null()]).optional(),
  imageUrl: z.string().nullable().optional(),
  gallery: z.array(z.string()).optional(),
  isVisible: z.boolean().optional(),
  featured: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.any().nullable().optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  minPurchaseQuantity: z.coerce.number().int().min(1).optional(),
  limitMaxEnabled: z.boolean().optional(),
  maxPurchaseQuantity: z.union([z.coerce.number().int().min(1), z.literal(""), z.null()]).optional(),
  onePurchasePerUser: z.boolean().optional(),
  deliveryType: z.enum(["manual", "automatic_lines", "file", "manual_chat", "mixed", "automatic_text"]),
  digitalLines: z.string().optional(),
  digitalFileUrl: z.string().nullable().optional(),
  manualDeliveryNote: z.string().optional(),
  postPurchaseInstructions: z.any().nullable().optional(),

  uiDeliveryClass: z.enum(["manual", "automatic"]).optional(),
  uiProductFormat: z.enum(["text", "lines", "file"]).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function buildDefaults(p: AdminProduct | null): ProductFormValues {
  let deliveryType: ProductFormValues["deliveryType"];
  let uiDeliveryClass: "manual" | "automatic";
  let uiProductFormat: "text" | "lines" | "file";

  if (p) {
    if (p.deliveryType === "manual" || p.deliveryType === "manual_chat") {
      deliveryType = "manual";
      uiDeliveryClass = "manual";
      uiProductFormat = "text";
    } else if (p.deliveryType === "automatic_lines") {
      deliveryType = "automatic_lines";
      uiDeliveryClass = "automatic";
      uiProductFormat = "lines";
    } else if (p.deliveryType === "file") {
      deliveryType = "file";
      uiDeliveryClass = "automatic";
      uiProductFormat = "file";
    } else {
      deliveryType = "automatic_text";
      uiDeliveryClass = "automatic";
      uiProductFormat = "text";
    }
  } else {
    deliveryType = "automatic_lines";
    uiDeliveryClass = "automatic";
    uiProductFormat = "lines";
  }

  return {
    name: p?.name ?? "",
    price: p ? Number(p.price) : 1.00,
    comparePrice: p?.comparePrice ? Number(p.comparePrice) : "",
    imageUrl: p?.imageUrl || null,
    gallery: p?.gallery ?? [],
    isVisible: p?.isVisible ?? true,
    featured: p?.featured ?? false,
    categoryId: p?.categoryId ?? p?.category?.id ?? null,
    description: p?.description ?? null,
    stockQuantity: p?.stockQuantity ?? 0,
    minPurchaseQuantity: p?.minPurchaseQuantity ?? 1,
    limitMaxEnabled: p?.maxPurchaseQuantity != null,
    maxPurchaseQuantity: p?.maxPurchaseQuantity ?? "",
    onePurchasePerUser: p?.onePurchasePerUser ?? false,
    deliveryType,
    digitalLines: (p?.digitalLines ?? []).join("\n"),
    digitalFileUrl: p?.digitalFileUrl ?? null,
    manualDeliveryNote: p?.manualDeliveryNote ?? "",
    postPurchaseInstructions: p?.postPurchaseInstructions ?? null,
    uiDeliveryClass,
    uiProductFormat,
  };
}

export function ProductForm({ product, variantCount = 0, isModal = false, onCancel, onSuccess }: { product?: AdminProduct | null; variantCount?: number; isModal?: boolean; onCancel?: () => void; onSuccess?: (p: AdminProduct) => void; }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const queryCategoryId = searchParams.get("categoryId");
  const isEditing = !!product;
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories", "flat"],
    queryFn: () => categoriesApi.listFlat(),
  });

  const categories = catData?.categories ?? [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...buildDefaults(product ?? null),
      categoryId: product?.categoryId ?? product?.category?.id ?? queryCategoryId ?? null,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset(buildDefaults(product));
    }
  }, [product, form]);

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
      const parsedLines = (values.digitalLines ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const isLinesDelivery =
        values.deliveryType === "automatic_lines" ||
        (values.uiDeliveryClass === "automatic" && values.uiProductFormat === "lines");

      const payload: ProductPayload = {
        name: values.name,
        price: values.price,
        comparePrice:
          typeof values.comparePrice === "number" ? values.comparePrice : null,
        imageUrl: values.imageUrl ?? null,
        gallery: values.gallery ?? [],
        isVisible: values.isVisible,
        featured: values.featured,
        categoryId: values.categoryId || null,
        description: values.description,
        stockQuantity: isLinesDelivery ? parsedLines.length : (values.stockQuantity ?? 0),
        minPurchaseQuantity: values.minPurchaseQuantity ?? 1,
        maxPurchaseQuantity:
          typeof values.maxPurchaseQuantity === "number" && values.maxPurchaseQuantity > 0
            ? values.maxPurchaseQuantity
            : null,
        onePurchasePerUser: values.onePurchasePerUser,
        deliveryType: values.deliveryType,
        digitalLines: parsedLines,
        digitalFileUrl: values.digitalFileUrl ?? null,
        manualDeliveryNote: values.manualDeliveryNote || null,
        postPurchaseInstructions: values.postPurchaseInstructions,
      };

      return isEditing && product
        ? productsApi.update(product.id, payload)
        : productsApi.create(payload);
    },
    onSuccess: (savedProduct) => {
      toast.success(isEditing ? "Produto atualizado!" : "Produto criado!");
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);

      if (onSuccess && savedProduct) {
        onSuccess(savedProduct);
      } else if (!isEditing && savedProduct?.id) {
        router.push(`/dashboard/admin/products/${savedProduct.id}/edit`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (values: ProductFormValues) => {
    if (isEditing && variantCount > 0) {
      toast.warning(
        "Este pacote possui variantes. O estoque é controlado em cada variante."
      );
    }
    mutation.mutate(values);
  };

  const onInvalid = () => {
    toast.error("Corrija os campos destacados antes de salvar");
  };

  const uiDeliveryClass = form.watch("uiDeliveryClass");
  const uiProductFormat = form.watch("uiProductFormat");
  const digitalLines = form.watch("digitalLines") ?? "";
  const lineCount = digitalLines.split("\n").filter((l) => l.trim()).length;

  const isManual = uiDeliveryClass === "manual";
  const isAutoLines = uiDeliveryClass === "automatic" && uiProductFormat === "lines";
  const isAutoText = uiDeliveryClass === "automatic" && uiProductFormat === "text";
  const isAutoFile = uiDeliveryClass === "automatic" && uiProductFormat === "file";

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
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className={cn("space-y-6", isModal && "py-4")}>
      {!isModal && (
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
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => {
                  if (onCancel) onCancel();
                  else router.push("/dashboard/admin/products");
                }}
              >
                Cancelar
              </Button>

              <Button type="submit" size="lg" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : savedSuccess ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : null}
                {isEditing
                  ? savedSuccess ? "Salvo!" : "Salvar alterações"
                  : savedSuccess ? "Criado!" : "Criar produto"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModal && (
        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="min-w-[120px]"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : savedSuccess ? (
              <Check className="h-4 w-4 mr-2" />
            ) : null}
            {savedSuccess ? "Salvo!" : "Salvar"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-4">
          <section className="rounded-md border border-white/5 bg-card overflow-hidden">
            <div className="space-y-4">
              <div className="border-b border-white/5 py-3 px-4">
                <h2 className="text-sm font-semibold text-white">Informações</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 px-4">
                <div className="space-y-2">
                  <Label htmlFor="p-name" className="text-white/80 font-medium">Nome</Label>
                  <Input
                    id="p-name"
                    placeholder="Nome do produto..."
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-2 px-4">
                <Label htmlFor="p-description" className="text-white/80 font-medium">Descrição</Label>
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

            <div className="grid grid-cols-2 gap-4 p-4">
              <div>
                <Label htmlFor="p-price" className="text-white/80 font-medium tracking-wider">Valor</Label>
                <Controller
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <InputGroup>
                      <InputGroupInput
                        id="p-price"
                        type="text"
                        placeholder="0,00"
                        value={typeof field.value === "number" ? field.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          const num = val ? Number(val) / 100 : 0;
                          field.onChange(num);
                        }}
                      />
                      <InputGroupAddon>R$</InputGroupAddon>
                      {form.formState.errors.price && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.price.message}
                        </p>
                      )}
                    </InputGroup>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="p-compare" className="text-white/80 font-medium">Comparação <span className="text-zinc-500 text-xs">( Opcional )</span></Label>
                <Controller
                  control={form.control}
                  name="comparePrice"
                  render={({ field }) => (
                    <InputGroup>
                      <InputGroupInput
                        id="p-compare"
                        type="text"
                        placeholder="0,00"
                        value={typeof field.value === "number" ? field.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          const num = val ? Number(val) / 100 : 0;
                          field.onChange(num ? num : "");
                        }}
                      />
                      <InputGroupAddon>R$</InputGroupAddon>
                    </InputGroup>
                  )}
                />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-white/5 bg-card">
            <div className="border-b border-white/5 py-3 px-4">
              <h2 className="text-sm font-semibold text-white">Tipos de entrega</h2>
            </div>

            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white/80">Entrega</Label>
                <Controller
                  control={form.control}
                  name="uiDeliveryClass"
                  render={({ field }) => (
                    <div className="flex bg-white/1 gap-2 p-1 rounded-md">
                      <Button
                        type="button"
                        onClick={() => {
                          field.onChange("manual");
                          form.setValue("deliveryType", "manual");
                        }}
                        className={cn(
                          "flex-1 items-center justify-center gap-2 rounded-md h-10 transition-all duration-500 ease-in-out",
                          field.value === "manual"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-transparent text-white/80"
                        )}
                      >
                        <FaShippingFast className="h-4 w-4" />
                        <span className="font-medium text-sm">Manual</span>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          field.onChange("automatic");
                          const format = form.getValues("uiProductFormat");
                          form.setValue("deliveryType", format === "lines" ? "automatic_lines" : format === "file" ? "file" : "automatic_text");
                        }}
                        className={cn(
                          "flex-1 items-center justify-center gap-2 rounded-md h-10 transition-all duration-500 ease-in-out",
                          field.value === "automatic"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-transparent text-white/80"
                        )}
                      >
                        <BiSolidZap className="h-4 w-4" />
                        <span className="font-medium text-sm">Automática</span>
                      </Button>
                    </div>
                  )}
                />
              </div>

              {!isManual && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white/80">Formato do produto</Label>
                  <Controller
                    control={form.control}
                    name="uiProductFormat"
                    render={({ field }) => (
                      <div className="flex bg-white/1 gap-2 p-1 rounded-md">
                        <Button
                          type="button"
                          onClick={() => {
                            field.onChange("text");
                            form.setValue("deliveryType", "automatic_text");
                          }}
                          className={cn(
                            "flex-1 items-center justify-center gap-2 rounded-md h-10 transition-all duration-500 ease-in-out",
                            field.value === "text"
                              ? "bg-white/5 text-white"
                              : "bg-transparent text-white/80"
                          )}
                        >
                          <span className="font-semibold text-sm">Texto</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            field.onChange("lines");
                            form.setValue("deliveryType", "automatic_lines");
                          }}
                          className={cn(
                            "flex-1 items-center justify-center gap-2 rounded-md h-10 transition-all duration-500 ease-in-out",
                            field.value === "lines"
                              ? "bg-white/5 text-white"
                              : "bg-transparent text-white/80"
                          )}
                        >
                          <span className="font-semibold text-sm">Linhas</span>
                        </Button>
                        <Button
                          type="button"
                          onClick={() => {
                            field.onChange("file");
                            form.setValue("deliveryType", "file");
                          }}
                          className={cn(
                            "flex-1 items-center justify-center gap-2 rounded-md h-10 transition-all duration-500 ease-in-out",
                            field.value === "file"
                              ? "bg-white/5 text-white"
                              : "bg-transparent text-white/80"
                          )}
                        >
                          <span className="font-semibold text-sm">Arquivo</span>
                        </Button>
                      </div>
                    )}
                  />

                  <div className="flex items-start gap-2.5 px-1">
                    <AlertCircle className="h-4 w-4 text-white/50 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50">
                      {isAutoLines
                        ? "No modo ( LINHAS ), cada linha é um item independente retirado do estoque na compra."
                        : isAutoFile
                          ? "No modo ( ARQUIVO ), o comprador recebe um link direto para baixar o arquivo após a compra."
                          : "No modo ( TEXTO ), todo o conteúdo de estoque é enviado ao cliente após a compra."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-md border border-white/5 bg-card">
            <div className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Estoque</h2>
              {isAutoLines && (
                <Badge variant="outline" className="text-xs border-white/10 text-zinc-400 gap-1.5">
                  <Hash className="h-3 w-3" />
                  {lineCount} {lineCount === 1 ? "item" : "itens"}
                </Badge>
              )}
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className={cn(
                "grid gap-4",
                isAutoLines ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3"
              )}>
                {!isAutoLines && (
                  <div className="space-y-1.5">
                    <Label htmlFor="s-quantity" className="text-sm font-medium text-white/80">
                      Qtd. em estoque
                    </Label>
                    <Input
                      id="s-quantity"
                      type="number"
                      placeholder="0"
                      {...form.register("stockQuantity", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-zinc-500">
                      Deixe 0 para ilimitado.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="cfg-min-qty" className="text-sm font-medium text-white/80">
                    Qtd. mínima
                  </Label>
                  <Input
                    id="cfg-min-qty"
                    type="number"
                    min="1"
                    placeholder="1"
                    {...form.register("minPurchaseQuantity", { valueAsNumber: true })}
                  />
                  <p className="text-xs text-zinc-500">Mínimo por pedido</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cfg-max-qty" className="text-sm font-medium text-white/80">
                    Qtd. máxima
                  </Label>
                  <Input
                    id="cfg-max-qty"
                    type="number"
                    min="1"
                    placeholder="Ilimitado"
                    {...form.register("maxPurchaseQuantity", {
                      setValueAs: v => (v === "" || v === null) ? "" : Number(v)
                    })}
                  />
                  <p className="text-xs text-zinc-500">Máximo por pedido</p>
                </div>
              </div>

              {!isManual && (
                <div className="space-y-1.5">
                  <Label htmlFor="s-stock" className="text-sm font-medium text-white/80">
                    {isAutoLines ? "Itens de estoque (um por linha)" : "Conteúdo entregue"}
                  </Label>
                  <Textarea
                    id="s-stock"
                    rows={isAutoLines ? 8 : 4}
                    className="text-sm bg-black/20 border-white/5 focus:border-primary/70"
                    placeholder={
                      isAutoLines
                        ? "XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY\n..."
                        : "Conteúdo a ser entregue ao cliente..."
                    }
                    {...form.register("digitalLines")}
                  />
                  {isAutoLines && (
                    <p className="text-xs text-zinc-500">
                      Cada linha é considerada um item de estoque independente e será entregue separadamente.
                    </p>
                  )}
                </div>
              )}

              {isAutoFile && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-white/80">Arquivo de entrega</Label>
                  <Controller
                    control={form.control}
                    name="digitalFileUrl"
                    render={({ field }) => (
                      <>
                        {field.value ? (
                          <div className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-4 py-3">
                            <span className="text-xs text-primary truncate hover:underline">{field.value}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-zinc-500 hover:text-white"
                              onClick={() => field.onChange(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-white/10 bg-black/20 py-8 cursor-pointer hover:border-primary/50 transition-colors">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadFile(f);
                                e.target.value = "";
                              }}
                            />
                            <UploadCloud className="h-6 w-6 text-zinc-500" />
                            <span className="text-xs text-zinc-400">Clique para enviar arquivo (Máx 10MB)</span>
                          </label>
                        )}
                      </>
                    )}
                  />
                </div>
              )}

              {isManual && (
                <div className="space-y-1.5">
                  <Label htmlFor="s-manual" className="text-sm font-medium text-white/80">Instruções para entrega manual</Label>
                  <Textarea
                    id="s-manual"
                    rows={4}
                    placeholder="Ex: Gerar código no painel e enviar ao cliente..."
                    className="text-sm bg-black/20 border-white/5 focus:border-primary/70"
                    {...form.register("manualDeliveryNote")}
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border border-white/5 bg-card">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Imagem do produto</h2>
            </div>

            <div className="space-y-2 px-4 py-4">
              <Label className="block mb-2 font-semibold text-sm">
                Imagem <span className="text-zinc-500 text-xs">( Opcional )</span>
              </Label>
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
            </div>
          </section>

          <section className="rounded-md border border-white/5 bg-card">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Configurações</h2>
            </div>

            <Controller
              control={form.control}
              name="isVisible"
              render={({ field }) => (
                <div className="flex items-center gap-4 px-4 py-3">
                  <Toggle
                    id="cfg-visible"
                    size="sm"
                    pressed={field.value ?? true}
                    onPressedChange={field.onChange}
                  >
                    {field.value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Toggle>
                  <div>
                    <Label htmlFor="cfg-visible" className="font-medium text-sm cursor-pointer">
                      {field.value ? "Visível" : "Oculto"}
                    </Label>
                    <p className="text-xs text-zinc-500">
                      {field.value
                        ? "O produto está visível na loja para os clientes."
                        : "O produto está oculto e não aparece na loja."}
                    </p>
                  </div>
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="featured"
              render={({ field }) => (
                <div className="flex items-center gap-4 px-4 py-3">
                  <Toggle
                    id="cfg-featured"
                    size="sm"
                    pressed={field.value ?? false}
                    onPressedChange={field.onChange}
                  >
                    {field.value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Toggle>
                  <div>
                    <Label htmlFor="cfg-featured" className="cursor-pointer text-sm font-medium">
                      {field.value ? "Destaque na Home" : "Sem destaque"}
                    </Label>
                    <p className="text-xs text-zinc-500">
                      {field.value
                        ? "Este produto aparece na vitrine da página inicial."
                        : "Marque para exibir este produto na vitrine da home."}
                    </p>
                  </div>
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="onePurchasePerUser"
              render={({ field }) => (
                <div className="flex items-center gap-4 px-4 py-3">
                  <Toggle
                    id="cfg-one-per-user"
                    size="sm"
                    pressed={field.value ?? false}
                    onPressedChange={field.onChange}
                  >
                    {field.value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Toggle>
                  <div>
                    <Label htmlFor="cfg-one-per-user" className="font-medium text-sm cursor-pointer">
                      Uma compra por usuário
                    </Label>
                    <p className="text-xs text-zinc-500">
                      Cada cliente só poderá comprar este produto uma vez
                    </p>
                  </div>
                </div>
              )}
            />
          </section>

          <section className="rounded-md border border-white/5 bg-card">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Pós Venda</h2>
            </div>

            <div className="space-y-2 px-4 py-4">
              <Label className="block mb-2 font-semibold text-sm">
                Instruções <span className="text-zinc-500 text-xs">( Opcional )</span>
              </Label>
              <Controller
                control={form.control}
                name="postPurchaseInstructions"
                render={({ field }) => (
                  <RichEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Instruções para o cliente..."
                    minHeight={160}
                  />
                )}
              />
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}