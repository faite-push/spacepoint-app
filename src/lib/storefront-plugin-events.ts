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

export function trackStorefrontPurchase({
  orderId,
  value,
  currency = "BRL",
}: PurchaseEventPayload): void {
  if (typeof window === "undefined") return;

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
    window.fbq("track", "Purchase", { value, currency });
  }

  if (window.ttq?.track) {
    window.ttq.track("CompletePayment", { value, currency });
  }
}
