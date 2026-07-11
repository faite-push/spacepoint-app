const STORAGE_PREFIX = "spacepoint_checkout_saved";

export type SavedCheckoutData = {
  values: Record<string, string>;
  savedAt: string;
};

function storageKey(userId?: string | null) {
  return userId ? `${STORAGE_PREFIX}_${userId}` : `${STORAGE_PREFIX}_guest`;
}

export function getSavedCheckoutData(userId?: string | null): SavedCheckoutData | null {
  if (typeof window === "undefined") return null;

  const userSaved = userId ? readSaved(storageKey(userId)) : null;
  if (userSaved) return userSaved;

  return readSaved(storageKey(null));
}

function readSaved(key: string): SavedCheckoutData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as SavedCheckoutData;
    if (!parsed?.values || typeof parsed.values !== "object") return null;

    return parsed;
  } catch {
    return null;
  }
}

export function saveCheckoutData(values: Record<string, string>, userId?: string | null) {
  if (typeof window === "undefined") return;

  const cleaned = Object.fromEntries(
    Object.entries(values).filter(([, value]) => String(value || "").trim() !== "")
  );

  if (Object.keys(cleaned).length === 0) return;

  const payload: SavedCheckoutData = {
    values: cleaned,
    savedAt: new Date().toISOString(),
  };

  localStorage.setItem(storageKey(userId), JSON.stringify(payload));

  if (userId) {
    localStorage.removeItem(storageKey(null));
  }
}

export function clearSavedCheckoutData(userId?: string | null) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(userId));
  if (userId) {
    localStorage.removeItem(storageKey(null));
  }
}

export function maskCheckoutValue(key: string, type: string, value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";

  if (key === "email" || type === "email") {
    const [local, domain] = trimmed.split("@");
    if (!domain) return trimmed.slice(0, 2) + "***";
    const visible = local.length <= 1 ? "*" : `${local[0]}***`;
    return `${visible}@${domain}`;
  }

  if (key === "cpf" || type === "cpf") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 2) return "***";
    return `***.***.***-${digits.slice(-2)}`;
  }

  if (key === "phone" || type === "tel") {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 4) return "(**) *****";
    return `(**) *****-${digits.slice(-4)}`;
  }

  if (key === "name" || type === "text") {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].length <= 2
        ? `${parts[0][0] || ""}***`
        : `${parts[0].slice(0, 2)}***`;
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    return `${first} ${last[0] || ""}***`;
  }

  if (trimmed.length <= 4) return "***";
  return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
}
