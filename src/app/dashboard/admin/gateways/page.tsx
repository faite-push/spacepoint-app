"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, ExternalLink, Headphones, Info, Loader2, Settings2, UserPlus, } from "lucide-react";
import { FaPix } from "react-icons/fa6";
import { FaCreditCard } from "react-icons/fa6";
import { toast } from "sonner";

import { GatewayConfigModal, type GatewayTemplate } from "@/components/admin/gateways/gateway-config-modal";
import { gatewaysApi } from "@/lib/admin-api";
import { API_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { GatewaysSkeleton } from "@/components/admin/skeletons/GatewaysSkeleton";


const GATEWAY_METHODS: Record<string, Array<"PIX" | "CARD">> = {
  "efi-bank": ["PIX", "CARD"],
  "mercado-pago": ["PIX", "CARD"],
  pagbank: ["PIX", "CARD"],
  stripe: ["CARD"],
};

const WEBHOOK_PATHS: Record<string, string> = {
  "efi-bank": "/v1/webhooks/efi/pix",
  "mercado-pago": "/v1/webhooks/mercado-pago",
  pagbank: "/v1/webhooks/pagbank",
  stripe: "/v1/webhooks/stripe",
};

const GATEWAY_TEMPLATES: GatewayTemplate[] = [
  {
    slug: "efi-bank",
    name: "Efí Bank",
    description: "PIX e cartão via Efí (Gerencianet). Requer certificado .p12.",
    links: {
      signup: "https://sejaefi.com.br",
      support: "https://sejaefi.com.br/central-de-ajuda",
      tutorial: "https://dev.efipay.com.br/docs/api-pix/credenciais",
    },
    renderLogo: (className) => (
      <img src="/efibank.png" alt="Efí Bank" className={cn("h-6 w-6", className)} />
    ),
    fields: [
      { key: "clientId", label: "Chave Client ID", placeholder: "Client_Id_...", type: "text" },
      { key: "clientSecret", label: "Chave Secret", placeholder: "Client_Secret_...", type: "password" },
      { key: "pixKey", label: "Chave PIX", placeholder: "sua-chave@email.com", type: "text" },
      { key: "certificateBase64", label: "Certificado .p12", type: "file", accept: ".p12", hint: "Arquivo .p12 exportado do painel Efí. Webhooks usam WEBHOOK_SHARED_SECRET do .env da API (?token=...&ignorar=)." },
    ],
  },
  {
    slug: "mercado-pago",
    name: "Mercado Pago",
    description: "PIX e cartão via Mercado Pago.",
    links: {
      signup: "https://www.mercadopago.com.br/developers",
      support: "https://www.mercadopago.com.br/developers/pt/support",
      tutorial: "https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/credentials",
    },
    renderLogo: (className) => <img src="/mercadopago.png" alt="Mercado Pago" className={cn("w-full")} />,
    fields: [
      { key: "publicKey", label: "Public Key", placeholder: "APP_USR-...", type: "text" },
      { key: "accessToken", label: "Access Token", placeholder: "APP_USR-...", type: "password" },
    ],
  },
  {
    slug: "pagbank",
    name: "PagBank",
    description: "PIX e cartão via API PagBank / PagSeguro.",
    links: {
      signup: "https://portaldev.pagbank.com.br",
      support: "https://developer.pagbank.com.br/discuss",
      tutorial: "https://developer.pagbank.com.br/docs/token-de-autenticacao",
    },
    renderLogo: (className) => <img src="/pagbank.png" alt="Pagbank" className={cn("h-6 w-6", className)} />,
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "", type: "text" },
      { key: "clientSecret", label: "Client Secret", placeholder: "", type: "password" },
      {
        key: "token",
        label: "Access Token (alternativo)",
        placeholder: "Cole o token do portal...",
        type: "password",
        hint: "Token de portaldev.pagbank.com.br → ative Modo Sandbox. Produção: PagBank > Venda online > Integrações. Webhooks usam WEBHOOK_SHARED_SECRET do .env (?token=).",
      },
    ],
  },
  {
    slug: "stripe",
    name: "Stripe",
    description: "Cartão de crédito via Stripe Checkout.",
    links: {
      signup: "https://dashboard.stripe.com/register",
      support: "https://support.stripe.com",
      tutorial: "https://docs.stripe.com/keys",
    },
    renderLogo: (className) => <img src="/stripe.png" className={cn("h-6 w-6", className)} alt="Stripe" />,
    fields: [
      { key: "publishableKey", label: "Publishable Key", placeholder: "pk_live_...", type: "text" },
      { key: "secretKey", label: "Secret Key", placeholder: "sk_live_...", type: "password" },
    ],
  },
];

