"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { productsApi } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";

type BulkScope = "filtered" | "all";
type PriceTargetField = "price" | "comparePrice";
type PriceMode = "fixed" | "increase_percent" | "decrease_percent";
type ApplyTo = "variants" | "products" | "both";

function formatBulkUpdateMessage(
  applyTo: ApplyTo,
  data: { updatedProducts: number; updatedVariants?: number },
  action: "price" | "visibility",
  isVisible?: boolean
) {
  const verb =
    action === "price"
      ? "Preços atualizados"
      : isVisible
        ? "Ativados"
        : "Desativados";

  if (applyTo === "variants") {
    return `${verb} em ${data.updatedVariants ?? 0} variante(s)`;
  }
  if (applyTo === "products") {
    return `${verb} em ${data.updatedProducts} produto(s)`;
  }
  return `${verb} em ${data.updatedProducts} produto(s) e ${data.updatedVariants ?? 0} variante(s)`;
}

function ScopeOption({ active, label, description, onClick, }: { active: boolean; label: string; description: string; onClick: () => void; }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-center w-full cursor-pointer rounded-sm px-4 py-2 transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground"
      )}
    >
      <p className="text-sm font-medium">{label}</p>
    </button>
  );
};

function ToggleOption({ active, label, onClick, }: { active: boolean; label: string; onClick: () => void; }) {
  return (
    <Toggle
      size="sm"
      pressed={active}
      onPressedChange={onClick}
      className={cn(
        "w-full cursor-pointer rounded-sm px-4 py-2 text-left transition-colors",
        active ? "bg-primary/10 text-primary" : "bg-transparent text-muted-foreground"
      )}
    >
      <span className="text-sm font-medium">{label}</span>
    </Toggle>
  );
};

function resolveProductIds(scope: BulkScope, filteredIds: string[], allIds: string[]): string[] | undefined {
  if (scope === "filtered") return filteredIds;
  return allIds.length ? undefined : [];
};

