'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MessageSquare, ShoppingBag } from 'lucide-react';

import { chatApi, type Chat } from '@/lib/admin-api';
import { playNotificationSound } from '@/lib/notification-sound';
import { usePermission } from '@/providers/PermissionProvider';

const CHATS_PATH = '/dashboard/admin/chats';
const POLL_INTERVAL = 5000;

function getCustomerName(chat: Chat) {
  return chat.order?.user?.name || chat.order?.user?.email || 'Cliente';
}

export function AdminChatNotifications() {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission } = usePermission();

  const initialized = useRef(false);
  const knownChatIds = useRef(new Set<string>());
  const lastMessageIds = useRef(new Map<string, string>());
  const volumeRef = useRef(0.8);

  const isOnChatsPage = pathname === CHATS_PATH;
  const canView = hasPermission('orders:view');

  const { data } = useQuery({
    queryKey: ['admin', 'chat-notifications'],
    queryFn: () => chatApi.list({ status: 'OPEN', sortBy: 'activity' }),
    refetchInterval: POLL_INTERVAL,
    enabled: canView,
  });

  useEffect(() => {
    if (!data?.chats || !canView) return;

    const chats = data.chats;

    if (!initialized.current) {
      chats.forEach((chat) => {
        knownChatIds.current.add(chat.id);
        if (chat.messages?.[0]) {
          lastMessageIds.current.set(chat.id, chat.messages[0].id);
        }
      });
      initialized.current = true;
      return;
    }

    for (const chat of chats) {
      const latestMsg = chat.messages?.[0];

      if (!knownChatIds.current.has(chat.id)) {
        knownChatIds.current.add(chat.id);
        if (latestMsg) {
          lastMessageIds.current.set(chat.id, latestMsg.id);
        }

        if (!isOnChatsPage) {
          playNotificationSound(volumeRef.current);
          toast('Nova compra recebida', {
            description: `${getCustomerName(chat)} — Pedido #${chat.orderId.slice(-8)}`,
            icon: <ShoppingBag className="h-4 w-4 text-primary" />,
            action: {
              label: 'Ver atendimento',
              onClick: () => router.push(CHATS_PATH),
            },
            duration: 8000,
          });
        }
        continue;
      }

      if (!latestMsg) continue;

      const prevId = lastMessageIds.current.get(chat.id);
      if (prevId === latestMsg.id) continue;

      lastMessageIds.current.set(chat.id, latestMsg.id);

      const isCustomerMessage =
        latestMsg.senderId !== 'ADMIN' &&
        latestMsg.senderId !== 'SYSTEM' &&
        latestMsg.type !== 'ORDER_APPROVED' &&
        latestMsg.type !== 'AUTOMATED';

      if (isCustomerMessage && !isOnChatsPage) {
        playNotificationSound(volumeRef.current);
        toast('Nova mensagem no atendimento', {
          description: `${getCustomerName(chat)}: ${latestMsg.content.slice(0, 80)}${latestMsg.content.length > 80 ? '...' : ''}`,
          icon: <MessageSquare className="h-4 w-4 text-blue-400" />,
          action: {
            label: 'Abrir chat',
            onClick: () => router.push(CHATS_PATH),
          },
          duration: 8000,
        });
      }
    }
  }, [data?.chats, canView, isOnChatsPage, router]);

  return null;
}
