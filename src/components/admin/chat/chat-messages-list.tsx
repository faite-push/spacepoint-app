'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { chatApi, type Chat, type ChatMessage } from '@/lib/admin-api';
import { ChatMessageItem } from '@/components/admin/chat/chat-message-row';
import { AdminChatMessagesSkeleton } from '@/components/admin/chat/chat-messages-skeleton';
import { Button } from '@/components/ui/button';

type ChatMessagesListProps = {
  chat: Chat;
  viewer: 'client' | 'admin';
  clientUserId?: string;
  clientName?: string;
  isLoading?: boolean;
  formatFileUrl: (url: string) => string;
  onLightboxOpen?: (url: string) => void;
  renderContent: (content: string) => React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  footer?: React.ReactNode;
};

const MemoChatMessageItem = React.memo(ChatMessageItem);

/** Remove duplicatas (otimista + WS) e ordena por data. */
export function dedupeChatMessages(msgs: ChatMessage[]): ChatMessage[] {
  const realMessages = msgs.filter((m) => !m.id.startsWith('optimistic-'));
  const result: ChatMessage[] = [];
  const seenIds = new Set<string>();

  for (const m of msgs) {
    if (seenIds.has(m.id)) continue;

    if (m.id.startsWith('optimistic-')) {
      const hasReal = realMessages.some(
        (other) =>
          other.senderId === m.senderId &&
          other.content === m.content &&
          other.type === m.type &&
          Math.abs(new Date(other.createdAt).getTime() - new Date(m.createdAt).getTime()) < 10000
      );
      if (hasReal) continue;
    }

    seenIds.add(m.id);
    result.push(m);
  }

  return result.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function ChatMessagesList({
  chat,
  viewer,
  clientUserId,
  clientName,
  isLoading,
  formatFileUrl,
  onLightboxOpen,
  renderContent,
  scrollRef: externalScrollRef,
  footer,
}: ChatMessagesListProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const [olderMessages, setOlderMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(chat.messagesMeta?.hasMore ?? false);
  const [loadingMore, setLoadingMore] = useState(false);
  const orderId = chat.orderId;
  const prevChatIdRef = useRef<string | null>(null);
  const prevMessagesLengthRef = useRef(0);
  const wasLoadingRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, [scrollRef]);

  useEffect(() => {
    setOlderMessages([]);
    setHasMore(chat.messagesMeta?.hasMore ?? false);
  }, [chat.id, chat.messagesMeta?.hasMore]);

  const messages = useMemo(() => {
    const current = chat.messages ?? [];
    const currentIds = new Set(current.map((m) => m.id));
    const older = olderMessages.filter((m) => !currentIds.has(m.id));
    return dedupeChatMessages([...older, ...current]);
  }, [chat.messages, olderMessages]);

  useLayoutEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
      return;
    }

    const el = scrollRef.current;
    if (!el) return;

    const chatChanged = prevChatIdRef.current !== chat.id;
    const justFinishedLoading = wasLoadingRef.current;
    wasLoadingRef.current = false;

    if (chatChanged || justFinishedLoading) {
      prevChatIdRef.current = chat.id;
      prevMessagesLengthRef.current = messages.length;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToBottom('auto'));
      });
      return;
    }

    if (loadingMore) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > prevMessagesLengthRef.current) {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < 160) {
        scrollToBottom('auto');
      }
    }

    prevMessagesLengthRef.current = messages.length;
  }, [chat.id, isLoading, loadingMore, messages.length, scrollRef, scrollToBottom]);

  const loadOlder = useCallback(async () => {
    const oldest = messages[0];
    if (!oldest || !hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await chatApi.listMessages(orderId, { before: oldest.id, limit: 50 });
      setOlderMessages((prev) => {
        const ids = new Set([...prev, ...messages].map((m) => m.id));
        const merged = res.messages.filter((m) => !ids.has(m.id));
        return [...merged, ...prev];
      });
      setHasMore(res.messagesMeta.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [messages, hasMore, loadingMore, orderId]);

  if (isLoading) {
    return <AdminChatMessagesSkeleton />;
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 min-h-0"
    >
      {hasMore && (
        <div className="flex justify-center pb-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs border-white/10"
            disabled={loadingMore}
            onClick={loadOlder}
          >
            {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Carregar mensagens anteriores'}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <div key={msg.id} className="shrink-0">
            <MemoChatMessageItem
              msg={msg}
              viewer={viewer}
              clientUserId={clientUserId}
              clientName={clientName}
              formatFileUrl={formatFileUrl}
              onLightboxOpen={onLightboxOpen}
              renderContent={renderContent}
            />
          </div>
        ))}
      </div>

      {footer}
    </div>
  );
}