export function BulkPriceChangeDialog({ open, onOpenChange, filteredProductIds, allProductIds, }: { open: boolean; onOpenChange: (open: boolean) => void; filteredProductIds: string[]; allProductIds: string[]; }) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<BulkScope>("filtered");
  const [targetField, setTargetField] = useState<PriceTargetField>("price");
  const [mode, setMode] = useState<PriceMode>("fixed");
  const [value, setValue] = useState<number | null>(null);
  const [alsoApplyToComparePrice, setAlsoApplyToComparePrice] = useState(false);
  const [applyTo, setApplyTo] = useState<ApplyTo>("both");

  const targetCount = scope === "filtered" ? filteredProductIds.length : allProductIds.length;

  const mutation = useMutation({
    mutationFn: () => {
      const productIds = resolveProductIds(scope, filteredProductIds, allProductIds);
      if (productIds && productIds.length === 0) throw new Error("Nenhum produto selecionado");
      if (value == null || value <= 0) throw new Error("Informe um valor válido");
      if (mode !== "fixed" && value > 1000) throw new Error("Porcentagem máxima: 1000%");

      return productsApi.bulkActions({
        action: "price",
        productIds,
        applyTo,
        targetField,
        mode,
        value,
        alsoApplyToComparePrice: targetField === "price" && alsoApplyToComparePrice,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(formatBulkUpdateMessage(applyTo, data, "price"));
      handleClose(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleClose(next: boolean) {
    if (!next) {
      setScope("filtered");
      setTargetField("price");
      setMode("fixed");
      setValue(null);
      setAlsoApplyToComparePrice(false);
      setApplyTo("variants");
    }
    onOpenChange(next);
  }

  const valueLabel =
    mode === "fixed"
      ? targetField === "comparePrice"
        ? "Novo preço de comparação"
        : "Novo preço"
      : mode === "increase_percent"
        ? "Porcentagem de aumento"
        : "Porcentagem de redução";

  const applyToLabel =
    applyTo === "variants"
      ? "variantes"
      : applyTo === "products"
        ? "produtos (pacote)"
        : "produtos e variantes";

  const helperText =
    mode === "fixed"
      ? `Todas as ${applyToLabel} dos ${targetCount} produto(s) selecionados terão este preço${targetField === "price" && alsoApplyToComparePrice ? " (e comparação)" : ""
      }.`
      : `O preço atual de cada ${applyTo === "variants" ? "variante" : applyTo === "products" ? "produto" : "item"} será ${mode === "increase_percent" ? "aumentado" : "reduzido"
      } em ${value ?? 0}%.`;

  const inputDisplay =
    mode === "fixed"
      ? typeof value === "number"
        ? value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : ""
      : value ?? "";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg select-none">
        <DialogHeader>
          <DialogTitle>Configurar alteração de preço</DialogTitle>
          <DialogDescription>Defina como os preços serão alterados.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Escopo de alteração</Label>
            <div className="flex flex-row bg-background border border-white/5 rounded-md p-1 gap-2">
              <ScopeOption
                active={scope === "filtered"}
                label={`Produtos filtrados (${filteredProductIds.length})`}
                description="Somente os produtos visíveis com os filtros atuais."
                onClick={() => setScope("filtered")}
              />
              <ScopeOption
                active={scope === "all"}
                label={`Todos os produtos (${allProductIds.length})`}
                description="Todos os produtos cadastrados na loja."
                onClick={() => setScope("all")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aplicar alteração em</Label>
            <div className="flex flex-row bg-background border border-white/5 rounded-md p-1 gap-2">
              <ScopeOption
                description="Atualiza o preço padrão de todos os produtos selecionados."
                active={targetField === "price"}
                label="Preço padrão"
                onClick={() => setTargetField("price")}
              />
              <ScopeOption
                description="Atualiza o preço de comparação de todos os produtos selecionados."
                active={targetField === "comparePrice"}
                label="Preço de comparação"
                onClick={() => setTargetField("comparePrice")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Onde aplicar</Label>
            <div className="flex flex-row bg-background border border-white/5 rounded-md p-1 gap-2">
              <ScopeOption
                description="Atualiza produto e todas as variantes."
                active={applyTo === "both"}
                label="Todos"
                onClick={() => setApplyTo("both")}
              />
              <ScopeOption
                description="Atualiza apenas o preço base do produto/pacote."
                active={applyTo === "products"}
                label="Apenas produto"
                onClick={() => setApplyTo("products")}
              />
              <ScopeOption
                description="Atualiza apenas os preços das variantes dos produtos selecionados."
                active={applyTo === "variants"}
                label="Apenas variantes"
                onClick={() => setApplyTo("variants")}
              />

            </div>
          </div>

          <div className="space-y-2">
            <Label>{valueLabel}</Label>
            <div className="flex items-center gap-0 rounded-md border border-input overflow-hidden">
              <Select value={mode} onValueChange={(val: PriceMode) => setMode(val)}>
                <SelectTrigger className="w-[230px] border-none bg-transparent focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[230px]">
                  <SelectItem value="fixed">Valor fixo</SelectItem>
                  <SelectItem value="increase_percent">Aumentar por porcentagem</SelectItem>
                  <SelectItem value="decrease_percent">Diminuir por porcentagem</SelectItem>
                </SelectContent>
              </Select>

              <div className="h-6 w-px bg-white/10" />

              <div className="px-3 text-sm text-muted-foreground">{mode === "fixed" ? "R$" : "%"}</div>

              <Input
                type={mode === "fixed" ? "text" : "number"}
                min={mode === "fixed" ? undefined : 0.01}
                max={mode === "fixed" ? undefined : 1000}
                step={mode === "fixed" ? undefined : 0.01}
                placeholder={mode === "fixed" ? "0,00" : "0"}
                value={inputDisplay}
                onChange={(e) => {
                  if (mode === "fixed") {
                    const digits = e.target.value.replace(/\D/g, "");
                    setValue(digits ? Number(digits) / 100 : null);
                    return;
                  }
                  setValue(e.target.value ? Number(e.target.value) : null);
                }}
                className="w-full px-2 bg-transparent border-none text-sm text-white focus:outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">{helperText}</p>
          </div>

          {targetField === "price" ? (
            <div className="flex items-center px-3 py-2 gap-4 rounded-md border border-white/5 bg-transparent">
              <Toggle
                id="bulk-compare-price"
                size="sm"
                pressed={alsoApplyToComparePrice}
                onPressedChange={setAlsoApplyToComparePrice}
              >
                {alsoApplyToComparePrice ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Toggle>
              <div className="space-y-0.5 cursor-pointer">
                <Label htmlFor="bulk-compare-price" className="text-sm font-medium cursor-pointer">
                  Aplicar também ao preço de comparação
                </Label>
                <p className="text-xs text-zinc-500">Atualiza `comparePrice` junto do preço padrão.</p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex flex-row gap-2">
          <Button
            type="button"
            size="lg"
            variant="ghost"
            className="flex-1"
            onClick={() => handleClose(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={mutation.isPending || !targetCount || value == null || value <= 0}
            onClick={() => mutation.mutate()}
            className="flex-1"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar alteração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function BulkVisibilityDialog({ open, onOpenChange, filteredProductIds, allProductIds, }: { open: boolean; onOpenChange: (open: boolean) => void; filteredProductIds: string[]; allProductIds: string[]; }) {
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<BulkScope>("filtered");
  const [isVisible, setIsVisible] = useState(true);
  const [applyTo, setApplyTo] = useState<ApplyTo>("variants");

  const targetCount = scope === "filtered" ? filteredProductIds.length : allProductIds.length;

  const mutation = useMutation({
    mutationFn: () => {
      const productIds = resolveProductIds(scope, filteredProductIds, allProductIds);
      if (productIds && productIds.length === 0) throw new Error("Nenhum produto selecionado");
      return productsApi.bulkActions({
        action: "visibility",
        productIds,
        applyTo,
        isVisible,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(formatBulkUpdateMessage(applyTo, data, "visibility", isVisible));
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleClose(next: boolean) {
    if (!next) {
      setScope("filtered");
      setIsVisible(true);
      setApplyTo("variants");
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg select-none">
        <DialogHeader>
          <DialogTitle>Alterar visibilidade em massa</DialogTitle>
          <DialogDescription>Ative ou desative produtos e suas variantes de uma só vez.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Visibilidade dos produtos</Label>
            <div className="flex flex-row bg-background border border-white/5 rounded-md p-1 gap-2">
              <Button
                className={cn(isVisible ? "flex-1 px-4 py-4 bg-primary/10 text-primary" : "flex-1 px-4 py-4 bg-transparent text-muted-foreground")}
                onClick={() => setIsVisible(true)}
              >
                Ativar todos
              </Button>
              <Button
                className={cn(!isVisible ? "flex-1 px-4 py-4 bg-primary/10 text-primary" : "flex-1 px-4 py-4 bg-transparent text-muted-foreground")}
                onClick={() => setIsVisible(false)}
              >
                Desativar todos
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Escopo de alteração</Label>
            <div className="flex flex-row bg-background border border-white/5 rounded-md p-1 gap-2">
              <ScopeOption
                active={scope === "filtered"}
                label={`Produtos filtrados (${filteredProductIds.length})`}
                description="Somente os produtos visíveis com os filtros atuais."
                onClick={() => setScope("filtered")}
              />
              <ScopeOption
                active={scope === "all"}
                label={`Todos os produtos (${allProductIds.length})`}
                description="Todos os produtos cadastrados na loja."
                onClick={() => setScope("all")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aplicar alteração em</Label>
            <div className="flex flex-row bg-background border border-white/5 rounded-md p-1 gap-2">
              <ScopeOption
                active={applyTo === "both"}
                label="Todos"
                description="Altera produto e todas as variantes."
                onClick={() => setApplyTo("both")}
              />
              <ScopeOption
                active={applyTo === "variants"}
                label="Apenas variantes"
                description="Altera a visibilidade só das variantes."
                onClick={() => setApplyTo("variants")}
              />
              <ScopeOption
                active={applyTo === "products"}
                label="Apenas produto"
                description="Altera a visibilidade só do produto/pacote."
                onClick={() => setApplyTo("products")}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-2">
          <Button type="button" size="lg" variant="ghost" className="flex-1" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button type="button" size="lg" className="flex-1" disabled={!targetCount || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirmar (${targetCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};