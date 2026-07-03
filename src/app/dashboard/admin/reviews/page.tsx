'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Search, Settings, Star, Globe, Clock, Trash2, X, Plus, Check, } from 'lucide-react';

import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogHeader } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { chatApi, siteSettingsApi, type ChatReview, type ReviewsSettings } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

const DEFAULT_SETTINGS: ReviewsSettings = {
  enabled: true,
  showOnHomepage: true,
  homeTitle: 'Depoimentos de clientes',
  homeSubtitle: 'Experiências reais de quem já confiou na nossa loja',
  autoPublish: false,
  allowScreenshots: false,
  opinionTags: ['Muito bom', 'Entrega rápida', 'Confiável', 'Voltarei a comprar', 'Ótimo suporte'],
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn('h-4 w-4', s <= rating ? 'fill-[#fcb64c] text-[#fcb64c]' : 'text-zinc-700')} />
      ))}
    </div>
  );
}

function ReviewStatusBadge({ status }: { status?: string | null }) {
  if (status === 'PUBLISHED') {
    return <Badge className="bg-transparent text-blue-500 border-none"><Globe className="h-3 w-3 mr-1" />Publicado</Badge>;
  }
  if (status === 'ARCHIVED') {
    return <Badge className="bg-transparent text-muted-foreground border-none"><Globe className="h-3 w-3 mr-1" />Arquivado</Badge>;
  }
  return <Badge className="bg-transparent text-[#fcb74f] border-none"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
};

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [stars, setStars] = useState('ALL');
  const [selected, setSelected] = useState<ChatReview | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [sellerResponse, setSellerResponse] = useState('');
  const [newTag, setNewTag] = useState('');
  const [settingsForm, setSettingsForm] = useState<ReviewsSettings>(DEFAULT_SETTINGS);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'chat-reviews', page, search, status, stars],
    queryFn: () => chatApi.listReviews({
      page,
      search: search || undefined,
      status: status !== 'ALL' ? status : undefined,
      minRating: stars !== 'ALL' ? Number(stars) : undefined,
    }),
  });

  const { data: siteData } = useQuery({
    queryKey: ['admin', 'site-settings'],
    queryFn: () => siteSettingsApi.get(),
  });

  const currentSettings = useMemo(() => ({
    ...DEFAULT_SETTINGS,
    ...(siteData?.config?.reviewsSettings || {}),
  }), [siteData?.config?.reviewsSettings]);

  const updateMutation = useMutation({
    mutationFn: (payload: { reviewStatus?: 'PENDING' | 'PUBLISHED' | 'ARCHIVED'; sellerResponse?: string | null }) =>
      chatApi.updateReview(selected!.id, payload),
    onSuccess: (updated) => {
      setSelected(updated);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-reviews'] });
      toast.success('Avaliação atualizada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => chatApi.deleteReview(selected!.id),
    onSuccess: () => {
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'chat-reviews'] });
      toast.success('Avaliação excluída');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: () => siteSettingsApi.update({ reviewsSettings: settingsForm }),
    onSuccess: () => {
      toast.success('Configurações salvas');
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-settings'] });
      setSettingsOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openReview = (review: ChatReview) => {
    setSelected(review);
    setSellerResponse(review.sellerResponse || '');
  };

  const openSettings = () => {
    setSettingsForm(currentSettings);
    setSettingsOpen(true);
  };

  const product = selected?.order?.items?.[0]?.product;
  const customerEmail = selected?.isAnonymousRating ? 'Cliente anônimo' : (selected?.order?.user?.email || selected?.order?.user?.name || 'Cliente');

  return (
    <div className="space-y-4">
      <div className="hidden md:flex absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="hidden md:flex absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="hidden md:flex absolute bottom-0 right-[10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="hidden md:flex absolute bottom-0 left-[10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div>
        <h1 className="text-2xl font-bold text-white">Avaliações</h1>
        <p className="text-muted-foreground">Gerencie e organize suas avaliações</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-2 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Pesquisar"
            className="pl-10"
          />
        </div>

        <div className='flex flex-row gap-2'>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Status</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
              <SelectItem value="ARCHIVED">Arquivado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stars} onValueChange={(v) => { setStars(v); setPage(1); }}>
            <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Estrelas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Estrelas</SelectItem>
              {[5, 4, 3, 2, 1].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} estrelas</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="w-10 h-10" onClick={openSettings}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.reviews.map((review) => {
            const tags = Array.isArray(review.ratingTags) ? review.ratingTags as string[] : [];
            const email = review.isAnonymousRating ? 'Cliente anônimo' : (review.order?.user?.email || review.order?.user?.name || 'Cliente');

            return (
              <button key={review.id} type="button" onClick={() => openReview(review)} className="rounded-md cursor-pointer border border-white/5 bg-card/70 p-4 text-left transition-all duration-300 hover:border-white/10">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 select-none pointer-events-none">
                      {review.order?.user?.image ? <AvatarImage src={review.order.user.image} /> : null}
                      <AvatarFallback>{email[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{email}</p>
                      <Stars rating={review.rating || 0} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Comentário</p>
                    {review.ratingComment ? (
                      <p className="max-w-auto rounded bg-white/5 px-2 py-1 text-sm text-muted-foreground">{review.ratingComment}</p>
                    ) : tags.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded bg-white/5 px-2 py-1 text-xs text-zinc-300">{tag}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="max-w-auto rounded bg-white/5 px-2 py-1 text-sm text-muted-foreground">Sem comentário</p>
                    )}
                  </div>

                  <div className="rounded bg-black/20 p-3">
                    <p className="mb-1 text-xs text-zinc-500">Resposta</p>
                    <p className="text-sm text-zinc-400">
                      {review.sellerResponse || 'Não há resposta do vendedor'}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(review.updatedAt), "dd MMM HH:mm", { locale: ptBR })}
                  </span>
                  <ReviewStatusBadge status={review.reviewStatus || 'PENDING'} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && !data?.reviews.length && (
        <p className="py-16 text-center text-zinc-500">Nenhuma avaliação encontrada</p>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="self-center text-sm text-zinc-400">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Avaliação</DialogTitle>
                <DialogDescription>Visualização da avaliação do cliente</DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <div className="rounded-md border border-white/5 bg-black/[0.02] p-3">
                  <p className="font-medium text-white">
                    {selected.reviewStatus === 'PUBLISHED' ? 'Avaliação Publicada' : 'Aguardando Aprovação'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selected.reviewStatus === 'PUBLISHED'
                      ? 'Avaliação publicada no site e disponível para outros clientes visualizarem.'
                      : 'Avaliação aguardando aprovação para ser publicada'}
                  </p>
                  <Button
                    className={cn('mt-2 text-xs rounded-sm', selected.reviewStatus === 'PUBLISHED' ? 'bg-white text-black hover:bg-white/80' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20')}
                    onClick={() => updateMutation.mutate({
                      reviewStatus: selected.reviewStatus === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED',
                    })}
                    disabled={updateMutation.isPending}
                  >
                    <Globe className="h-3 w-3" />
                    {selected.reviewStatus === 'PUBLISHED' ? 'Arquivar Avaliação' : 'Publicar Avaliação'}
                  </Button>
                </div>

                <div className="flex items-center gap-3 select-none pointer-events-none">
                  <Avatar><AvatarFallback>{customerEmail[0]?.toUpperCase()}</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">{customerEmail}</p>
                    <Stars rating={selected.rating || 0} />
                  </div>
                </div>

                <div>
                  <Label>Comentário</Label>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.ratingComment || ''}</p>
                  {Array.isArray(selected.ratingTags) && (selected.ratingTags as string[]).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(selected.ratingTags as string[]).map((tag) => (
                        <span key={tag} className="rounded bg-white/2 px-2 py-1 text-xs text-white/60">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label>Resposta</Label>
                  <Textarea
                    value={sellerResponse}
                    onChange={(e) => setSellerResponse(e.target.value)}
                    placeholder="Sua mensagem..."
                    className="mt-1 min-h-[100px] border border-white/5 max-h-[100px] resize-none"
                  />
                </div>

                {product && (
                  <div className="flex items-center gap-3 rounded-lg border border-white/5 p-3">
                    <div className="h-12 w-12 rounded bg-white/5 shrink-0">
                      <Avatar className="h-12 w-12 rounded select-none pointer-events-none">
                        {product.imageUrl ? <AvatarImage src={product.imageUrl} className="object-cover rounded" /> : null}
                        <AvatarFallback>{product.name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{product.name}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {format(new Date(selected.updatedAt), "dd MMM HH:mm", { locale: ptBR })}
                  </span>
                  <ReviewStatusBadge status={selected.reviewStatus || 'PENDING'} />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => updateMutation.mutate({ sellerResponse: sellerResponse.trim() || null })}
                    disabled={updateMutation.isPending}
                    className="flex-1 bg-white text-black hover:bg-white/80"
                    size="lg"
                  >
                    Salvar
                  </Button>
                  <Button
                    className="flex-1 bg-[#ff493f] text-white hover:bg-[#ff493f]/80"
                    size="lg"
                    onClick={() => deleteMutation.mutate()}
                    disabled={deleteMutation.isPending}>
                    Excluir
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurações de avaliações</DialogTitle>
            <DialogDescription>Configure as avaliações de acordo com suas necessidades</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex bg-card border border-white/5 gap-2 p-1 rounded-md">
              <Button
                type="button"
                className={cn('flex-1 items-center justify-center rounded-sm px-6 py-2 text-sm transition-colors', settingsForm.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-500/3 text-emerald-500/30')}
                onClick={() => setSettingsForm((s) => ({ ...s, enabled: true }))}
              >
                Ativo
              </Button>
              <Button
                type="button"
                className={cn('flex-1 items-center justify-center rounded-sm px-6 py-2 text-sm transition-colors', !settingsForm.enabled ? 'bg-red-500/10 text-red-500' : 'bg-red-500/3 text-red-500/30')}
                onClick={() => setSettingsForm((s) => ({ ...s, enabled: false }))}
              >
                Desativado
              </Button>
            </div>

            <div className="flex items-center p-3 gap-4 rounded-md border border-white/5 bg-card">
              <Toggle
                size="sm"
                pressed={settingsForm.showOnHomepage}
                onPressedChange={(v) => setSettingsForm((s) => ({ ...s, showOnHomepage: v }))}
              >
                {settingsForm.showOnHomepage ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Toggle>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Carrossel na home</Label>
                <p className="text-xs text-zinc-500">Exibe depoimentos dos clientes na página inicial</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Título da seção</Label>
                <Input
                  value={settingsForm.homeTitle}
                  onChange={(e) => setSettingsForm((s) => ({ ...s, homeTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm">Subtítulo</Label>
                <Input
                  value={settingsForm.homeSubtitle}
                  onChange={(e) => setSettingsForm((s) => ({ ...s, homeSubtitle: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center p-3 gap-4 rounded-md border border-white/5 bg-card">
              <Toggle
                size="sm"
                pressed={settingsForm.autoPublish}
                onPressedChange={(v) => setSettingsForm((s) => ({ ...s, autoPublish: v }))}
              >
                {settingsForm.autoPublish ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Toggle>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Auto Publicar</Label>
                <p className="text-xs text-zinc-500">Avaliações serão publicadas automaticamente</p>
              </div>
            </div>

            <div className="flex items-center p-3 gap-4 rounded-md border border-white/5 bg-card">
              <Toggle
                size="sm"
                pressed={settingsForm.allowScreenshots}
                onPressedChange={(v) => setSettingsForm((s) => ({ ...s, allowScreenshots: v }))}
              >
                {settingsForm.allowScreenshots ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              </Toggle>
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Permitir Prints</Label>
                <p className="text-xs text-zinc-500">Permite que os clientes enviem prints na avaliação</p>
              </div>
            </div>

            <div className='rounded-md border border-white/5 bg-card'>
              <div className='px-4 py-3 border-b border-white/5'>
                <Label className="text-sm font-medium">Opiniões de avaliações</Label>
                <p className="text-xs text-zinc-500">Gerencie as opiniões que podem ser aplicadas aos feedbacks</p>
              </div>

              <div className="flex flex-wrap gap-2 px-4 py-2">
                {settingsForm.opinionTags.map((tag) => (
                  <span key={tag} className="inline-flex select-none items-center gap-1 rounded-sm bg-blue-500/10 text-blue-500 px-3 py-1 text-xs">
                    {tag}
                    <button type="button" onClick={() => setSettingsForm((s) => ({ ...s, opinionTags: s.opinionTags.filter((t) => t !== tag) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-sm bg-white/5 text-white hover:bg-white/10 px-4 py-1 text-xs transition-colors duration-200"
                  onClick={() => setAddTagOpen(true)}
                >
                  <Plus className="h-3 w-3" />Adicionar
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" variant="default" onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>Salvar</Button>
              <Button className="flex-1" variant="ghost" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addTagOpen} onOpenChange={setAddTagOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar opinião</DialogTitle>
            <DialogDescription>Adicione uma nova opinião para as avaliações</DialogDescription>
          </DialogHeader>
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Nova opinião"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              const tag = newTag.trim();
              if (!tag) return;
              setSettingsForm((s) => ({ ...s, opinionTags: [...s.opinionTags, tag] }));
              setNewTag('');
              setAddTagOpen(false);
            }}
          />
          <DialogFooter className="flex gap-2">
            <Button
              className="flex-1"
              variant="default"
              onClick={() => {
                const tag = newTag.trim();
                if (!tag) return;
                setSettingsForm((s) => ({ ...s, opinionTags: [...s.opinionTags, tag] }));
                setNewTag('');
                setAddTagOpen(false);
              }}
            >
              Adicionar
            </Button>
            <Button
              className="flex-1"
              variant="ghost"
              onClick={() => {
                setNewTag('');
                setAddTagOpen(false);
              }}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}