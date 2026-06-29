'use client';

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const RATING_LABELS = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

const QUICK_TAGS = [
  'Muito bom',
  'Entrega rápida',
  'Confiável',
  'Voltarei a comprar',
  'Ótimo suporte',
];

interface ChatRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { rating: number; ratingComment?: string; ratingTags: string[]; isAnonymous: boolean }) => void;
  isSubmitting?: boolean;
}

export function ChatRatingDialog({ open, onOpenChange, onSubmit, isSubmitting }: ChatRatingDialogProps) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      rating,
      ratingComment: comment.trim() || undefined,
      ratingTags: selectedTags,
      isAnonymous,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[#111] border-white/10 p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Avalie sua experiência</DialogTitle>

        <div className="p-6 pb-4 border-b border-white/5 relative">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 text-zinc-500 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold text-white">Avalie sua experiência</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Avalie agora e ajude a deixar o serviço cada vez melhor.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'h-10 w-10 transition-colors',
                      (hover || rating) >= star
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-zinc-600'
                    )}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-white">
              {RATING_LABELS[(hover || rating) - 1]}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-zinc-400">Escolha as opções abaixo</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Deixe seu comentário</label>
            <div className="relative">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 256))}
                placeholder="Escreva seu comentário (opcional)"
                className="min-h-[100px] bg-white/5 border-white/10 resize-none pr-16"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-zinc-500">
                {comment.length} / 256
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAnonymous(!isAnonymous)}
            className="flex items-start gap-3 w-full text-left rounded-md border border-white/10 p-3 hover:bg-white/[0.02] transition-colors"
          >
            <div
              className={cn(
                'mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0',
                isAnonymous ? 'bg-red-500 border-red-500' : 'border-zinc-600 bg-transparent'
              )}
            >
              {isAnonymous && <X className="h-3 w-3 text-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Avaliação Anônima</p>
              <p className="text-xs text-zinc-500">Enviar avaliação de forma anônima</p>
            </div>
          </button>
        </div>

        <div className="p-6 pt-0">
          <Button
            className="w-full h-12 text-base font-semibold bg-violet-600 hover:bg-violet-700"
            onClick={handleSubmit}
            disabled={isSubmitting || rating < 1}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
