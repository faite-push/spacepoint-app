"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import { ShoppingBasket, Heart, Zap, ShieldCheck, CreditCard, ChevronRight, OctagonAlert, Check, Info, CircleCheck, Receipt, BadgeDollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichContent } from "@/components/shared/rich-content";
import { formatPrice, formatPriceLabel } from "@/lib/shop-api";
import type { Product, ProductVariant } from "@/types/shop";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";


export function ProductDetail({ product, relatedProducts = [] }: { product: Product; relatedProducts?: Product[]; }) {
  const router = useRouter();
  const addProduct = useCartStore((s) => s.addProduct);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));

  const [selectedVariantId, setSelectedVariantId] = useState<string | "">(
    product.hasVariants ? (product.variants[0]?.id ?? "") : ""
  );

  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (!product.hasVariants) return null;
    return product.variants.find((v) => v.id === selectedVariantId) ?? null;
  }, [product, selectedVariantId]);

  const outOfStock = selectedVariant != null ? selectedVariant.stockQuantity <= 0 : !product.hasVariants && (product.stockQuantity ?? 0) <= 0;
  const displayImage = selectedVariant?.imageUrl || product.imageUrl || product.images[0] || "/placeholder.svg";
  const comparePrice = selectedVariant?.comparePrice ?? product.comparePrice;
  const displayPrice = selectedVariant?.price ?? product.price;


  function handleAdd() {
    if (product.hasVariants && !selectedVariant) {
      toast.error("Selecione uma variante primeiro");
      return false;
    }
    addProduct(product, selectedVariant);
    toast.success("Adicionado ao carrinho");
    return true;
  };

  function handleBuyNow() {
    if (handleAdd()) {
      router.push("/checkout");
    }
  };

  function handleWishlist() {
    const wasIn = isInWishlist;
    toggleWishlist(product);
    toast.success(wasIn ? "Removido da lista de desejos" : "Adicionado à lista de desejos!");
  };
  const [mounted, setMounted] = useState(false);
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const button = document.getElementById("main-buy-button");
      if (button) {
        const rect = button.getBoundingClientRect();
        setShowFloatingBar(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isFavorite = mounted && isInWishlist;

  return (
    <div className="pb-24 lg:pb-12 -mt-22 py-6 md:py-12 space-y-6 relative">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[50%] left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <nav className="flex items-center gap-1 text-sm -mt-6 md:-mt-10 text-white/50">
        <Link href="/" className="hover:text-white transition-colors">Início</Link>
        {product.category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-white transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-white/80 truncate max-w-auto sm:max-w-none">{product.name}</span>
      </nav>

      <div className="rounded-xl border border-white/5 bg-[#111111]/30 p-5 md:p-8 backdrop-blur-md">
        <div className="grid gap-8 md:gap-12 lg:grid-cols-[400px_1fr]">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/5 bg-[#0a0a0a]">
            <Image
              src={displayImage}
              alt={product.name}
              fill
              className="object-cover pointer-events-none select-none"
              sizes="(max-width: 1024px) 100vw, 400px"
              priority
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-start gap-4 mb-6">
              <div className="space-y-1">
                <h1 className="text-xl md:text-xl lg:text-2xl font-bold text-white leading-tight tracking-wide">
                  {product.name}
                </h1>
              </div>

              <button
                onClick={handleWishlist}
                className={cn(
                  "flex-shrink-0 flex items-center justify-center cursor-pointer h-10 w-10 rounded-full bg-[#1c1c1c] border transition-all",
                  isFavorite
                    ? "border-red-400/40 text-red-400"
                    : "border-white/10 text-white/50 hover:text-red-400 hover:border-red-400/30"
                )}
              >
                <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 mb-6">
              <div className="flex items-center gap-2.5 text-[14px] text-white/80 font-medium tracking-wide">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/70">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Jogos 100% Originais com Garantia Vitalícia</span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-white/80 font-medium tracking-wide">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/70">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Segurança e Tranquilidade Total</span>
              </div>
              <div className="flex items-center gap-2.5 text-[14px] text-white/80 font-medium tracking-wide">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/70">
                  <Check className="h-3.5 w-3.5" />
                </div>
                <span>Entrega Instantânea e Fácil</span>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex items-center cursor-pointer gap-2 text-[13px] text-primary/90 hover:text-primary/70 font-bold w-fit mt-1 transition-colors">
                    Entenda como funciona as Licenças Primária e Secundária
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-primary/10 backdrop-blur-md border-white/10 text-white max-w-6xl max-h-[85vh] overflow-y-hidden">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white tracking-wide">Como Funcionam os Jogos Digitais na Space Point BR?</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-white/70 text-sm leading-relaxed mt-4">
                    <p>A compra de jogos digitais está cada vez mais popular, e a Space Point BR oferece uma forma segura, prática e acessível para você aproveitar seus títulos favoritos. Todos os jogos comprados na loja são de versão Brasileira e legendados em português (se disponível na PS Store).</p>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-base">Como Funciona a Entrega?</h3>
                      <p>Após a compra, você receberá um login e senha para criar um usuário no seu videogame. Esse usuário permitirá acesso à biblioteca para efetuar o download do jogo adquirido.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                        <h4 className="font-bold text-primary">1. Licença Primária</h4>
                        <ul className="space-y-1">
                          <li className="flex items-start gap-1"><CircleCheck className="text-primary/80 w-5 h-5" /> <strong>Acesso pelo seu perfil pessoal:</strong> Jogue diretamente no seu usuário principal.</li>
                          <li className="flex items-start gap-1"><CircleCheck className="text-primary/80 w-5 h-5" /> <strong>Jogo online e offline:</strong> Funciona normalmente, até sem internet.</li>
                          <li className="flex items-start gap-1"><CircleCheck className="text-primary/80 w-5 h-5" /> <strong>Experiência completa:</strong> Troféus e direitos de uma compra feita na PSN.</li>
                          <li className="text-white/50 mt-2 text-xs"><strong className="text-primary/80">Exclusivo ao console:</strong> A conta deve ser utilizada apenas no console em que foi ativada (PS4 ou PS5). Caso mude do Ps4 para O Ps5, necessário que entre em contato com o suporte da loja para solicitar aquisição de uma nova compra para o Ps5. A versão de Ps4 segue com garantia vitalicia para o Console ao qual comprou, ou, caso necessário, podendo ser retirada do console inicial para outro PS4. ( Não sendo possível ativação em um PS5, pois as licenças são vendidas separadas ).</li>
                        </ul>
                      </div>

                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                        <h4 className="font-bold text-primary">2. Licença Secundária</h4>
                        <ul className="space-y-1">
                          <li className="flex items-start gap-1"><BadgeDollarSign className="text-primary/80 w-5 h-5" /> <strong>Custo-benefício:</strong> Muito mais em conta. Jogue pelo perfil enviado.</li>
                          <li className="flex items-start gap-1"><CircleCheck className="text-primary/80 w-5 h-5" /> <strong>Online:</strong> Necessário conexão com internet para validar a licença e jogar.</li>
                          <li className="text-white/50 mt-2 text-xs">Assim como a primária, exclusivo à geração (PS4 ou PS5). Não use dados em dezenas de consoles para evitar bloqueios.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-white text-base">Termos e Regras Importantes:</h3>
                      <p>Trabalhamos apenas com jogos originais adquiridos da PSN Store. Conta vitalícia (o jogo é seu para sempre sem prazo para bloqueio) e zero risco de banimento.</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1 text-red-300">
                        <li>Não altere os dados da conta (login, senha, ID ou configurações).</li>
                        <li>Não ative a verificação em duas etapas.</li>
                        <li>Não compartilhe a conta com terceiros.</li>
                      </ul>
                      <p className="text-xs mt-2 text-red-400 font-bold">⚠ Caso alguma dessas regras seja desrespeitada, a conta perde a garantia vitalícia instantaneamente.</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {product.hasVariants && (
              <div className="mb-6 rounded-lg border border-white/5 bg-transparent p-4 shadow-inner">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm font-semibold text-white/70 tracking-wide">Escolha a Variante</p>
                  {selectedVariant && selectedVariant.stockQuantity < 10 && selectedVariant.stockQuantity > 0 && (
                    <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2.5 py-0.5 rounded-md border border-orange-400/20">
                      🔥 Últimas unidades
                    </span>
                  )}
                </div>

                {product.variants.length <= 4 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {product.variants.map((v) => {
                      const active = selectedVariantId === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          className={cn(
                            "flex flex-col cursor-pointer rounded-xl p-2.5 sm:p-3 border transition-all duration-200 w-full text-left relative overflow-hidden group",
                            active
                              ? "border-[#a855f7] bg-[#a855f7]/10 ring-1 ring-[#a855f7]/50"
                              : "border-white/10 bg-transparent hover:bg-white/[0.03] hover:border-white/20"
                          )}
                        >
                          {active && (
                            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#a855f7]/30 to-transparent rounded-bl-3xl pointer-events-none" />
                          )}

                          <div className="flex w-full justify-between items-center gap-2 mb-1">
                            <span className={cn(
                              "font-semibold text-xs sm:text-[13px] leading-tight line-clamp-2 transition-colors flex-1",
                              active ? "text-white" : "text-white/80 group-hover:text-white"
                            )}>
                              {v.name}
                            </span>

                            <span className={cn(
                              "font-bold text-[13px] sm:text-[14px] shrink-0",
                              active ? "text-[#c084fc]" : "text-white/90"
                            )}>
                              {formatPrice(v.price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-medium tracking-wide">
                            <div className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              v.stockQuantity > 0 ? "bg-emerald-400" : "bg-red-400"
                            )} />
                            <span className={v.stockQuantity > 0 ? "text-emerald-400/80" : "text-red-400/80"}>
                              {v.stockQuantity > 0 ? "Disponível" : "Sem estoque"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                    <SelectTrigger className="w-full bg-[#0a0a0a] border-white/10 h-14 rounded-xl px-4 text-left transition-colors hover:bg-[#111]">
                      <SelectValue placeholder="Selecione uma opção..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10 rounded-xl max-h-[300px]">
                      {product.variants.map((v) => (
                        <SelectItem
                          value={v.id}
                          key={v.id}
                          className="py-3 px-4 focus:bg-[#ffffff08] cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 w-[260px] sm:w-[320px]">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-white line-clamp-1 mr-2">{v.name}</span>
                              <span className="font-bold text-purple-400 shrink-0">{formatPrice(v.price)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-white/40">
                              <span>
                                {v.stockQuantity > 0
                                  ? `Disponível`
                                  : "Sem estoque"}
                              </span>
                              {v.sku && <span>SKU: {v.sku}</span>}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="mt-auto mb-6">
              {comparePrice != null && comparePrice > displayPrice && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-white/40 line-through">
                    {formatPrice(comparePrice)}
                  </span>
                  <span className="rounded-md bg-[#a855f7]/20 px-2 py-0.5 text-[10px] font-bold text-[#a855f7] border border-[#a855f7]/30 tracking-wider">
                    {Math.round((1 - displayPrice / comparePrice) * 100)}% OFF
                  </span>
                </div>
              )}

              <div className="flex flex-col text-white">
                <span className="text-[40px] md:text-[36px] font-bold tracking-tight leading-none mb-1">
                  {product.hasVariants && !selectedVariant
                    ? formatPriceLabel(product)
                    : formatPrice(displayPrice)}
                </span>
                <span className="text-[13px] text-white/40">À vista no Pix</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 relative group" id="main-buy-button">
              {outOfStock && (
                <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center justify-center text-center text-sm text-white/50 bg-white/3 backdrop-blur-sm border border-white/10 shadow-lg shadow-white/3 rounded-xl px-4 py-2 z-10 whitespace-nowrap animate-in fade-in zoom-in duration-200">
                  <OctagonAlert className="w-4 h-4 mr-2" />
                  Esgotado no momento
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleBuyNow}
                  variant="default"
                  className="flex-2 w-full sm:w-2/4 h-16 py-4 md:h-14 font-medium rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors shadow-[0_0_20px_rgba(168,85,247,0.15)] focus:ring-4 focus:ring-[#a855f7]/30 border border-t-white/20 border-b-black/20"
                  disabled={outOfStock || (product.hasVariants && !selectedVariant)}
                >
                  Comprar agora
                </Button>

                <Button
                  variant="outline"
                  onClick={handleAdd}
                  className={cn(
                    "flex-1 w-full sm:w-1/2 h-16 py-4 md:h-14 font-medium rounded-xl border-white/10 bg-[#1c1c1c] text-white transition-colors",
                    outOfStock || (product.hasVariants && !selectedVariant)
                      ? "opacity-50"
                      : "hover:bg-[#252525] hover:text-white"
                  )}
                  disabled={outOfStock || (product.hasVariants && !selectedVariant)}
                >
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#ffffff02] p-4 transition-colors hover:bg-white/[0.02]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-400">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-white mb-0.5">Entrega imediata</h4>
            <p className="text-xs text-white/50 leading-tight">Receba seu pacote imediatamente após confirmação.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#ffffff02] p-4 transition-colors hover:bg-white/[0.02]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-white mb-0.5">Segurança total</h4>
            <p className="text-xs text-white/50 leading-tight">Sistema 100% testado criptografado de ponta-a-ponta.</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.04] bg-[#ffffff02] p-4 transition-colors hover:bg-white/[0.02]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a855f7]/20 to-purple-600/20 text-[#a855f7]">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-white mb-0.5">Formas de pagamento</h4>
            <p className="text-xs text-white/50 leading-tight">Aceitamos Pix, Cartão de Crédito e Boleto Bancário.</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.04] bg-[#ffffff02] p-6 lg:p-8 mt-6">
        <h2 className="mb-6 text-2xl font-bold text-white tracking-wide">Descrição</h2>
        {(() => {
          const desc = selectedVariant?.description || product.description;
          
          if (desc && typeof desc === "object") {
            return <RichContent content={desc} />;
          }
          
          if (typeof desc === "string" && desc.trim().length > 0) {
            return (
              <div className="text-white/70 leading-relaxed whitespace-pre-wrap font-medium">
                {desc}
              </div>
            );
          }

          return (
            <p className="text-white/50 italic text-sm">
              Este produto garante acesso instantâneo ao conteúdo digital. Entre em sua conta após o pagamento para desfrutar automaticamente das suas recompensas e jogos.
            </p>
          );
        })()}
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-white/5 pt-12">
          <h3 className="text-2xl font-bold text-white mb-8 tracking-tight uppercase">Veja também</h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {relatedProducts.map(rp => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}

      {showFloatingBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-5 border-t border-[#a855f7]/20 bg-[#111]/95 backdrop-blur-xl p-4 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-white/60 truncate pr-2 font-medium uppercase tracking-wider">{product.name}</span>
              <span className="text-xl font-bold text-white tracking-tight">{formatPrice(displayPrice)}</span>
            </div>

            <Button
              onClick={handleBuyNow}
              className="h-[52px] px-8 font-bold rounded-xl bg-[#a855f7] hover:bg-[#9333ea] text-white transition-colors shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              disabled={outOfStock || (product.hasVariants && !selectedVariant)}
            >
              Comprar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};