"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inventoryApi, type InventoryVariantItem } from "@/lib/admin-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: InventoryVariantItem | null;
  onSuccess: () => void;
};

export function InventoryBulkUploadDialog({ open, onOpenChange, variant, onSuccess }: Props) {
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      if (!variant) throw new Error("Variante não selecionada");
      if (!content.trim()) throw new Error("Cole ao menos um código");
      return inventoryApi.bulkUploadCodes(variant.id, { content });
    },
    onSuccess: (data) => {
      toast.success(
        `${data.added} código(s) adicionado(s)` +
        (data.duplicates ? ` · ${data.duplicates} duplicado(s) ignorado(s)` : "")
      );
      setContent("");
      onOpenChange(false);
      onSuccess();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleClose(next: boolean) {
    if (!next) setContent("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar códigos em massa</DialogTitle>
          <DialogDescription>
            {variant
              ? `${variant.productName} — ${variant.name}`
              : "Cole um código por linha para adicionar ao estoque."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="bulk-codes">Códigos (um por linha)</Label>
          <Textarea
            id="bulk-codes"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"XXXX-XXXX-XXXX\nYYYY-YYYY-YYYY"}
            className="min-h-[220px]"
          />
          <p className="text-xs text-muted-foreground">
            Duplicados são ignorados automaticamente. Máximo de 5.000 linhas por upload.
          </p>
        </div>

        <DialogFooter className="flex flex-row">
          <Button
            type="button"
            size="lg"
            variant="ghost"
            onClick={() => handleClose(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="lg"
            disabled={!content.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex-1"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="hidden h-4 w-4" />}
            Adicionar códigos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
