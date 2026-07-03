'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Maximize2, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { chatApi, type Chat, type ChatMessage } from '@/lib/admin-api';
import { API_URL } from '@/lib/api';
import { uploadChatImages } from '@/lib/chat-upload';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/lib/notification-sound';
import { useSocket } from '@/context/socket-context';
import { ChatMessageItem } from '@/components/admin/chat/chat-message-row';
import { ChatInput } from '@/components/admin/chat/chat-input';
import { ChatImageLightbox } from '@/components/admin/chat/chat-image-lightbox';
import { ChatRatingDialog } from '@/components/admin/chat/chat-rating-dialog';
import { isSupportSender } from '@/lib/chat-message-display';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const FAQ_ITEMS = [
  { q: 'Quando recebo meu produto?', a: 'Após a confirmação do pagamento, a entrega é feita aqui no chat.' },
  { q: 'Como funciona a entrega?', a: 'Nossa equipe envia os códigos ou arquivos diretamente nesta conversa.' },
  { q: 'Posso pedir suporte?', a: 'Sim! Envie sua dúvida abaixo que responderemos o mais rápido possível.' },
];

interface OrderChatProps {
  orderId: string;
}

function formatFileUrl(url: string) {
  if (!url) return '';
  const cdnMatch = url.match(/\/cdn\/([^/?#]+)/i);
  if (cdnMatch) return `${API_URL}/cdn/${cdnMatch[1]}`;
  if (url.startsWith('http')) return url;
  const cleanBase = (API_URL || '').replace(/\/$/, '');
  return `${cleanBase}${url.startsWith('/') ? url : `/${url}`}`;
}

function renderMessageContent(content: string) {
  if (!content) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.split(urlRegex).map((part, i) =>
    urlRegex.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
        {part}
      </a>
    ) : part
  );
}

function getDeliveryProgress(chat: Chat) {
  const items = chat.order?.items || [];
  if (!items.length) return 0;
  let total = 0;
  let delivered = 0;
  for (const item of items) {
    total += item.quantity;
    delivered += item.codes?.filter((c) => c.status === 'DELIVERED').length ?? 0;
  }
  return total ? Math.round((delivered / total) * 100) : 0;
}

function ChatMessages({
  chat,
  scrollRef,
  messagesEndRef,
  onLightboxOpen,
  readAt,
}: {
  chat: Chat;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onLightboxOpen: (url: string) => void;
  readAt?: string | null;
}) {
  const pinned = (chat.messages ?? []).filter((m) => m.isPinned);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10 min-h-0">
      {pinned.length > 0 && (
        <div className="space-y-2 mb-2">
          {pinned.map((msg) => (
            <div key={msg.id} className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2 text-xs text-amber-200">
              📌 {msg.content.slice(0, 120)}
            </div>
          ))}
        </div>
      )}

      {(chat.messages ?? []).map((msg) => (
        <ChatMessageItem
          key={msg.id}
          msg={msg}
          viewer="client"
          clientUserId={chat.order?.user?.id}
          clientName={chat.order?.user?.name || chat.order?.user?.email || 'Cliente'}
          formatFileUrl={formatFileUrl}
          onLightboxOpen={onLightboxOpen}
          renderContent={renderMessageContent}
        />
      ))}

      {readAt && (
        <p className="text-[10px] text-emerald-400/80 text-right">✓ Visualizado pelo suporte</p>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

export function OrderChat({ orderId }: OrderChatProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showFaq, setShowFaq] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const expandedScrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const expandedEndRef = useRef<HTMLDivElement>(null);
  const lastSentAtRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket, isConnected } = useSocket();

  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', orderId],
    queryFn: () => chatApi.getByOrder(orderId),
    enabled: !!orderId,
    refetchInterval: isConnected ? false : 5000,
  });

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      expandedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages?.length, expanded, scrollToBottom]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (!socket || !chat?.id) return;

    socket.emit('join_chat', chat.id);

    const handleNewMessage = (msg: any) => {
      const msgChatId = msg.chatId || chat.id;
      if (msgChatId !== chat.id) return;

      queryClient.setQueryData(['chat', orderId], (old: any) => {
        if (!old) {
          queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
          return old;
        }
        const messages = old.messages ?? [];
        if (messages.some((m: any) => m.id === msg.id)) return old;
        return { ...old, messages: [...messages, msg] };
      });

      if (isSupportSender(msg)) {
        playNotificationSound();
        if (document.hidden && Notification.permission === 'granted') {
          new Notification('Nova mensagem do suporte', { body: msg.content?.slice(0, 80) || 'Você recebeu uma resposta.' });
        }
      }
    };

    const handleChatUpdated = (updatedChat: any) => {
      if (updatedChat.id === chat.id) {
        queryClient.setQueryData(['chat', orderId], (old: any) => {
          if (!old) {
            if (updatedChat.order) return updatedChat;
            queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
            return old;
          }
          return {
            ...old,
            ...updatedChat,
            messages: updatedChat.messages?.length ? updatedChat.messages : (old.messages ?? []),
            order: updatedChat.order ?? old.order,
          };
        });
        if (updatedChat.status === 'CLOSED' && !updatedChat.rating) {
          setShowRating(true);
        }
      }
    };

    const handleTyping = ({ chatId, isTyping, isAdmin }: { chatId: string; isTyping: boolean; isAdmin?: boolean }) => {
      if (chatId !== chat.id || !isAdmin) return;
      setAdminTyping(isTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) typingTimeoutRef.current = setTimeout(() => setAdminTyping(false), 3000);
    };

    const handleRead = ({ chatId }: { chatId: string }) => {
      if (chatId === chat.id) {
        queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('chat_updated', handleChatUpdated);
    socket.on('typing', handleTyping);
    socket.on('messages_read', handleRead);

    return () => {
      socket.emit('leave_chat', chat.id);
      socket.off('new_message', handleNewMessage);
      socket.off('chat_updated', handleChatUpdated);
      socket.off('typing', handleTyping);
      socket.off('messages_read', handleRead);
    };
  }, [socket, chat?.id, orderId, queryClient]);

  useEffect(() => {
    if (!socket || !chat?.id) return;

    if (!message.trim()) {
      socket.emit('typing_stop', { chatId: chat.id });
      return;
    }

    const startTimer = setTimeout(() => {
      socket.emit('typing_start', { chatId: chat.id });
    }, 400);

    const stopTimer = setTimeout(() => {
      socket.emit('typing_stop', { chatId: chat.id });
    }, 2800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [message, socket, chat?.id]);

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; type?: string; fileUrl?: string }) =>
      chatApi.sendMessage(chat?.id || '', payload),
    onError: (err: Error) => toast.error(err.message || 'Falha ao enviar mensagem'),
  });

  const ratingMutation = useMutation({
    mutationFn: (payload: { rating: number; ratingComment?: string; ratingTags: string[]; isAnonymous: boolean }) =>
      chatApi.submitRating(chat?.id || '', payload),
    onSuccess: () => {
      toast.success('Obrigado pela avaliação!');
      setShowRating(false);
      queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
    },
    onError: (err: Error) => toast.error(err.message || 'Falha ao enviar avaliação'),
  });

  const reopenMutation = useMutation({
    mutationFn: () => chatApi.reopenChat(chat?.id || ''),
    onSuccess: (updatedChat) => {
      toast.success('Chat reaberto');
      queryClient.setQueryData(['chat', orderId], (old: any) => {
        if (!old) return updatedChat;
        const messages = old.messages ?? [];
        const newMessages = updatedChat?.messages?.length
          ? updatedChat.messages.filter((m: any) => !messages.some((existing: any) => existing.id === m.id))
          : [];
        return {
          ...old,
          ...updatedChat,
          status: 'OPEN',
          isResolved: false,
          messages: newMessages.length ? [...messages, ...newMessages] : messages,
        };
      });
    },
    onError: (err: Error) => toast.error(err.message || 'Falha ao reabrir'),
  });

  const handleSend = async () => {
    if (!message.trim() && !files.length) return;
    const now = Date.now();
    if (now - lastSentAtRef.current < 2000) {
      toast.error('Aguarde alguns segundos antes de enviar outra mensagem.');
      return;
    }
    if (sendMutation.isPending) return;

    try {
      if (message.trim()) {
        await sendMutation.mutateAsync({ content: message, type: 'TEXT' });
      }
      if (files.length) {
        const urls = await uploadChatImages(files);
        if (!urls.length) {
          toast.error('Falha no upload das imagens');
          return;
        }
        if (urls.length < files.length) {
          toast.warning(`${urls.length} de ${files.length} imagens enviadas`);
        }
        for (const url of urls) {
          await sendMutation.mutateAsync({ content: '', type: 'IMAGE', fileUrl: url });
        }
      }
      lastSentAtRef.current = Date.now();
      setMessage('');
      setFiles([]);
      if (socket && chat?.id) socket.emit('typing_stop', { chatId: chat.id });
    } catch {
      // onError do mutation já exibe toast
    }
  };

  if (isLoading) {
    return (
      <div className="bg-transparent border border-white/5 rounded-md p-8 animate-pulse">
        <div className="h-4 w-1/4 bg-white/5 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-20 bg-white/5 rounded-xl" />
          <div className="h-20 bg-white/5 rounded-xl w-3/4 ml-auto" />
        </div>
      </div>
    );
  }

  if (!chat) return null;

  const isClosed = chat.status === 'CLOSED';
  const progress = getDeliveryProgress(chat);
  const canRate = isClosed && !chat.rating;
  const readAt = chat.lastAdminReadAt;

  const panelHeader = (
    <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <div className="bg-emerald-500 h-3 w-3 rounded-full animate-pulse" />
        <h3 className="text-sm font-semibold text-white">Chat de Entrega</h3>
      </div>
      <div className="flex items-center gap-2">
        {canRate && (
          <Button size="sm" variant="ghost" className="text-yellow-400 text-xs" onClick={() => setShowRating(true)}>
            <Star className="h-4 w-4 mr-1" /> Avaliar
          </Button>
        )}
        {isClosed && (
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => reopenMutation.mutate()} disabled={reopenMutation.isPending}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reabrir
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => setExpanded(true)} title="Expandir">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const progressBar = (
    <div className="px-4 py-2 border-b border-white/5 shrink-0">
      <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
        <span>Progresso da entrega</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );

  const faqSection = !isClosed && (
    <div className="border-b border-white/5 shrink-0">
      <button type="button" className="w-full px-4 py-2 flex items-center justify-between text-xs text-zinc-400 hover:bg-white/[0.02]" onClick={() => setShowFaq(!showFaq)}>
        Perguntas frequentes
        {showFaq ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {showFaq && (
        <div className="px-4 pb-3 space-y-2">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="text-xs bg-white/[0.03] rounded p-2 border border-white/5">
              <p className="font-medium text-white/90">{item.q}</p>
              <p className="text-zinc-500 mt-0.5">{item.a}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const inputSection = !isClosed && (
    <div className="px-4 py-3 border-t border-white/5 shrink-0">
      <ChatInput
        message={message}
        onMessageChange={setMessage}
        files={files}
        onFilesChange={setFiles}
        onSend={handleSend}
        isSending={sendMutation.isPending}
        placeholder="Digite sua mensagem..."
        typingIndicator={
          adminTyping ? (
            <p className="text-xs text-zinc-400 animate-pulse">Suporte digitando...</p>
          ) : null
        }
      />
    </div>
  );

  return (
    <>
      <div className="bg-black/10 border border-white/5 rounded-md overflow-hidden flex flex-col max-h-[700px] h-[600px]">
        {panelHeader}
        {progressBar}
        {faqSection}
        <ChatMessages
          chat={chat}
          scrollRef={scrollRef}
          messagesEndRef={messagesEndRef}
          onLightboxOpen={setLightboxImage}
          readAt={readAt}
        />
        {inputSection}
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-5xl w-[96vw] h-[60vh] p-0 gap-0 flex flex-col overflow-hidden">
          <DialogTitle className="sr-only">Chat ampliado</DialogTitle>
          <div className="flex flex-col h-full min-h-0">
            {panelHeader}
            {progressBar}
            <ChatMessages
              chat={chat}
              scrollRef={expandedScrollRef}
              messagesEndRef={expandedEndRef}
              onLightboxOpen={setLightboxImage}
              readAt={readAt}
            />
            {inputSection}
          </div>
        </DialogContent>
      </Dialog>

      <ChatRatingDialog
        open={showRating}
        onOpenChange={setShowRating}
        isSubmitting={ratingMutation.isPending}
        onSubmit={(payload) => ratingMutation.mutate(payload)}
      />

      <ChatImageLightbox src={lightboxImage} open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)} />
    </>
  );
}
