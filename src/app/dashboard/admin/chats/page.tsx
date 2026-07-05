'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Search, Archive, Send, MessageSquareQuote, CornerDownRight, Plus, X, Loader2, Settings, Volume2, Trash2, Edit2, Zap, RotateCcw, CheckCircle2, Circle, Tag, Check, Clock, UserCheck, ChevronLeft, MessageSquare } from 'lucide-react';
import { LuClock4, LuCheck } from "react-icons/lu";
import { TbTagFilled } from "react-icons/tb";

import { toast } from 'sonner';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from "@/components/ui/slider";

import { chatApi, siteSettingsApi, type Chat, type ChatMessage, type ChatMacro, type ChatLabel } from '@/lib/admin-api';
import { API_URL } from '@/lib/api';
import { uploadChatImages } from '@/lib/chat-upload';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/lib/notification-sound';
import { ChatMessagesList, dedupeChatMessages } from '@/components/admin/chat/chat-messages-list';
import { isSupportSender } from '@/lib/chat-message-display';
import { ChatOrderPanel } from '@/components/admin/chat/chat-order-panel';
import { ChatInput } from '@/components/admin/chat/chat-input';
import { ChatImageLightbox } from '@/components/admin/chat/chat-image-lightbox';
import { ChatLabelModal, type ChatLabelFormValues } from '@/components/admin/chat/chat-label-modal';
import { getUnreadCount, isOrderFullyDelivered, getPreviewText, formatChatListTimestamp, mergeChatData, mergeOrderData, } from '@/lib/chat-utils';
import { claimRealtimeEvent, clearChatUnreadInCache, isCustomerAlertMessage, normalizeChatRealtimePayload, resetUnreadBumpKey, setActiveAdminChatId, } from '@/lib/admin-chat-realtime';
import { getChatListRowClass, isExpressDelivery } from '@/lib/order-delivery';
import { buildChatFiltersSearchParams, buildChatListQueryParams, readChatFiltersFromSearchParams, type ChatStatusFilter, } from '@/lib/chat-list-filters';
import { CHAT_LIST_SCROLL_CLASS, restoreChatListScroll, saveChatListScrollTop, } from '@/lib/chat-list-scroll';
import { useIsMobile } from '@/lib/use-is-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AdminAmbientGlow } from '@/components/admin/layout/admin-ambient-glow';
import Image from 'next/image';

