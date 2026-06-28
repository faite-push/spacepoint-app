'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { chatApi } from '@/lib/admin-api';
import { API_URL, getCsrfToken } from '@/lib/api';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/lib/notification-sound';
import { OrderApprovedCard, DeliveryCard, parseOrderApproved, parseDelivery } from '@/components/admin/chat/chat-message-cards';
import { ChatInput } from '@/components/admin/chat/chat-input';
import { ChatImageLightbox } from '@/components/admin/chat/chat-image-lightbox';

interface OrderChatProps {
  orderId: string;
}

export function OrderChat({ orderId }: OrderChatProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);

  const { data: chat, isLoading } = useQuery({
    queryKey: ['chat', orderId],
    queryFn: () => chatApi.getByOrder(orderId),
    enabled: !!orderId,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!chat?.messages?.length) return;

    const latest = chat.messages[chat.messages.length - 1];

    if (lastMessageId && latest.id !== lastMessageId && (latest.senderId === 'ADMIN' || latest.senderId === 'SYSTEM')) {
      playNotificationSound();
    }

    setLastMessageId(latest.id);
  }, [chat?.messages, lastMessageId]);

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; type?: string; fileUrl?: string }) =>
      chatApi.sendMessage(chat?.id || '', payload),
    onSuccess: () => {
      setMessage('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
    },
    onError: () => toast.error('Falha ao enviar mensagem'),
  });

  const ratingMutation = useMutation({
    mutationFn: (stars: number) =>
      chatApi.updateStatus(chat?.id || '', { status: 'CLOSED', rating: stars }),
    onSuccess: () => {
      toast.success('Obrigado pela avaliação!');
      queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
    },
    onError: () => toast.error('Falha ao enviar avaliação'),
  });

  const handleFileUpload = async (file: File): Promise<string | null> => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo maior que 5MB');
      return null;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API_URL}/v1/cdn/upload`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRF-Token': getCsrfToken() },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.url;
    } catch {
      toast.error('Falha no upload');
      return null;
    }
  };

  const handleSend = async () => {
    if (!message.trim() && !file) return;
    if (file) {
      const url = await handleFileUpload(file);
      if (!url) return;
      sendMutation.mutate({ content: message.trim(), type: 'IMAGE', fileUrl: url });
    } else {
      sendMutation.mutate({ content: message, type: 'TEXT' });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  const formatFileUrl = (url: string) => {
    if (!url) return '';

    const cdnMatch = url.match(/\/cdn\/([^/?#]+)/i);
    if (cdnMatch) {
      return `${API_URL}/cdn/${cdnMatch[1]}`;
    }

    if (url.startsWith('http')) return url;

    const cleanBase = (API_URL || '').replace(/\/$/, '');
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${cleanBase}${cleanPath}`;
  };

  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all underline-offset-2">
          {part}
        </a>
      ) : part
    );
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

  const isClosed = chat?.status === 'CLOSED' || chat?.status === 'ARCHIVED';

  return (
    <div className="bg-black/10 border border-white/5 rounded-md overflow-hidden flex flex-col max-h-[700px] h-[600px]">
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className='flex items-center gap-2'>
            <div className='bg-emerald-500 h-3 w-3 rounded-full animate-pulse'></div>
            <h3 className="text-sm font-semibold text-white">Chat de Entrega</h3>
          </div>
        </div>
        {isClosed && (
          <span className="text-[10px] bg-white/5 text-zinc-400 px-2 py-1 rounded-full uppercase">
            {chat?.status === 'ARCHIVED' ? 'Arquivado' : 'Encerrado'}
          </span>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
      >
        {chat?.messages.map((msg) => {
          const orderApproved = msg.type === 'ORDER_APPROVED' ? parseOrderApproved(msg.content) : null;
          const delivery = msg.type === 'DELIVERY' ? parseDelivery(msg.content) : null;
          const isSystem = msg.senderId === 'SYSTEM' || msg.senderId === 'ADMIN';
          const isAutomated = msg.type === 'AUTOMATED';
          const isCustomer = !isSystem && !orderApproved && !delivery;

          if (orderApproved) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div>
                  <OrderApprovedCard payload={orderApproved} />
                  <span className="text-[10px] opacity-40 mt-1 block text-center">
                    {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </div>
            );
          }

          if (delivery) {
            return (
              <div key={msg.id} className="flex justify-start">
                <div>
                  <DeliveryCard payload={delivery} />
                  <span className="text-[10px] opacity-40 mt-1 block">
                    {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={cn('flex', isSystem ? 'justify-start' : isAutomated ? 'justify-center' : 'justify-end')}>
              <div
                className={cn(
                  'max-w-[80%] rounded-md p-3 text-sm',
                  isAutomated ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs'
                    : isSystem ? 'bg-white/5 text-white'
                      : 'bg-purple-600 text-white rounded-tr-none'
                )}
              >
                {msg.fileUrl && (
                  <img
                    src={formatFileUrl(msg.fileUrl)}
                    alt="Anexo"
                    className="rounded-lg mb-2 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setLightboxImage(formatFileUrl(msg.fileUrl!))}
                  />
                )}
                {msg.content && <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>}
                <span className="text-[10px] opacity-40 mt-1 block">
                  {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isClosed && !chat?.rating && (
        <div className="p-6 border-t border-white/5 bg-purple-500/5 text-center">
          <h4 className="text-sm font-medium text-white mb-3">Como foi seu atendimento?</h4>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => ratingMutation.mutate(star)}
                disabled={ratingMutation.isPending}
                className="p-2 hover:scale-110 transition-transform group disabled:opacity-50"
              >
                <Star className={cn('h-6 w-6 transition-colors', star <= (chat?.rating || 0) ? 'text-yellow-400 fill-current' : 'text-zinc-600')} />
              </button>
            ))}
          </div>
        </div>
      )}

      {!isClosed && (
        <div className="px-4 py-3 border-t border-white/5">
          <ChatInput
            message={message}
            onMessageChange={setMessage}
            file={file}
            onFileChange={setFile}
            onSend={handleSend}
            isSending={sendMutation.isPending}
            placeholder="Digite sua mensagem..."
          />
        </div>
      )}

      <ChatImageLightbox
        src={lightboxImage}
        open={!!lightboxImage}
        onOpenChange={(open) => !open && setLightboxImage(null)}
      />
    </div>
  );
}
