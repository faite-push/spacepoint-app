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
import { Checkbox } from "@/components/ui/checkbox";
import { clientsApi, type ClientImportResult } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function ClientImportDialog({ open, onOpenChange, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [preview, setPreview] = useState<ClientImportResult | null>(null);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreview(null);
      setSkipExisting(true);
      setUpdateExisting(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [open]);

  const previewMutation = useMutation({
    mutationFn: (selected: File) => clientsApi.previewImport(selected),
    onSuccess: (data) => {
      setPreview(data);
      toast.success(`${data.uniqueEmails} cliente(s) únicos detectados`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Selecione um arquivo");
      return clientsApi.importSpreadsheet(file, { skipExisting, updateExisting });
    },
    onSuccess: (data) => {
      toast.success(
        `${data.created} criado(s)` +
          (data.updated ? ` · ${data.updated} atualizado(s)` : "") +
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
          <DialogTitle>Importar clientes</DialogTitle>
          <DialogDescription>
            Envie a planilha da Loja Integrada (
            <code className="text-xs">CLIENTES_COM_PEDIDO.xlsx</code>
            ). Colunas: CLIENTE_ID, CLIENTE_NOME, CPF_CNPJ, CLIENTE_EMAIL,
            TELEFONE e DATA_CRIACAO.
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
                {file ? file.name : "Selecione o arquivo .xlsx"}
              </p>
              <p className="text-xs text-muted-foreground">
                Até 15 MB · .xlsx, .xls ou .csv
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
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
              onCheckedChange={(checked) => {
                const next = checked === true;
                setSkipExisting(next);
                if (next) setUpdateExisting(false);
              }}
            />
            Ignorar e-mails que já existem
          </label>

          <label className="flex items-center gap-3 text-sm text-white/80">
            <Checkbox
              checked={updateExisting}
              onCheckedChange={(checked) => {
                const next = checked === true;
                setUpdateExisting(next);
                if (next) setSkipExisting(false);
              }}
            />
            Atualizar nome, CPF e telefone dos existentes
          </label>

          {previewMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analisando planilha...
            </div>
          )}

          {preview && (
            <div className="space-y-3 rounded-md border border-white/10 bg-black/20 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Linhas</p>
                  <p className="font-semibold text-white">{preview.totalRows}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Únicos</p>
                  <p className="font-semibold text-white">{preview.uniqueEmails}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Novos</p>
                  <p className="font-semibold text-emerald-400">{preview.created}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Já existem</p>
                  <p className="font-semibold text-amber-400">
                    {preview.skipped + preview.updated}
                  </p>
                </div>
              </div>

              {preview.sample?.length > 0 && (
                <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-white/60">
                  {preview.sample.map((item) => (
                    <p key={item.email} className="truncate">
                      {item.name || "Sem nome"} · {item.email}
                      {item.exists ? " · já cadastrado" : ""}
                    </p>
                  ))}
                </div>
              )}

              {(preview.errors?.length ?? 0) > 0 && (
                <p className="text-xs text-red-400">
                  {preview.invalidRows} linha(s) inválida(s) serão ignoradas
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button
            disabled={!file || !preview || busy}
            onClick={() => importMutation.mutate()}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              "Importar clientes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
