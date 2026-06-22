"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Loader2, Save, Plus, Trash2, Search, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { Coupon, CouponPayload, CouponType, couponsApi } from "@/lib/coupons-api";
import { categoriesApi, productsApi, Category, AdminProduct } from "@/lib/admin-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReferenceSelectorDialog, Reference } from "./reference-selector-dialog";

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
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  allowedPayments: z.array(z.string()).default(["PIX", "CREDIT_CARD", "BOLETO", "PAYPAL"]),
  references: z.array(z.object({
    type: z.enum(["PRODUCT", "CATEGORY", "VARIANT"]),
    referenceId: z.string(),
    label: z.string().optional()
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
  startDate: string | null;
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

function DateTimeInput({ value, onChange, label, sublabel }: { value: string | null | undefined, onChange: (val: string | null) => void, label: string, sublabel?: string }) {
  const date = value ? new Date(value) : null;

  const [day, setDay] = useState(date ? date.getUTCDate().toString().padStart(2, "0") : "");
  const [month, setMonth] = useState(date ? (date.getUTCMonth() + 1).toString().padStart(2, "0") : "");
  const [year, setYear] = useState(date ? date.getUTCFullYear().toString() : "");
  const [hour, setHour] = useState(date ? date.getUTCHours().toString().padStart(2, "0") : "");
  const [min, setMin] = useState(date ? date.getUTCMinutes().toString().padStart(2, "0") : "");

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setDay(d.getUTCDate().toString().padStart(2, "0"));
      setMonth((d.getUTCMonth() + 1).toString().padStart(2, "0"));
      setYear(d.getUTCFullYear().toString());
      setHour(d.getUTCHours().toString().padStart(2, "0"));
      setMin(d.getUTCMinutes().toString().padStart(2, "0"));
    } else {
      setDay("");
      setMonth("");
      setYear("");
      setHour("");
      setMin("");
    }
  }, [value]);

  const update = (d: string, m: string, y: string, h: string, mi: string) => {
    if (d && m && y && h && mi) {
      const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${h.padStart(2, "0")}:${mi.padStart(2, "0")}`;
      onChange(iso);
    } else if (!d && !m && !y && !h && !mi) {
      onChange(null);
    }
  };

  const handleDay = (v: string) => { setDay(v); update(v, month, year, hour, min); };
  const handleMonth = (v: string) => { setMonth(v); update(day, v, year, hour, min); };
  const handleYear = (v: string) => { setYear(v); update(day, month, v, hour, min); };
  const handleHour = (v: string) => { setHour(v); update(day, month, year, v, min); };
  const handleMin = (v: string) => { setMin(v); update(day, month, year, hour, v); };

  const inputClass = "w-full text-center px-0";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-white">{label}</p>

      <div className="flex flex-col">
        <div className="flex items-end gap-2">
          <div className="flex-1 text-center">
            <span className="text-xs text-white/50 font-medium">Dia</span>
            <Input type="text" placeholder="DD" value={day} onChange={(e) => handleDay(e.target.value.replace(/\D/g, "").slice(0, 2))} className={inputClass} />
          </div>
          <span className="mb-2.5 text-white/60">/</span>
          <div className="flex-1 text-center">
            <span className="text-xs text-white/50 font-medium">Mês</span>
            <Input type="text" placeholder="MM" value={month} onChange={(e) => handleMonth(e.target.value.replace(/\D/g, "").slice(0, 2))} className={inputClass} />
          </div>
          <span className="mb-2.5 text-white/60">/</span>
          <div className="flex-1 text-center">
            <span className="text-xs text-white/50 font-medium">Ano</span>
            <Input type="text" placeholder="AAAA" value={year} onChange={(e) => handleYear(e.target.value.replace(/\D/g, "").slice(0, 4))} className={inputClass} />
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1 items-center justify-center mx-auto space-y-1.5 text-center">
            <span className="text-xs text-white/50 font-medium">Hora</span>
            <Input type="text" placeholder="HH" value={hour} onChange={(e) => handleHour(e.target.value.replace(/\D/g, "").slice(0, 2))} className={inputClass} />
          </div>
          <span className="mb-2.5 text-zinc-700">:</span>
          <div className="flex-1 items-center justify-center mx-auto space-y-1.5 text-center">
            <span className="text-xs text-white/50 font-medium">Min</span>
            <Input type="text" placeholder="MM" value={min} onChange={(e) => handleMin(e.target.value.replace(/\D/g, "").slice(0, 2))} className={inputClass} />
          </div>
        </div>
      </div>
    </div>
  );
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
      startDate: null,
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
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : null,
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
        startDate: null,
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
        startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
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

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const currentRefs = form.watch("references");

  const addReference = (type: "PRODUCT" | "CATEGORY" | "VARIANT", id: string, label: string) => {
    if (currentRefs.some(r => r.referenceId === id)) return;
    form.setValue("references", [...currentRefs, { type, referenceId: id, label }]);
  };

  const removeType = (type: "PRODUCT" | "CATEGORY" | "VARIANT") => {
    form.setValue("references", currentRefs.filter(r => r.type !== type));
  };

  const removeReference = (id: string | null = null, type: "PRODUCT" | "CATEGORY" | "VARIANT" | null = null) => {
    if (type) {
      removeType(type);
    } else if (id) {
      form.setValue("references", currentRefs.filter(r => r.referenceId !== id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
          <DialogDescription>Configure as regras de desconto e validade.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit as any)} className="flex flex-col h-full max-h-[80vh]">
          <div className="space-y-6 pt-4 overflow-y-auto custom-scrollbar scrollbar-none pr-1">
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <div className="flex bg-white/1 border border-white/2 gap-2 p-1 rounded-md">
                  <Button
                    type="button"
                    onClick={() => field.onChange(true)}
                    className={cn(
                      "flex-1 items-center justify-center rounded-sm px-6 py-2 text-sm transition-colors",
                      field.value
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-emerald-500/3 text-emerald-500/30"
                    )}
                  >
                    Ativo
                  </Button>

                  <Button
                    type="button"
                    onClick={() => field.onChange(false)}
                    className={cn(
                      "flex-1 items-center justify-center rounded-sm px-6 py-2 text-sm transition-colors",
                      !field.value
                        ? "bg-red-500/10 text-red-500"
                        : "bg-red-500/3 text-red-500/30"
                    )}
                  >
                    Desativado
                  </Button>
                </div>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Nome</Label>
                  <div className="relative">
                    <Input
                      id="code"
                      placeholder="Nome do cupom"
                      {...form.register("code")}
                    />
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => form.setValue("code", Math.random().toString(36).substring(2, 10).toUpperCase())}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        }
                      >
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Gerar código aleatório
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {form.formState.errors.code && <p className="text-xs text-red-500">{form.formState.errors.code.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Desconto</Label>
                <div className="flex items-center gap-0 rounded-md border border-input focus-within:border-input overflow-hidden transition-all duration-200">
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-auto cursor-pointer border-none rounded-l-md bg-transparent focus:ring-0 px-4 transition-colors gap-2 text-zinc-400">
                          <span className="text-sm font-bold min-w-[1.2rem]">
                            {field.value === "PERCENTAGE" ? "%" : "R$"}
                          </span>
                        </SelectTrigger>
                        <SelectContent className="w-52">
                          <SelectItem value="PERCENTAGE" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span>Porcentagem</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="FIXED" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span>Fixo</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />

                  <div className="h-6 w-[1px] bg-white/5" />

                  <Controller
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="0"
                          autoComplete="off"
                          className="w-full h-10 px-4 focus:outline-none text-base font-medium text-white"
                          value={
                            form.watch("type") === "FIXED"
                              ? (field.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : field.value || ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (form.watch("type") === "FIXED") {
                              const val = raw.replace(/\D/g, "");
                              const num = val ? Number(val) / 100 : 0;
                              field.onChange(num);
                            } else {
                              const val = raw.replace(/[^\d.,]/g, "").replace(",", ".");
                              const num = parseFloat(val);
                              field.onChange(isNaN(num) ? 0 : num);
                            }
                          }}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Qtd. Máxima</Label>
                <Input type="number" placeholder="Ilimitado" {...form.register("maxUses")} />
              </div>
              <div className="space-y-2">
                <Label>Valor Mínimo</Label>
                <Input type="number" step="0.01" placeholder="R$ 0,00" {...form.register("minOrderValue")} />
              </div>
              <div className="space-y-2">
                <Label>Desconto Máximo</Label>
                <Input type="number" step="0.01" placeholder="R$ 0,00" {...form.register("maxDiscount")} />
              </div>
            </div>

            <div className="flex items-center p-4 gap-4 rounded-md border border-white/5 bg-card">
              <Controller
                control={form.control}
                name="perUserLimit"
                render={({ field }) => (
                  <Toggle
                    id="cfg-visible"
                    size="sm"
                    pressed={field.value === 1}
                    onPressedChange={(v) => field.onChange(v ? 1 : 999999)}
                  >
                    {field.value === 1 ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Toggle>
                )}
              />
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Uso único por cliente</Label>
                <p className="text-xs text-zinc-500">Cada cliente só poderá usar este cupom uma única vez.</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Referências</Label>

              <div className="space-y-1">
                <Button
                  type="button"
                  onClick={() => setIsSelectorOpen(true)}
                  className="w-full flex items-center justify-center py-6 px-4 rounded-md border border-dashed border-white/15 bg-card hover:bg-white/[0.02] transition-all group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-sm font-light text-white transition-colors">Selecionar referências</span>
                  </div>
                </Button>

                <div className="flex flex-wrap gap-2">
                  <p className="text-xs text-white/70">
                    Selecione <span className="text-white font-medium">produtos ( {currentRefs.filter(r => r.type === "PRODUCT").length} )</span> ou <span className="text-white font-medium">categorias</span> ( {currentRefs.filter(r => r.type === "CATEGORY").length} ) específicas para aplicar o cupom
                  </p>
                </div>
              </div>
            </div>

            <ReferenceSelectorDialog
              open={isSelectorOpen}
              onOpenChange={setIsSelectorOpen}
              initialReferences={currentRefs as any}
              onConfirm={(refs) => form.setValue("references", refs)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-6 mt-2">
              <Controller
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <DateTimeInput
                    label="Data e Horário de Início"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <DateTimeInput
                    label="Data e Horário de Fim"
                    sublabel="Período de validade do cupom com data e horário (opcional)"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
          </div>

          <DialogFooter className="mt-3">
            <div className="flex w-full gap-3">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={mutation.isPending}
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={mutation.isPending}
                className="flex-1"
              >
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 hidden" />}
                {isEditing ? "Salvar Alterações" : "Criar Cupom"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};