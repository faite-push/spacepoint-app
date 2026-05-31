"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Save, Plus, Trash2, Search, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Coupon, CouponPayload, CouponType, couponsApi } from "@/lib/coupons-api";
import { categoriesApi, productsApi, Category, AdminProduct } from "@/lib/admin-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const couponSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").max(20),
  description: z.string().optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().min(0, "O valor deve ser positivo"),
  minOrderValue: z.coerce.number().min(0).optional().nullable(),
  maxOrderValue: z.coerce.number().min(0).optional().nullable(),
  maxDiscount: z.coerce.number().min(0).optional().nullable(),
  maxUses: z.coerce.number().int().min(0).optional().nullable(),
  perUserLimit: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional().nullable(),
  allowedPayments: z.array(z.string()).default(["PIX", "CREDIT_CARD", "BOLETO", "PAYPAL"]),
  references: z.array(z.object({
    type: z.enum(["PRODUCT", "CATEGORY", "VARIANT"]),
    referenceId: z.string(),
    label: z.string().optional() // virtual para UI
  })).default([]),
});

type CouponFormValues = {
  code: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  maxDiscount: number | null;
  maxUses: number | null;
  perUserLimit: number;
  isActive: boolean;
  startDate: string;
  endDate: string | null;
  allowedPayments: string[];
  references: {
    type: "PRODUCT" | "CATEGORY" | "VARIANT";
    referenceId: string;
    label?: string;
  }[];
};

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: Coupon | null;
}

