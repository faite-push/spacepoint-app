import type { Order } from "@/types/shop";

const VISIBLE_STATUSES = new Set(["PENDING", "PAID", "DELIVERED", "REFUNDED", "CANCELLED"]);

/**
 * Pendentes no topo (mais recentes primeiro); demais por data decrescente.
 * Evita enterrar pedidos DELIVERED recentes abaixo de PAID antigos.
 */
export function sortAccountOrders(orders: Order[]) {
  return [...orders]
    .filter((order) => VISIBLE_STATUSES.has(String(order.status || "").toUpperCase()))
    .sort((a, b) => {
      const aPending = String(a.status).toUpperCase() === "PENDING";
      const bPending = String(b.status).toUpperCase() === "PENDING";
      if (aPending !== bPending) return aPending ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export function getOrderPaymentUrl(order: Pick<Order, "id" | "paymentMethod">) {
  const method = (order.paymentMethod || "PIX").toUpperCase();
  return `/checkout/payment/${order.id}?paymentMethod=${encodeURIComponent(method)}`;
}

export function isOrderAwaitingPayment(status: string) {
  return status.toUpperCase() === "PENDING";
}

export function isOrderRefunded(status: string) {
  return status.toUpperCase() === "REFUNDED";
}

export function canAccessOrderChat(status: string) {
  return ["PAID", "DELIVERED", "REFUNDED"].includes(status.toUpperCase());
}

export function canReviewOrder(
  order: Pick<Order, "status"> & { chat?: { rating?: number | null } | null }
) {
  return order.status.toUpperCase() === "DELIVERED" && !order.chat?.rating;
}