export default function AdminChatsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialFilters = readChatFiltersFromSearchParams(searchParams);
  const chatIdFromUrl = pathname.match(/\/chats\/chat\/([^/]+)/)?.[1];
  const isMobile = useIsMobile();
  const [listSheetOpen, setListSheetOpen] = useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const { socket, onlineUsers, isConnected } = useSocket();
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkIsOnline = (chat: Chat) => {
    const customerId = chat.order?.user?.id;
    if (!customerId) return false;
    return onlineUsers.includes(customerId);
  };

  const [search, setSearch] = useState(initialFilters.search);
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [chatWelcomeMessage, setChatWelcomeMessage] = useState('');
  const [chatAutomatedMessagesText, setChatAutomatedMessagesText] = useState('');
  const [showMacros, setShowMacros] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingLabel, setEditingLabel] = useState<ChatLabel | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const chatListScrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const [statusFilter, setStatusFilter] = useState<ChatStatusFilter>(initialFilters.statusFilter);
  const [labelFilter, setLabelFilter] = useState<string>(initialFilters.labelFilter);
  const [sortBy, setSortBy] = useState<'activity' | 'created'>(initialFilters.sortBy);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationVolume, setNotificationVolume] = useState(80);
  const selectedChatRef = useRef(selectedChat);
  useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);
  useEffect(() => {
    setActiveAdminChatId(selectedChat?.id ?? null);
    return () => setActiveAdminChatId(null);
  }, [selectedChat?.id]);
  const notificationsEnabledRef = useRef(notificationsEnabled);
  useEffect(() => { notificationsEnabledRef.current = notificationsEnabled; }, [notificationsEnabled]);
  const notificationVolumeRef = useRef(notificationVolume);
  useEffect(() => { notificationVolumeRef.current = notificationVolume; }, [notificationVolume]);
  const searchRef = useRef(search);
  useEffect(() => { searchRef.current = search; }, [search]);
  const statusFilterRef = useRef(statusFilter);
  useEffect(() => { statusFilterRef.current = statusFilter; }, [statusFilter]);
  const labelFilterRef = useRef(labelFilter);
  useEffect(() => { labelFilterRef.current = labelFilter; }, [labelFilter]);
  const sortByRef = useRef(sortBy);
  useEffect(() => { sortByRef.current = sortBy; }, [sortBy]);

  useEffect(() => {
    const params = buildChatFiltersSearchParams(statusFilter, labelFilter, search, sortBy);
    const qs = params.toString();
    const path = chatIdFromUrl
      ? `/dashboard/admin/chats/chat/${chatIdFromUrl}`
      : '/dashboard/admin/chats';
    const next = qs ? `${path}?${qs}` : path;
    const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (next !== current) {
      router.replace(next, { scroll: false });
    }
  }, [statusFilter, labelFilter, search, sortBy, chatIdFromUrl, pathname, router, searchParams]);

  const [editingMacro, setEditingMacro] = useState<ChatMacro | null>(null);
  const [newMacroShortcut, setNewMacroShortcut] = useState('');
  const [newMacroContent, setNewMacroContent] = useState('');
  const [newMacroCategory, setNewMacroCategory] = useState('geral');
  const [showMacroForm, setShowMacroForm] = useState(false);
  const [showMacrosList, setShowMacrosList] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLabelsList, setShowLabelsList] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['admin', 'chats', search, statusFilter, labelFilter, sortBy],
    queryFn: () => chatApi.list(buildChatListQueryParams(statusFilter, labelFilter, search, sortBy)),
    refetchInterval: isConnected ? false : 8000,
    refetchIntervalInBackground: false,
    staleTime: isConnected ? Infinity : 0,
  });

  const { data: labelsData } = useQuery({
    queryKey: ['admin', 'chat-labels'],
    queryFn: () => chatApi.listLabels(),
  });

  const { data: macrosData } = useQuery({
    queryKey: ['admin', 'chat-macros'],
    queryFn: () => chatApi.listMacros(),
  });

  const { data: selectedChatData, isLoading: isLoadingSelectedChat, isFetching: isFetchingSelectedChat } = useQuery({
    queryKey: ['chat', selectedChat?.orderId],
    queryFn: () => chatApi.getByOrder(selectedChat?.orderId || ''),
    enabled: !!selectedChat?.orderId,
    refetchInterval: isConnected ? false : 5000,
    refetchIntervalInBackground: false,
    staleTime: isConnected ? Infinity : 0,
  });

  const chatDetailReady = !!selectedChat && !!selectedChatData && (selectedChatData.orderId === selectedChat.orderId || selectedChatData.id === selectedChat.id);

  const isChatMessagesLoading = !!selectedChat && (!chatDetailReady || isLoadingSelectedChat || (isFetchingSelectedChat && !chatDetailReady));

  const selectedChatFull = selectedChat && chatDetailReady
    ? {
      ...selectedChat,
      ...selectedChatData,
      messages: selectedChatData.messages ?? [],
      order: mergeOrderData(selectedChat.order, selectedChatData.order) ?? selectedChatData.order ?? selectedChat.order,
      labels: selectedChatData.labels ?? selectedChat.labels,
      userStats: selectedChatData.userStats ?? selectedChat.userStats,
    }
    : selectedChat;

  useEffect(() => {
    if (!socket || !selectedChat?.id) return;

    if (!message.trim()) {
      socket.emit('typing_stop', { chatId: selectedChat.id });
      return;
    }

    const startTimer = setTimeout(() => {
      socket.emit('typing_start', { chatId: selectedChat.id });
    }, 400);

    const stopTimer = setTimeout(() => {
      socket.emit('typing_stop', { chatId: selectedChat.id });
    }, 2800);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(stopTimer);
    };
  }, [message, socket, selectedChat?.id]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessageAlert = (raw: {
      chatId: string;
      type?: string;
      orderId?: string;
      customerName?: string;
      message?: { id: string; content: string; senderId: string; type?: string };
    }) => {
      const payload = normalizeChatRealtimePayload(raw);
      const activeChatId = selectedChatRef.current?.id ?? null;

      // Lista e badge são atualizados por AdminChatNotifications (evita processar 2x)

      if (!claimRealtimeEvent(payload)) return;

      const isReopen = payload.type === 'reopened';
      const isCustomer = isCustomerAlertMessage(payload.lastMessage);

      if (payload.chatId !== activeChatId && notificationsEnabledRef.current && (isReopen || isCustomer)) {
        playNotificationSound(notificationVolumeRef.current / 100);
        if (isReopen) {
          toast('Chat reaberto pelo cliente', {
            description: raw.customerName
              ? `${raw.customerName}${raw.orderId ? ` — Pedido #${raw.orderId.slice(-8)}` : ''}`
              : 'O cliente reabriu o atendimento.',
          });
        } else if (payload.type === 'new_chat') {
          toast('Nova compra recebida', {
            description: raw.customerName
              ? `${raw.customerName}${raw.orderId ? ` — Pedido #${raw.orderId.slice(-8)}` : ''}`
              : 'Um novo chat de atendimento foi aberto.',
          });
        } else if (payload.lastMessage) {
          toast('Nova mensagem no atendimento', {
            description: `${raw.customerName || 'Cliente'}: ${payload.lastMessage.content?.slice(0, 80) || 'Nova mensagem'}`,
          });
        }
      }
    };

    const handleChatListUpdate = (_raw: {
      chatId: string;
      lastMessage?: { id: string; content: string; senderId: string; type?: string };
      type?: string;
    }) => {
      // Processado globalmente em AdminChatNotifications
    };

    socket.on('new_message_alert', handleNewMessageAlert);
    socket.on('chat_list_update', handleChatListUpdate);

    return () => {
      socket.off('new_message_alert', handleNewMessageAlert);
      socket.off('chat_list_update', handleChatListUpdate);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    if (!socket) return;

    const findOrderIdForChat = (chatId: string): string | undefined => {
      const current = selectedChatRef.current;
      if (current?.id === chatId && current.orderId) return current.orderId;
      const cached = queryClient.getQueriesData<{ chats?: Chat[] }>({ queryKey: ['admin', 'chats'] });
      for (const [, data] of cached) {
        const found = data?.chats?.find((c) => c.id === chatId);
        if (found?.orderId) return found.orderId;
      }
      const detailQueries = queryClient.getQueriesData<Chat>({ queryKey: ['chat'] });
      for (const [, data] of detailQueries) {
        if (data?.id === chatId && data.orderId) return data.orderId;
      }
      return undefined;
    };

    const handleGlobalNewMessage = (msg: any) => {
      const msgChatId = msg.chatId;
      if (!msgChatId) return;
      const orderId = msg.orderId || findOrderIdForChat(msgChatId);
      const activeChatId = selectedChatRef.current?.id ?? null;

      if (msgChatId === activeChatId && isCustomerAlertMessage(msg)) {
        void chatApi.markAsRead(msgChatId).then(() => {
          resetUnreadBumpKey(msgChatId);
          clearChatUnreadInCache(queryClient, msgChatId);
        });
      }

      if (!orderId) {
        queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
        return;
      }

      queryClient.setQueryData(['chat', orderId], (old: Chat | undefined) => {
        if (!old) {
          queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
          return old;
        }
        const messages = old.messages ?? [];
        if (messages.some((m) => m.id === msg.id)) return old;
        return { ...old, messages: dedupeChatMessages([...messages, msg]) };
      });
    };

    const handleGlobalChatUpdated = (updatedChat: Partial<Chat> & { id: string }) => {
      const orderId = updatedChat.orderId || findOrderIdForChat(updatedChat.id);
      if (orderId) {
        queryClient.setQueryData(['chat', orderId], (old: Chat | undefined) => {
          const merged = mergeChatData(old, updatedChat);
          if (!merged) {
            queryClient.invalidateQueries({ queryKey: ['chat', orderId] });
            return old;
          }
          return merged;
        });
      }

      setSelectedChat((prev) => {
        if (!prev || prev.id !== updatedChat.id) return prev;
        return mergeChatData(prev, updatedChat) ?? prev;
      });
    };

    socket.on('new_message', handleGlobalNewMessage);
    socket.on('chat_updated', handleGlobalChatUpdated);

    return () => {
      socket.off('new_message', handleGlobalNewMessage);
      socket.off('chat_updated', handleGlobalChatUpdated);
    };
  }, [socket, queryClient]);

  useEffect(() => {
    if (!socket || !selectedChat?.id) return;

    const chatId = selectedChat.id;
    const orderId = selectedChat.orderId;

    socket.emit('join_chat', chatId);

    const handleTyping = ({ chatId: cid, userId, isTyping, isAdmin }: { chatId: string; userId: string; isTyping: boolean; isAdmin?: boolean }) => {
      if (cid !== chatId || isAdmin) return;
      if (isTyping) {
        setTypingUserId(userId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 3000);
      } else {
        setTypingUserId(null);
      }
    };

    socket.on('typing', handleTyping);

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('typing', handleTyping);
    };
  }, [socket, selectedChat?.id, selectedChat?.orderId, queryClient]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!selectedChatFull) return;

      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          (activeEl as HTMLElement).isContentEditable
        ) {
          return;
        }
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [selectedChatFull]);

  useEffect(() => {
    if (selectedChat?.id && messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 50);
    }
  }, [selectedChat?.id]);

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; type?: string; fileUrl?: string }) =>
      chatApi.sendMessage(selectedChatFull?.id || '', payload),
    onMutate: async (payload) => {
      const orderId = selectedChatRef.current?.orderId;
      const chatId = selectedChatRef.current?.id;
      if (!orderId || !chatId || !user?.id) return;

      await queryClient.cancelQueries({ queryKey: ['chat', orderId] });

      const tempId = `optimistic-${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        id: tempId,
        chatId,
        senderId: 'ADMIN',
        senderName: user.name ?? null,
        content: payload.content,
        type: (payload.type as ChatMessage['type']) || 'TEXT',
        fileUrl: payload.fileUrl ?? null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Chat>(['chat', orderId], (old) => {
        if (!old) return old;
        return { ...old, messages: [...(old.messages ?? []), optimisticMsg] };
      });

      return { orderId, tempId };
    },
    onSuccess: (saved, _payload, context) => {
      if (!context) return;
      queryClient.setQueryData<Chat>(['chat', context.orderId], (old) => {
        if (!old) return old;
        const withoutTemp = (old.messages ?? []).filter((m) => m.id !== context.tempId);
        const next = withoutTemp.some((m) => m.id === saved.id)
          ? withoutTemp
          : [...withoutTemp, saved];
        return { ...old, messages: dedupeChatMessages(next) };
      });
    },
    onError: (_err, _payload, context) => {
      if (context?.orderId) {
        queryClient.setQueryData<Chat>(['chat', context.orderId], (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: (old.messages ?? []).filter((m) => m.id !== context.tempId),
          };
        });
      }
      toast.error('Erro ao enviar mensagem');
    },
  });

  const { data: siteSettingsData } = useQuery({
    queryKey: ['admin', 'site-settings'],
    queryFn: () => siteSettingsApi.get(),
    enabled: showSettingsDialog,
  });

  useEffect(() => {
    const config = siteSettingsData?.config;
    if (!config) return;
    setChatWelcomeMessage(config.chatWelcomeMessage || '');
    if (config.chatAutomatedMessages) {
      try {
        const parsed = JSON.parse(config.chatAutomatedMessages);
        setChatAutomatedMessagesText(Array.isArray(parsed) ? parsed.join('\n') : '');
      } catch {
        setChatAutomatedMessagesText('');
      }
    } else {
      setChatAutomatedMessagesText('');
    }
  }, [siteSettingsData]);

  const saveChatSettingsMutation = useMutation({
    mutationFn: () => {
      const lines = chatAutomatedMessagesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return siteSettingsApi.update({
        chatWelcomeMessage: chatWelcomeMessage.trim() || null,
        chatAutomatedMessages: lines.length ? JSON.stringify(lines) : null,
      });
    },
    onSuccess: () => {
      toast.success('Mensagens automáticas salvas');
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-settings'] });
    },
    onError: () => toast.error('Erro ao salvar mensagens automáticas'),
  });

  const assignMutation = useMutation({
    mutationFn: (assignedToId: string | null) =>
      chatApi.assignChat(selectedChatFull?.id || '', assignedToId),
    onSuccess: () => {
      toast.success('Atendente atualizado');
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChat?.orderId] });
    },
  });

  const getSlaMinutes = (chat: Chat) => {
    const messages = chat.messages ?? [];
    const lastCustomer = [...messages].reverse().find(
      (m) => m.senderId !== 'ADMIN' && m.senderId !== 'SYSTEM' && m.type !== 'AUTOMATED'
    );
    if (!lastCustomer) return null;
    const answered = messages.some(
      (m) => m.senderId === 'ADMIN' && new Date(m.createdAt) > new Date(lastCustomer.createdAt)
    );
    if (answered) return null;
    return Math.floor((Date.now() - new Date(lastCustomer.createdAt).getTime()) / 60000);
  };

  const archiveMutation = useMutation({
    mutationFn: (isArchived: boolean) =>
      chatApi.updateStatus(selectedChatFull?.id || '', { isArchived }),
    onSuccess: (_, isArchived) => {
      toast.success(isArchived ? 'Conversa arquivada' : 'Conversa desarquivada');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatFull?.orderId] });
    },
    onError: () => toast.error('Erro ao atualizar conversa'),
  });

  const labelMutation = useMutation({
    mutationFn: (labelIds: string[]) =>
      chatApi.updateLabels(selectedChatFull?.id || '', labelIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatFull?.orderId] });
    },
  });

  const resolvedMutation = useMutation({
    mutationFn: (isResolved: boolean) =>
      chatApi.updateStatus(selectedChatFull?.id || '', { isResolved }),
    onSuccess: (_, isResolved) => {
      toast.success(isResolved ? 'Atendimento finalizado' : 'Atendimento reaberto');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatFull?.orderId] });
    },
    onError: () => toast.error('Erro ao atualizar resolução'),
  });

  const deleteLabelMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteLabel(id),
    onSuccess: () => {
      toast.success('Etiqueta removida');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-labels'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
    },
    onError: () => toast.error('Erro ao remover etiqueta'),
  });

  const createLabelMutation = useMutation({
    mutationFn: (payload: ChatLabelFormValues) => chatApi.createLabel(payload),
    onSuccess: () => {
      toast.success('Etiqueta criada');
      setShowLabelModal(false);
      setEditingLabel(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-labels'] });
    },
    onError: () => toast.error('Erro ao criar etiqueta'),
  });

  const updateLabelMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChatLabelFormValues }) =>
      chatApi.updateLabel(id, payload),
    onSuccess: () => {
      toast.success('Etiqueta atualizada');
      setShowLabelModal(false);
      setEditingLabel(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-labels'] });
    },
    onError: () => toast.error('Erro ao atualizar etiqueta'),
  });

  const handleLabelSubmit = (values: ChatLabelFormValues) => {
    if (editingLabel) {
      updateLabelMutation.mutate({ id: editingLabel.id, payload: values });
    } else {
      createLabelMutation.mutate(values);
    }
  };

  const handleSend = async (e?: React.FormEvent, content?: string) => {
    e?.preventDefault();
    const textToSend = content ?? message;
    if (!textToSend.trim() && !files.length) return;
    if (sendMutation.isPending) return;

    try {
      if (textToSend.trim()) {
        await sendMutation.mutateAsync({ content: textToSend, type: 'TEXT' });
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
      setMessage('');
      setFiles([]);
      setShowMacros(false);
      if (socket && selectedChat?.id) socket.emit('typing_stop', { chatId: selectedChat.id });
    } catch {
      // onError do mutation já exibe toast
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: (chatId: string) => chatApi.markAsRead(chatId),
    onSuccess: (_, chatId) => {
      resetUnreadBumpKey(chatId);
      clearChatUnreadInCache(queryClient, chatId);
    },
  });

  const handleSelectChat = (chat: Chat) => {
    if (chatListScrollRef.current) {
      saveChatListScrollTop(chatListScrollRef.current.scrollTop);
    }
    const params = buildChatFiltersSearchParams(statusFilter, labelFilter, search, sortBy);
    const qs = params.toString();
    router.push(qs ? `/dashboard/admin/chats/chat/${chat.id}?${qs}` : `/dashboard/admin/chats/chat/${chat.id}`);
    setSelectedChat(chat);
    if (chat.orderId) {
      void queryClient.invalidateQueries({ queryKey: ['chat', chat.orderId] });
    }
    if (isMobile) setListSheetOpen(false);
    if (chat.messages?.[0]?.senderId !== 'ADMIN' && (!chat.lastAdminReadAt || new Date(chat.messages[0].createdAt) > new Date(chat.lastAdminReadAt))) {
      markAsReadMutation.mutate(chat.id);
    }
  };

  useEffect(() => {
    if (!chatIdFromUrl || !chatsData?.chats?.length) return;
    if (selectedChat?.id === chatIdFromUrl) return;
    const found = chatsData.chats.find((c) => c.id === chatIdFromUrl);
    if (found) {
      setSelectedChat(found);
      void queryClient.invalidateQueries({ queryKey: ['chat', found.orderId] });
      return;
    }
    chatApi.getById(chatIdFromUrl).then((chat) => {
      setSelectedChat(chat);
      if (chat.orderId) {
        void queryClient.invalidateQueries({ queryKey: ['chat', chat.orderId] });
      }
    }).catch(() => { });
  }, [chatIdFromUrl, chatsData?.chats, selectedChat?.id, queryClient]);

  const handleToggleLabel = (labelId: string) => {
    const currentLabels = selectedChatFull?.labels?.map(l => l.id) || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    labelMutation.mutate(newLabels);
  };

  const createMacroMutation = useMutation({
    mutationFn: () => chatApi.createMacro(newMacroShortcut, newMacroContent, newMacroCategory),
    onSuccess: () => {
      toast.success('Atalho criado');
      setNewMacroShortcut('');
      setNewMacroContent('');
      setShowMacroForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-macros'] });
    },
    onError: () => toast.error('Falha ao criar atalho'),
  });

  const updateMacroMutation = useMutation({
    mutationFn: () => chatApi.updateMacro(editingMacro?.id || '', newMacroShortcut, newMacroContent, newMacroCategory),
    onSuccess: () => {
      toast.success('Atalho atualizado');
      setEditingMacro(null);
      setNewMacroShortcut('');
      setNewMacroContent('');
      setShowMacroForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-macros'] });
    },
    onError: () => toast.error('Falha ao atualizar atalho'),
  });

  const deleteMacroMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteMacro(id),
    onSuccess: () => {
      toast.success('Atalho removido');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-macros'] });
    },
    onError: () => toast.error('Falha ao remover atalho'),
  });

  const handleEditMacro = (macro: ChatMacro) => {
    setEditingMacro(macro);
    setNewMacroShortcut(macro.shortcut);
    setNewMacroContent(macro.content);
    setShowMacroForm(true);
  };

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
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all underline-offset-2">
          {part}
        </a>
      ) : part
    );
  };

  if (!user) return null;

  const chats = chatsData?.chats || [];
  const macros = macrosData?.macros || [];
  const allLabels = labelsData?.labels || [];

  const handleChatListScroll = () => {
    if (chatListScrollRef.current) {
      saveChatListScrollTop(chatListScrollRef.current.scrollTop);
    }
  };

  useLayoutEffect(() => {
    const el = chatListScrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => restoreChatListScroll(el));
  }, [chatsData?.chats, chatIdFromUrl]);

  const renderChatListItems = () => (
    <div
      ref={chatListScrollRef}
      className={CHAT_LIST_SCROLL_CLASS}
      onScroll={handleChatListScroll}
    >
      <div className="px-2 space-y-1">
        {chats.map((c) => {
          const unread = getUnreadCount(c);
          const delivered = isOrderFullyDelivered(c);
          const isSelected = selectedChat?.id === c.id;
          const isOnline = checkIsOnline(c);
          const express = isExpressDelivery(c.order);
          return (
            <button
              key={c.id}
              onClick={() => handleSelectChat(c)}
              className={cn(
                'w-full select-none cursor-pointer flex items-start gap-3 rounded-md p-3 transition-all relative border',
                getChatListRowClass({ isExpress: express, isResolved: c.isResolved, isSelected })
              )}
            >
              <div className="relative flex-shrink-0">
                <div className="flex items-center justify-center bg-white/10 rounded-full h-10 w-10 text-white ml-1">
                  <span className="font-medium">
                    {c.order?.user?.name?.slice(0, 1).toUpperCase() || '??'}
                  </span>
                </div>

                {delivered ? (
                  <Tooltip>
                    <TooltipTrigger render={
                      <div className="absolute -top-0.5 -left-0.5 bg-blue-500 text-white font-bold p-1 rounded-full border-2 border-black">
                        <LuCheck className="h-3 w-3 text-[#1a1a1a]" />
                      </div>
                    }>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Produto Entregue</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger render={
                      <div className="absolute -top-0.5 -left-0.5 bg-[#fcb64c] text-white font-bold p-1 rounded-full border-2 border-black">
                        <LuClock4 className="h-3 w-3 text-[#1a1a1a]" />
                      </div>
                    }>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Entrega pendente</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger render={
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center shadow-md",
                      isOnline ? "bg-emerald-500" : "bg-zinc-500"
                    )}>
                      {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                    </div>
                  }>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isOnline ? 'Cliente Online' : 'Cliente Offline'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-white text-sm truncate">
                      {c.order?.user?.name || c.order?.user?.email || 'Cliente'}
                    </span>

                    {express && (
                      <Tooltip>
                        <TooltipTrigger render={
                          <span className="inline-flex items-center justify-center text-xs font-medium text-[#fcb74e]">
                            <Zap className="h-3.5 w-3.5 fill-current rotate-12" />
                          </span>
                        }>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Entrega expressa</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {c.labels && c.labels.length > 0 && (
                      <Tooltip>
                        <TooltipTrigger render={
                          <div className="flex items-center justify-center gap-1">
                            {c.labels.slice(0, 2).map((l) => (
                              <span key={l.id} className="flex items-center justify-center text-xs text-white">
                                <TbTagFilled className="h-3.5 w-3.5" fill={l.color} />
                              </span>
                            ))}
                          </div>
                        }>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{c.labels.map((l) => l.name).join(', ')}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>

                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatChatListTimestamp(c.updatedAt, c.isResolved)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-sm text-muted-foreground line-clamp-1", unread > 0 && "text-white font-medium")}>
                    {c.messages?.[0] ? getPreviewText(c.messages[0].content, c.messages[0].type) : ''}
                  </span>
                  {unread > 0 && (
                    <span className="text-xs font-medium text-white h-5 min-w-5 px-1 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (isMobile && !chatIdFromUrl) {
    return (
      <>
        <div className="-mx-3 -my-8 flex min-h-[calc(100dvh-3.5rem)] w-[calc(100%+1.5rem)] flex-col items-center justify-center sm:-mx-4 sm:w-[calc(100%+2rem)]">
          <div className="flex h-[200px] w-[200px] items-center justify-center">
            <img src="/rm.png" alt="Rocket Money" className="h-full w-full object-cover select-none pointer-events-none" />
          </div>

          <Button
            onClick={() => setListSheetOpen(true)}
            className="bg-white text-black hover:bg-white/90 h-9 px-10 font-medium"
          >
            Abrir Chats
          </Button>
        </div>

        <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
          <SheetContent side="left" className="w-full border-none p-0 sm:max-w-md" showCloseButton>
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/5 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <h2 className="text-lg font-medium text-white">Conversas</h2>
                </div>
              </div>
              <div className="p-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    placeholder="Pesquisar uma conversa"
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {renderChatListItems()}
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <AdminAmbientGlow className={cn(isMobile && "-mx-3 -my-5 w-[calc(100%+1.5rem)] sm:-mx-4 sm:-my-0 sm:w-[calc(100%+2rem)] lg:mx-0 lg:-my-0 lg:w-full")}>
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col lg:h-[850px]">
        <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
          <div className="hidden w-80 lg:flex flex-col rounded-md border border-white/5">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-start gap-2">
                  <div className='rounded-full bg-emerald-500 w-3 h-3 animate-pulse animate-ping animate-duration-1000'></div>
                  <h2 className="text-lg font-medium text-white">Conversas</h2>
                </div>

                <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon-lg" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurações do Chat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      <div className="space-y-2 rounded-md border border-white/5 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-zinc-400" />
                            <Label className="text-sm font-medium">Volume das notificações</Label>
                          </div>
                          <span className="text-xs font-bold text-zinc-500">{notificationVolume}%</span>
                        </div>
                        <Slider
                          value={[notificationVolume]}
                          onValueChange={(v) => setNotificationVolume(Array.isArray(v) ? v[0] : v)}
                          max={100}
                          step={1}
                          className="py-2"
                        />
                      </div>

                      <Dialog open={showMacrosList} onOpenChange={setShowMacrosList}>
                        <DialogTrigger asChild>
                          <div className="flex flex-col cursor-pointer hover:bg-white/[0.03] rounded-md border border-white/5 p-4 transition-all duration-200">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-primary" />
                              <Label className="text-sm font-medium cursor-pointer">Atalhos de mensagens</Label>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Crie atalhos para mensagens frequentes. Digite <span className="bg-white/10 px-1 rounded text-white font-mono">!</span> no chat para usar.</p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md sm:max-w-[450px]">
                          <DialogHeader>
                            <DialogTitle>Atalhos</DialogTitle>
                            <DialogDescription>Crie atalhos para mensagens frequentes. Digite <code className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-xs">!</code> no chat para usar.</DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <Dialog open={showMacroForm} onOpenChange={(open) => {
                              setShowMacroForm(open);
                              if (!open) { setEditingMacro(null); setNewMacroShortcut(''); setNewMacroContent(''); }
                            }}>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="w-full h-10 bg-transparent border-white/5 hover:bg-white/5 font-medium text-white gap-2">
                                  <Plus className="h-5 w-5" /> Novo atalho
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="text-white">{editingMacro ? 'Editar Atalho' : 'Novo Atalho'}</DialogTitle>
                                  <p className="text-xs text-zinc-500">Defina um gatilho começando com ! e a mensagem correspondente.</p>
                                </DialogHeader>
                                <div className="space-y-3 pt-4">
                                  <div className="space-y-2">
                                    <Label>Nome do atalho</Label>
                                    <div className="relative">
                                      <span className="absolute left-4.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">!</span>
                                      <Input
                                        value={newMacroShortcut}
                                        onChange={(e) => setNewMacroShortcut(e.target.value)}
                                        className="pl-6"
                                        placeholder="vendas"
                                      />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Será usado como <span className="text-primary font-bold">!{newMacroShortcut || '...'}</span> no chat</p>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Categoria</Label>
                                    <Select value={newMacroCategory} onValueChange={setNewMacroCategory}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="geral">Geral</SelectItem>
                                        <SelectItem value="entrega">Entrega</SelectItem>
                                        <SelectItem value="suporte">Suporte</SelectItem>
                                        <SelectItem value="reembolso">Reembolso</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Mensagem</Label>
                                    <Textarea
                                      value={newMacroContent}
                                      onChange={(e) => setNewMacroContent(e.target.value)}
                                      placeholder="Digite a mensagem que o atalho irá enviar..."
                                      className="min-h-[120px] resize-none"
                                      maxLength={1000}
                                    />
                                    <p className="text-xs text-muted-foreground text-right">{newMacroContent.length}/1000 caracteres</p>
                                  </div>

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      onClick={() => editingMacro ? updateMacroMutation.mutate() : createMacroMutation.mutate()}
                                      disabled={!newMacroShortcut || !newMacroContent}
                                      className="w-full h-10"
                                    >
                                      {editingMacro ? 'Salvar' : 'Criar'}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <ScrollArea className="max-h-[350px] pr-2">
                              <div className="space-y-3">
                                {macros.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed border-white/5 rounded-md">
                                    <Zap className="h-10 w-10 opacity-20 mb-2 fill-current" />
                                    <p className="text-sm text-muted-foreground">Nenhum atalho criado</p>
                                  </div>
                                ) : (
                                  macros.map((m) => (
                                    <div key={m.id} className="flex items-center justify-between p-3 rounded-md bg-transparent border border-white/5 transition-colors">
                                      <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-sm font-medium text-white">!{m.shortcut}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-1 truncate">{m.content}</p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          className="h-8 w-8"
                                          onClick={() => handleEditMacro(m)}
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          size="icon-sm"
                                          className="h-8 w-8"
                                          onClick={() => deleteMacroMutation.mutate(m.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={showLabelsList} onOpenChange={setShowLabelsList}>
                        <DialogTrigger asChild>
                          <div className="flex flex-col cursor-pointer hover:bg-white/[0.03] rounded-md border border-white/5 p-4 transition-all duration-200">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-primary" />
                              <Label className="text-sm font-medium cursor-pointer">Etiquetas</Label>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Crie e gerencie etiquetas para organizar os chats por categoria.</p>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md sm:max-w-[450px]">
                          <DialogHeader>
                            <DialogTitle>Etiquetas</DialogTitle>
                            <DialogDescription>Organize chats por reembolso, não entregue, etc.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Button
                              className="w-full"
                              onClick={() => {
                                setEditingLabel(null);
                                setShowLabelModal(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Nova etiqueta
                            </Button>

                            <ScrollArea className="max-h-[320px]">
                              <div className="space-y-2">
                                {allLabels.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border-2 border-dashed border-white/5 rounded-md">
                                    <Tag className="h-10 w-10 opacity-20 mb-2 fill-current" />
                                    <p className="text-sm text-muted-foreground">Nenhuma etiqueta criada</p>
                                  </div>
                                ) : allLabels.map((l) => (
                                  <div key={l.id} className="flex items-center justify-between gap-2 p-3 rounded-md bg-transparent border border-white/5">
                                    <div className="min-w-0 flex-1">
                                      <span className="px-2 py-1 rounded text-xs font-medium text-white" style={{ backgroundColor: l.color }}>{l.name}</span>
                                      {(l.references?.length ?? 0) > 0 && (
                                        <p className="text-[10px] text-zinc-500 mt-1">
                                          {l.references!.length} referência(s) — aplicada na compra
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setEditingLabel(l);
                                          setShowLabelModal(true);
                                        }}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteLabelMutation.mutate(l.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* <div className="space-y-3 rounded-md border border-white/5 p-4">
                        <div className="flex items-center gap-2">
                          <MessageSquareQuote className="h-4 w-4 text-primary" />
                          <Label className="text-sm font-medium">Mensagens automáticas</Label>
                        </div>
                        <p className="text-xs text-zinc-500">
                          Enviadas automaticamente ao abrir um chat após a compra. Uma mensagem por linha.
                        </p>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400">Mensagem de boas-vindas</Label>
                          <Textarea
                            value={chatWelcomeMessage}
                            onChange={(e) => setChatWelcomeMessage(e.target.value)}
                            placeholder="Olá! Bem-vindo ao suporte..."
                            className="min-h-[60px] resize-none"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-zinc-400">Mensagens adicionais (uma por linha)</Label>
                          <Textarea
                            value={chatAutomatedMessagesText}
                            onChange={(e) => setChatAutomatedMessagesText(e.target.value)}
                            placeholder={'Aguarde que em breve responderemos.\nNosso horário é de 9h às 18h.'}
                            className="min-h-[80px] resize-none"
                            rows={3}
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => saveChatSettingsMutation.mutate()}
                          disabled={saveChatSettingsMutation.isPending}
                        >
                          {saveChatSettingsMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          Salvar mensagens automáticas
                        </Button>
                      </div> */}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Pesquisar..."
                    className="pl-9 h-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ChatStatusFilter)}>
                    <SelectTrigger className="bg-white/[0.02] border border-white/10 text-xs h-8 rounded-sm">
                      <SelectValue placeholder="Status do chat" />
                    </SelectTrigger>
                    <SelectContent align='start' className='bg-card border border-white/5 min-w-[200px]'>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="OPEN">Ativos</SelectItem>
                      <SelectItem value="ARCHIVED">Arquivados</SelectItem>
                      <SelectItem value="EXPRESS">Entrega expressa</SelectItem>
                      <SelectItem value="RESOLVED">Pedidos resolvidos</SelectItem>
                      <SelectItem value="UNRESOLVED">Pedidos não resolvidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={labelFilter} onValueChange={setLabelFilter}>
                    <SelectTrigger className="bg-white/[0.02] border border-white/10 text-xs h-8 rounded-sm">
                      <SelectValue placeholder="Etiqueta" />
                    </SelectTrigger>
                    <SelectContent align='end' className='bg-card border border-white/5 min-w-[200px]'>
                      <SelectItem value="ALL">Todas etiquetas</SelectItem>
                      {allLabels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {renderChatListItems()}
          </div>

          <div
            className={cn(
              "relative flex flex-1 flex-col rounded-md border border-white/5 min-w-0",
              isMobile && "border-0 rounded-none"
            )}
            onDragEnter={(e) => {
              e.preventDefault();
              dragCounterRef.current += 1;
              if (e.dataTransfer.types.includes('Files')) setIsDraggingFile(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              dragCounterRef.current -= 1;
              if (dragCounterRef.current <= 0) {
                dragCounterRef.current = 0;
                setIsDraggingFile(false);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              dragCounterRef.current = 0;
              setIsDraggingFile(false);
              const dropped = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'));
              if (dropped.length) setFiles((prev) => {
                const merged = [...prev];
                for (const f of dropped) {
                  if (merged.length >= 10) break;
                  if (!merged.some((x) => x.name === f.name && x.size === f.size)) merged.push(f);
                }
                return merged;
              });
            }}
          >
            {isDraggingFile && selectedChatFull && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-md pointer-events-none">
                <p className="text-xl font-medium text-white">Solte as imagens para enviar 📷</p>
              </div>
            )}

            {selectedChatFull ? (
              <>
                <div className="p-4 border-b border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isMobile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => setListSheetOpen(true)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                    )}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center select-none font-bold text-muted-foreground">
                        {selectedChatFull.order?.user?.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center shadow-md",
                        checkIsOnline(selectedChatFull) ? "bg-emerald-500" : "bg-zinc-500"
                      )}>
                        {checkIsOnline(selectedChatFull) && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isMobile) setDetailsSheetOpen(true);
                        }}
                        className={cn("text-left", isMobile && "cursor-pointer")}
                      >
                        <h3 className="font-medium text-white truncate">
                          {selectedChatFull.order?.user?.name || selectedChatFull.order?.user?.email || 'Cliente'}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-2">
                          <span>
                            Pedido <span className="font-mono">#{selectedChatFull.orderId.slice(-8)}</span>
                          </span>
                        </p>
                      </button>
                    </div>
                  </div>

                  {isMobile && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-white/10 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDetailsSheetOpen(true);
                      }}
                    >
                      Detalhes
                    </Button>
                  )}

                  <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end shrink-0">
                    <Button
                      size="lg"
                      onClick={() => resolvedMutation.mutate(!selectedChatFull.isResolved)}
                      className={cn(
                        'rounded-sm',
                        selectedChatFull.isResolved
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-white/5 hover:bg-white/10'
                      )}
                    >
                      {selectedChatFull.isResolved ? (
                        <><CheckCircle2 className="h-4 w-4 mr-2" /> Resolvido</>
                      ) : (
                        <><Circle className="h-4 w-4 mr-2" /> Não resolvido</>
                      )}
                    </Button>

                    <Button
                      size="lg"
                      onClick={() => archiveMutation.mutate(!selectedChatFull.isArchived)}
                      className="rounded-sm bg-white/5 hover:bg-white/10"
                      disabled={archiveMutation.isPending}
                    >
                      {selectedChatFull.isArchived ? (
                        <><RotateCcw className="h-4 w-4 mr-2" /> Desarquivar</>
                      ) : (
                        <><Archive className="h-4 w-4 mr-2" /> Arquivar</>
                      )}
                    </Button>
                  </div>

                  {isMobile && (
                    <Button
                      size="sm"
                      onClick={() => resolvedMutation.mutate(!selectedChatFull.isResolved)}
                      className={cn(
                        'rounded-sm shrink-0 text-xs border',
                        selectedChatFull.isResolved
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-[#fcb64c]/40 bg-[#fcb64c]/10 text-[#fcb64c]'
                      )}
                    >
                      {selectedChatFull.isResolved ? 'Resolvido' : 'Não resolvido'}
                    </Button>
                  )}
                </div>

                {isExpressDelivery(selectedChatFull.order) && (
                  <div className="flex items-center justify-center gap-2 rounded-b-sm bg-[#fcb74e]/10 px-3 py-2 text-[#fcb74e]">
                    <Zap className="h-4 w-4 shrink-0 text-[#fcb74e] fill-current" />
                    <p className="text-sm">Entrega expressa. Priorize o atendimento e a entrega deste pedido.</p>
                  </div>
                )}

                {selectedChatFull && (
                  <ChatMessagesList
                    chat={selectedChatFull}
                    viewer="admin"
                    clientUserId={selectedChatFull.order?.user?.id}
                    clientName={
                      selectedChatFull.order?.user?.name ||
                      selectedChatFull.order?.user?.email ||
                      'Cliente'
                    }
                    isLoading={isChatMessagesLoading}
                    formatFileUrl={formatFileUrl}
                    onLightboxOpen={(url) => setLightboxImage(url)}
                    renderContent={renderMessageContent}
                    scrollRef={scrollRef}
                  />
                )}

                <div className={cn("relative", isChatMessagesLoading && "pointer-events-none opacity-50")}>
                  {showMacros && (
                    <div className="absolute bottom-full bg-transparent backdrop-blur-xl border-t border-b border-white/5 rounded-t-md w-full animate-in slide-in-from-bottom-2 fade-out-0 duration-300 z-10">
                      <div className="text-sm text-white font-medium px-4 py-2 border-b border-white/5 mb-2 flex items-center justify-between">
                        Atalhos
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setShowMacros(true);
                            setShowSettingsDialog(true);
                          }}
                        >
                          <Settings className="h-4 w-4 text-zinc-500" />
                        </Button>
                      </div>

                      <ScrollArea className="h-22 px-2">
                        <div className="space-y-1">
                          {macros.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => handleSend(undefined, m.content)}
                              className="flex flex-row items-center w-full cursor-pointer px-3 py-2 rounded-sm bg-primary transition-colors text-xs text-zinc-300"
                            >
                              <span className="flex-1 text-left text-md font-semibold text-black">!{m.shortcut}</span>
                              <p className="text-xs text-black">{m.content}</p>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>

                      <div className="p-2 bg-transparent border-t border-white/5">
                        <button
                          onClick={() => {
                            setShowMacros(false);
                            setShowSettingsDialog(true);
                            setShowMacros(true);
                          }}
                          className="flex flex-row w-full items-center justify-center gap-2 cursor-pointer px-4 py-3 rounded-md bg-transparent hover:bg-primary/10 border border-dashed border-white/10 hover:border-primary/50 hover:text-primary transition-colors text-sm text-zinc-300"
                        >
                          <Plus className="h-4 w-4" />
                          Criar novo atalho
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="px-2 py-2">
                    <ChatInput
                      message={message}
                      onMessageChange={setMessage}
                      files={files}
                      onFilesChange={setFiles}
                      onSend={() => handleSend()}
                      isSending={sendMutation.isPending}
                      placeholder="Digite sua mensagem ou use !atalho..."
                      showMacroHint
                      onMacroTrigger={setShowMacros}
                      typingIndicator={
                        typingUserId ? (
                          <p className="text-xs text-zinc-400 animate-pulse">Cliente digitando...</p>
                        ) : null
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                <div className="h-[300px] w-[300px] flex items-center justify-center">
                  <Image
                    src="/logo-sidebar.png"
                    alt="Space Point"
                    width={140}
                    height={44}
                    className="mr-1 h-full w-full opacity-80 object-contain select-none pointer-events-none invert brightness-0"
                    priority
                  />
                </div>
              </div>
            )}
          </div>

          {selectedChatFull && chatDetailReady && (
            <div className="hidden h-full min-h-0 shrink-0 lg:block">
              <ChatOrderPanel
                chat={selectedChatFull as Chat}
                allLabels={allLabels}
                onToggleLabel={handleToggleLabel}
              />
            </div>
          )}
        </div>

        {isMobile && selectedChatFull && chatDetailReady && (
          <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
            <SheetContent
              side="right"
              overlayClassName="bg-black/60 supports-backdrop-filter:backdrop-blur-sm z-[100]"
              className="z-[101] flex h-full w-full max-w-md flex-col gap-0 overflow-hidden border-none p-0 sm:max-w-md"
              showCloseButton
            >
              <ChatOrderPanel
                chat={selectedChatFull as Chat}
                allLabels={allLabels}
                onToggleLabel={handleToggleLabel}
                embedded
              />
            </SheetContent>
          </Sheet>
        )}

        {isMobile && chatIdFromUrl && (
          <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
            <SheetContent side="left" className="min-w-[415px] border-none p-0 sm:max-w-md" showCloseButton>
              <div className="flex h-full flex-col bg-[#0a0a0a]">
                <div className="flex items-center justify-between border-b border-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <h2 className="text-lg font-medium text-white">Conversas</h2>
                  </div>
                </div>
                <div className="p-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      placeholder="Pesquisar uma conversa"
                      className="pl-9 h-9"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ChatStatusFilter)}>
                    <SelectTrigger className="bg-white/[0.02] border border-white/10 text-xs h-8 rounded-sm">
                      <SelectValue placeholder="Status do chat" />
                    </SelectTrigger>
                    <SelectContent align='start' className='bg-card border border-white/5 min-w-[200px]'>
                      <SelectItem value="ALL">Todos</SelectItem>
                      <SelectItem value="OPEN">Ativos</SelectItem>
                      <SelectItem value="ARCHIVED">Arquivados</SelectItem>
                      <SelectItem value="EXPRESS">Entrega expressa</SelectItem>
                      <SelectItem value="RESOLVED">Pedidos resolvidos</SelectItem>
                      <SelectItem value="UNRESOLVED">Pedidos não resolvidos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={labelFilter} onValueChange={setLabelFilter}>
                    <SelectTrigger className="bg-white/[0.02] border border-white/10 text-xs h-8 rounded-sm">
                      <SelectValue placeholder="Etiqueta" />
                    </SelectTrigger>
                    <SelectContent align='end' className='bg-card border border-white/5 min-w-[200px]'>
                      <SelectItem value="ALL">Todas etiquetas</SelectItem>
                      {allLabels.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {renderChatListItems()}
              </div>
            </SheetContent>
          </Sheet>
        )}

        <ChatImageLightbox
          src={lightboxImage}
          open={!!lightboxImage}
          onOpenChange={(open) => !open && setLightboxImage(null)}
        />

        <ChatLabelModal
          open={showLabelModal}
          onOpenChange={(open) => {
            setShowLabelModal(open);
            if (!open) setEditingLabel(null);
          }}
          label={editingLabel}
          isSubmitting={createLabelMutation.isPending || updateLabelMutation.isPending}
          onSubmit={handleLabelSubmit}
        />
      </div>
    </AdminAmbientGlow>
  );
}