"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi, type InventoryVariantItem } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { Can } from "@/providers/PermissionProvider";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: InventoryVariantItem | null;
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  DELIVERED: "Entregue",
  ALL: "Todos",
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RESERVED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELIVERED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export function InventoryCodesDialog({ open, onOpenChange, variant }: Props) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("AVAILABLE");
  const [page, setPage] = useState(1);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory", "codes", variant?.id, status, page],
    queryFn: () =>
      inventoryApi.listCodes(variant!.id, {
        status,
        page,
        pageSize: 30,
      }),
    enabled: open && Boolean(variant?.id),
  });

  const removeMutation = useMutation({
    mutationFn: (codeId: string) => inventoryApi.removeCode(codeId),
    onSuccess: () => {
      toast.success("Código removido");
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory", "codes", variant?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleClose(next: boolean) {
    if (!next) {
      setStatus("AVAILABLE");
      setPage(1);
      setRevealed({});
    }
    onOpenChange(next);
  }

  const codes = data?.codes ?? [];
  const pagination = data?.pagination;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Códigos da variante</DialogTitle>
          <DialogDescription>
            {variant ? `${variant.productName} — ${variant.name}` : "Visualize e gerencie os códigos."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <Select
            value={status}
            onValueChange={(val) => {
              setStatus(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] bg-[#0D0D0D] border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">Disponíveis</SelectItem>
              <SelectItem value="RESERVED">Reservados</SelectItem>
              <SelectItem value="DELIVERED">Entregues</SelectItem>
              <SelectItem value="ALL">Todos</SelectItem>
            </SelectContent>
          </Select>
          {pagination ? (
            <span className="text-xs text-muted-foreground">
              {pagination.total} código(s)
            </span>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-white/5 bg-[#0A0A0A]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : codes.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground italic">
              Nenhum código encontrado para este filtro.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {codes.map((code) => {
                const isRevealed = revealed[code.id];
                return (
                  <div key={code.id} className="flex items-center gap-3 px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] uppercase", STATUS_COLORS[code.status] || "")}
                    >
                      {STATUS_LABELS[code.status] || code.status}
                    </Badge>
                    <code className="flex-1 text-sm font-mono text-white truncate">
                      {isRevealed ? code.code : code.maskedCode}
                    </code>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() =>
                        setRevealed((prev) => ({ ...prev, [code.id]: !prev[code.id] }))
                      }
                    >
                      {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    {code.status === "AVAILABLE" ? (
                      <Can permission="products:edit">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-red-400 hover:text-red-300"
                          disabled={removeMutation.isPending}
                          onClick={() => removeMutation.mutate(code.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Can>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
