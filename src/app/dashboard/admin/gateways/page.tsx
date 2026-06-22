"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  ShieldCheck,
  Save,
  Loader2,
  Info,
  CheckCircle2,
  AlertCircle,
  FlaskConical,
} from "lucide-react";
import { FaPix } from "react-icons/fa6";

import { gatewaysApi, type GatewayConfig } from "@/lib/admin-api";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  type?: string;
  accept?: string;
  hint?: string;
};

const WEBHOOK_PATHS: Record<string, string> = {
  "efi-bank": "/v1/webhooks/efi/pix",
  "mercado-pago": "/v1/webhooks/mercado-pago",
  pagbank: "/v1/webhooks/pagbank",
  stripe: "/v1/webhooks/stripe",
};

const GATEWAY_TEMPLATES = [
  {
    slug: "efi-bank",
    name: "Efí Bank",
    color: "emerald",
    description: "PIX nativo via Efí (Gerencianet). Requer certificado .p12.",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "Client_Id_...", type: "text" },
      { key: "clientSecret", label: "Client Secret", placeholder: "Client_Secret_...", type: "password" },
      { key: "pixKey", label: "Chave PIX", placeholder: "sua-chave@email.com", type: "text" },
      { key: "certificateBase64", label: "Certificado .p12", type: "file", accept: ".p12", hint: "Arquivo .p12 exportado do painel Efí" },
    ] as FieldDef[],
  },
  {
    slug: "mercado-pago",
    name: "Mercado Pago",
    color: "blue",
    description: "PIX com aprovação via Mercado Pago.",
    fields: [
      { key: "publicKey", label: "Public Key", placeholder: "APP_USR-...", type: "text" },
      { key: "accessToken", label: "Access Token", placeholder: "APP_USR-...", type: "password" },
      { key: "webhookSecret", label: "Webhook Secret (opcional)", placeholder: "...", type: "password" },
    ] as FieldDef[],
  },
  {
    slug: "pagbank",
    name: "PagBank",
    color: "yellow",
    description: "PIX via API PagBank / PagSeguro.",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "...", type: "text" },
      { key: "clientSecret", label: "Client Secret", placeholder: "...", type: "password" },
      { key: "token", label: "Access Token (alternativo)", placeholder: "Bearer token...", type: "password", hint: "Use Client ID + Secret OU um token de acesso" },
    ] as FieldDef[],
  },
  {
    slug: "stripe",
    name: "Stripe",
    color: "purple",
    description: "PIX via Stripe (conta com PIX habilitado no Brasil).",
    fields: [
      { key: "publishableKey", label: "Publishable Key", placeholder: "pk_live_...", type: "text" },
      { key: "secretKey", label: "Secret Key", placeholder: "sk_live_...", type: "password" },
      { key: "webhookSecret", label: "Webhook Secret (opcional)", placeholder: "whsec_...", type: "password" },
    ] as FieldDef[],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", glow: "bg-emerald-500" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", glow: "bg-blue-500" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", glow: "bg-yellow-500" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", glow: "bg-purple-500" },
};

function webhookUrl(slug: string) {
  const base = API_URL || "https://sua-api.com";
  return `${base}${WEBHOOK_PATHS[slug] || "/v1/webhooks/payments"}`;
}

