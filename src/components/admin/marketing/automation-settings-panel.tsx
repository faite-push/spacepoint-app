"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Info, Lightbulb, Loader2, Pencil, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Can } from "@/providers/PermissionProvider";
import {
  marketingAutomationsApi,
  type MarketingAutomationSettings,
} from "@/lib/admin-api";
import { emailTemplateHref } from "@/lib/marketing-email-routes";
import { cn } from "@/lib/utils";

function formatDelayLabel(hours: number) {
  if (hours < 24) {
    return hours === 1 ? "1 hora após" : `${hours} horas após`;
  }
  const days = hours / 24;
  return days === 1 ? "1 dia após" : `${days} dias após`;
}

function DelayToggles({
  options,
  selected,
  onChange,
  recommendedHours = 1,
  templateBaseId,
  maxSteps = 3,
}: {
  options: number[];
  selected: number[];
  onChange: (next: number[]) => void;
  recommendedHours?: number;
  /** Ex.: abandonedCartRecovery — etapa 1/2/3 conforme a ordem dos delays ativos */
  templateBaseId: string;
  maxSteps?: number;
}) {
  const toggle = (hours: number, checked: boolean) => {
    if (checked) {
      if (selected.length >= maxSteps) {
        toast.error(`Máximo de ${maxSteps} etapas na régua de e-mails`);
        return;
      }
      onChange([...new Set([...selected, hours])].sort((a, b) => a - b));
      return;
    }
    const next = selected.filter((h) => h !== hours);
    onChange(next.length ? next : selected);
  };

  const sortedSelected = [...selected].sort((a, b) => a - b);

  return (
    <div className="space-y-2">
      {options.map((hours) => {
        const active = selected.includes(hours);
        const stepIndex = sortedSelected.indexOf(hours) + 1;
        const stepSlug =
          stepIndex <= 1
            ? templateBaseId
            : `${templateBaseId}_step${Math.min(stepIndex, maxSteps)}`;

        return (
          <div
            key={hours}
            className={cn(
              "flex flex-col items-start gap-3 rounded-md border px-4 py-3 transition-colors md:flex-row md:flex-wrap md:items-center md:justify-between",
              active ? "border-primary/40 bg-primary/5" : "border-white/5 bg-background/20"
            )}
          >
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <Switch
                checked={active}
                onCheckedChange={(v) => toggle(hours, v)}
                disabled={!active && selected.length >= maxSteps}
              />
              <span className="text-sm text-white">{formatDelayLabel(hours)}</span>
              {active && stepIndex > 0 ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
                  Etapa {stepIndex}
                </span>
              ) : null}
              {hours === recommendedHours ? (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                  Recomendado
                </span>
              ) : null}
            </div>
            {active ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white/55 hover:text-white md:w-auto"
                asChild
              >
                <Link href={emailTemplateHref(stepSlug)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Editar e-mail
                </Link>
              </Button>
            ) : null}
          </div>
        );
      })}
      <p className="text-xs text-white/35">
        Até {maxSteps} etapas (uma por horário ativo), cada uma com template próprio.
      </p>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
  info,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  info?: string;
}) {
  return (
    <section className="space-y-3 rounded-md border border-white/5 bg-background/20 p-4 md:p-5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-white">{title}</h3>
            {info ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button type="button" className="text-white/35 hover:text-white/70">
                      <Info className="h-4 w-4" />
                    </button>
                  }
                />
                <TooltipContent>
                  <p className="max-w-xs">{info}</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-sm text-white/45">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function TipBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-md border border-white/5 bg-white/[0.03] p-4">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <div className="min-w-0 space-y-1 text-sm">
        <p className="font-medium text-white">{title}</p>
        <div className="text-white/45">{children}</div>
      </div>
    </div>
  );
}

