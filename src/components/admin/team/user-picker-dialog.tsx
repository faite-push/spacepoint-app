'use client';

import { useEffect, useState } from 'react';
import { Search, ScanFace } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type UserOption = {
  id: string;
  name?: string | null;
  email: string;
};

interface UserPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserOption[];
  title?: string;
  onSelect: (userId: string) => void;
}

export function UserPickerDialog({
  open,
  onOpenChange,
  users,
  title = 'Adicionar usuário',
  onSelect,
}: UserPickerDialogProps) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-white/10 bg-[#161616] p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-3 pb-3">
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Pesquisar usuário"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 border-white/10 bg-black/40 pl-8 text-sm"
              autoFocus
            />
          </div>

          <div className="max-h-56 space-y-0.5 overflow-y-auto rounded-md">
            {filtered.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onSelect(user.id);
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-2.5 text-left text-sm text-zinc-300 transition-colors hover:bg-white/5"
              >
                <ScanFace className="h-4 w-4 shrink-0 text-zinc-500" />
                <div className="min-w-0">
                  <p className="truncate text-white">{user.name || user.email}</p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-2 py-6 text-center text-xs text-zinc-500">Nenhum usuário disponível</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