function webhookUrl(slug: string) {
  const base = API_URL || "https://sua-api.com";
  const path = WEBHOOK_PATHS[slug] || "/v1/webhooks/payments";
  // Token vem do WEBHOOK_SHARED_SECRET no .env (não expor o valor no browser)
  if (slug === "efi-bank") {
    return `${base}${path}?token=SEU_WEBHOOK_SHARED_SECRET&ignorar=`;
  }
  if (slug === "pagbank" || slug === "mercado-pago" || slug === "stripe") {
    return `${base}${path}?token=SEU_WEBHOOK_SHARED_SECRET`;
  }
  return `${base}${path}`;
}

function isGatewayConfigured(slug: string, config: Record<string, unknown> = {}) {
  switch (slug) {
    case "efi-bank":
      return Boolean(
        config.clientId && config.clientSecret && config.pixKey && config.certificateBase64
      );
    case "mercado-pago":
      return Boolean(config.accessToken);
    case "pagbank":
      return Boolean(config.token || (config.clientId && config.clientSecret));
    case "stripe":
      return Boolean(config.secretKey);
    default:
      return false;
  }
}

function getGatewayActiveMethods(
  slug: string,
  config: Record<string, unknown> = {},
  isActive = false
) {
  const supported = GATEWAY_METHODS[slug] || ["PIX"];
  const activeMethods = config.activeMethods as Record<string, boolean> | undefined;

  if (activeMethods && typeof activeMethods === "object") {
    return {
      PIX: supported.includes("PIX") && Boolean(activeMethods.PIX),
      CARD: supported.includes("CARD") && Boolean(activeMethods.CARD),
    };
  }

  const legacy = Array.isArray(config.paymentMethods)
    ? config.paymentMethods.map((m) => String(m).toUpperCase())
    : [];

  if (isActive && legacy.length) {
    return {
      PIX: supported.includes("PIX") && legacy.includes("PIX"),
      CARD: supported.includes("CARD") && legacy.includes("CARD"),
    };
  }

  return { PIX: false, CARD: false };
}

function formatActiveMethodsLabel(slug: string, config: Record<string, unknown>, isActive: boolean) {
  const active = getGatewayActiveMethods(slug, config, isActive);
  const labels: string[] = [];
  if (active.PIX) labels.push("PIX");
  if (active.CARD) labels.push("Cartão");
  return labels.length ? labels.join(" + ") : "Nenhum";
}

type TabId = "payments" | "rules";

