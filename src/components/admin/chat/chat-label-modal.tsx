'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ReferenceSelectorDialog, type Reference } from '@/components/admin/coupons/reference-selector-dialog';
import type { ChatLabel } from '@/lib/admin-api';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#f87171', '#fb923c',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#4ade80', '#34d399',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#60a5fa', '#818cf8',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#c084fc',
  '#71717a', '#a1a1aa', '#52525b', '#27272a', '#09090b', '#3f3f46',
  '#fda4af', '#fca5a5', '#fdba74', '#fde047', '#bef264', '#86efac',
  '#a78bfa', '#f472b6', '#fb7185', '#94a3b8'
];

export interface ChatLabelFormValues {
  name: string;
  color: string;
  references: { type: 'PRODUCT' | 'CATEGORY' | 'VARIANT'; referenceId: string }[];
}

interface ChatLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: ChatLabel | null;
  isSubmitting?: boolean;
  onSubmit: (values: ChatLabelFormValues) => void;
}

export function ChatLabelModal({
  open,
  onOpenChange,
  label,
  isSubmitting = false,
  onSubmit,
}: ChatLabelModalProps) {
  const isEditing = !!label;
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [references, setReferences] = useState<Reference[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (label) {
      setName(label.name);
      setColor(label.color);
      setReferences(
        (label.references || []).map((r) => ({
          type: r.type,
          referenceId: r.referenceId,
          label: r.label || r.referenceId,
        }))
      );
    } else {
      setName('');
      setColor('#3b82f6');
      setReferences([]);
    }
  }, [open, label]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      color,
      references: references.map((r) => ({ type: r.type, referenceId: r.referenceId })),
    });
  };

  const productCount = references.filter((r) => r.type === 'PRODUCT').length;
  const categoryCount = references.filter((r) => r.type === 'CATEGORY').length;
  const variantCount = references.filter((r) => r.type === 'VARIANT').length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar etiqueta' : 'Criação'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Atualize a etiqueta e suas referências de produto.'
                : 'Crie uma nova etiqueta para organizar os chats.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da etiqueta</Label>
              <Input
                placeholder="Nome da etiqueta"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Cor da etiqueta</Label>
              <p className="text-xs text-zinc-500">Cor de exibição da etiqueta.</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'h-8 w-8 rounded-full cursor-pointer border-2 transition-transform hover:scale-105',
                      color === c ? 'border-white' : 'border-transparent'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Referências de produto</Label>
              <p className="text-xs text-zinc-500">
                A etiqueta será aplicada automaticamente ao chat quando o cliente comprar um produto, categoria ou variante vinculada.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSelectorOpen(true)}
                className="w-full flex items-center justify-center py-6 px-4 rounded-md border border-dashed border-white/15 bg-card hover:bg-white/[0.02] transition-all"
              >
                <span className="text-sm font-light text-white">Selecionar referências</span>
              </Button>
              {references.length > 0 && (
                <p className="text-xs text-white/70">
                  {categoryCount > 0 && (
                    <span>
                      <span className="text-white font-medium">{categoryCount}</span> categoria(s){' '}
                    </span>
                  )}
                  {productCount > 0 && (
                    <span>
                      <span className="text-white font-medium">{productCount}</span> produto(s){' '}
                    </span>
                  )}
                  {variantCount > 0 && (
                    <span>
                      <span className="text-white font-medium">{variantCount}</span> variante(s)
                    </span>
                  )}
                  selecionado(s)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <div className="flex w-full gap-3">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                size="lg"
                disabled={isSubmitting}
                className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                size="lg"
                disabled={!name.trim() || isSubmitting}
                className="flex-1">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReferenceSelectorDialog
        open={isSelectorOpen}
        onOpenChange={setIsSelectorOpen}
        initialReferences={references}
        onConfirm={setReferences}
      />
    </>
  );
}
