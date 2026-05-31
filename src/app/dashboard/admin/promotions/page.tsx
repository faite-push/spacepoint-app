"use client";

import { useState } from "react";
import { 
  Plus, Search, Calendar, Tag, Clock, ArrowLeft, 
  MoreHorizontal, Edit2, Trash2, CheckCircle2, XCircle,
  Timer, Percent, Package, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

// Mock data as the backend might not have this endpoint yet
const MOCK_PROMOTIONS = [
  {
    id: "1",
    name: "Oferta de Verão",
    discount: 15,
    type: "PERCENTAGE",
    startDate: "2026-06-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    status: "SCHEDULED",
    target: "Categorias Selecionadas",
    usageCount: 0
  },
  {
    id: "2",
    name: "Flash Sale Tech",
    discount: 30,
    type: "PERCENTAGE",
    startDate: "2026-05-20T00:00:00Z",
    endDate: "2026-05-28T23:59:59Z",
    status: "ACTIVE",
    target: "Produtos Específicos",
    usageCount: 142
  },
  {
    id: "3",
    name: "Semana Gamer",
    discount: 10,
    type: "PERCENTAGE",
    startDate: "2026-05-01T00:00:00Z",
    endDate: "2026-05-07T23:59:59Z",
    status: "EXPIRED",
    target: "Toda a Loja",
    usageCount: 856
  }
];

export default function PromotionsPage() {
  const [search, setSearch] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 uppercase text-[10px] font-bold"><CheckCircle2 size={10} /> Ativa</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1.5 uppercase text-[10px] font-bold"><Clock size={10} /> Agendada</Badge>;
      case "EXPIRED":
        return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 gap-1.5 uppercase text-[10px] font-bold"><XCircle size={10} /> Expirada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/admin" className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Promoções Agendadas</h1>
          </div>
          <p className="text-sm text-zinc-500">Crie descontos automáticos que expiram sozinhos.</p>
        </div>
        <Button className="h-11 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)]">
          <Plus size={18} />
          Nova Promoção
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Timer className="text-emerald-500" size={16} />
              </div>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full">+12%</span>
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Promoções Ativas</p>
               <p className="text-xl font-black text-white">04</p>
            </div>
         </div>
         <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="text-blue-500" size={16} />
              </div>
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agendadas</p>
               <p className="text-xl font-black text-white">12</p>
            </div>
         </div>
         <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Percent className="text-purple-500" size={16} />
              </div>
            </div>
            <div>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Desconto Médio</p>
               <p className="text-xl font-black text-white">18.5%</p>
            </div>
         </div>
         <div className="rounded-2xl border border-white/5 bg-[#111111] p-5 flex flex-col gap-3 border-dashed">
            <div className="flex-1 flex flex-col items-center justify-center gap-1 opacity-40 group hover:opacity-100 transition-opacity cursor-pointer">
               <Plus size={20} className="text-zinc-400 group-hover:text-white" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Nova Campanha</span>
            </div>
         </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Buscar promoção pelo nome..." 
              className="bg-[#0D0D0D] border-white/5 pl-10 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/5">
             <Button variant="ghost" size="sm" className="bg-white/5 text-white">Todas</Button>
             <Button variant="ghost" size="sm" className="text-zinc-500">Ativas</Button>
             <Button variant="ghost" size="sm" className="text-zinc-500">Agendadas</Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600 pl-6 py-4">Nome da Promoção / Target</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Desconto</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Período</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-zinc-600 pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_PROMOTIONS.map((promo) => (
                <TableRow key={promo.id} className="border-white/5 hover:bg-white/[0.01] transition-colors group">
                  <TableCell className="pl-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-center justify-center text-purple-400">
                           <Tag size={18} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-tight">{promo.name}</span>
                           <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1">
                              <Package size={10} /> {promo.target}
                           </span>
                        </div>
                     </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col">
                        <span className="text-base font-black text-white">{promo.discount}%</span>
                        <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">OFF NO TOTAL</span>
                     </div>
                  </TableCell>
                  <TableCell>
                     <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-medium">
                           <Calendar size={12} className="text-zinc-600" />
                           {format(new Date(promo.startDate), "dd MMM", { locale: ptBR })} - {format(new Date(promo.endDate), "dd MMM yyyy", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                           <Clock size={12} />
                           {promo.status === "ACTIVE" ? "Termina em 3 dias" : "Inicia em 10 dias"}
                        </div>
                     </div>
                  </TableCell>
                  <TableCell>
                     {getStatusBadge(promo.status)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                              <MoreHorizontal size={14} className="text-zinc-500" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0D0D0D] border-white/10 text-white min-w-[160px]">
                            <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5 font-medium">
                               <Edit2 size={14} /> Editar Campanha
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5 font-medium">
                               <Plus size={14} /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-red-500/10 text-red-500 font-medium">
                               <Trash2 size={14} /> Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-center p-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
           <div className="flex flex-col items-center gap-3 text-center max-w-xs">
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                 <AlertCircle className="text-blue-500" size={24} />
              </div>
              <h4 className="text-sm font-bold text-white">Dica de Especialista</h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">Promoções com duração de menos de 48h (Flash Sales) tendem a aumentar a conversão em até 25% devido ao gatilho de escassez.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
