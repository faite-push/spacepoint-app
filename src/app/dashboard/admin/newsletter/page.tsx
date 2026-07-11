"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Mail, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Can } from "@/providers/PermissionProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { newsletterApi } from "@/lib/admin-api";

function sourceLabel(source: string) {
  if (source === "footer") return "Rodapé";
  if (source === "home") return "Página inicial";
  return source;
}

export default function AdminNewsletterPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "newsletter", search, page],
    queryFn: () => newsletterApi.list({ search: search || undefined, page }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => newsletterApi.remove(id),
    onSuccess: () => {
      toast.success("Inscrito removido");
      queryClient.invalidateQueries({ queryKey: ["admin", "newsletter"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleExport() {
    try {
      const blob = await newsletterApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "newsletter-subscribers.csv";
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao exportar");
    }
  }

  const subscribers = data?.subscribers ?? [];
  const pagination = data?.pagination;

  return (
    <Can I="settings:manage" message="Você não tem permissão para gerenciar a newsletter.">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Newsletter</h1>
            <p className="text-sm text-muted-foreground">
              Inscritos capturados pelos formulários da loja.
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="border-white/10">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por e-mail..."
            className="pl-9"
          />
        </div>

        <div className="rounded-md border border-white/10 bg-black/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <Mail className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Nenhum inscrito encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((subscriber) => (
                  <TableRow key={subscriber.id}>
                    <TableCell className="font-medium text-white">{subscriber.email}</TableCell>
                    <TableCell>{sourceLabel(subscriber.source)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {subscriber.user?.name || subscriber.user?.email || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(subscriber.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => removeMutation.mutate(subscriber.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pagination.total} inscrito{pagination.total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </Can>
  );
}
