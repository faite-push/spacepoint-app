'use client';

import React, { useState } from 'react';
import { Check, Star, X } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Avalie sua experiência</DialogTitle>
          <DialogDescription>Avalie agora e ajude a deixar o serviço cada vez melhor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(star)}
                  className="p-1 cursor-pointer transition-transform hover:scale-110"
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

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Escolha as opções abaixo</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1.5 rounded-sm text-xs font-medium transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-primary/10 text-primary'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  )}
                >
                  {tag}
                </Button>
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
                className="min-h-[100px] resize-none pr-16"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-zinc-500">
                {comment.length} / 256
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full rounded-md border border-white/10 p-3">
            <Toggle
              pressed={isAnonymous}
              onPressedChange={setIsAnonymous}
              variant="default"
              size="sm"
              className="h-8 w-8 rounded-sm"
              aria-label="Enviar avaliação de forma anônima"
            >
              {isAnonymous ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </Toggle>
            <div>
              <p className="text-sm font-medium text-white">Avaliação Anônima</p>
              <p className="text-xs text-zinc-500">Enviar avaliação de forma anônima</p>
            </div>
          </div>
        </div>

        <div className="pt-0">
          <Button
            className="w-full h-12"
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
