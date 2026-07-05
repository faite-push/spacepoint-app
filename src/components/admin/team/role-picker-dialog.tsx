'use client';

import { useEffect, useState } from 'react';
import { Search, Shield } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type RoleOption = {
  id: string;
  name: string;
  isProtected?: boolean;
};

interface RolePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleOption[];
  selectedRoleId?: string | null;
  title?: string;
  onSelect: (roleId: string) => void;
}

export function RolePickerDialog({
  open,
  onOpenChange,
  roles,
  selectedRoleId,
  title = 'Atribuir cargo',
  onSelect,
}: RolePickerDialogProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Selecione um cargo para atribuir ao cliente</DialogDescription>
        </DialogHeader>

        <div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Pesquisar cargo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-md">
            {filtered.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  onSelect(role.id);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 text-left text-sm transition-colors hover:bg-white/5',
                  selectedRoleId === role.id ? 'bg-white/10 text-primary' : 'text-zinc-300'
                )}
              >
                <Shield className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
                <span className="truncate">{role.name}</span>
                {selectedRoleId === role.id && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-zinc-500">Nenhum cargo encontrado</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
