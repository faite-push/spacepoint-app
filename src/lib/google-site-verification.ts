function isLikelyVerificationCode(value: string): boolean {
  if (/content=/i.test(value)) return true;
  return value.length >= 20 && /[A-Za-z]/.test(value) && /^[A-Za-z0-9_-]+$/.test(value);
}

export function extractGoogleSiteVerification(input?: string | null): string | null {
  if (!input?.trim()) return null;

  const trimmed = input.trim();
  const fromMeta = trimmed.match(/content=["']([^"']+)["']/i);
  if (fromMeta?.[1]) return fromMeta[1];

  return isLikelyVerificationCode(trimmed) ? trimmed : null;
}

export function getGoogleSiteVerificationFromPlugins(
  pluginsConfig?: Record<string, { enabled?: boolean; config?: Record<string, string> }> | null
): string | null {
  const entry = pluginsConfig?.["google-merchant"];
  if (!entry?.enabled || !entry.config) return null;

  // Nunca usar merchantId aqui — é um número de conta, não o token da meta tag.
  const candidates = [entry.config.siteVerification, entry.config.verificationCode];

  for (const candidate of candidates) {
    const parsed = extractGoogleSiteVerification(candidate);
    if (parsed) return parsed;
  }

  return null;
}

export function resolveGoogleSiteVerification(
  pluginsConfig?: Record<string, { enabled?: boolean; config?: Record<string, string> }> | null
): string | null {
  return (
    getGoogleSiteVerificationFromPlugins(pluginsConfig) ||
    extractGoogleSiteVerification(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION) ||
    extractGoogleSiteVerification(process.env.GOOGLE_SITE_VERIFICATION)
  );
}
