"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Copy, Link2, Mail, Phone, ShoppingBag, UserRound, Fingerprint } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

import { formatDocument, formatPhone } from "@/lib/client-format";
import type { MarketingUnpaidOrder } from "@/lib/admin-api";
import { formatPrice } from "@/lib/shop-api";

type Props = {
  order: MarketingUnpaidOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function InfoRow({ icon: Icon, label, value, }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-white/5 px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-white/40" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-all text-sm text-white">{value}</p>
      </div>
    </div>
  );
};

export function UnpaidOrderDetailDialog({ order, open, onOpenChange }: Props) {
  if (!order) return null;

  const copyLink = () => {
    void navigator.clipboard.writeText(order.recoveryUrl);
    toast.success("Link de pagamento copiado");
  };

  const openWhatsApp = () => {
    if (!order.whatsappUrl) {
      toast.error("Cliente sem telefone válido");
      return;
    }
    window.open(order.whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>{order.customerName}</DialogTitle>
          <DialogDescription>
            Pedido #{order.id.slice(-6).toUpperCase()} ·{" "}
            {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {" · "}
            {formatPrice(order.total)}
            {order.paymentMethod ? ` · ${order.paymentMethod}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Dados de contato</p>
              <InfoRow icon={UserRound} label="Nome" value={order.customerName} />
              <InfoRow icon={Mail} label="E-mail" value={order.email || "—"} />
              <InfoRow icon={Phone} label="Telefone" value={formatPhone(order.phone)} />
              <InfoRow icon={Fingerprint} label="CPF" value={formatDocument(order.document)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Itens do pedido</p>
              <div className="space-y-2 rounded-md border border-white/5 p-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 select-none">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-white/5">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill className="object-cover" />
                      ) : (
                        <ShoppingBag className="m-auto h-5 w-5 text-white/30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{item.name}</p>
                      <p className="text-xs text-white/50">
                        {item.quantity}x · {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row">
          <Tooltip>
            <TooltipTrigger render={
              <Button
                type="button"
                className="flex-1 bg-[#25d366] px-4 py-2 rounded-full text-black font-medium"
                onClick={openWhatsApp}
                disabled={!order.whatsappUrl}
              >
                <FaWhatsapp className="h-4 w-4" />
                WhatsApp
              </Button>
            }>
            </TooltipTrigger>
            <TooltipContent>
              <p>Abra o WhatsApp com o cliente para recuperar o carrinho</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button
                type="button"
                className="flex-1 bg-transparent border border-white/5 hover:bg-white/5 px-4 py-2 rounded-full text-white font-medium"
                onClick={copyLink}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar link
              </Button>
            }>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copiar link de pagamento</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={
              <Button
                type="button"
                className="flex-1 bg-transparent border border-white/5 hover:bg-white/5 px-4 py-2 rounded-full text-white font-medium"
                asChild
              >
                <Link href={order.recoveryUrl} target="_blank" rel="noopener noreferrer">
                  <Link2 className="mr-2 h-4 w-4" />
                  Abrir pagamento
                </Link>
              </Button>
            }>
            </TooltipTrigger>
            <TooltipContent>
              <p>Abrir pagamento</p>
            </TooltipContent>
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
