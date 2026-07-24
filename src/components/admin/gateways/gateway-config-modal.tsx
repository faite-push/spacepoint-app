"use client";

import type { ReactNode } from "react";
import { BookOpen, CheckCircle2, ExternalLink, Loader2, Upload } from "lucide-react";
import { TbCactusFilled } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { cn } from "@/lib/utils";

export type GatewayFieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: string;
  accept?: string;
  hint?: string;
};

export type GatewayTemplate = {
  slug: string;
  name: string;
  description: string;
  fields: GatewayFieldDef[];
  links: {
    signup: string;
    support: string;
    tutorial: string;
  };
  renderLogo: (className?: string) => ReactNode;
};

type GatewayConfigModalProps = {
  open: boolean;
  template: GatewayTemplate | null;
  formData: Record<string, unknown>;
  hasStoredCertificate?: boolean;
  isValidating: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (data: Record<string, unknown>) => void;
  onFileUpload: (key: string, file: File | null) => void;
  onValidate: () => void;
  onSave: () => void;
};

export function GatewayConfigModal({ open, template, formData, hasStoredCertificate, isValidating, isSaving, onOpenChange, onFormChange, onFileUpload, onValidate, onSave, }: GatewayConfigModalProps) {
  if (!template) return null;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl">
        <div className="border-b border-white/5">
          <div className="flex items-center gap-3 pr-8">
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-bold text-white">
                {template.name}
              </DialogTitle>
              <DialogDescription className="text-left text-xs text-muted-foreground">
                {template.description}
              </DialogDescription>
            </div>
          </div>

          <a
            href={template.links.tutorial}
            target="_blank"
            rel="noopener noreferrer"
            className="my-2 flex items-center justify-center gap-3 rounded-sm bg-white/5 p-3 transition-colors"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            <p className="text-xs leading-relaxed text-zinc-300">
              Como conectar o {template.name}?{" "}
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                Veja o tutorial de configuração
                <ExternalLink className="h-3 w-3" />
              </span>
            </p>
          </a>
        </div>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto custom-scrollbar scrollbar-none pr-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <TbCactusFilled className="h-8 w-8 shrink-0 text-muted-foreground" />

                <div>
                  <p className="font-medium text-white">Modo Desenvolvimento</p>
                  <p className="text-xs text-muted-foreground">Credenciais de homologação / sandbox</p>
                </div>
              </div>
              <Switch
                checked={formData.sandbox === true}
                onCheckedChange={(val) => {
                  const updates: Record<string, unknown> = { ...formData, sandbox: val };
                  if (template.slug === "efi-bank") {
                    updates.certificateBase64 = undefined;
                    updates.certificateFresh = false;
                  }
                  onFormChange(updates);
                }}
              />
            </div>
            <p className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-100/90">
              <strong className="font-semibold text-amber-50">Somente para desenvolvedores.</strong>{" "}
              Em loja real deixe desligado (produção). Ativar por engano usa ambiente de teste e
              os pagamentos dos clientes não serão processados de verdade.
            </p>
          </div>

          {template.slug === "efi-bank" && (
            <p className="rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
              O certificado .p12 precisa ser da <strong>mesma aplicação</strong> e do{" "}
              <strong>mesmo ambiente</strong> (Homologação/Produção) do Client ID.
              Se você trocou as chaves, baixe o .p12 de novo em Meus certificados e reenvie aqui.
            </p>
          )}

          {template.fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm font-medium text-white/80">
                {field.label}
                {formData.sandbox === true ? " — Sandbox" : " — Produção"}
              </Label>

              {field.type === "file" ? (
                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-white/10",
                    "bg-transparent px-4 py-6 transition-colors hover:bg-white/[0.04]"
                  )}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-white">Selecionar certificado</span>
                  <span className="text-[11px] text-muted-foreground">Apenas arquivos .p12 são aceitos</span>
                  <Input
                    type="file"
                    accept={field.accept}
                    className="hidden"
                    onChange={(e) => onFileUpload(field.key, e.target.files?.[0] || null)}
                  />
                  {formData[field.key] ? (
                    <p className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Certificado carregado
                    </p>
                  ) : (
                    template.slug === "efi-bank" && (
                      <p className="text-xs text-amber-300/90">
                        Selecione o arquivo .p12 deste ambiente/aplicação
                      </p>
                    )
                  )}
                </label>
              ) : (
                <Input
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={String(formData[field.key] ?? "")}
                  onChange={(e) => {
                    const value = e.target.value;
                    const updates: Record<string, unknown> = { ...formData, [field.key]: value };

                    if (template.slug === "pagbank" && field.key === "token" && value.trim()) {
                      updates.sandbox = true;
                    }

                    // Trocar Client ID da Efí exige novo .p12 da mesma app
                    if (
                      template.slug === "efi-bank"
                      && field.key === "clientId"
                      && value !== formData.clientId
                    ) {
                      updates.certificateBase64 = undefined;
                      updates.certificateFresh = false;
                    }

                    onFormChange(updates);
                  }}
                  className="font-mono"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            size="lg"
            variant="default"
            onClick={onSave}
            disabled={isValidating || isSaving}
            className="w-full"
          >
            {isSaving || isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="hidden h-4 w-4" />
            )}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}