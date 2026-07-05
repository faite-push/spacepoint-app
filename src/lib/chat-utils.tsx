import type { Chat } from '@/lib/admin-api';
import React from 'react';
import { differenceInMinutes, differenceInHours, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BiImage } from 'react-icons/bi';
import { PiCheckSquareFill } from "react-icons/pi";
import { BiSolidPackage } from "react-icons/bi";

export function mergeOrderData(
  existing: Chat['order'] | undefined,
  incoming: Chat['order'] | undefined
): Chat['order'] | undefined {
  if (!incoming) return existing;
  if (!existing) return incoming;

  const incomingHasProfile = !!(incoming.user?.name || incoming.user?.email);
  const existingHasProfile = !!(existing.user?.name || existing.user?.email);

  if (!incomingHasProfile && existingHasProfile) {
    return {
      ...existing,
      ...incoming,
      user: existing.user,
      items: incoming.items?.length ? incoming.items : existing.items,
      payments: incoming.payments?.length ? incoming.payments : existing.payments,
      subtotal: incoming.subtotal ?? existing.subtotal,
      discount: incoming.discount ?? existing.discount,
      total: incoming.total ?? existing.total,
      paymentMethod: incoming.paymentMethod ?? existing.paymentMethod,
      paidAt: incoming.paidAt ?? existing.paidAt,
      adminNotes: incoming.adminNotes ?? existing.adminNotes,
      clientIp: incoming.clientIp ?? existing.clientIp,
      userAgent: incoming.userAgent ?? existing.userAgent,
    };
  }

  return {
    ...existing,
    ...incoming,
    user: incoming.user ?? existing.user,
    items: incoming.items?.length ? incoming.items : existing.items,
    payments: incoming.payments?.length ? incoming.payments : existing.payments,
  };
}

export function mergeChatData(old: Chat | undefined, updated: Partial<Chat>): Chat | undefined {
  if (!old) {
    if (updated.order?.user?.name || updated.order?.user?.email) {
      return updated as Chat;
    }
    return undefined;
  }

  return {
    ...old,
    ...updated,
    messages: updated.messages?.length ? updated.messages : (old.messages ?? []),
    order: mergeOrderData(old.order, updated.order) ?? old.order,
    labels: updated.labels ?? old.labels,
    assignedTo: updated.assignedTo ?? old.assignedTo,
    userStats: updated.userStats ?? old.userStats,
  };
}

function isReopenNotice(message: Chat['messages'][number]) {
  return (
    message.senderId === 'SYSTEM' &&
    message.type === 'AUTOMATED' &&
    message.content?.includes('reabriu')
  );
}

export function computeUnreadCount(chat: Chat): number {
  if (!chat.messages?.length) {
    return !chat.lastAdminReadAt ? 1 : 0;
  }

  const customerMessages = chat.messages.filter(
    (m) => m.senderId !== 'ADMIN' && m.senderId !== 'SYSTEM'
  );

  let count: number;
  if (!chat.lastAdminReadAt) {
    count = customerMessages.length > 0 ? customerMessages.length : 1;
  } else {
    count = customerMessages.filter(
      (m) => new Date(m.createdAt) > new Date(chat.lastAdminReadAt!)
    ).length;
  }

  const hasUnreadReopen = chat.messages.some(
    (m) =>
      isReopenNotice(m) &&
      (!chat.lastAdminReadAt || new Date(m.createdAt) > new Date(chat.lastAdminReadAt))
  );
  if (hasUnreadReopen) count = Math.max(count, 1);

  return count;
}

export function getUnreadCount(chat: Chat): number {
  if (chat.unreadCount !== undefined) return chat.unreadCount;
  return computeUnreadCount(chat);
}

export function isOrderFullyDelivered(chat: Chat): boolean {
  if (!chat.order?.items?.length) return false;
  return chat.order.items.every((item) => {
    const delivered = item.codes?.filter((c) => c.status === 'DELIVERED').length ?? 0;
    return delivered >= item.quantity;
  });
}

export function getPendingDeliveryCount(chat: Chat): number {
  if (!chat.order?.items?.length) return 0;
  return chat.order.items.reduce((acc, item) => {
    const delivered = item.codes?.filter((c) => c.status === 'DELIVERED').length ?? 0;
    return acc + Math.max(0, item.quantity - delivered);
  }, 0);
}

export function decodeDeliveryCode(code: string): string {
  const idx = code.indexOf(':');
  if (idx >= 0 && code.length > idx + 1) return code.slice(idx + 1);
  return code;
}

export function getDeliveredContents(item: Chat['order']['items'][0]): string[] {
  if (!item.codes?.length) return [];
  return item.codes
    .filter((c) => c.status === 'DELIVERED')
    .map((c) => decodeDeliveryCode(c.code));
}

export function getPreviewText(content: string, type?: string): React.ReactNode {
  if (type === 'IMAGE') {
    return (
      <span className="flex items-center gap-1">
        <BiImage className="h-4 w-4 shrink-0 text-zinc-400" />
        Imagem
      </span>
    );
  }
  if (type === 'ORDER_APPROVED') {
    return (
      <span className="flex items-center gap-1">
        <PiCheckSquareFill className="h-4 w-4 shrink-0 text-emerald-500" />
        Pedido Aprovado
      </span>
    );
  }

  if (type === 'DELIVERY') {
    return (
      <span className="flex items-center gap-1">
        <BiSolidPackage className="h-4 w-4 shrink-0 text-blue-500" />
        Produto entregue
      </span>
    );
  }
  if (type === 'AUTOMATED') return content.slice(0, 60);
  return content.slice(0, 80);
}

function formatAbsoluteChatTime(date: Date): string {
  const day = format(date, 'd', { locale: ptBR });
  const month = format(date, 'MMM', { locale: ptBR }).replace('.', '');
  const monthLabel = month.charAt(0).toUpperCase() + month.slice(1);
  const time = format(date, 'HH:mm', { locale: ptBR });
  return `${day} ${monthLabel} ${time}`;
}

/** Horário na lista de conversas do admin. */
export function formatChatListTimestamp(
  isoDate: string | undefined | null,
  isResolved?: boolean
): string {
  if (!isoDate) return 'agora';

  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'agora';

  if (isResolved) {
    return formatAbsoluteChatTime(date);
  }

  const minutes = differenceInMinutes(new Date(), date);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;

  if (isToday(date)) {
    const hours = Math.max(1, differenceInHours(new Date(), date));
    return `há ${hours}h`;
  }

  if (isYesterday(date)) return 'ontem';

  return formatAbsoluteChatTime(date);
}
