import type { QueryClient } from '@tanstack/react-query';
import type { Chat } from '@/lib/admin-api';
import { computeUnreadCount } from '@/lib/chat-utils';

export type ChatRealtimeMessage = {
  id: string;
  content?: string;
  senderId: string;
  type?: string;
  createdAt?: string;
};

export type ChatListUpdatePayload = {
  chatId: string;
  lastMessage?: ChatRealtimeMessage;
  type?: 'new_chat' | 'reopened' | string;
  orderId?: string;
  customerName?: string;
};

const processedEventKeys = new Map<string, string>();
let activeAdminChatId: string | null = null;

export function setActiveAdminChatId(chatId: string | null) {
  activeAdminChatId = chatId;
}

export function getActiveAdminChatId() {
  return activeAdminChatId;
}

function eventDedupKey(payload: ChatListUpdatePayload): string | null {
  if (payload.lastMessage?.id) return payload.lastMessage.id;
  if (payload.type === 'reopened') return `reopened:${payload.chatId}`;
  if (payload.type === 'new_chat') return `new_chat:${payload.chatId}`;
  return null;
}

/** Prevents duplicate toasts/sounds for the same realtime event. */
export function claimRealtimeEvent(payload: ChatListUpdatePayload): boolean {
  const key = eventDedupKey(payload);
  if (!key) return true;
  if (processedEventKeys.get(payload.chatId) === key) return false;
  processedEventKeys.set(payload.chatId, key);
  return true;
}

export function isCustomerAlertMessage(message?: ChatRealtimeMessage) {
  if (!message) return false;
  return (
    message.senderId !== 'ADMIN' &&
    message.senderId !== 'SYSTEM' &&
    message.type !== 'AUTOMATED' &&
    message.type !== 'ORDER_APPROVED' &&
    message.type !== 'DELIVERY'
  );
}

function shouldIncrementUnread(chat: Chat, lastMessage?: ChatRealtimeMessage) {
  if (!lastMessage || !isCustomerAlertMessage(lastMessage)) return false;

  const prev = chat.messages?.[0];
  if (prev?.id === lastMessage.id) return false;

  // Chat já marcado como não lido (ex.: nova compra) — nova msg do cliente não soma de novo no servidor
  if ((chat.unreadCount || 0) > 0 && prev && !isCustomerAlertMessage(prev)) {
    return false;
  }

  return true;
}

export function resetUnreadBumpKey(chatId: string) {
  processedEventKeys.delete(chatId);
}

export function applyChatListUpdate(
  old: { chats: Chat[] } | undefined,
  payload: ChatListUpdatePayload,
  activeChatId?: string | null
) {
  if (!old?.chats) return old;

  const { chatId, lastMessage, type } = payload;
  if (!old.chats.some((c) => c.id === chatId)) return old;

  const isActive = activeChatId === chatId;

  const chats = old.chats.map((c) => {
    if (c.id !== chatId) return c;

    const updated: Chat = {
      ...c,
      updatedAt: new Date().toISOString(),
    };

    if (type === 'reopened') {
      updated.isResolved = false;
      updated.status = 'OPEN';
    }

    if (lastMessage) {
      updated.messages = [lastMessage as Chat['messages'][number]];
    }

    if (isActive) {
      updated.unreadCount = 0;
    } else if (type === 'reopened') {
      updated.unreadCount = Math.max(c.unreadCount || 0, 1);
    } else if (lastMessage && shouldIncrementUnread(c, lastMessage)) {
      updated.unreadCount = (c.unreadCount || 0) + 1;
    } else if (lastMessage) {
      updated.unreadCount = c.unreadCount ?? computeUnreadCount(updated);
    }

    return updated;
  });

  const idx = chats.findIndex((c) => c.id === chatId);
  if (idx > 0) {
    const [moved] = chats.splice(idx, 1);
    chats.unshift(moved);
  }

  return { ...old, chats };
}

export function syncGlobalUnreadCount(queryClient: QueryClient) {
  const queries = queryClient.getQueriesData<{ chats?: Chat[] }>({
    queryKey: ['admin', 'chats'],
  });

  let total = 0;
  let found = false;

  for (const [, data] of queries) {
    if (!data?.chats?.length) continue;
    found = true;
    const sum = data.chats.reduce((acc, c) => acc + (c.unreadCount ?? 0), 0);
    total = Math.max(total, sum);
  }

  if (found) {
    queryClient.setQueryData<number>(['admin', 'unread-chats-count'], total);
  }
}

export function patchAllChatLists(
  queryClient: QueryClient,
  payload: ChatListUpdatePayload,
  activeChatId?: string | null
) {
  const queries = queryClient.getQueriesData<{ chats?: Chat[] }>({
    queryKey: ['admin', 'chats'],
  });

  for (const [key, data] of queries) {
    if (!data?.chats) continue;
    queryClient.setQueryData(
      key,
      applyChatListUpdate({ chats: data.chats }, payload, activeChatId)
    );
  }

  syncGlobalUnreadCount(queryClient);
}

export function normalizeChatRealtimePayload(payload: {
  chatId: string;
  lastMessage?: ChatRealtimeMessage;
  message?: ChatRealtimeMessage;
  type?: string;
  orderId?: string;
  customerName?: string;
}): ChatListUpdatePayload {
  return {
    chatId: payload.chatId,
    type: payload.type,
    orderId: payload.orderId,
    customerName: payload.customerName,
    lastMessage: payload.lastMessage || payload.message,
  };
}

export function clearChatUnreadInCache(queryClient: QueryClient, chatId: string) {
  const queries = queryClient.getQueriesData<{ chats?: Chat[] }>({
    queryKey: ['admin', 'chats'],
  });

  for (const [key, data] of queries) {
    if (!data?.chats) continue;
    queryClient.setQueryData(key, {
      ...data,
      chats: data.chats.map((c) =>
        c.id === chatId
          ? { ...c, unreadCount: 0, lastAdminReadAt: new Date().toISOString() }
          : c
      ),
    });
  }

  syncGlobalUnreadCount(queryClient);
}

export function handleAdminChatListUpdate(
  queryClient: QueryClient,
  rawPayload: {
    chatId: string;
    lastMessage?: ChatRealtimeMessage;
    message?: ChatRealtimeMessage;
    type?: string;
    orderId?: string;
    customerName?: string;
  },
  activeChatId?: string | null
) {
  const payload = normalizeChatRealtimePayload(rawPayload);
  const resolvedActiveChatId = activeChatId ?? getActiveAdminChatId();
  patchAllChatLists(queryClient, payload, resolvedActiveChatId);
}
