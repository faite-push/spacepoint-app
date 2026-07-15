"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, GripVertical, Loader2, Plus, PlusCircle, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { siteSettingsApi, type CheckoutAuthMode, type CheckoutFieldConfig, type CheckoutSettings, } from "@/lib/admin-api";
import { DEFAULT_CHECKOUT_SETTINGS } from "@/lib/checkout-defaults";
import { Toggle } from "@/components/ui/toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DEFAULT_SETTINGS: CheckoutSettings = DEFAULT_CHECKOUT_SETTINGS;

function newField(index: number): CheckoutFieldConfig {
  return {
    key: `campo_${index + 1}`,
    label: "Novo campo",
    type: "text",
    placeholder: "",
    required: false,
    enabled: true,
    prefillFromUser: null,
  };
}

export function CheckoutSettingsPanel({ hideHeader = false }: { hideHeader?: boolean }) {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<CheckoutSettings>(DEFAULT_SETTINGS);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "site-settings"],
    queryFn: () => siteSettingsApi.get(),
  });

  useEffect(() => {
    if (data?.config?.checkoutSettings) {
      setSettings({
        ...DEFAULT_SETTINGS,
        ...data.config.checkoutSettings,
        fields: data.config.checkoutSettings.fields?.length
          ? data.config.checkoutSettings.fields
          : DEFAULT_SETTINGS.fields,
        deliveryOptions: {
          enabled: data.config.checkoutSettings.deliveryOptions?.enabled ?? DEFAULT_SETTINGS.deliveryOptions!.enabled,
          standardLabel: data.config.checkoutSettings.deliveryOptions?.standardLabel ?? DEFAULT_SETTINGS.deliveryOptions!.standardLabel,
          standardDescription: data.config.checkoutSettings.deliveryOptions?.standardDescription ?? DEFAULT_SETTINGS.deliveryOptions!.standardDescription,
          expressLabel: data.config.checkoutSettings.deliveryOptions?.expressLabel ?? DEFAULT_SETTINGS.deliveryOptions!.expressLabel,
          expressDescription: data.config.checkoutSettings.deliveryOptions?.expressDescription ?? DEFAULT_SETTINGS.deliveryOptions!.expressDescription,
          expressFeeCents: data.config.checkoutSettings.deliveryOptions?.expressFeeCents ?? DEFAULT_SETTINGS.deliveryOptions!.expressFeeCents,
        },
      });
    }
  }, [data?.config?.checkoutSettings]);

  const saveMutation = useMutation({
    mutationFn: () => siteSettingsApi.update({ checkoutSettings: settings }),
    onSuccess: () => {
      toast.success("Configurações do checkout salvas");
      queryClient.invalidateQueries({ queryKey: ["admin", "site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateField = (index: number, patch: Partial<CheckoutFieldConfig>) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    }));
  };

  const removeField = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const addField = () => {
    setSettings((prev) => ({
      ...prev,
      fields: [...prev.fields, newField(prev.fields.length)],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      {!hideHeader && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">Checkout</h1>
            <p className="mt-1 text-sm text-muted-foreground lg:text-base">
              Campos do formulário, termos e preenchimento automático na finalização da compra.
            </p>
          </div>
          <Button
            className="w-full shrink-0 gap-2 px-4 py-5 sm:w-auto"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 hidden" />
            )}
            Salvar alterações
          </Button>
        </div>
      )}

      <div className="rounded-md border border-white/5 bg-transparent">
        <div className="border-b border-white/5 px-4 py-3">
          <h2 className="text-sm font-medium">Comportamento geral</h2>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 px-4 py-4">
          <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Termos já marcados</p>
              <p className="text-xs text-muted-foreground">Checkbox de termos vem selecionado</p>
            </div>

            <Toggle
              variant="default"
              size="sm"
              pressed={settings.termsCheckedByDefault}
              onPressedChange={(val) => setSettings((s) => ({ ...s, termsCheckedByDefault: val }))}
            >
              {settings.termsCheckedByDefault ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Toggle>
          </div>

          <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Preencher nome do usuário</p>
              <p className="text-xs text-muted-foreground">Se logado, usa o nome da conta</p>
            </div>
            <Toggle
              variant="default"
              size="sm"
              pressed={settings.prefillUserName}
              onPressedChange={(val) => setSettings((s) => ({ ...s, prefillUserName: val }))}
            >
              {settings.prefillUserName ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Toggle>
          </div>

          <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Preencher e-mail do usuário</p>
              <p className="text-xs text-muted-foreground">Se logado, usa o e-mail da conta</p>
            </div>
            <Toggle
              variant="default"
              size="sm"
              pressed={settings.prefillUserEmail}
              onPressedChange={(val) => setSettings((s) => ({ ...s, prefillUserEmail: val }))}
            >
              {settings.prefillUserEmail ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Toggle>
          </div>

          <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Autenticação no checkout</p>
              <p className="text-xs text-muted-foreground">Define quando o cliente precisa entrar na conta para finalizar a compra.</p>
            </div>
            <Select
              value={settings.authMode ?? "inline_at_payment"}
              onValueChange={(value: CheckoutAuthMode) =>
                setSettings((s) => ({ ...s, authMode: value }))
              }
            >
              <SelectTrigger className="w-auto min-w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inline_at_payment">Login ao pagar (modal no checkout)</SelectItem>
                <SelectItem value="login_before_checkout">Exigir login antes do checkout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-white/5 bg-transparent">
        <div className="border-b border-white/5 px-4 py-3">
          <h2 className="text-sm font-medium">Entrega no checkout</h2>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 px-4 py-4">
          <div className="flex items-center justify-between rounded-md border border-white/5 px-4 py-3 md:col-span-2">
            <div>
              <p className="text-sm font-medium text-white">Ativar opções de entrega</p>
              <p className="text-xs text-muted-foreground">Exibe padrão vs expressa no checkout</p>
            </div>
            <Toggle
              variant="default"
              size="sm"
              pressed={settings.deliveryOptions?.enabled ?? true}
              onPressedChange={(val) =>
                setSettings((s) => ({
                  ...s,
                  deliveryOptions: { ...DEFAULT_SETTINGS.deliveryOptions!, ...s.deliveryOptions, enabled: val },
                }))
              }
            >
              {settings.deliveryOptions?.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Toggle>
          </div>

          <div className="space-y-1.5">
            <Label>Label entrega padrão</Label>
            <Input
              value={settings.deliveryOptions?.standardLabel ?? ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  deliveryOptions: { ...DEFAULT_SETTINGS.deliveryOptions!, ...s.deliveryOptions, standardLabel: e.target.value },
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Label entrega expressa</Label>
            <Input
              value={settings.deliveryOptions?.expressLabel ?? ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  deliveryOptions: { ...DEFAULT_SETTINGS.deliveryOptions!, ...s.deliveryOptions, expressLabel: e.target.value },
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição entrega expressa</Label>
            <Input
              value={settings.deliveryOptions?.expressDescription ?? ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  deliveryOptions: { ...DEFAULT_SETTINGS.deliveryOptions!, ...s.deliveryOptions, expressDescription: e.target.value },
                }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Taxa expressa</Label>
            <InputGroup>
              <InputGroupInput
                type="text"
                placeholder="0,00"
                value={
                  (
                    (settings.deliveryOptions?.expressFeeCents ??
                      DEFAULT_SETTINGS.deliveryOptions?.expressFeeCents ??
                      999) / 100
                  ).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const cents = val ? Number(val) : 0;
                  setSettings((s) => ({
                    ...s,
                    deliveryOptions: {
                      ...DEFAULT_SETTINGS.deliveryOptions!,
                      ...s.deliveryOptions,
                      expressFeeCents: cents,
                    },
                  }));
                }}
              />
              <InputGroupAddon>R$</InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-white/5 bg-transparent">
        <div className="flex items-center border-b border-white/5 justify-between px-4 py-3">
          <div>
            <h2 className="text-sm font-medium">Campos do formulário</h2>
          </div>

          <Button type="button" variant="outline" size="lg" onClick={addField}>
            <PlusCircle className="h-4 w-4" />
            Adicionar campo
          </Button>
        </div>

        <div className="px-4 py-3">
          <ScrollArea className="max-h-[450px] gap-3 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.fields.map((field, index) => (
                <div
                  key={`${field.key}-${index}`}
                  className="rounded-md border border-white/5 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Campo {index + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400 hover:text-red-300"
                            onClick={() => removeField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remover campo</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">ID</Label>
                        <Input
                          value={field.key}
                          onChange={(e) => updateField(index, { key: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(index, { label: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Placeholder</Label>
                        <Input
                          value={field.placeholder}
                          onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                          value={field.type}
                          onValueChange={(val) => updateField(index, { type: val as CheckoutFieldConfig["type"] })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="tel">Telefone</SelectItem>
                            <SelectItem value="cpf">CPF</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-4">
                        <Toggle
                          variant="default"
                          size="sm"
                          pressed={field.enabled}
                          onPressedChange={(val) => updateField(index, { enabled: val })}
                        >
                          {field.enabled ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Toggle>

                        <div>
                          <Label htmlFor="show-navbar" className="cursor-pointer">
                            {field.enabled ? "Ativado" : "Desativado"}
                          </Label>
                          <p className="text-xs text-white/50">
                            Controla se o campo aparece no checkout.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Toggle
                          variant="default"
                          size="sm"
                          pressed={field.required}
                          onPressedChange={(val) => updateField(index, { required: val })}
                        >
                          {field.required ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Toggle>

                        <div>
                          <Label htmlFor="show-navbar" className="cursor-pointer">
                            {field.required ? "Obrigatório" : "Não obrigatório"}
                          </Label>
                          <p className="text-xs text-white/50">
                            Controla se o campo é obrigatório no checkout.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-1 mt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Preencher com dados do usuário</Label>
                        <Select
                          value={field.prefillFromUser || "none"}
                          onValueChange={(val) =>
                            updateField(index, {
                              prefillFromUser: val === "none" ? null : (val as "name" | "email"),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            <SelectItem value="name">Nome</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
