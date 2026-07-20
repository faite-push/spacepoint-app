const RECOVERY_STORAGE_KEY = "spacepoint-cart-recovery";

export type CartRecoverySession = {
  token: string;
  source: "email" | "whatsapp" | "manual" | "link";
  cartId?: string;
  savedAt: number;
};

const VALID_SOURCES = new Set(["email", "whatsapp", "manual", "link"]);

export function normalizeRecoverySource(value?: string | null): CartRecoverySession["source"] {
  const src = String(value || "").trim().toLowerCase();
  if (VALID_SOURCES.has(src)) return src as CartRecoverySession["source"];
  return "link";
}

export function saveCartRecoverySession(payload: {
  token: string;
  source?: string | null;
  cartId?: string;
}) {
  if (typeof window === "undefined") return;
  const token = String(payload.token || "").trim();
  if (!token) return;
  const session: CartRecoverySession = {
    token,
    source: normalizeRecoverySource(payload.source),
    cartId: payload.cartId,
    savedAt: Date.now(),
  };
  try {
    sessionStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function getCartRecoverySession(): CartRecoverySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartRecoverySession;
    if (!parsed?.token) return null;
    // Expira em 7 dias
    if (parsed.savedAt && Date.now() - parsed.savedAt > 7 * 24 * 60 * 60 * 1000) {
      clearCartRecoverySession();
      return null;
    }
    return {
      ...parsed,
      source: normalizeRecoverySource(parsed.source),
    };
  } catch {
    return null;
  }
}

export function clearCartRecoverySession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
