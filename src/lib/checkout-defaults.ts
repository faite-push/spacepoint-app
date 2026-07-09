import type { CheckoutSettings } from "@/lib/admin-api";

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  termsCheckedByDefault: false,
  prefillUserName: true,
  prefillUserEmail: true,
  authMode: "inline_at_payment",
  fields: [
    {
      key: "name",
      label: "Nome completo",
      type: "text",
      placeholder: "Nome completo",
      required: true,
      enabled: true,
      prefillFromUser: "name",
    },
    {
      key: "email",
      label: "E-mail",
      type: "email",
      placeholder: "Seu melhor e-mail",
      required: true,
      enabled: true,
      prefillFromUser: "email",
    },
    {
      key: "cpf",
      label: "CPF",
      type: "cpf",
      placeholder: "000.000.000-00",
      required: false,
      enabled: true,
      prefillFromUser: null,
    },
    {
      key: "phone",
      label: "Celular",
      type: "tel",
      placeholder: "(00) 00000-0000",
      required: false,
      enabled: true,
      prefillFromUser: null,
    },
  ],
  deliveryOptions: {
    enabled: true,
    standardLabel: "Entrega padrão",
    standardDescription: "Processamento normal do pedido",
    expressLabel: "Entrega expressa",
    expressDescription: "Prioridade no atendimento e entrega mais rápida",
    expressFeeCents: 999,
  },
};

export function resolveEffectiveCheckoutFields(
  settings: CheckoutSettings,
  requiredFieldKeys: string[] = []
) {
  const required = new Set(requiredFieldKeys.filter(Boolean));
  const fields = (settings.fields || []).map((field) => {
    const forced = required.has(field.key);
    return {
      ...field,
      enabled: field.enabled || forced,
      required: field.required || forced,
    };
  });

  for (const key of required) {
    if (!fields.some((field) => field.key === key)) {
      const fallback = DEFAULT_CHECKOUT_SETTINGS.fields.find((field) => field.key === key);
      if (fallback) fields.push({ ...fallback, enabled: true, required: true });
    }
  }

  return fields.filter((field) => field.enabled);
}

export function formatCpfInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
