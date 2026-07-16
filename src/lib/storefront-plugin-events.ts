declare global {
  interface Window {
    __spacepointGoogleAds?: { conversionId: string; sendTo: string };
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (...args: unknown[]) => void };
  }
}

export type PurchaseEventPayload = {
  orderId: string;
  value: number;
  currency?: string;
};

export type CartEventPayload = {
  value: number;
  currency?: string;
  contentIds?: string[];
  numItems?: number;
};

const PURCHASE_TRACK_STORAGE_KEY = "spacepoint:tracked-purchases";
const PURCHASE_TRACK_MAX = 40;

function readTrackedPurchaseIds(): string[] {
  try {
    const raw = window.localStorage.getItem(PURCHASE_TRACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string" && id.length > 0)
      : [];
  } catch {
    return [];
  }
}

function hasTrackedPurchase(orderId: string): boolean {
  return readTrackedPurchaseIds().includes(orderId);
}

function markTrackedPurchase(orderId: string): void {
  try {
    const ids = readTrackedPurchaseIds().filter((id) => id !== orderId);
    ids.push(orderId);
    const trimmed = ids.length > PURCHASE_TRACK_MAX ? ids.slice(-PURCHASE_TRACK_MAX) : ids;
    window.localStorage.setItem(PURCHASE_TRACK_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // private mode / quota — ignora
  }
}

export function trackStorefrontAddToCart({
  value,
  currency = "BRL",
  contentIds = [],
  numItems = 1,
}: CartEventPayload): void {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", "add_to_cart", {
      value,
      currency,
      items: contentIds.map((id) => ({ item_id: id })),
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "AddToCart", {
      value,
      currency,
      content_ids: contentIds,
      content_type: "product",
      num_items: numItems,
    });
  }

  if (window.ttq?.track) {
    window.ttq.track("AddToCart", {
      value,
      currency,
      content_id: contentIds[0],
      quantity: numItems,
    });
  }
}

export function trackStorefrontInitiateCheckout({
  value,
  currency = "BRL",
  contentIds = [],
  numItems = 1,
}: CartEventPayload): void {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", "begin_checkout", {
      value,
      currency,
      items: contentIds.map((id) => ({ item_id: id })),
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq("track", "InitiateCheckout", {
      value,
      currency,
      content_ids: contentIds,
      content_type: "product",
      num_items: numItems,
    });
  }

  if (window.ttq?.track) {
    window.ttq.track("InitiateCheckout", {
      value,
      currency,
      content_id: contentIds[0],
      quantity: numItems,
    });
  }
}

/** Dispara Purchase uma vez por pedido (localStorage). Retorna false se já tinha sido enviado. */
export function trackStorefrontPurchase({
  orderId,
  value,
  currency = "BRL",
}: PurchaseEventPayload): boolean {
  if (typeof window === "undefined") return false;
  if (!orderId?.trim()) return false;
  if (hasTrackedPurchase(orderId)) return false;

  // Marca antes de enviar para reduzir duplicata em Strict Mode / efeitos concorrentes
  markTrackedPurchase(orderId);

  const ads = window.__spacepointGoogleAds;
  if (typeof window.gtag === "function" && ads?.sendTo) {
    window.gtag("event", "conversion", {
      send_to: ads.sendTo,
      value,
      currency,
      transaction_id: orderId,
    });
  }

  if (typeof window.fbq === "function") {
    window.fbq(
      "track",
      "Purchase",
      {
        value,
        currency,
        content_type: "product",
        order_id: orderId,
      },
      { eventID: orderId }
    );
  }

  if (window.ttq?.track) {
    window.ttq.track("CompletePayment", {
      value,
      currency,
      content_id: orderId,
    });
  }

  return true;
}
