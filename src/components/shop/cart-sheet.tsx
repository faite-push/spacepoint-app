"use client";

import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription, } from "@/components/ui/sheet";
import { Minus, Plus, ShoppingCart, Trash2, X, Ticket, ArrowRight, Check, Loader, TicketPercent } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/shop-api";
import { useState } from "react";
import { toast } from "sonner";

import type { PublicSiteConfig } from "@/lib/site-api";

export function CartSheet({ children, siteConfig }: { children: React.ReactElement; siteConfig?: PublicSiteConfig | null; }) {
  const { items, removeItem, setQuantity, total, subtotal, discount, appliedCoupon, applyCoupon, removeCoupon, isOpen, setIsOpen, addProduct } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const primaryColor = siteConfig?.primaryColor || "#A855F7";

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setIsApplyingCoupon(true);
    try {
      await applyCoupon(couponInput);
      toast.success("Cupom aplicado com sucesso!");
      setCouponInput("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao aplicar cupom");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger render={children} />
      <SheetContent className="flex min-w-full flex-col sm:min-w-[520px] bg-[#0a0a0a]/95 backdrop-blur-2xl border-white/5 text-white">
        <SheetHeader className="px-6 pb-4">
          <div className="flex flex-col items-start justify-between">
            <SheetTitle className="text-xl font-bold text-white">
              Meu Carrinho
            </SheetTitle>
            <SheetDescription>
              {items.length} {items.length === 1 ? "item" : "itens"}
            </SheetDescription>
          </div>
        </SheetHeader>

        {items.length > 0 ? (
          <>
            <ScrollArea className="flex-1">
              <div className="space-y-2 px-6">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.cartKey} className="group flex items-center gap-4 p-4 transition-all bg-white/[0.02] hover:bg-white/[0.04] rounded-xl border border-white/5">
                      <div className="relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5 border border-white/5">
                        {item.image ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="cursor-pointer object-cover select-none pointer-events-none"
                                />
                              }
                            >
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{item.name}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-white/10" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-center min-w-0">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <h4 className="text-sm cursor-pointer font-bold text-white/90 line-clamp-2 leading-tight mb-1">
                                {item.name}
                              </h4>
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.name}</p>
                          </TooltipContent>
                        </Tooltip>

                        <p className="text-base font-bold text-white/60">
                          {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                          {(() => {
                            const maxQ = item.maxPurchaseQuantity || item.stockQuantity || 99;
                            return (
                              <>
                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 cursor-pointer text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                        onClick={() => setQuantity(item.cartKey, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                      />
                                    }
                                  >
                                    <Minus className="h-4 w-4" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Diminuir quantidade</p>
                                  </TooltipContent>
                                </Tooltip>

                                <div className="flex h-8 w-10 select-none items-center justify-center rounded-md bg-white/5 border border-white/5 text-xs font-bold font-mono text-white">
                                  {item.quantity}
                                </div>

                                <Tooltip>
                                  <TooltipTrigger
                                    render={
                                      <button
                                        onClick={() => setQuantity(item.cartKey, item.quantity + 1)}
                                        disabled={item.quantity >= maxQ}
                                        className="h-8 w-8 cursor-pointer flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                                      />
                                    }
                                  >
                                    <Plus className="h-4 w-4" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {item.quantity >= maxQ ? (
                                      <p>Limite máximo atingido ({maxQ})</p>
                                    ) : (
                                      <p>Aumentar quantidade</p>
                                    )}
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            );
                          })()}
                        </div>

                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                onClick={() => removeItem(item.cartKey)}
                              />
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remover item</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="space-y-4 px-6 pt-6 border-t rounded-t-xl border-white/5 pb-8 bg-background">
              <div className="flex flex-col gap-2">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <div className="flex px-2 items-center gap-2">
                      <Ticket className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-400">
                        Cupom {appliedCoupon.code} está ativado
                      </span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={removeCoupon}
                            className="text-[10px] font-bold text-white/40 hover:text-white transition-colors"
                          />
                        }
                      >
                        <X className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Remover cupom</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TicketPercent className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                      <Input
                        placeholder="Cupom de desconto"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="h-10 w-full rounded-lg border border-white/10 bg-transparent pl-10 pr-4 font-medium text-sm text-white placeholder:text-white/30 focus:border-[#9333EA]/60 focus:outline-none focus:ring-none transition-all duration-300"
                      />
                    </div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            className="h-10 px-4 border-white/10 bg-transparent hover:bg-white/5 text-sm font-bold"
                            onClick={handleApplyCoupon}
                            disabled={isApplyingCoupon || !couponInput}
                          >
                            {isApplyingCoupon ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                        }
                      >
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Aplicar cupom</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-white/40 tracking-widest">Subtotal</span>
                  <span className="text-white font-bold">{formatPrice(subtotal())}</span>
                </div>
                {discount() > 0 && (
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/40 tracking-widest">Desconto</span>
                    <span className="text-emerald-400 font-bold">- {formatPrice(discount())}</span>
                  </div>
                )}
                <Separator className="my-2 bg-white/5" />
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-white/60">Valor Total</span>
                  <span className="text-3xl font-bold text-white tracking-tighter">
                    {formatPrice(total())}
                  </span>
                </div>
              </div>

              <SheetFooter className="flex-col gap-2 p-0 sm:flex-col">
                <Button
                  asChild
                  className="group relative w-full h-14 text-sm font-medium text-white overflow-hidden active:scale-95 transition-all duration-300"
                  style={{ backgroundColor: primaryColor }}
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/checkout">
                    <span className="relative z-10 flex items-center gap-2">
                      Finalizar Pedido <ArrowRight className="h-4 w-4" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-800" />
                  </Link>
                </Button>
              </SheetFooter>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="relative">
              <div className="h-24 w-24 flex items-center justify-center animate-pulse">
                <ShoppingCart className="h-10 w-10" style={{ color: primaryColor }} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white">Vazio por aqui</h3>
              <p className="text-sm text-white/30 leading-relaxed mx-auto">
                Seu carrinho aguarda pelos melhores games da galáxia.
              </p>
            </div>
            <Button
              className="absolute inset-x-0 mx-auto bottom-2 w-5/6 py-5 bg-white/5 hover:bg-white/10 text-white border-white/5 font-bold text-sm"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Ir para a loja
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};