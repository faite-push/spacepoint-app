"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Check, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { variantsApi, type ProductVariant } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type MatrixRow = {
  id: string;
  label: string;
  enabled: boolean;
  price: number;
  comparePrice: number | null;
};

type PlatformRow = {
  id: string;
  label: string;
  enabled: boolean;
};

const DEFAULT_TYPES: MatrixRow[] = [
  { id: "primaria", label: "Primária", enabled: true, price: 0.00, comparePrice: 0.00 },
  { id: "secundaria", label: "Secundária", enabled: true, price: 0.00, comparePrice: 0.00 },
];

const DEFAULT_PLATFORMS: PlatformRow[] = [
  { id: "ps4", label: "PS4", enabled: true },
  { id: "ps5", label: "PS5", enabled: true },
];

function newId() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

function buildVariantName(typeLabel: string, platformLabel: string) {
  return `${typeLabel.trim()} ${platformLabel.trim()}`.replace(/\s+/g, " ").toUpperCase();
};

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

function MoneyInput({ value, onChange, placeholder = "0,00", }: { value: number | null; onChange: (value: number | null) => void; placeholder?: string; }) {
  return (
    <InputGroup>
      <InputGroupInput
        type="text"
        placeholder={placeholder}
        value={
          typeof value === "number"
            ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : ""
        }
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          if (!digits) {
            onChange(null);
            return;
          }
          onChange(Number(digits) / 100);
        }}
      />
      <InputGroupAddon>R$</InputGroupAddon>
    </InputGroup>
  );
};

