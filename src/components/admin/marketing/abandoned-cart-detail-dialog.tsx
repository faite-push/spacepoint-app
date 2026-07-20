"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Copy, Link2, Mail, Phone, ShoppingCart, UserRound } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Fingerprint } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Can } from "@/providers/PermissionProvider";
import { formatDocument, formatPhone } from "@/lib/client-format";
import { formatPrice } from "@/lib/shop-api";
import { marketingAutomationsApi, type MarketingAbandonedCart, } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  cart: MarketingAbandonedCart | null;
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
}

export function AbandonedCartDetailDialog({ cart, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: (id: string) => marketingAutomationsApi.createOrderFromCart(id),
    onSuccess: (order) => {
      toast.success("Pedido criado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["admin", "marketing"] });
      onOpenChange(false);
      window.open(order.recoveryUrl, "_blank", "noopener,noreferrer");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!cart) return null;

  const copyLink = () => {
    if (!cart.recoveryUrl) return;
    void navigator.clipboard.writeText(cart.recoveryUrl);
    toast.success("Link de recuperação copiado");
  };

  const openWhatsApp = () => {
    if (!cart.whatsappUrl) {
      toast.error("Cliente sem telefone válido");
      return;
    }
    window.open(cart.whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl flex-col gap-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle>{cart.customerName || (cart.isVisitor ? "Cliente visitante" : "Carrinho abandonado")}</DialogTitle>
          <DialogDescription>
            Atividade em{" "}
            {format(new Date(cart.lastActivityAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            {" · "}
            {formatPrice(cart.subtotalCents)}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Dados de contato</p>
              <InfoRow icon={UserRound} label="Nome" value={cart.customerName || "Visitante anônimo"} />
              <InfoRow icon={Mail} label="E-mail" value={cart.email || "—"} />
              <InfoRow icon={Phone} label="Telefone" value={formatPhone(cart.phone)} />
              <InfoRow icon={Fingerprint} label="CPF" value={formatDocument(cart.document)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white">Itens do carrinho</p>
              <div className="space-y-2 rounded-md border border-white/5 p-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-white/5">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt="" fill className="object-cover" />
                      ) : (
                        <ShoppingCart className="m-auto h-5 w-5 text-white/30" />
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
                {!cart.items.length && (
                  <p className="px-2 py-4 text-sm text-white/40">Nenhum item</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row">
          <Tooltip>
            <TooltipTrigger render={
              <Button
                type="button"
                className="bg-[#25d366] px-4 py-2 rounded-full text-black font-medium"
                onClick={openWhatsApp}
                disabled={!cart.whatsappUrl}
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
                className="bg-transparent border border-white/5 hover:bg-white/5 px-4 py-2 rounded-full text-white font-medium"
                onClick={copyLink}
                disabled={!cart.recoveryUrl}
              >
                <Copy className="h-4 w-4" />
                Copiar link
              </Button>
            }>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copie o link para enviar ao cliente</p>
            </TooltipContent>
          </Tooltip>

          {cart.recoveryUrl && (
            <Tooltip>
              <TooltipTrigger render={
                <Button
                  type="button"
                  className="bg-transparent border border-white/5 hover:bg-white/5 px-4 py-2 rounded-full text-white font-medium"
                  asChild
                >
                  <Link href={cart.recoveryUrl} target="_blank" rel="noopener noreferrer">
                    <Link2 className="h-4 w-4" />
                    Abrir link
                  </Link>
                </Button>
              }>
              </TooltipTrigger>
              <TooltipContent>
                <p>Abra o link para enviar ao cliente</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Can I="marketing:manage">
            <Button
              type="button"
              onClick={() => createOrderMutation.mutate(cart.id)}
              disabled={createOrderMutation.isPending || (!cart.email && !cart.userId)}
              className={cn(createOrderMutation.isPending && "opacity-70", "flex-1 bg-primary rounded-full hover:bg-primary/90 px-4 py-2")}
            >
              Criar Pedido
            </Button>
          </Can>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
