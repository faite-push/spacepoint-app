import type { Order } from "@/types/shop";

const STATUS_PRIORITY: Record<string, number> = {
  PENDING: 0,
  PAID: 1,
  DELIVERED: 2,
  REFUNDED: 3,
  CANCELLED: 4,
};

const VISIBLE_STATUSES = new Set(["PENDING", "PAID", "DELIVERED", "REFUNDED", "CANCELLED"]);

export function sortAccountOrders(orders: Order[]) {
  return [...orders]
    .filter((order) => VISIBLE_STATUSES.has(order.status.toUpperCase()))
    .sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status.toUpperCase()] ?? 99;
      const priorityB = STATUS_PRIORITY[b.status.toUpperCase()] ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
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