export function VariantMatrixGeneratorDialog({ open, onOpenChange, productId, existingVariants = [], }: { open: boolean; onOpenChange: (open: boolean) => void; productId: string; existingVariants?: ProductVariant[]; }) {
  const queryClient = useQueryClient();
  const [types, setTypes] = useState<MatrixRow[]>(DEFAULT_TYPES);
  const [platforms, setPlatforms] = useState<PlatformRow[]>(DEFAULT_PLATFORMS);
  const [defaultStock, setDefaultStock] = useState(0);

  const existingNames = useMemo(
    () => new Set(existingVariants.map((v) => v.name.trim().toLowerCase())),
    [existingVariants]
  );

  const preview = useMemo(() => {
    const rows: Array<{
      key: string;
      name: string;
      price: number;
      comparePrice: number | null;
      stockQuantity: number;
      exists: boolean;
    }> = [];

    for (const type of types) {
      if (!type.enabled || !type.label.trim()) continue;
      for (const platform of platforms) {
        if (!platform.enabled || !platform.label.trim()) continue;
        const name = buildVariantName(type.label, platform.label);
        rows.push({
          key: `${type.id}:${platform.id}`,
          name,
          price: type.price,
          comparePrice: type.comparePrice,
          stockQuantity: defaultStock,
          exists: existingNames.has(name.toLowerCase()),
        });
      }
    }

    return rows;
  }, [types, platforms, defaultStock, existingNames]);

  const toCreate = preview.filter((row) => !row.exists);
  const hasInvalidPrice = toCreate.some((row) => !row.price || row.price <= 0);

  const mutation = useMutation({
    mutationFn: () =>
      variantsApi.bulkGenerate(productId, {
        variants: toCreate.map((row) => ({
          name: row.name,
          price: row.price,
          comparePrice: row.comparePrice,
          stockQuantity: row.stockQuantity,
        })),
        defaults: {
          deliveryType: "automatic_lines",
          digitalLines: [],
          isVisible: true,
          isActive: true,
        },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "variants", productId] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      const skipped = data.skipped?.length ?? 0;
      toast.success(
        skipped > 0
          ? `${data.created} variantes criadas (${skipped} já existiam)`
          : `${data.created} variantes criadas!`
      );
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function updateType(id: string, patch: Partial<MatrixRow>) {
    setTypes((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  function updatePlatform(id: string, patch: Partial<PlatformRow>) {
    setPlatforms((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  function resetForm() {
    setTypes(DEFAULT_TYPES.map((row) => ({ ...row })));
    setPlatforms(DEFAULT_PLATFORMS.map((row) => ({ ...row })));
    setDefaultStock(0);
  };

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerador de variantes</DialogTitle>
          <DialogDescription>Combine tipos de conta e plataformas para criar várias variantes de uma vez.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 overflow-y-auto pr-1">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Tipos de conta</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() =>
                  setTypes((prev) => [
                    ...prev,
                    { id: newId(), label: "Novo tipo", enabled: true, price: 0, comparePrice: null },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {types.map((type) => (
                <div key={type.id} className="rounded-md border border-white/10 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Toggle
                      variant="default"
                      size="sm"
                      pressed={type.enabled}
                      onPressedChange={(enabled) => updateType(type.id, { enabled })}
                    >
                      {type.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Toggle>
                    <Input
                      value={type.label}
                      onChange={(e) => updateType(type.id, { label: e.target.value })}
                      className="h-9"
                      placeholder="Ex: Primária"
                    />
                    {types.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-lg"
                        onClick={() => setTypes((prev) => prev.filter((row) => row.id !== type.id))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Preço</Label>
                      <MoneyInput
                        value={type.price}
                        onChange={(price) => updateType(type.id, { price: price ?? 0 })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Comparação</Label>
                      <MoneyInput
                        value={type.comparePrice}
                        onChange={(comparePrice) => updateType(type.id, { comparePrice })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Plataformas</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() =>
                  setPlatforms((prev) => [
                    ...prev,
                    { id: newId(), label: "Nova plataforma", enabled: true },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {platforms.map((platform) => (
                <div key={platform.id} className="flex items-center gap-2 rounded-md border border-white/10 p-2">
                  <Toggle
                    variant="default"
                    size="sm"
                    pressed={platform.enabled}
                    onPressedChange={(enabled) => updatePlatform(platform.id, { enabled })}
                  >
                    {platform.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Toggle>
                  <Input
                    value={platform.label}
                    onChange={(e) => updatePlatform(platform.id, { label: e.target.value })}
                    className="h-9"
                    placeholder="Ex: PS5"
                  />
                  {platforms.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-lg"
                      onClick={() =>
                        setPlatforms((prev) => prev.filter((row) => row.id !== platform.id))
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label>Estoque inicial (opcional)</Label>
              <Input
                type="number"
                min={0}
                value={defaultStock}
                onChange={(e) => setDefaultStock(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Mesmo valor para todas as variantes. Usa entrega manual até você colar códigos na variante.
              </p>
            </div>
          </section>
        </div>

        <section className="space-y-2 border-t border-white/5 pt-4">
          <div className="flex items-center justify-between">
            <Label>Pré-visualização</Label>
            <Badge className="bg-primary/10 text-primary">
              {toCreate.length} nova{toCreate.length === 1 ? "" : "s"}
              {preview.length - toCreate.length > 0 &&
                ` · ${preview.length - toCreate.length} já existe${preview.length - toCreate.length === 1 ? "" : "m"}`}
            </Badge>
          </div>

          <ScrollArea className="h-[140px] rounded-md border border-white/5">
            <div className="divide-y divide-white/5">
              {preview.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  Selecione ao menos um tipo e uma plataforma.
                </p>
              ) : (
                preview.map((row) => (
                  <div
                    key={row.key}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3 py-2 text-sm",
                      row.exists && "opacity-50"
                    )}
                  >
                    <span className="font-medium truncate">{row.name}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      {row.comparePrice != null && row.comparePrice > 0 && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatMoney(row.comparePrice)}
                        </span>
                      )}
                      <span>{formatMoney(row.price)}</span>
                      {row.exists ? (
                        <Badge variant="outline" className="text-xs">
                          Existe
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </section>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="flex-1"
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            size="lg"
            className="flex-1"
            type="button"
            disabled={mutation.isPending || toCreate.length === 0 || hasInvalidPrice}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Gerar ${toCreate.length} variante${toCreate.length === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};