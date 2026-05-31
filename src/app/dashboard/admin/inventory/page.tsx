"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Search, Package, AlertTriangle, CheckCircle2, XCircle, 
  ArrowLeft, Loader2, Save, History, Filter, MoreHorizontal,
  Edit2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { productsApi, type AdminProduct } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", "inventory", search],
    queryFn: () => productsApi.list({ search, page: 1 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string, stock: number }) => 
      productsApi.update(id, { stockQuantity: stock }),
    onSuccess: () => {
      toast.success("Estoque atualizado");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const products = data?.products ?? [];

  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: "Sem Estoque", color: "text-red-500", bg: "bg-red-500/10 border-red-500/20", icon: XCircle };
    if (qty < 10) return { label: "Estoque Baixo", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle };
    return { label: "Em Dia", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 };
  };

  const handleStartEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setEditValue(product.stockQuantity);
  };

  const handleSaveEdit = (id: string) => {
    updateMutation.mutate({ id, stock: editValue });
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/admin" className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Controle de Estoque</h1>
          </div>
          <p className="text-sm text-zinc-500">Visualize e atualize o inventário de todos os seus pacotes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-[#0A0A0A] border-white/10 gap-2 text-xs font-bold uppercase tracking-widest h-11">
             <History size={16} />
             Histórico
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
               <AlertTriangle className="text-amber-500" size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Alertas Baixos</p>
               <p className="text-xl font-black text-white">{products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length}</p>
            </div>
         </div>
         <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
               <XCircle className="text-red-500" size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fora de Estoque</p>
               <p className="text-xl font-black text-white">{products.filter(p => p.stockQuantity <= 0).length}</p>
            </div>
         </div>
         <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
               <Package className="text-emerald-500" size={24} />
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Sku's</p>
               <p className="text-xl font-black text-white">{products.length}</p>
            </div>
         </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Pesquisar por nome ou SKU..." 
              className="bg-[#0D0D0D] border-white/5 pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
             <Button variant="ghost" className="text-zinc-500 hover:text-white h-11 px-4 gap-2">
                <Filter size={16} />
                Filtros
             </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600 pl-6 py-4">Produto</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Categoria</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Qtd Atual</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-zinc-600 pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5 animate-pulse">
                    <TableCell colSpan={5} className="h-16 bg-white/[0.01]" />
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-zinc-500 italic">Nenhum produto encontrado.</TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const status = getStockStatus(product.stockQuantity);
                  const StatusIcon = status.icon;
                  const isEditing = editingId === product.id;

                  return (
                    <TableRow key={product.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                      <TableCell className="pl-6 py-4">
                         <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">{product.name}</span>
                            <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">ID: #{product.id.slice(-6).toUpperCase()}</span>
                         </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-zinc-400">
                            {product.category?.name || "Sem Categoria"}
                         </Badge>
                      </TableCell>
                      <TableCell>
                         <div className={cn(
                           "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                           status.bg,
                           status.color
                         )}>
                            <StatusIcon size={12} />
                            {status.label}
                         </div>
                      </TableCell>
                      <TableCell>
                         {isEditing ? (
                           <div className="flex items-center gap-2">
                             <Input 
                               type="number" 
                               value={editValue} 
                               onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                               className="h-9 w-20 bg-[#0D0D0D] border-purple-500/50 text-white font-bold"
                             />
                             <Button 
                               size="icon" 
                               className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white"
                               onClick={() => handleSaveEdit(product.id)}
                               disabled={updateMutation.isPending}
                             >
                                {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                             </Button>
                           </div>
                         ) : (
                           <button 
                             onClick={() => handleStartEdit(product)}
                             className="flex items-center gap-2 text-sm font-black text-white hover:text-purple-400 transition-colors group/edit"
                           >
                              {product.stockQuantity}
                              <Edit2 size={10} className="text-zinc-600 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                           </button>
                         )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                               <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                                  <MoreHorizontal size={14} className="text-zinc-500" />
                               </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0D0D0D] border-white/10 text-white min-w-[140px]">
                               <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" asChild>
                                  <Link href={`/dashboard/admin/products/${product.id}/edit`}>
                                     <Edit2 size={14} />
                                     Editar Integrado
                                  </Link>
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                         </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
