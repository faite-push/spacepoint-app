"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-markup";
import "prismjs/themes/prism-tomorrow.css";

import { ArrowLeft, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Can } from "@/providers/PermissionProvider";
import { emailTemplatesApi, type EmailTemplateBlock, type EmailTemplatesResponse, type EmailTemplatesState, } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type Props = {
  block: EmailTemplateBlock;
  data: EmailTemplatesResponse;
  onBackHref: string;
  onSaved: (next: EmailTemplatesResponse) => void;
};

function getBlockHtml(templates: EmailTemplatesState, block: EmailTemplateBlock) {
  if (block.key === "headerHtml") return templates.headerHtml;
  if (block.key === "footerHtml") return templates.footerHtml;
  if (block.key.startsWith("bodies.")) {
    const bodyKey = block.key.replace("bodies.", "");
    return templates.bodies[bodyKey] || "";
  }
  return "";
}

function getDefaultBlockHtml(
  defaults: EmailTemplatesResponse["defaults"],
  block: EmailTemplateBlock
) {
  if (block.key === "headerHtml") return defaults.headerHtml;
  if (block.key === "footerHtml") return defaults.footerHtml;
  if (block.key.startsWith("bodies.")) {
    const bodyKey = block.key.replace("bodies.", "");
    return defaults.bodies?.[bodyKey] || defaults.sampleBodyHtml || "";
  }
  return defaults.sampleBodyHtml || "";
}

export function EmailBlockEditor({ block, data, onBackHref, onSaved }: Props) {
  const [code, setCode] = useState(() => {
    const current = getBlockHtml(data.templates, block);
    return current.trim() ? current : getDefaultBlockHtml(data.defaults, block);
  });
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testEmail, setTestEmail] = useState(data.branding.contactEmail || "");

  const defaultCode = useMemo(
    () => getDefaultBlockHtml(data.defaults, block),
    [block, data.defaults]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (block.key === "headerHtml") {
        return emailTemplatesApi.update({ headerHtml: code });
      }
      if (block.key === "footerHtml") {
        return emailTemplatesApi.update({ footerHtml: code });
      }
      const bodyKey = block.key.replace("bodies.", "");
      return emailTemplatesApi.update({
        bodies: {
          ...data.templates.bodies,
          [bodyKey]: code,
        },
      });
    },
    onSuccess: (res) => {
      toast.success("Template salvo");
      onSaved(res);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMutation = useMutation({
    mutationFn: () => {
      const isHeader = block.key === "headerHtml";
      const isFooter = block.key === "footerHtml";
      return emailTemplatesApi.sendTest({
        to: testEmail.trim(),
        blockId: block.id,
        headerHtml: isHeader ? code : data.templates.headerHtml,
        footerHtml: isFooter ? code : data.templates.footerHtml,
        bodyHtml: !isHeader && !isFooter && code.trim() ? code : data.defaults.sampleBodyHtml,
        title: block.defaultTitle || block.title,
        subtitle: block.defaultSubtitle || block.description,
      });
    },
    onSuccess: () => {
      toast.success("E-mail de teste enviado");
      setTestOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    const current = getBlockHtml(data.templates, block);
    setCode(current.trim() ? current : getDefaultBlockHtml(data.defaults, block));
  }, [block, data.templates, data.defaults]);

  useEffect(() => {
    setTestEmail(data.branding.contactEmail || "");
  }, [data.branding.contactEmail]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const isHeader = block.key === "headerHtml";
        const isFooter = block.key === "footerHtml";
        const payload = {
          headerHtml: isHeader ? code : data.templates.headerHtml,
          footerHtml: isFooter ? code : data.templates.footerHtml,
          bodyHtml: !isHeader && !isFooter && code.trim()
            ? code
            : data.defaults.sampleBodyHtml,
          title: block.defaultTitle || "Pré-visualização",
          subtitle: block.defaultSubtitle || "Como o e-mail aparece para o cliente",
        };
        const res = await emailTemplatesApi.preview(payload);
        if (!cancelled) setPreviewHtml(res.html);
      } catch {
        if (!cancelled) {
          setPreviewHtml("<p style='color:#fafafa;padding:16px'>Falha ao gerar pré-visualização</p>");
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, block, data.templates.headerHtml, data.templates.footerHtml, data.defaults.sampleBodyHtml]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="text-white/60 hover:text-white"
            asChild
          >
            <Link href={onBackHref}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div>
            <h2 className="text-lg font-medium text-white">{block.title}</h2>
            <p className="text-sm text-white/45">{block.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="px-5 py-4"
            onClick={() => setCode(defaultCode)}
          >
            Restaurar padrão
          </Button>
          <Can I="marketing:manage">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 px-5 py-4"
              onClick={() => setTestOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar teste
            </Button>
            <Button
              type="button"
              className="px-6 py-4"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              Salvar Alterações
            </Button>
          </Can>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="overflow-hidden rounded-md border border-white/10 bg-background/40">
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2 text-xs text-white/50">
            Editor HTML
          </div>
          <div className="max-h-[70vh] overflow-auto">
            <Editor
              value={code}
              onValueChange={setCode}
              highlight={(value) => highlight(value, languages.markup, "markup")}
              padding={16}
              textareaClassName="outline-none"
              className="min-h-[420px] font-mono text-[13px] leading-5 text-white/90"
              style={{
                fontFamily: '"Fira Code", "JetBrains Mono", ui-monospace, monospace',
                background: "transparent",
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-white/10 bg-background/40">
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2 text-xs text-white/50">
            Pré-visualização
            {previewLoading ? <span className="text-white/30">atualizando…</span> : null}
          </div>
          <div className={cn("min-h-[420px] bg-transparent p-2", previewLoading && "opacity-70")}>
            <iframe
              title="Pré-visualização do e-mail"
              srcDoc={previewHtml}
              className="h-[70vh] w-full rounded-sm border-0 bg-transparent"
              sandbox=""
            />
          </div>
        </div>
      </div>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent className="border-white/10 bg-background sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar e-mail de teste</DialogTitle>
            <DialogDescription>
              Envia o bloco <strong className="text-white/80">{block.title}</strong> com dados de
              exemplo para o endereço informado. O HTML atual do editor será usado (mesmo sem salvar).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="test-email">Destinatário</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="seu@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="border-white/10 bg-background"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/10"
              onClick={() => setTestOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!testEmail.trim() || testMutation.isPending}
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};