import type { CheckoutSettings } from "@/lib/admin-api";

export const DEFAULT_CHECKOUT_SETTINGS: CheckoutSettings = {
  termsCheckedByDefault: false,
  prefillUserName: true,
  prefillUserEmail: true,
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
  ],
};
