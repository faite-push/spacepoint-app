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
