import type { Chat } from '@/lib/admin-api';
import React from 'react';
import { BiImage } from 'react-icons/bi';

export function getUnreadCount(chat: Chat): number {
  if (chat.unreadCount !== undefined) return chat.unreadCount;
  if (!chat.messages?.length) return 0;

  const customerMessages = chat.messages.filter(
    (m) => m.senderId !== 'ADMIN' && m.senderId !== 'SYSTEM'
  );

  if (!chat.lastAdminReadAt) return customerMessages.length;

  return customerMessages.filter(
    (m) => new Date(m.createdAt) > new Date(chat.lastAdminReadAt!)
  ).length;
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
  if (type === 'ORDER_APPROVED') return '✅ Pedido Aprovado';
  if (type === 'DELIVERY') return '📦 Produto entregue';
  if (type === 'AUTOMATED') return content.slice(0, 60);
  return content.slice(0, 80);
}