export function AutomationSettingsPanel() {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState("general");
  const [form, setForm] = useState<MarketingAutomationSettings | null>(null);
  const [baseline, setBaseline] = useState<MarketingAutomationSettings | null>(null);

  const query = useQuery({
    queryKey: ["admin", "marketing", "automation-settings"],
    queryFn: () => marketingAutomationsApi.getSettings(),
  });

  useEffect(() => {
    if (query.data?.settings) {
      setForm(query.data.settings);
      setBaseline(query.data.settings);
    }
  }, [query.data?.settings]);

  const dirty = useMemo(() => {
    if (!form || !baseline) return false;
    return JSON.stringify(form) !== JSON.stringify(baseline);
  }, [form, baseline]);

  const saveMutation = useMutation({
    mutationFn: () => marketingAutomationsApi.updateSettings(form!),
    onSuccess: (res) => {
      toast.success("Configurações salvas");
      setForm(res.settings);
      setBaseline(res.settings);
      queryClient.setQueryData(["admin", "marketing", "automation-settings"], res);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patch = <K extends keyof MarketingAutomationSettings>(
    key: K,
    value: MarketingAutomationSettings[K]
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [key]: value };
      // Manter sendRecoveryEmail alinhado ao modo (evita o backend forçar manual)
      if (key === "cartSendMode") {
        next.sendRecoveryEmail = value === "automated";
      }
      return next;
    });
  };

  if (query.isLoading || !form || !query.data) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full max-w-xl bg-white/5" />
        <Skeleton className="h-40 w-full bg-white/5" />
        <Skeleton className="h-40 w-full bg-white/5" />
      </div>
    );
  }

  const { defaults, options } = query.data;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <div className="flex flex-col gap-4 md:flex-row">
          <TabsList className="h-auto w-full flex-nowrap overflow-x-auto bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:w-auto">
            <TabsTrigger
              value="general"
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 md:px-4 md:py-3 md:text-sm"
            >
              Configurações gerais
            </TabsTrigger>
            <TabsTrigger
              value="cart"
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 md:px-4 md:py-3 md:text-sm"
            >
              Carrinho Abandonado
            </TabsTrigger>
            <TabsTrigger
              value="product"
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 md:px-4 md:py-3 md:text-sm"
            >
              Abandono de Produto
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-xs font-medium cursor-pointer transition-all duration-200 md:px-4 md:py-3 md:text-sm"
            >
              Pedido Cancelado
            </TabsTrigger>
          </TabsList>

          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center md:ml-auto md:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto"
              disabled={!dirty || saveMutation.isPending}
              onClick={() => baseline && setForm(baseline)}
            >
              Cancelar
            </Button>
            <Can I="marketing:manage">
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                disabled={!dirty || saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 hidden" />
                )}
                Salvar alterações
              </Button>
            </Can>
          </div>
        </div>

        <TabsContent value="general" className="mt-4 space-y-4">
          <SettingsSection
            title="Automações ativas"
            description="Desative para pausar os disparos automáticos de carrinho abandonado (produto e pedido cancelado continuam com seus próprios interruptores)."
          >
            <label className="flex items-center gap-3 text-sm text-white">
              <Switch
                checked={form.enabled}
                onCheckedChange={(v) => patch("enabled", v)}
              />
              {form.enabled ? "Carrinho abandonado ativo" : "Carrinho abandonado pausado"}
            </label>
          </SettingsSection>

          <SettingsSection
            title="Intervalo de notificação"
            description="Em qual horário o sistema de notificação deverá funcionar? O cliente receberá e-mails apenas dentro do horário programado. Múltiplas notificações irão respeitar o horário pré-estabelecido."
          >
            <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="notif-start">Início</Label>
                <Input
                  id="notif-start"
                  type="time"
                  value={form.notificationWindowStart}
                  onChange={(e) => patch("notificationWindowStart", e.target.value)}
                  className="border-white/5 bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-end">Fim</Label>
                <Input
                  id="notif-end"
                  type="time"
                  value={form.notificationWindowEnd}
                  onChange={(e) => patch("notificationWindowEnd", e.target.value)}
                  className="border-white/5 bg-background"
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Critérios de abandono (carrinho)"
            description="Define quando um carrinho entra na régua automática de recuperação."
          >
            <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="inactivity-minutes">Inatividade (minutos)</Label>
                <Input
                  id="inactivity-minutes"
                  type="number"
                  min={5}
                  max={1440}
                  value={form.inactivityMinutes}
                  onChange={(e) =>
                    patch("inactivityMinutes", Math.max(5, Number(e.target.value) || 5))
                  }
                  className="border-white/5 bg-background"
                />
                <p className="text-xs text-white/35">
                  Tempo sem atividade antes do 1º e-mail (padrão{" "}
                  {defaults.inactivityMinutes ?? 10} min).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min-subtotal">Subtotal mínimo (R$)</Label>
                <Input
                  id="min-subtotal"
                  type="number"
                  min={0}
                  step={0.01}
                  value={(form.minSubtotalCents / 100).toFixed(2)}
                  onChange={(e) => {
                    const reais = Number(e.target.value);
                    patch(
                      "minSubtotalCents",
                      Number.isFinite(reais) ? Math.max(0, Math.round(reais * 100)) : 0
                    );
                  }}
                  className="border-white/5 bg-background"
                />
                <p className="text-xs text-white/35">
                  Carrinhos abaixo deste valor não entram na recuperação automática.
                </p>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        <TabsContent value="cart" className="mt-4 space-y-4">
          <SettingsSection
            title="Envio de e-mails"
            description="No modo automatizado o cron dispara a régua. No modo manual use o botão de e-mail na listagem de carrinhos."
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-3 text-sm text-white">
                <Switch
                  checked={form.cartSendMode === "automated"}
                  onCheckedChange={(checked) =>
                    patch("cartSendMode", checked ? "automated" : "manual")
                  }
                />
                Automatizado
              </label>
              <label className="flex items-center gap-3 text-sm text-white">
                <Switch
                  checked={form.cartSendMode === "manual"}
                  onCheckedChange={(checked) =>
                    patch("cartSendMode", checked ? "manual" : "automated")
                  }
                />
                Envio manual
              </label>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Mensagem de notificação"
            description="Personalize a mensagem de notificação que é gerada ao clicar para enviar uma mensagem através do WhatsApp."
          >
            <Textarea
              value={form.whatsappCartMessage}
              onChange={(e) => patch("whatsappCartMessage", e.target.value)}
              rows={5}
              className="border-white/5 bg-background font-mono text-sm"
            />
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => patch("whatsappCartMessage", defaults.whatsappCartMessage)}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Restaurar mensagem padrão
            </Button>
            <TipBox title="Como personalizar sua mensagem">
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <code className="text-primary">{"{{ nome }}"}</code> — primeiro nome do cliente
                </li>
                <li>
                  <code className="text-primary">{"{{ carrinho }}"}</code> — link do carrinho abandonado
                </li>
                <li>
                  <code className="text-primary">{"{{ link }}"}</code> — mesmo link de recuperação
                </li>
                <li>
                  <code className="text-primary">{"{{ loja }}"}</code> — nome da loja
                </li>
              </ul>
            </TipBox>
          </SettingsSection>

          <SettingsSection
            title="Quando enviar o e-mail"
            description="Ative os intervalos da régua. Cada horário marcado dispara um e-mail em sequência (ex.: 1h → 12h → 24h). Use “Editar e-mail” na etapa correspondente."
          >
            <DelayToggles
              options={options.cartEmailDelays}
              selected={form.cartEmailDelays}
              onChange={(next) => patch("cartEmailDelays", next)}
              templateBaseId="abandonedCartRecovery"
              maxSteps={options.maxRecoverySteps ?? 3}
            />
          </SettingsSection>
        </TabsContent>

        <TabsContent value="product" className="mt-4 space-y-4">
          <SettingsSection
            title="Envio de e-mails de abandono"
            description="Enviamos automaticamente e-mails para lembrar os visitantes que pararam de navegar na loja após visualizar produtos, mas não montaram carrinhos."
            info="Abandono de produto e carrinho não disparam ao mesmo tempo para o mesmo cliente."
          >
            <label className="flex items-center gap-3 text-sm text-white">
              <Switch
                checked={form.abandonedProductEnabled}
                onCheckedChange={(v) => patch("abandonedProductEnabled", v)}
              />
              {form.abandonedProductEnabled ? "Ativado" : "Desativado"}
            </label>
            <TipBox title="E-mails personalizados de acordo com o seu usuário">
              <p>
                Os e-mails de abandono de carrinho e produto não são enviados simultaneamente; cada um
                é disparado de acordo com a ação específica do cliente.
              </p>
            </TipBox>
          </SettingsSection>

          <SettingsSection title="Quando enviar o e-mail">
            <DelayToggles
              options={options.abandonedProductDelays}
              selected={form.abandonedProductDelays}
              onChange={(next) => patch("abandonedProductDelays", next)}
              templateBaseId="abandonedProductRecovery"
              maxSteps={options.maxRecoverySteps ?? 3}
            />
          </SettingsSection>
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4 space-y-4">
          <SettingsSection
            title="Recuperação de pedido cancelado"
            description="Enviamos automaticamente e-mails para os clientes refazerem seus pedidos cancelados de forma facilitada."
            info="Dispara após cancelamento ou expiração por falta de pagamento."
          >
            <label className="flex items-center gap-3 text-sm text-white">
              <Switch
                checked={form.cancelledOrderEnabled}
                onCheckedChange={(v) => patch("cancelledOrderEnabled", v)}
              />
              {form.cancelledOrderEnabled ? "Ativado" : "Desativado"}
            </label>
          </SettingsSection>

          <SettingsSection
            title="Mensagem de notificação"
            description="Personalize a mensagem de notificação que é gerada ao clicar para enviar uma mensagem através do WhatsApp."
          >
            <Textarea
              value={form.whatsappOrderMessage}
              onChange={(e) => patch("whatsappOrderMessage", e.target.value)}
              rows={5}
              className="border-white/5 bg-background font-mono text-sm"
            />
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => patch("whatsappOrderMessage", defaults.whatsappOrderMessage)}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Restaurar mensagem padrão
            </Button>
            <TipBox title="Como personalizar sua mensagem">
              <ul className="list-disc space-y-1 pl-4">
                <li>
                  <code className="text-primary">{"{{ nome }}"}</code> — primeiro nome do cliente
                </li>
                <li>
                  <code className="text-primary">{"{{ carrinho }}"}</code> — link do pedido cancelado
                </li>
              </ul>
            </TipBox>
          </SettingsSection>

          <SettingsSection title="Quando enviar o e-mail">
            <DelayToggles
              options={options.cancelledOrderDelays}
              selected={form.cancelledOrderDelays}
              onChange={(next) => patch("cancelledOrderDelays", next)}
              templateBaseId="cancelledOrderRecovery"
              maxSteps={options.maxRecoverySteps ?? 3}
            />
          </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