export function CouponModal({ open, onOpenChange, coupon }: CouponModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!coupon;

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema) as any,
    defaultValues: {
      code: "",
      description: "",
      type: "PERCENTAGE",
      value: 0,
      minOrderValue: null,
      maxOrderValue: null,
      maxDiscount: null,
      maxUses: null,
      perUserLimit: 1,
      isActive: true,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: null,
      allowedPayments: ["PIX", "CREDIT_CARD", "BOLETO", "PAYPAL"],
      references: [],
    },
  });

  useEffect(() => {
    if (coupon) {
      form.reset({
        code: coupon.code,
        description: coupon.description || "",
        type: coupon.type,
        value: Number(coupon.value),
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
        maxOrderValue: coupon.maxOrderValue ? Number(coupon.maxOrderValue) : null,
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        maxUses: coupon.maxUses ?? null,
        perUserLimit: coupon.perUserLimit ?? 1,
        isActive: coupon.isActive,
        startDate: new Date(coupon.startDate).toISOString().slice(0, 16),
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : null,
        allowedPayments: coupon.allowedPayments,
        references: coupon.references?.map(r => ({
          type: r.type,
          referenceId: r.referenceId
        })) || [],
      });
    } else {
      form.reset({
        code: "",
        description: "",
        type: "PERCENTAGE",
        value: 0,
        minOrderValue: null,
        maxOrderValue: null,
        maxDiscount: null,
        maxUses: null,
        perUserLimit: 1,
        isActive: true,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: null,
        allowedPayments: ["PIX", "CREDIT_CARD", "BOLETO", "PAYPAL"],
        references: [],
      });
    }
  }, [coupon, form, open]);

  const mutation = useMutation({
    mutationFn: (values: CouponFormValues) => {
      const payload: CouponPayload = {
        ...values,
        code: values.code.toUpperCase(),
        startDate: new Date(values.startDate).toISOString(),
        endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        minOrderValue: values.minOrderValue || null,
        maxOrderValue: values.maxOrderValue || null,
        maxDiscount: values.maxDiscount || null,
        maxUses: values.maxUses || null,
      };
      return isEditing && coupon
        ? couponsApi.update(coupon.id, payload)
        : couponsApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Cupom atualizado" : "Cupom criado");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (values: CouponFormValues) => mutation.mutate(values);

  // ─── Referências Selection ───────────────────────────────────────────────
  const [searchRef, setSearchRef] = useState("");
  const { data: catData } = useQuery({ queryKey: ["admin", "categories", "flat"], queryFn: () => categoriesApi.listFlat() });
  const { data: prodData } = useQuery({ queryKey: ["admin", "products", searchRef], queryFn: () => productsApi.list({ search: searchRef }) });

  const currentRefs = form.watch("references");

  const addReference = (type: "PRODUCT" | "CATEGORY" | "VARIANT", id: string, label: string) => {
    if (currentRefs.some(r => r.referenceId === id)) return;
    form.setValue("references", [...currentRefs, { type, referenceId: id, label }]);
  };

  const removeReference = (id: string) => {
    form.setValue("references", currentRefs.filter(r => r.referenceId !== id));
  };

  const paymentMethods = [
    { id: "PIX", label: "PIX" },
    { id: "CREDIT_CARD", label: "Cartão" },
    { id: "BOLETO", label: "Boleto" },
    { id: "PAYPAL", label: "PayPal" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#0A0A0A] border-white/10 text-white overflow-y-auto max-h-[90vh] custom-scrollbar focus:outline-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isEditing ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
          <DialogDescription className="text-zinc-500">Configure as regras de desconto e validade.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status & Code */}
            <div className="space-y-4">
               <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                  <Label className="text-sm font-medium">Status do cupom</Label>
                  <Controller
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter">
                          {field.value ? "Ativo" : "Desativado"}
                        </span>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
               </div>

               <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom</Label>
                  <div className="relative">
                    <Input
                      id="code"
                      placeholder="EX: VERÃO2026"
                      className="bg-white/5 border-white/10 uppercase font-mono tracking-widest h-12"
                      {...form.register("code")}
                    />
                    <button 
                      type="button"
                      onClick={() => form.setValue("code", Math.random().toString(36).substring(2, 10).toUpperCase())}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-white transition-colors"
                      title="Gerar código aleatório"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
               </div>
            </div>

            {/* Type & Value */}
            <div className="space-y-4">
               <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0D0D0D] border-white/10 text-white">
                          <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                          <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
               </div>
               <div className="space-y-2">
                  <Label>Valor do Desconto</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">
                      {form.watch("type") === "PERCENTAGE" ? "%" : "R$"}
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      className={cn(
                        "bg-white/5 border-white/10 h-12",
                        form.watch("type") === "PERCENTAGE" ? "pl-7" : "pl-9"
                      )}
                      {...form.register("value")}
                    />
                  </div>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
                <Label>Qtd. Máxima</Label>
                <Input type="number" placeholder="Ilimitado" className="bg-white/5 border-white/10" {...form.register("maxUses")} />
             </div>
             <div className="space-y-2">
                <Label>Valor Mínimo</Label>
                <Input type="number" step="0.01" placeholder="R$ 0,00" className="bg-white/5 border-white/10" {...form.register("minOrderValue")} />
             </div>
             <div className="space-y-2">
                <Label>Desconto Máximo</Label>
                <Input type="number" step="0.01" placeholder="R$ 0,00" className="bg-white/5 border-white/10" {...form.register("maxDiscount")} />
             </div>
          </div>

          {/* Uso Único */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02]">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Uso único por cliente</Label>
              <p className="text-xs text-zinc-500">Cada cliente só poderá usar este cupom uma única vez.</p>
            </div>
            <Controller
              control={form.control}
              name="perUserLimit"
              render={({ field }) => (
                <Switch 
                  checked={field.value === 1} 
                  onCheckedChange={(v) => field.onChange(v ? 1 : 999999)} 
                />
              )}
            />
          </div>

          {/* Referências Section */}
          <div className="space-y-3">
            <Label>Restrições do Cupom (Opcional)</Label>
            <p className="text-xs text-zinc-500">Selecione produtos ou categorias específicas para aplicar o cupom.</p>
            
            <div className="space-y-4 rounded-xl border border-white/5 bg-white/[0.01] p-4">
              <div className="flex flex-wrap gap-2">
                {currentRefs.map((ref) => (
                  <Badge key={ref.referenceId} variant="secondary" className="bg-white/5 border-white/10 text-zinc-300 py-1 pl-2 pr-1 gap-1">
                    <span className="text-[10px] uppercase opacity-50">{ref.type}:</span> {ref.label || ref.referenceId}
                    <button type="button" onClick={() => removeReference(ref.referenceId)} className="hover:text-white transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {currentRefs.length === 0 && <p className="text-xs text-zinc-600 italic">Válido para toda a loja</p>}
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Pesquisar produtos ou categorias..." 
                    className="bg-white/5 border-white/10 pl-9"
                    value={searchRef}
                    onChange={(e) => setSearchRef(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Categorias</p>
                    {catData?.categories?.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => addReference("CATEGORY", cat.id, cat.name)}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-xs hover:bg-white/5 transition-colors group"
                      >
                        <span className="text-zinc-400 group-hover:text-white">{cat.name}</span>
                        {currentRefs.some(r => r.referenceId === cat.id) ? <Check className="h-3 w-3 text-primary" /> : <Plus className="h-3 w-3 text-zinc-700" />}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase font-bold text-zinc-600 tracking-widest">Produtos</p>
                    {prodData?.products?.map(prod => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => addReference("PRODUCT", prod.id, prod.name)}
                        className="flex w-full items-center justify-between rounded-lg p-2 text-xs hover:bg-white/5 transition-colors group"
                      >
                        <span className="text-zinc-400 group-hover:text-white truncate max-w-[150px]">{prod.name}</span>
                        {currentRefs.some(r => r.referenceId === prod.id) ? <Check className="h-3 w-3 text-primary" /> : <Plus className="h-3 w-3 text-zinc-700" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Validade */}
          <div className="space-y-3">
            <Label>Validade</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-600 uppercase font-bold ml-1">Início</span>
                <Input type="datetime-local" className="bg-white/5 border-white/10 h-10 color-scheme-dark" {...form.register("startDate")} />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] text-zinc-600 uppercase font-bold ml-1">Fim (Opcional)</span>
                <Input type="datetime-local" className="bg-white/5 border-white/10 h-10 color-scheme-dark" {...form.register("endDate")} />
              </div>
            </div>
          </div>

          {/* Métodos de Pagamento */}
          <div className="space-y-3">
            <Label>Métodos de Pagamento Permitidos</Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {paymentMethods.map(method => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Controller
                    control={form.control}
                    name="allowedPayments"
                    render={({ field }) => (
                      <Checkbox
                        id={`payment-${method.id}`}
                        checked={field.value?.includes(method.id)}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, method.id]);
                          } else {
                            field.onChange(current.filter(m => m !== method.id));
                          }
                        }}
                        className="border-white/20 data-[state=checked]:bg-primary"
                      />
                    )}
                  />
                  <Label htmlFor={`payment-${method.id}`} className="text-sm font-normal text-zinc-400 cursor-pointer">{method.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 border-white/5 hover:bg-white/5 transition-colors"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? "Salvar Alterações" : "Criar Cupom"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
