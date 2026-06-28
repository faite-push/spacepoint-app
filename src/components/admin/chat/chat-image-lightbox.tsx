'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ChatImageLightboxProps {
  src: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatImageLightbox({ src, open, onOpenChange }: ChatImageLightboxProps) {
  if (!src) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-2 bg-black/95 border-white/10">
        <img
          src={src}
          alt="Imagem expandida"
          className="w-full max-h-[80vh] object-contain rounded-md"
        />
      </DialogContent>
    </Dialog>
  );
}