export default function GatewaysPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>("payments");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

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
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao salvar configurações");
    },
  });

  const validateMutation = useMutation({
    mutationFn: ({ slug, config }: { slug: string; config: Record<string, unknown> }) =>
      gatewaysApi.validate(slug, config),
    onSuccess: (result) => {
      if (result.enforceSandbox) {
        setFormData((prev) => ({ ...prev, sandbox: true }));
      }
      toast.success(result.message || "Credenciais válidas!");
    },
    onError: (err: Error & { enforceSandbox?: boolean }) => {
      if (err.enforceSandbox) {
        setFormData((prev) => ({ ...prev, sandbox: true }));
      }
      toast.error(err.message || "Credenciais inválidas");
    },
  });

  const toggleMethodMutation = useMutation({
    mutationFn: ({ slug, method, enabled }: { slug: string; method: "PIX" | "CARD"; enabled: boolean }) =>
      gatewaysApi.toggleMethod(slug, method, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "gateways"] });
      toast.success("Método de pagamento atualizado!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao alternar método");
    },
  });

  if (isLoading) {
    return <GatewaysSkeleton />;
  }

  const gateways = data?.gateways || [];
  const editingTemplate = GATEWAY_TEMPLATES.find((t) => t.slug === editingSlug) || null;
  const editingGateway = gateways.find((g) => g.slug === editingSlug);

  const handleToggleMethod = async (slug: string, method: "PIX" | "CARD", enabled: boolean) => {
    const gateway = gateways.find((g) => g.slug === slug);
    if (!gateway) return;

    if (!isGatewayConfigured(slug, gateway.config)) {
      toast.error("Configure o gateway antes de ativar um método");
      return;
    }

    toggleMethodMutation.mutate({ slug, method, enabled });
  };

  const handleOpenConfig = (slug: string) => {
    const existing = gateways.find((g) => g.slug === slug);
    const config = existing?.config || {};
    setEditingSlug(slug);
    setFormData({
      ...config,
      // Primeira configuração (ou sem flag): desligado. Só liga se já estava salvo como true.
      sandbox: config.sandbox === true,
    });
  };

  const handleFileUpload = (key: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setFormData((prev) => ({ ...prev, [key]: base64, certificateFresh: true }));
    };
    reader.readAsDataURL(file);
  };

  const buildConfig = (slug: string) => {
    const existing = gateways.find((g) => g.slug === slug);
    const merged = {
      ...(existing?.config || {}),
      ...formData,
      sandbox: formData.sandbox === true,
    };
    delete (merged as Record<string, unknown>).certificateFresh;
    return merged;
  };

  const handleValidate = () => {
    if (!editingSlug) return;
    validateMutation.mutate({ slug: editingSlug, config: buildConfig(editingSlug) });
  };

  const handleSave = async () => {
    if (!editingSlug) return;
    const config = buildConfig(editingSlug);

    try {
      await validateMutation.mutateAsync({ slug: editingSlug, config });

      const template = GATEWAY_TEMPLATES.find((t) => t.slug === editingSlug);
      const existing = gateways.find((g) => g.slug === editingSlug);

      updateMutation.mutate({
        slug: editingSlug,
        payload: {
          name: template?.name || editingSlug,
          config,
          isActive: existing?.isActive ?? false,
        },
      });
    } catch (error) {
      console.error("Validation failed before save:", error);
    }
  };

  const handleToggleGateway = (_slug: string, _isActive: boolean) => {
    toast.message("Use os toggles Pix/Cartão em cada gateway para ativar métodos.");
  };

  return (
    <div className="relative space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="relative space-y-1">
        <h1 className="text-2xl font-bold text-white">Pagamentos</h1>
        <p className="text-muted-foreground">Configuração de pagamentos</p>
      </div>

      {activeTab === "payments" ? (
        <div className="relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {GATEWAY_TEMPLATES.map((template) => {
            const gateway = gateways.find((g) => g.slug === template.slug);
            const config = (gateway?.config || {}) as Record<string, unknown>;
            const isConfigured = isGatewayConfigured(template.slug, config);
            const activeMethods = getGatewayActiveMethods(
              template.slug,
              config,
              gateway?.isActive || false
            );
            const isActive = activeMethods.PIX || activeMethods.CARD;
            const supportedMethods = GATEWAY_METHODS[template.slug] || ["PIX"];
            const methodPending = toggleMethodMutation.isPending || updateMutation.isPending;

            return (
              <div
                key={template.slug}
                className={cn("flex flex-col rounded-md border border-white/5 bg-card p-4 transition-all")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-14 w-14 p-2 shrink-0 items-center justify-center">
                      {template.renderLogo("h-full w-full rounded-sm select-none object-cover pointer-events-none")}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">{template.name}</h3>
                      <p className="text-xs text-muted-foreground">Conecte sua conta</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isConfigured ? "outline" : "default"}
                    onClick={() => handleOpenConfig(template.slug)}
                    className={cn(
                      "h-8 shrink-0 rounded-sm px-3 text-xs",
                      !isConfigured && "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    {isConfigured ? "Configurar" : "Conectar"}
                  </Button>
                </div>

                <div className="mt-4 space-y-2 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2.5">
                  {supportedMethods.includes("PIX") && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaPix className="h-4 w-4 text-primary" />
                        <span className="text-sm text-white">Pix</span>
                      </div>
                      <Switch
                        checked={activeMethods.PIX}
                        disabled={methodPending || !isConfigured}
                        onCheckedChange={(val) => handleToggleMethod(template.slug, "PIX", val)}
                      />
                    </div>
                  )}
                  {supportedMethods.includes("CARD") && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaCreditCard className="h-4 w-4 text-primary" />
                        <span className="text-sm text-white">Cartão</span>
                      </div>
                      <Switch
                        checked={activeMethods.CARD}
                        disabled={methodPending || !isConfigured}
                        onCheckedChange={(val) => handleToggleMethod(template.slug, "CARD", val)}
                      />
                    </div>
                  )}
                </div>


                <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-white/5 bg-white/[0.02] p-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className={cn("rounded p-1 text-xs lowercase font-medium", isActive ? "text-emerald-400" : "text-white/60")}>
                      {isActive ? "Ativo" : "Desativado"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Método</p>
                    <p className="mt-1 text-xs font-semibold text-white">
                      {formatActiveMethodsLabel(template.slug, config, isActive)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Conta</p>
                    <p className={cn("rounded lowercase mt-1 text-xs font-medium", isConfigured ? "text-emerald-400" : "text-white/60")}>
                      {isConfigured ? "Conectada" : "Desconectada"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/5 pt-3">
                  <div className="flex flex-row mx-auto gap-6">
                    <a
                      href={template.links.signup}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors duration-200 hover:text-primary"
                    >
                      <UserPlus className="h-3 w-3" />
                      Criar conta
                    </a>
                    <a
                      href={template.links.support}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Headphones className="h-3 w-3" />
                      Suporte
                    </a>
                    <a
                      href={template.links.tutorial}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Tutorial
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative space-y-4">
          <div className="rounded-2xl border border-white/5 bg-card/40 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Regras de uso</h3>
                <p className="text-xs text-muted-foreground">Como os gateways funcionam na sua loja</p>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Pix e Cartão são independentes: você pode usar Pix de um gateway e Cartão de outro.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Apenas um gateway pode ficar ativo por método (um Pix e um Cartão por vez).
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Stripe aceita somente Cartão. Efí, Mercado Pago e PagBank aceitam Pix e Cartão.
              </li>
              <li className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Todos os gateways usam <code className="text-xs">WEBHOOK_SHARED_SECRET</code> no{" "}
                <code className="text-xs">.env</code> da API. Cadastre a URL com{" "}
                <code className="text-xs">?token=...</code> no painel do provedor.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/5 bg-card/40 p-6">
            <h3 className="mb-4 font-semibold text-white">URLs de Webhook</h3>
            <div className="space-y-3">
              {GATEWAY_TEMPLATES.map((template) => (
                <div
                  key={template.slug}
                  className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <p className="text-xs font-medium text-white">{template.name}</p>
                  <code className="mt-1 block break-all text-[11px] text-muted-foreground">
                    {webhookUrl(template.slug)}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <GatewayConfigModal
        open={Boolean(editingSlug)}
        template={editingTemplate}
        formData={formData}
        hasStoredCertificate={Boolean(editingGateway?.config?.certificateBase64)}
        isValidating={validateMutation.isPending}
        isSaving={updateMutation.isPending}
        onOpenChange={(open) => !open && setEditingSlug(null)}
        onFormChange={setFormData}
        onFileUpload={handleFileUpload}
        onValidate={handleValidate}
        onSave={handleSave}
      />
    </div>
  );
};