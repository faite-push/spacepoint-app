'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { DeliveryType } from '@/lib/admin-api';

interface DeliverProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  pendingCount: number;
  deliveryType: DeliveryType;
  onConfirm: (payload: { content: string; mode: 'text' | 'lines'; useStock: boolean }) => void;
  isLoading?: boolean;
  editMode?: boolean;
  initialContent?: string;
  title?: string;
}

export function DeliverProductDialog({
  open,
  onOpenChange,
  productName,
  pendingCount,
  deliveryType,
  onConfirm,
  isLoading = false,
  editMode = false,
  initialContent = '',
  title,
}: DeliverProductDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<'text' | 'lines'>('text');
  const [useStock, setUseStock] = useState(false);

  const isAutomatic = deliveryType === 'automatic_lines';
  const dialogTitle = title || (editMode ? 'Editar todos' : 'Entregar produto');

  React.useEffect(() => {
    if (open) {
      setContent(initialContent);
      setMode(editMode ? 'lines' : 'text');
      setUseStock(isAutomatic);
    }
  }, [open, initialContent, editMode, isAutomatic]);

  const handleConfirm = () => {
    onConfirm({ content, mode, useStock: isAutomatic || useStock });
  };

  const lines = content.split('\n').filter((l) => l.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{editMode ? 'Edite todos os produtos' : `Adicione os produtos que deseja entregar (${pendingCount} pendente${pendingCount !== 1 ? 's' : ''})`}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!editMode && isAutomatic && (
            <label className="flex items-start gap-3 rounded-md border border-white/10 p-4 cursor-pointer hover:bg-white/[0.02]">
              <input
                type="checkbox"
                checked={useStock}
                onChange={(e) => setUseStock(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20"
              />
              <div>
                <p className="text-sm font-medium text-white">Enviar do Estoque</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Ao selecionar, o produto será removido do estoque e será entregue ao cliente
                </p>
              </div>
            </label>
          )}

          {!isAutomatic && (
            <div className="space-y-2">
              <Label className="text-white text-sm">Tipo de Entrega</Label>
              <div className="flex rounded-md border border-white/10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMode('text')}
                  className={cn('flex-1 py-2.5 cursor-pointer text-sm font-medium transition-colors', mode === 'text' ? 'bg-white/10 text-white' : 'text-muted-foreground')}
                >
                  Texto
                </button>
                <button
                  type="button"
                  onClick={() => setMode('lines')}
                  className={cn('flex-1 py-2.5 cursor-pointer text-sm font-medium transition-colors', mode === 'lines' ? 'bg-white/10 text-white' : 'text-muted-foreground')}
                >
                  Linhas
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 mt-1">
            {mode === 'lines' ? (
              <div className="flex rounded-md border border-white/10 overflow-hidden min-h-[160px]">
                <div className="bg-white/[0.03] px-3 py-3 text-xs text-zinc-600 font-mono select-none border-r border-white/10">
                  {lines.map((_, i) => (
                    <div key={i} className="leading-6">{i + 1}</div>
                  ))}
                  {lines.length === 0 && <div className="leading-6">1</div>}
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Digite um produto por linha..."
                  className="flex-1 min-h-[160px] border-0 bg-transparent resize-none rounded-none font-mono"
                />
              </div>
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Digite o produto a ser entregue"
                className="min-h-[120px] bg-white/[0.02] border-white/10"
              />
            )}
            {mode === 'lines' && lines.length > pendingCount && (
              <p className="text-xs text-amber-400">
                Apenas {pendingCount} linha(s) serão entregues (quantidade pendente).
              </p>
            )}
          </div>

          <Button
            className="w-full h-10 bg-blue-500 hover:bg-blue-500/80 text-black font-medium"
            onClick={handleConfirm}
            disabled={isLoading || (!isAutomatic && !content.trim())}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
