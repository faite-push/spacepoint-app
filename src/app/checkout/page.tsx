"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { ChevronRight, Minus, Plus, Trash2, Ticket, PlusCircle, User, Mail, Zap, ArrowRight, Loader2, ShoppingCart, AlertCircle, Check, Lock, X, CreditCard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip"
import { createOrder, fetchCheckoutPaymentOptions, formatPrice, fetchProducts } from "@/lib/shop-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useCartStore, useCartHydrated } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/types/shop";
import { FaPix } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";

export default function CheckoutPage() {
  const { items, total, subtotal, discount, setQuantity, removeItem, clear, applyCoupon, appliedCoupon, removeCoupon } = useCartStore();

  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD">("PIX");

  const [contactInfo, setContactInfo] = useState({
    name: "",
    email: "",
    robloxName: ""
  });

  const hydrated = useCartHydrated();
  const paymentOptionsQuery = useQuery({
    queryKey: ["checkout", "payment-options"],
    queryFn: fetchCheckoutPaymentOptions,
  });

  const availableMethods = paymentOptionsQuery.data?.methods || ["PIX"];
  const cardAvailable = availableMethods.includes("CARD");

  useEffect(() => {
    async function loadRecs() {
      try {
        const products = await fetchProducts();
        const inCartIds = items.map(i => i.productId);
        const filtered = products.filter(p => !inCartIds.includes(p.id)).slice(0, 2);
        setRecommendations(filtered);
      } catch (e) {
        console.error("Failed to load recommendations", e);
      }
    }
    loadRecs();
  }, [items]);

  useEffect(() => {
    if (!cardAvailable && paymentMethod === "CARD") {
      setPaymentMethod("PIX");
    }
  }, [cardAvailable, paymentMethod]);

  async function handleApplyCoupon() {
    if (!couponInput) return;
    setIsApplyingCoupon(true);
    setCouponError("");
    try {
      await applyCoupon(couponInput);
      setCouponInput("");
    } catch (error: any) {
      setCouponError(error.message || "Cupom inválido ou não encontrado.");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  async function submitOrder() {
    if (!acceptedTerms || isSubmitting) return;

    setIsSubmitting(true);
    setStatus("Processando seu pedido seguro...");

    try {
      const order = await createOrder(
        items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        {
          couponCode: appliedCoupon?.code ?? null,
          paymentMethod,
        }
      );
      clear();
      // Redireciona para a página de pagamento
      window.location.href = `/checkout/payment/${order.id}?paymentMethod=${paymentMethod}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao criar pedido");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24 lg:pb-12 -mt-32 py-6 md:py-12 relative">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium mb-4">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-zinc-300">Checkout</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Finalizar Compra</h1>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <section className="bg-white/[0.01] border border-primary/5 rounded-xl p-6 sm:p-6">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                Formas de pagamento
              </h2>
              <div className="grid gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("PIX")}
                  className="relative group overflow-hidden text-left"
                >
                  <div className={`relative flex items-center justify-between p-5 rounded-xl border transition-colors ${paymentMethod === "PIX" ? "border-primary/20 bg-primary/10" : "border-white/10 bg-white/[0.02]"}`}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center">
                        <FaPix className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Pix</span>
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Zap className="h-2.5 w-2.5 fill-current" /> Mais rápido
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium mt-1">Aprovação imediata</p>
                      </div>
                    </div>
                    {paymentMethod === "PIX" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => cardAvailable && setPaymentMethod("CARD")}
                  disabled={!cardAvailable}
                  className={`relative group overflow-hidden text-left ${!cardAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className={`relative flex items-center justify-between p-5 rounded-xl border transition-colors ${paymentMethod === "CARD" ? "border-primary/20 bg-primary/10" : "border-white/10 bg-white/[0.02]"}`}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">Cartão</span>
                          {!cardAvailable && (
                            <span className="text-[10px] bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full font-bold">
                              Indisponível no gateway ativo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-medium mt-1">
                          {cardAvailable ? "Pague com cartão de crédito" : "Ative Cartão na configuração do gateway"}
                        </p>
                      </div>
                    </div>
                    {paymentMethod === "CARD" && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              </div>
            </section>

            <section className="bg-white/[0.01] border border-primary/5 rounded-xl p-6 sm:p-6">
              <h2 className="text-xl font-bold mb-3">Informações de contato</h2>
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                  <Input
                    placeholder="Nome completo"
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })}
                    className="h-14 pl-12 bg-transparent border-white/5 rounded-lg focus:border-primary/30 focus:bg-white/2 text-white"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
                  <Input
                    type="email"
                    placeholder="Seu melhor e-mail"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="h-14 pl-12 bg-transparent border-white/5 rounded-lg focus:border-primary/30 focus:bg-white/2 text-white"
                  />
                </div>
              </div>
            </section>

            <div className="flex items-center space-x-3 px-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="h-5 w-5 rounded-md border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium text-zinc-400 cursor-pointer select-none"
              >
                Eu aceito os <span className="text-white font-bold underline decoration-primary underline-offset-4">termos e condições</span> desta compra.
              </label>
            </div>

            {recommendations.length > 0 && (
              <div className="mt-8 bg-white/[0.01] rounded-lg p-5 border border-primary/5">
                <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-white/90">
                  <Zap className="h-4 w-4 text-primary" /> Jogos que combinam com você
                </h4>

                <div className="grid gap-3">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-lg group hover:bg-white/[0.04] transition-colors">
                      <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5 border border-white/5">
                        {rec.imageUrl ? (
                          <Image
                            src={rec.imageUrl}
                            alt={rec.name}
                            fill
                            className="object-cover select-none pointer-events-none"
                          />
                        ) : (
                          <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-zinc-600" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <h4 className="text-sm cursor-pointer font-bold text-white/90 line-clamp-2 leading-tight mb-1">
                                {rec.name}
                              </h4>
                            }
                          >
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{rec.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="text-xs text-white/70">{formatPrice(rec.price)}</div>
                      </div>

                      {rec.hasVariants ? (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link href={`/product/${rec.slug}`}>
                            Ver
                          </Link>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { const { addProduct } = useCartStore.getState(); addProduct(rec); }}
                        >
                          <PlusCircle className="h-4 w-4" />
                          Adicionar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="lg:hidden">
              <Button
                onClick={submitOrder}
                disabled={!acceptedTerms || items.length === 0 || isSubmitting}
                className="w-full h-12 rounded-lg text-md font-semibold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : `Pagar ${hydrated ? formatPrice(total()) : "R$ 0,00"}`}
              </Button>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="bg-white/[0.01] border border-primary/5 rounded-lg p-6 sm:p-8 sticky top-12">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-white tracking-tight">Resumo do pedido</h2>
                <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-xs font-bold">
                  <Lock className="h-3.5 w-3.5" /> Pagamento Seguro
                </Badge>
              </div>

              <ScrollArea className="flex-2 max-h-46 overflow-y-scroll pr-1">
                <div className="space-y-3">
                  {hydrated ? items.map((item) => (
                    <div
                      key={item.cartKey}
                      className="group flex items-center gap-4 p-3 transition-all bg-white/[0.02] hover:bg-white/[0.02] rounded-lg border border-white/5"
                    >
                      <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/5 border border-white/5">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill className="object-cover select-none pointer-events-none" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart className="h-5 w-5 text-white/10" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-center min-w-0">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <h4 className="text-xs cursor-pointer font-bold text-white/90 line-clamp-1" >
                                {item.name}
                              </h4>
                            }
                          >
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.name}</p>
                          </TooltipContent>
                        </Tooltip>

                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center bg-white/2 rounded-md p-1 border border-white/5">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    onClick={() => setQuantity(item.cartKey, Math.max(1, item.quantity - 1))}
                                    className="cursor-pointer h-5 w-5 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                                  >
                                    <Minus className="h-2.5 w-2.5" />
                                  </button>
                                }
                              >
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Diminuir quantidade</p>
                              </TooltipContent>
                            </Tooltip>

                            <span className="select-none pointer-events-none w-6 text-center text-[10px] font-bold text-white">{item.quantity}</span>

                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <button
                                    onClick={() => setQuantity(item.cartKey, item.quantity + 1)}
                                    className="cursor-pointer h-5 w-5 flex items-center justify-center hover:bg-white/10 rounded-md transition-colors text-white/40 hover:text-white"
                                  >
                                    <Plus className="h-2.5 w-2.5" />
                                  </button>
                                }
                              >
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Adicionar quantidade</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  onClick={() => removeItem(item.cartKey)}
                                  className="cursor-pointer h-5 w-5 flex items-center justify-center rounded-md transition-colors text-white/40 hover:text-red-500"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              }
                            >
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remover item</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {hydrated ? formatPrice(item.price * item.quantity) : "R$ 0,00"}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div className="h-20 rounded-lg bg-white/[0.02] animate-pulse" />
                  )}
                  {hydrated && items.length === 0 && (
                    <div className="py-12 text-center text-zinc-600">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">Seu carrinho está vazio</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator className="my-4 bg-white/5" />

              <div className="mb-4">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Ticket className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-400">Cupom {appliedCoupon.code} está ativado!</div>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            onClick={removeCoupon}
                            size="icon"
                            className="text-[10px] font-bold text-white/40 hover:text-white transition-colors">
                            <X className="h-4 w-4" />
                          </Button>
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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                        <Input
                          placeholder="Cupom de desconto"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); }}
                          className={`h-12 pl-12 bg-transparent border-white/5 rounded-lg focus:border-primary/30 focus:bg-white/2 text-white ${couponError ? "border-red-500/50" : ""}`}
                        />
                      </div>

                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              onClick={handleApplyCoupon}
                              disabled={isApplyingCoupon || !couponInput}
                              className="p-6 bg-primary font-bold text-white hover:bg-primary/90 rounded-lg"
                            >
                              {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                          }
                        >
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Aplicar cupom</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {couponError && (
                      <div className="flex items-center gap-2 text-xs text-red-400 font-medium px-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{couponError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-white/40 tracking-widest">Subtotal</span>
                  <span className="text-white font-bold">{hydrated ? formatPrice(subtotal()) : "R$ 0,00"}</span>
                </div>
                {hydrated && discount() > 0 && (
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-white/40 tracking-widest">Desconto</span>
                    <span className="text-emerald-400 font-bold">- {formatPrice(discount())}</span>
                  </div>
                )}
                <Separator className="my-2 bg-white/5" />
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-white/60">Valor Total</span>
                  <span className="text-3xl font-bold text-white tracking-tighter">
                    {hydrated ? formatPrice(total()) : "R$ 0,00"}
                  </span>
                </div>
              </div>

              <div className="hidden lg:block mt-8">
                <Button
                  onClick={submitOrder}
                  disabled={!acceptedTerms || items.length === 0 || isSubmitting}
                  className="w-full h-12 rounded-lg text-md font-semibold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <>
                      <span>Pagar {hydrated ? formatPrice(total()) : "R$ 0,00"}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>

              {status && (
                <div className="mt-4 text-center text-sm font-bold text-emerald-500 bg-emerald-500/10 py-3 rounded-2xl border border-emerald-500/20">
                  {status}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};