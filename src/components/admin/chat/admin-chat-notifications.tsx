'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageSquare, ShoppingBag } from 'lucide-react';

import { chatApi } from '@/lib/admin-api';
import { playNotificationSound } from '@/lib/notification-sound';
import { usePermission } from '@/providers/PermissionProvider';
import { useSocket } from '@/context/socket-context';

const CHATS_PATH = '/dashboard/admin/chats';

type ChatMessagePreview = {
  id: string;
  content: string;
  senderId: string;
  type?: string;
};

type AlertPayload = {
  chatId: string;
  message?: ChatMessagePreview;
  type?: 'new_chat';
  orderId?: string;
  customerName?: string;
};

function isCustomerMessage(msg?: ChatMessagePreview) {
  if (!msg) return false;
  return (
    msg.senderId !== 'ADMIN' &&
    msg.senderId !== 'SYSTEM' &&
    msg.type !== 'ORDER_APPROVED' &&
    msg.type !== 'AUTOMATED' &&
    msg.type !== 'DELIVERY'
  );
}

export function AdminChatNotifications() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const { socket, isConnected } = useSocket();

  const volumeRef = useRef(0.8);
  const knownChatIds = useRef(new Set<string>());
  const lastMessageIds = useRef(new Map<string, string>());
  const seeded = useRef(false);

  const isOnChatsPage = pathname.startsWith(CHATS_PATH);
  const isOnChatsPageRef = useRef(isOnChatsPage);
  useEffect(() => { isOnChatsPageRef.current = isOnChatsPage; }, [isOnChatsPage]);

  const canView = hasPermission('orders:view');

  // Fallback seed when WS is disconnected
  const { data } = useQuery({
    queryKey: ['admin', 'chat-notifications'],
    queryFn: () => chatApi.list({ status: 'OPEN', sortBy: 'activity' }),
    refetchInterval: isConnected ? false : 8000,
    enabled: canView,
    staleTime: isConnected ? Infinity : 0,
  });

  useEffect(() => {
    if (!data?.chats || !canView || seeded.current) return;
    data.chats.forEach((chat) => {
      knownChatIds.current.add(chat.id);
      if (chat.messages?.[0]) {
        lastMessageIds.current.set(chat.id, chat.messages[0].id);
      }
    });
    seeded.current = true;
  }, [data?.chats, canView]);

  useEffect(() => {
    if (!socket || !canView) return;

    const showToast = (
      title: string,
      description: string,
      icon: React.ReactNode,
      actionLabel = 'Abrir chat',
      targetChatId?: string
    ) => {
      if (isOnChatsPageRef.current) return;
      playNotificationSound(volumeRef.current);
      toast(title, {
        description,
        icon,
        action: {
          label: actionLabel,
          onClick: () => router.push(targetChatId ? `${CHATS_PATH}/chat/${targetChatId}` : CHATS_PATH),
        },
        duration: 8000,
      });
    };

    const handleNewMessageAlert = (payload: AlertPayload) => {
      const { chatId, message, type, orderId, customerName } = payload;

      if (type === 'new_chat') {
        queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'unread-chats-count'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin', 'unread-chats-count'] });
      }

      const customer = customerName || 'Cliente';

      if (type === 'new_chat') {
        if (knownChatIds.current.has(chatId)) return;
        knownChatIds.current.add(chatId);
        queryClient.setQueryData<number>(['admin', 'unread-chats-count'], (old) => (old ?? 0) + 1);
        queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
        queryClient.invalidateQueries({ queryKey: ['admin', 'unread-chats-count'] });
        showToast(
          'Nova compra recebida',
          `${customer}${orderId ? ` — Pedido #${orderId.slice(-8)}` : ''}`,
          <ShoppingBag className="h-4 w-4 text-primary" />,
          'Ver atendimento',
          chatId
        );
        return;
      }

      if (!message || !isCustomerMessage(message)) return;

      const prevId = lastMessageIds.current.get(chatId);
      if (prevId === message.id) return;
      lastMessageIds.current.set(chatId, message.id);

      showToast(
        'Nova mensagem no atendimento',
        `${customer}: ${message.content.slice(0, 80)}${message.content.length > 80 ? '...' : ''}`,
        <MessageSquare className="h-4 w-4 text-blue-400" />,
        'Abrir chat',
        chatId
      );
    };

    socket.on('new_message_alert', handleNewMessageAlert);

    return () => {
      socket.off('new_message_alert', handleNewMessageAlert);
    };
  }, [socket, canView, router, queryClient]);

  return null;
}
