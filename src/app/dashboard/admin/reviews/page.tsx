'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Star, MessageSquareQuote } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { chatApi } from '@/lib/admin-api';
import { cn } from '@/lib/utils';

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'chat-reviews', page],
    queryFn: () => chatApi.listReviews({ page }),
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Avaliações de Atendimento</h1>
          <p className="text-sm text-muted-foreground">Feedback dos clientes após o chat de entrega</p>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-3xl font-bold text-yellow-400 flex items-center gap-1 justify-end">
              <Star className="h-7 w-7 fill-current" />
              {data.averageRating.toFixed(1)}
            </p>
            <p className="text-xs text-zinc-500">{data.total} avaliação(ões)</p>
          </div>
        )}
      </div>

      <div className="rounded-md border border-white/5 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-200px)]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data?.reviews.map((review) => {
                const tags = Array.isArray(review.ratingTags) ? review.ratingTags as string[] : [];
                const customer = review.isAnonymousRating
                  ? 'Anônimo'
                  : (review.order?.user?.name || review.order?.user?.email || 'Cliente');

                return (
                  <div key={review.id} className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{customer}</p>
                        <p className="text-xs text-zinc-500">
                          Pedido #{review.orderId.slice(-8)} · {format(new Date(review.updatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn('h-4 w-4', s <= (review.rating || 0) ? 'text-yellow-400 fill-current' : 'text-zinc-700')}
                          />
                        ))}
                      </div>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    )}

                    {review.ratingComment && (
                      <p className="text-sm text-zinc-300 bg-white/[0.03] rounded-md p-3 border border-white/5">
                        {review.ratingComment}
                      </p>
                    )}

                    <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                      <Link href={`/dashboard/admin/chats/chat/${review.id}`}>
                        <MessageSquareQuote className="h-3.5 w-3.5 mr-1.5" />
                        Ver chat
                      </Link>
                    </Button>
                  </div>
                );
              })}
              {!data?.reviews.length && (
                <p className="p-8 text-center text-zinc-500">Nenhuma avaliação ainda</p>
              )}
            </div>
          )}
        </ScrollArea>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="text-sm text-zinc-400 self-center">{page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}
    </div>
  );
}
