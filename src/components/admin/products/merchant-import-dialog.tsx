"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileUp, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { productsApi, type MerchantImportResult } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

function formatMoney(value?: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function MerchantImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [preview, setPreview] = useState<MerchantImportResult | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setSkipExisting(true);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open]);

  const previewMutation = useMutation({
    mutationFn: (selected: File) => productsApi.previewMerchantImport(selected),
    onSuccess: (data) => {
      setPreview(data);
      toast.success(
        `${data.productCount} produto(s) detectado(s) a partir de ${data.itemCount} item(ns)`
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Selecione um arquivo XML");
      return productsApi.importMerchantXml(file, { skipExisting });
    },
    onSuccess: (data) => {
      toast.success(
        `${data.created} produto(s) importado(s)` +
          (data.variantsCreated ? ` · ${data.variantsCreated} variante(s)` : "") +
          (data.skipped ? ` · ${data.skipped} ignorado(s)` : "")
      );
      onOpenChange(false);
      onSuccess();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleFileChange(next: File | null) {
    setFile(next);
    setPreview(null);
    if (next) previewMutation.mutate(next);
  }

  const busy = previewMutation.isPending || importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Google Merchant XML</DialogTitle>
          <DialogDescription>
            Envie o feed XML da loja integrada. Itens com o mesmo{" "}
            <code className="text-xs">item_group_id</code> viram um produto com variantes.
            Categorias vêm de <code className="text-xs">product_type</code> (
            Pai &gt; Subcategoria).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 text-center transition-colors",
              file && "border-primary/40 bg-primary/5"
            )}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-white">
                {file ? file.name : "Selecione o arquivo .xml"}
              </p>
              <p className="text-xs text-muted-foreground">
                Até 12 MB · formato Google Merchant / Loja Integrada
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xml,text/xml,application/xml"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <FileUp className="mr-2 h-4 w-4" />
              Escolher arquivo
            </Button>
          </div>

          <label className="flex items-center gap-3 text-sm text-white/80">
            <Checkbox
              checked={skipExisting}
              onCheckedChange={(checked) => setSkipExisting(checked === true)}
            />
            Ignorar produtos que já existem (mesmo nome/slug)
          </label>

          {previewMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando XML...
            </div>
          )}

          {preview && (
            <div className="space-y-3 rounded-md border border-white/10 bg-black/20 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Itens no feed</p>
                  <p className="font-semibold text-white">{preview.itemCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                  <p className="font-semibold text-white">{preview.productCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Variantes</p>
                  <p className="font-semibold text-white">{preview.variantCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Categorias pai</p>
                  <p className="font-semibold text-white">
                    {preview.categoryParents?.length || 0}
                  </p>
                </div>
              </div>

              {preview.sample?.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-white/80">Prévia</Label>
                  <div className="max-h-48 space-y-2 overflow-auto pr-1">
                    {preview.sample.map((item) => (
                      <div
                        key={`${item.name}-${item.price}`}
                        className="rounded-md border border-white/5 bg-white/[0.02] px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category || "Sem categoria"} · {formatMoney(item.price)}
                          {item.comparePrice ? ` (de ${formatMoney(item.comparePrice)})` : ""}
                          {item.variants?.length
                            ? ` · ${item.variants.length} variante(s)`
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={() => importMutation.mutate()}
            disabled={!file || !preview || busy}
          >
            {importMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Importar produtos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
