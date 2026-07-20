import type { EmailTemplateBlock, EmailTemplatesResponse } from "@/lib/admin-api";

export const EMAILS_BASE = "/dashboard/admin/marketing/emails";
export const EMAIL_TEMPLATE_BASE = `${EMAILS_BASE}/template`;
export const AUTOMATIONS_BASE = "/dashboard/admin/marketing/automations";
export const AUTOMATIONS_SETTINGS = `${AUTOMATIONS_BASE}/settings`;

export function emailTemplateHref(slug: string) {
  return `${EMAIL_TEMPLATE_BASE}/${slug}`;
}

export function findEmailBlockBySlug(
  catalog: EmailTemplatesResponse["catalog"] | undefined,
  slug: string
): EmailTemplateBlock | null {
  if (!catalog || !slug) return null;
  const all = [
    ...catalog.components,
    ...catalog.transactional,
    ...catalog.abandonedCart,
    ...catalog.abandonedProduct,
  ];
  return all.find((b) => b.id === slug) || null;
}

export function catalogTabForBlock(block: EmailTemplateBlock): string {
  if (block.key === "headerHtml" || block.key === "footerHtml") return "components";
  if (block.id.startsWith("abandonedCart")) return "abandonedCart";
  if (block.id.startsWith("abandonedProduct")) return "abandonedProduct";
  return "transactional";
}