export default function GatewaysPage() {
  const queryClient = useQueryClient();
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [validationStatus, setValidationStatus] = useState<Record<string, "idle" | "valid" | "invalid">>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "gateways"],
    queryFn: () => gatewaysApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ slug, payload }: { slug: string; payload: { name: string; config: Record<string, unknown>; isActive?: boolean } }) =>
      gatewaysApi.update(slug, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gateways"] });
      toast.success("Configurações salvas com sucesso!");
      setEditingSlug(null);
      setValidationStatus({});
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar configurações");
    },
  });

  const validateMutation = useMutation({
    mutationFn: ({ slug, config }: { slug: string; config: Record<string, unknown> }) =>
      gatewaysApi.validate(slug, config),
    onSuccess: (result, { slug }) => {
      setValidationStatus((s) => ({ ...s, [slug]: "valid" }));
      toast.success(result.message || "Credenciais válidas!");
    },
    onError: (err: Error, { slug }) => {
      setValidationStatus((s) => ({ ...s, [slug]: "invalid" }));
      toast.error(err.message || "Credenciais inválidas");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ slug, isActive }: { slug: string; isActive: boolean }) =>
      gatewaysApi.toggle(slug, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gateways"] });
      toast.success("Gateway atualizado!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao alternar gateway");
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const gateways = data?.gateways || [];

  const handleEdit = (slug: string) => {
    const existing = gateways.find((g) => g.slug === slug);
    setEditingSlug(slug);
    setFormData(existing?.config || {});
    setValidationStatus({});
  };

  const handleFileUpload = (key: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setFormData((prev) => ({ ...prev, [key]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleValidate = (slug: string) => {
    const template = GATEWAY_TEMPLATES.find((t) => t.slug === slug);
    const existing = gateways.find((g) => g.slug === slug);
    const config = {
      ...(existing?.config || {}),
      ...formData,
      sandbox: formData.sandbox !== false,
    };
    validateMutation.mutate({ slug, config });
  };

  const handleSave = (slug: string) => {
    const template = GATEWAY_TEMPLATES.find((t) => t.slug === slug);
    const existing = gateways.find((g) => g.slug === slug);
    const config = {
      ...(existing?.config || {}),
      ...formData,
      sandbox: formData.sandbox !== false,
    };
    updateMutation.mutate({
      slug,
      payload: {
        name: template?.name || slug,
        config,
        isActive: existing?.isActive ?? false,
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Configurações de Pagamento</h1>
        <p className="text-muted-foreground">
          Configure Efí Bank, Mercado Pago, PagBank ou Stripe. Apenas um gateway PIX pode ficar ativo por vez.
        </p>
      </div>

      <div className="grid gap-6">
        {GATEWAY_TEMPLATES.map((template) => {
          const colors = COLOR_MAP[template.color] || COLOR_MAP.blue;
          const isActive = gateways.find((g) => g.slug === template.slug)?.isActive || false;
          const isEditing = editingSlug === template.slug;
          const status = validationStatus[template.slug];

          return (
            <div
              key={template.slug}
              className={cn(
                "group relative overflow-hidden rounded-3xl border transition-all duration-300",
                isActive ? "bg-white/[0.02] border-primary/20" : "bg-zinc-900/50 border-white/5 opacity-80"
              )}
            >
              {isActive && (
                <div className={cn("absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-10", colors.glow)} />
              )}

              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-lg", colors.bg, colors.border, colors.text)}>
                      {template.slug === "stripe" ? <CreditCard className="h-7 w-7" /> : <FaPix className="h-7 w-7" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{template.name}</h3>
                        {isActive && (
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0">
                            Ativo
                          </Badge>
                        )}
                        {status === "valid" && (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Validado
                          </Badge>
                        )}
                        {status === "invalid" && (
                          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 gap-1">
                            <AlertCircle className="h-3 w-3" /> Inválido
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 max-w-md">{template.description}</p>
                      <code className="text-[10px] text-zinc-600 font-mono block mt-1">
                        Webhook: {webhookUrl(template.slug)}
                      </code>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-medium text-zinc-400">{isActive ? "Ativo" : "Inativo"}</span>
                      <Switch
                        checked={isActive}
                        onCheckedChange={(val) => toggleMutation.mutate({ slug: template.slug, isActive: val })}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/10 hover:bg-white/10"
                      onClick={() => (isEditing ? setEditingSlug(null) : handleEdit(template.slug))}
                    >
                      {isEditing ? "Cancelar" : "Configurar"}
                    </Button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 pt-8 border-t border-white/5 animate-in slide-in-from-top-4 duration-300">
                    <div className="mb-6 flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <FlaskConical className="h-5 w-5 text-amber-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Modo Sandbox</p>
                          <p className="text-xs text-zinc-500">Use credenciais de homologação/teste</p>
                        </div>
                      </div>
                      <Switch
                        checked={formData.sandbox !== false}
                        onCheckedChange={(val) => setFormData({ ...formData, sandbox: val })}
                      />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {template.fields.map((field) => (
                        <div key={field.key} className={field.type === "file" ? "md:col-span-2" : ""}>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">
                              {field.label}
                            </Label>
                            {field.type === "file" ? (
                              <div className="space-y-2">
                                <Input
                                  type="file"
                                  accept={field.accept}
                                  onChange={(e) => handleFileUpload(field.key, e.target.files?.[0] || null)}
                                  className="h-12 bg-white/[0.03] border-white/5 rounded-xl"
                                />
                                {Boolean(formData[field.key] || gateways.find((g) => g.slug === template.slug)?.config?.[field.key]) && (
                                  <p className="text-xs text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Certificado carregado
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Input
                                type={field.type || "text"}
                                placeholder={field.placeholder}
                                value={String(formData[field.key] ?? "")}
                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                className="h-12 bg-white/[0.03] border-white/5 rounded-xl focus:border-primary/50 transition-all font-mono text-xs"
                              />
                            )}
                            {field.hint && <p className="text-[10px] text-zinc-600 ml-1">{field.hint}</p>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className="flex items-center gap-3 text-sm text-primary/80 font-medium">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        Credenciais validadas com o provedor antes de salvar.
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => handleValidate(template.slug)}
                          disabled={validateMutation.isPending}
                          className="rounded-xl border-white/10"
                        >
                          {validateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                          )}
                          Testar credenciais
                        </Button>
                        <Button
                          onClick={() => handleSave(template.slug)}
                          disabled={updateMutation.isPending}
                          className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 px-6"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-start gap-6">
        <div className="h-16 w-16 shrink-0 flex items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-500">
          <Info className="h-8 w-8" />
        </div>
        <div className="space-y-3 flex-1">
          <h4 className="text-lg font-bold text-white">Webhooks por gateway</h4>
          <p className="text-sm text-zinc-400">
            Configure a URL de webhook no painel de cada provedor. O sistema confirma pagamentos consultando a API do gateway.
          </p>
          <ul className="space-y-1 text-xs font-mono text-zinc-500">
            {GATEWAY_TEMPLATES.map((t) => (
              <li key={t.slug}>
                <span className="text-zinc-400">{t.name}:</span> {webhookUrl(t.slug)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
