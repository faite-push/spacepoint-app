'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Search, Archive, Send, MessageSquareQuote, CornerDownRight, Plus, X, Loader2, Star, Settings, Volume2, Trash2, Edit2, Zap, RotateCcw, CheckCircle2, Circle, Tag, Check } from 'lucide-react';
import { PiClockCountdownBold, PiCheckCircleBold } from "react-icons/pi";

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from "@/components/ui/slider";

import { chatApi, type Chat, type ChatMacro, type ChatLabel } from '@/lib/admin-api';
import { API_URL, getCsrfToken } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { playNotificationSound } from '@/lib/notification-sound';
import { OrderApprovedCard, DeliveryCard, parseOrderApproved, parseDelivery } from '@/components/admin/chat/chat-message-cards';
import { ChatOrderPanel } from '@/components/admin/chat/chat-order-panel';
import { ChatInput } from '@/components/admin/chat/chat-input';
import { ChatImageLightbox } from '@/components/admin/chat/chat-image-lightbox';
import { getUnreadCount, isOrderFullyDelivered, getPreviewText } from '@/lib/chat-utils';

export default function AdminChatsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const checkIsOnline = (chat: Chat) => {
    if (chat.messages?.length) {
      const customerMessages = chat.messages.filter(
        (m) => m.senderId !== 'ADMIN' && m.senderId !== 'SYSTEM'
      );
      if (customerMessages.length > 0) {
        const lastMsgTime = new Date(customerMessages[0].createdAt).getTime();
        if (Date.now() - lastMsgTime < 5 * 60 * 1000) return true;
      }
    }
    const charCodeSum = chat.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return charCodeSum % 3 === 0;
  };
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showMacros, setShowMacros] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

  const scrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'ARCHIVED'>('OPEN');
  const [labelFilter, setLabelFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'activity' | 'created'>('activity');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationVolume, setNotificationVolume] = useState(80);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const knownChatIdsRef = useRef<Set<string>>(new Set());
  const chatsInitializedRef = useRef(false);

  const [editingMacro, setEditingMacro] = useState<ChatMacro | null>(null);
  const [newMacroShortcut, setNewMacroShortcut] = useState('');
  const [newMacroContent, setNewMacroContent] = useState('');
  const [showMacroForm, setShowMacroForm] = useState(false);
  const [showMacrosList, setShowMacrosList] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showLabelsList, setShowLabelsList] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragCounterRef = useRef(0);

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['admin', 'chats', search, statusFilter, labelFilter, sortBy],
    queryFn: () => chatApi.list({
      search,
      status: statusFilter,
      labelId: labelFilter !== 'ALL' ? labelFilter : undefined,
      sortBy,
    }),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const { data: labelsData } = useQuery({
    queryKey: ['admin', 'chat-labels'],
    queryFn: () => chatApi.listLabels(),
  });

  const { data: macrosData } = useQuery({
    queryKey: ['admin', 'chat-macros'],
    queryFn: () => chatApi.listMacros(),
  });

  const { data: selectedChatData } = useQuery({
    queryKey: ['chat', selectedChat?.orderId],
    queryFn: () => chatApi.getByOrder(selectedChat?.orderId || ''),
    enabled: !!selectedChat?.orderId,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const selectedChatFull = selectedChatData || selectedChat;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [selectedChatFull?.messages?.length]);

  useEffect(() => {
    if (!chatsData?.chats?.length) return;

    if (!chatsInitializedRef.current) {
      chatsData.chats.forEach((c) => knownChatIdsRef.current.add(c.id));
      chatsInitializedRef.current = true;
      return;
    }

    for (const chat of chatsData.chats) {
      if (!knownChatIdsRef.current.has(chat.id)) {
        knownChatIdsRef.current.add(chat.id);
        if (notificationsEnabled) {
          playNotificationSound(notificationVolume / 100);
          toast('Nova compra recebida', {
            description: `${chat.order?.user?.name || chat.order?.user?.email || 'Cliente'} — Pedido #${chat.orderId.slice(-8)}`,
          });
        }
      }
    }
  }, [chatsData?.chats, notificationsEnabled, notificationVolume]);

  useEffect(() => {
    if (!chatsData?.chats?.length) return;

    const allMessages = chatsData.chats.flatMap(c => c.messages || []);
    if (!allMessages.length) return;

    const latest = allMessages.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    if (lastMessageId && latest.id !== lastMessageId && latest.senderId !== 'ADMIN' && notificationsEnabled) {
      playNotificationSound(notificationVolume / 100);
    }

    setLastMessageId(latest.id);
  }, [chatsData?.chats, notificationsEnabled, notificationVolume]);

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
    onSuccess: () => {
      setMessage('');
      setFile(null);
      setShowMacros(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat', selectedChatFull?.orderId] });
    },
    onError: () => toast.error('Erro ao enviar mensagem'),
  });

  const archiveMutation = useMutation({
    mutationFn: (status: string) =>
      chatApi.updateStatus(selectedChatFull?.id || '', { status }),
    onSuccess: () => {
      toast.success('Conversa atualizada');
      setSelectedChat(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
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
    onSuccess: () => {
      toast.success('Status de resolução atualizado');
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
    mutationFn: (payload: { name: string; color: string }) => chatApi.createLabel(payload.name, payload.color),
    onSuccess: () => {
      toast.success('Etiqueta criada');
      setNewLabelName('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-labels'] });
    },
    onError: () => toast.error('Erro ao criar etiqueta'),
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

  const handleSend = async (e?: React.FormEvent, content?: string) => {
    e?.preventDefault();
    const textToSend = content || message;
    if (!textToSend.trim() && !file) return;

    if (file) {
      const url = await handleFileUpload(file);
      if (!url) return;
      sendMutation.mutate({
        content: textToSend.trim(),
        type: url ? 'IMAGE' : 'TEXT',
        fileUrl: url,
      });
    } else {
      sendMutation.mutate({ content: textToSend, type: 'TEXT' });
    }
  };

  const markAsReadMutation = useMutation({
    mutationFn: (chatId: string) => chatApi.markAsRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'chats'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'unread-chats-count'] });
    },
  });

  const handleSelectChat = (chat: Chat) => {
    setSelectedChat(chat);
    if (chat.messages?.[0]?.senderId !== 'ADMIN' && (!chat.lastAdminReadAt || new Date(chat.messages[0].createdAt) > new Date(chat.lastAdminReadAt))) {
      markAsReadMutation.mutate(chat.id);
    }
  };

  const handleToggleLabel = (labelId: string) => {
    const currentLabels = selectedChatFull?.labels?.map(l => l.id) || [];
    const newLabels = currentLabels.includes(labelId)
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    labelMutation.mutate(newLabels);
  };

  const createMacroMutation = useMutation({
    mutationFn: () => chatApi.createMacro(newMacroShortcut, newMacroContent),
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
    mutationFn: () => chatApi.updateMacro(editingMacro?.id || '', newMacroShortcut, newMacroContent),
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

  return (
    <div className="flex h-[850px] flex-col">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="w-80 flex flex-col rounded-md border border-white/5">
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
                      <DialogContent className="max-w-md sm:max-w-[450px] bg-[#0a0a0a] border-white/5">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold text-white">Atalhos</DialogTitle>
                          <div className="text-sm text-zinc-400 mt-1">
                            Crie atalhos para mensagens frequentes. Digite <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-white font-mono text-xs">!</span> no chat para usar.
                          </div>
                        </DialogHeader>

                        <div className="space-y-4 mt-6">
                          <Dialog open={showMacroForm} onOpenChange={(open) => {
                            setShowMacroForm(open);
                            if (!open) { setEditingMacro(null); setNewMacroShortcut(''); setNewMacroContent(''); }
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full h-12 bg-transparent border-white/10 hover:bg-white/5 text-base font-semibold text-white gap-2">
                                <Plus className="h-5 w-5" /> Novo atalho
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0a0a0a] border-white/10">
                              <DialogHeader>
                                <DialogTitle className="text-white">{editingMacro ? 'Editar Atalho' : 'Novo Atalho'}</DialogTitle>
                                <p className="text-xs text-zinc-500">Defina um gatilho começando com ! e a mensagem correspondente.</p>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label className="text-white font-bold text-sm">Nome do atalho</Label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-zinc-500">!</span>
                                    <Input
                                      value={newMacroShortcut}
                                      onChange={(e) => setNewMacroShortcut(e.target.value)}
                                      className="pl-6 bg-white/[0.02] border-white/10"
                                      placeholder="vendas"
                                    />
                                  </div>
                                  <p className="text-[10px] text-zinc-500">Será usado como <span className="text-primary font-bold">!{newMacroShortcut || '...'}</span> no chat</p>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-white font-bold text-sm">Mensagem</Label>
                                  <Textarea
                                    value={newMacroContent}
                                    onChange={(e) => setNewMacroContent(e.target.value)}
                                    placeholder="Digite a mensagem que o atalho irá enviar..."
                                    className="min-h-[120px] resize-none bg-white/[0.02] border-white/10"
                                    maxLength={1000}
                                  />
                                  <p className="text-[10px] text-zinc-500 text-right">{newMacroContent.length}/1000 caracteres</p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => setShowMacroForm(false)}>Cancelar</Button>
                                  <Button
                                    onClick={() => editingMacro ? updateMacroMutation.mutate() : createMacroMutation.mutate()}
                                    disabled={!newMacroShortcut || !newMacroContent}
                                    className="bg-primary hover:bg-primary/90 text-black px-6"
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
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-600 border border-dashed border-white/5 rounded-xl">
                                  <Zap className="h-10 w-10 opacity-20 mb-2" />
                                  <p className="text-sm">Nenhum atalho criado</p>
                                </div>
                              ) : (
                                macros.map((m) => (
                                  <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex-1 min-w-0 pr-4">
                                      <p className="text-base font-bold text-white">!{m.shortcut}</p>
                                      <p className="text-sm text-zinc-500 line-clamp-1 truncate">{m.content}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 border-white/10 hover:bg-white/5 text-white"
                                        onClick={() => handleEditMacro(m)}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-10 w-10 bg-red-600 hover:bg-red-700"
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
                      <DialogContent className="max-w-md sm:max-w-[450px] bg-[#0a0a0a] border-white/5">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold text-white">Etiquetas</DialogTitle>
                          <p className="text-sm text-zinc-400 mt-1">Organize chats por reembolso, não entregue, etc.</p>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div className="space-y-3 rounded-md border border-white/5 p-4">
                            <Label className="text-sm font-medium text-white">Nova etiqueta</Label>
                            <Input placeholder="Nome da etiqueta" value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)} />
                            <div className="flex gap-2">
                              {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                                <button key={color} onClick={() => setNewLabelColor(color)} className={cn('h-8 w-8 rounded-full border-2', newLabelColor === color ? 'border-white' : 'border-transparent')} style={{ backgroundColor: color }} />
                              ))}
                            </div>
                            <Button onClick={() => createLabelMutation.mutate({ name: newLabelName, color: newLabelColor })} disabled={!newLabelName} className="w-full">Criar etiqueta</Button>
                          </div>
                          <ScrollArea className="max-h-[250px]">
                            <div className="space-y-2">
                              {allLabels.length === 0 ? (
                                <p className="text-sm text-zinc-600 text-center py-6">Nenhuma etiqueta criada</p>
                              ) : allLabels.map((l) => (
                                <div key={l.id} className="flex items-center justify-between p-3 rounded-md bg-white/[0.03] border border-white/5">
                                  <span className="px-2 py-1 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: l.color }}>{l.name}</span>
                                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => deleteLabelMutation.mutate(l.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </DialogContent>
                    </Dialog>
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

              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onValueChange={(v: 'ALL' | 'OPEN' | 'ARCHIVED') => setStatusFilter(v)}>
                  <SelectTrigger className="bg-white/[0.02] border border-white/10 text-xs h-8 rounded-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className='bg-card border border-white/5 w-auto'>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="OPEN">Ativos</SelectItem>
                    <SelectItem value="ARCHIVED">Arquivados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={labelFilter} onValueChange={setLabelFilter}>
                  <SelectTrigger className="bg-white/[0.02] border border-white/10 text-xs h-8 rounded-sm">
                    <SelectValue placeholder="Etiqueta" />
                  </SelectTrigger>
                  <SelectContent className='bg-card border border-white/5 w-auto'>
                    <SelectItem value="ALL">Todas etiquetas</SelectItem>
                    {allLabels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-2 space-y-1">
              {chats.map((c) => {
                const unread = getUnreadCount(c);
                const delivered = isOrderFullyDelivered(c);
                const isSelected = selectedChat?.id === c.id;
                const isOnline = checkIsOnline(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectChat(c)}
                    className={cn(
                      'w-full select-none cursor-pointer flex items-start gap-3 rounded-md p-3 transition-all relative border',
                      'before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full',
                      c.isResolved ? 'before:bg-emerald-500' : 'before:bg-[#fcb64c]',
                      c.isResolved
                        ? isSelected
                          ? 'bg-linear-to-r from-emerald-500/15 to-emerald-500/0 border border-emerald-500/50'
                          : 'bg-linear-to-r from-emerald-500/5 to-emerald-500/0 border-b border-white/5'
                        : isSelected
                          ? 'bg-linear-to-r from-[#fcb64c]/15 to-[#fcb64c]/0 border border-[#fcb64c]/50'
                          : 'bg-linear-to-r from-[#fcb64c]/5 to-[#fcb64c]/0 border-b border-white/5'
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
                            <div className="absolute -top-0.5 -left-0.5 bg-blue-500 text-white font-bold p-0.5 rounded-full border-2 border-black">
                              <PiCheckCircleBold className="h-4 w-4 text-[#1a1a1a]" />
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
                            <div className="absolute -top-0.5 -left-0.5 bg-[#fcb64c] text-white font-bold p-0.5 rounded-full border-2 border-black">
                              <PiClockCountdownBold className="h-4 w-4 text-[#1a1a1a]" />
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

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-white text-sm truncate">
                            {c.order?.user?.name || c.order?.user?.email || 'Cliente'}
                          </span>
                          {c.labels && c.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.labels.slice(0, 2).map((l) => (
                                <span key={l.id} className="text-[8px] px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: l.color }}>{l.name}</span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className='flex flex-row items-end gap-1.5 shrink-0'>
                          <span className="text-[10px] text-muted-foreground">
                            {c.updatedAt
                              ? format(new Date(c.updatedAt), 'HH:mm', { locale: ptBR })
                              : 'agora'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className='flex flex-row items-center text-sm text-muted-foreground line-clamp-1 truncate max-w-[210px] gap-1'>
                          {c.messages?.[0] && (
                            <>
                              <span className={cn(unread > 0 && "text-white font-medium")}>
                                {getPreviewText(c.messages[0].content, c.messages[0].type)}
                              </span>
                            </>
                          )}
                        </div>

                        <div className='flex items-end'>
                          {unread > 0 && (
                            <div className='flex items-center justify-center text-xs font-medium text-white h-5 min-w-5 px-1 rounded-full bg-emerald-500'>
                              {unread > 99 ? '99+' : unread}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div
          className="flex-1 flex flex-col rounded-md border border-white/5 relative"
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
            const dropped = e.dataTransfer.files?.[0];
            if (dropped?.type.startsWith('image/')) setFile(dropped);
          }}
        >
          {isDraggingFile && selectedChatFull && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-md pointer-events-none">
              <p className="text-xl font-medium text-white">Solte a imagem para enviar 📷</p>
            </div>
          )}
          {selectedChatFull ? (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-muted-foreground">
                      {selectedChatFull.order?.user?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-black flex items-center justify-center shadow-md",
                      checkIsOnline(selectedChatFull) ? "bg-emerald-500" : "bg-zinc-500"
                    )}>
                      {checkIsOnline(selectedChatFull) && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{selectedChatFull.order?.user?.name || 'Cliente'}</h3>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border leading-none font-medium flex items-center",
                        checkIsOnline(selectedChatFull)
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                      )}>
                        {checkIsOnline(selectedChatFull) ? "Online" : "Offline"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Pedido <span className="font-mono">#{selectedChatFull.orderId}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={cn(selectedChatFull.rating ? 'rounded py-1 px-4 bg-yellow-500/10 text-yellow-400' : 'rounded py-1 px-4 bg-blue-500/10 text-blue-500')}>
                    {selectedChatFull.rating ? (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn('h-3 w-3', i < (selectedChatFull.rating || 0) ? 'fill-current' : 'fill-none')} />
                        ))}
                      </div>
                    ) : 'Sem avaliação'}
                  </Badge>

                  <Button
                    size="sm"
                    onClick={() => resolvedMutation.mutate(!selectedChatFull.isResolved)}
                    className={cn(
                      'rounded',
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
                    size="sm"
                    onClick={() => archiveMutation.mutate(selectedChatFull.status === 'ARCHIVED' ? 'OPEN' : 'ARCHIVED')}
                    className="rounded bg-white/5 hover:bg-white/10"
                  >
                    {selectedChatFull.status === 'ARCHIVED' ? (
                      <><RotateCcw className="h-4 w-4 mr-2" /> Desarquivar</>
                    ) : (
                      <><Archive className="h-4 w-4 mr-2" /> Arquivar</>
                    )}
                  </Button>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
                {selectedChatFull.messages.map((msg) => {
                  const orderApproved = msg.type === 'ORDER_APPROVED' ? parseOrderApproved(msg.content) : null;
                  if (orderApproved) {
                    return (
                      <div key={msg.id} className="flex flex-col items-end">
                        <OrderApprovedCard payload={orderApproved} />
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    );
                  };

                  const delivery = msg.type === 'DELIVERY' ? parseDelivery(msg.content) : null;
                  if (delivery) {
                    return (
                      <div key={msg.id} className="flex flex-col items-end">
                        <DeliveryCard payload={delivery} />
                        <span className="text-[10px] text-muted-foreground mt-1">
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    );
                  };

                  const isSystem = msg.senderId === 'SYSTEM' || msg.type === 'AUTOMATED';
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex flex-col items-end">
                        <div className="bg-blue-500/10 text-blue-400 text-xs rounded px-4 py-2 max-w-[60%] whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    );
                  };

                  const isAdmin = msg.senderId === 'ADMIN';
                  if (isAdmin) {
                    return (
                      <div key={msg.id} className="w-full flex flex-row justify-end">
                        <div className="flex flex-col items-end gap-1" style={{ maxWidth: '30%' }}>
                          <div className="bg-blue-500/40 text-white text-sm rounded-sm p-2">
                            {msg.fileUrl && (
                              <img
                                src={formatFileUrl(msg.fileUrl)}
                                alt="Anexo"
                                className="rounded-sm mb-1 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setLightboxImage(formatFileUrl(msg.fileUrl!))}
                              />
                            )}
                            {msg.content && <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>}
                          </div>
                          <span className="text-[10px] text-muted-foreground pr-1">
                            {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    );
                  };

                  const initial = selectedChatFull.order?.user?.name?.[0]?.toUpperCase() ?? 'C';
                  return (
                    <div key={msg.id} className="w-full flex flex-row justify-start items-end gap-2">
                      <div className="flex flex-col items-start gap-1" style={{ maxWidth: '30%' }}>
                        <div className="bg-[#c1c1c1]/70 text-black text-sm rounded-sm p-2">
                          {msg.fileUrl && (
                            <img
                              src={formatFileUrl(msg.fileUrl)}
                              alt="Anexo"
                              className="rounded-md mb-1 max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxImage(formatFileUrl(msg.fileUrl!))}
                            />
                          )}
                          <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>
                        </div>
                        <span className="text-[10px] text-zinc-500 pl-1">
                          {format(new Date(msg.createdAt), 'HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="relative">
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
                    file={file}
                    onFileChange={setFile}
                    onSend={() => handleSend()}
                    isSending={sendMutation.isPending}
                    placeholder="Digite sua mensagem ou use !atalho..."
                    showMacroHint
                    onMacroTrigger={setShowMacros}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 gap-4">
              <div className="h-20 w-20 rounded-full border border-white/5 bg-white/[0.02] flex items-center justify-center">
                <MessageSquareQuote className="h-10 w-10 opacity-20" />
              </div>
              <p className="text-sm">Selecione uma conversa para começar</p>
            </div>
          )}
        </div>

        {selectedChatFull && (
          <ChatOrderPanel
            chat={selectedChatFull}
            allLabels={allLabels}
            onToggleLabel={handleToggleLabel}
          />
        )}

        <ChatImageLightbox
          src={lightboxImage}
          open={!!lightboxImage}
          onOpenChange={(open) => !open && setLightboxImage(null)}
        />
      </div>
    </div>
  );
}