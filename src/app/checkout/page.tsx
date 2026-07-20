"use client";

import { useState, useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";

import { ChevronRight, Minus, Plus, Trash2, Ticket, PlusCircle, User, Mail, Zap, ArrowRight, Loader2, ShoppingCart, AlertCircle, Check, Lock, X, CreditCard, Phone, Truck, FingerprintPattern } from "lucide-react";
import { BsCreditCard2FrontFill } from "react-icons/bs";
import { FaPix } from "react-icons/fa6";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { createOrder, fetchCheckoutPaymentOptions, formatPrice, fetchProducts } from "@/lib/shop-api";
import { fetchSiteConfig } from "@/lib/site-api";
import { API_URL, getApiHeaders } from "@/lib/api";
import { captureCartEmail, clearAbandonedCart, recoverAbandonedCart } from "@/lib/cart-api";
import { clearCartRecoverySession, getCartRecoverySession, saveCartRecoverySession } from "@/lib/cart-recovery";
import { getVisitorId } from "@/lib/visitor-id";
import { trackStorefrontInitiateCheckout } from "@/lib/storefront-plugin-events";
import { DEFAULT_CHECKOUT_SETTINGS, resolveEffectiveCheckoutFields, formatCpfInput, formatPhoneInput } from "@/lib/checkout-defaults";
import {
  clearSavedCheckoutData,
  getSavedCheckoutData,
  maskCheckoutValue,
  saveCheckoutData,
} from "@/lib/checkout-saved-data";
import type { CheckoutFieldConfig } from "@/lib/admin-api";
import { useAuth } from "@/context/auth-context";
import { useCartStore, useCartHydrated } from "@/store/cart-store";
import type { Product } from "@/types/shop";
import { cartItemKey } from "@/types/shop";
import { CheckoutAuthModal } from "@/components/checkout/checkout-auth-modal";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, total, subtotal, discount, setQuantity, removeItem, clear, applyCoupon, appliedCoupon, removeCoupon, replaceItems } = useCartStore();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [status, setStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARD">("PIX");
  const [deliveryOption, setDeliveryOption] = useState<"standard" | "express">("standard");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [maskedFields, setMaskedFields] = useState<Record<string, boolean>>({});
  const [hasLoadedSavedData, setHasLoadedSavedData] = useState(false);
  const [saveForNextPurchase, setSaveForNextPurchase] = useState(false);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [savePromptShown, setSavePromptShown] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const hydrated = useCartHydrated();
  const paymentOptionsQuery = useQuery({
    queryKey: ["checkout", "payment-options", paymentMethod],
    queryFn: () => fetchCheckoutPaymentOptions(paymentMethod),
  });

  const checkoutConfigQuery = useQuery({
    queryKey: ["checkout", "site-config"],
    queryFn: fetchSiteConfig,
  });

  const checkoutSettings = checkoutConfigQuery.data?.checkoutSettings ?? DEFAULT_CHECKOUT_SETTINGS;
  const authMode = checkoutSettings.authMode ?? "inline_at_payment";
  const requiredFieldKeys = paymentOptionsQuery.data?.requiredFieldsByMethod?.[paymentMethod] || paymentOptionsQuery.data?.requiredCustomerFields || [];
  const enabledFields = resolveEffectiveCheckoutFields(checkoutSettings, requiredFieldKeys);
  const deliverySettings = checkoutSettings.deliveryOptions ?? DEFAULT_CHECKOUT_SETTINGS.deliveryOptions!;
  const deliveryFee = deliveryOption === "express" && deliverySettings.enabled ? deliverySettings.expressFeeCents : 0;
  const orderTotal = total() + deliveryFee;
  const allFieldsFilled = enabledFields.every((field) => {
    const value = String(fieldValues[field.key] || "").trim();
    return !field.required || value.length > 0;
  }) && Object.keys(fieldErrors).length === 0;

  const availableMethods = paymentOptionsQuery.data?.methods || ["PIX"];
  const pixAvailable = availableMethods.includes("PIX");
  const cardAvailable = availableMethods.includes("CARD");

  useEffect(() => {
    if (authLoading || user) return;
    if (authMode === "login_before_checkout") {
      router.replace(`/login?from=${encodeURIComponent("/checkout")}`);
    }
  }, [authLoading, user, authMode, router]);

  useEffect(() => {
    if (!hydrated) return;
    const token = searchParams.get("recover");
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const recovered = await recoverAbandonedCart(token);
        if (cancelled) return;
        saveCartRecoverySession({
          token,
          source: searchParams.get("src"),
          cartId: recovered.cartId,
        });
        replaceItems(
          recovered.items.map((item) => ({
            cartKey: cartItemKey(item.productId, item.variantId),
            productId: item.productId,
            variantId: item.variantId,
            variantName: null,
            slug: item.slug || item.productId,
            name: item.name,
            price: item.price,
            image: item.image || undefined,
            platform: "",
            quantity: item.quantity,
          }))
        );
        if (recovered.couponCode) {
          try {
            await applyCoupon(recovered.couponCode);
          } catch {
            /* cupom pode estar inválido */
          }
        }
        toast.success("Carrinho recuperado com sucesso");
        router.replace("/checkout");
      } catch {
        if (!cancelled) toast.error("Não foi possível recuperar este carrinho");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, searchParams, replaceItems, applyCoupon, router]);

  useEffect(() => {
    if (!checkoutSettings) return;

    setAcceptedTerms(Boolean(checkoutSettings.termsCheckedByDefault));

    const saved = getSavedCheckoutData(user?.id);
    const initialValues: Record<string, string> = {};
    const initialMasked: Record<string, boolean> = {};

    for (const field of checkoutSettings.fields || []) {
      if (!field.enabled) continue;

      const savedValue = saved?.values[field.key];
      if (savedValue) {
        initialValues[field.key] = savedValue;
        initialMasked[field.key] = true;
      } else if (field.prefillFromUser === "name" && checkoutSettings.prefillUserName && user?.name) {
        initialValues[field.key] = user.name;
      } else if (field.prefillFromUser === "email" && checkoutSettings.prefillUserEmail && user?.email) {
        initialValues[field.key] = user.email;
      } else {
        initialValues[field.key] = "";
      }
    }

    setFieldValues(initialValues);
    setMaskedFields(initialMasked);
    setHasLoadedSavedData(!!saved);
    setSaveForNextPurchase(!!saved);
    setSavePromptShown(false);
  }, [checkoutSettings, user?.id, user?.name, user?.email]);

  useEffect(() => {
    if (!allFieldsFilled || hasLoadedSavedData || savePromptShown) return;
    setSavePromptOpen(true);
    setSavePromptShown(true);
  }, [allFieldsFilled, hasLoadedSavedData, savePromptShown]);

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
    if (!hydrated || items.length === 0) return;

    trackStorefrontInitiateCheckout({
      value: orderTotal / 100,
      contentIds: items.map((item) => item.productId),
      numItems: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    const emailField = enabledFields.find((field) => field.key === "email" || field.type === "email");
    if (!emailField) return;

    const email = String(fieldValues[emailField.key] || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    const nameField = enabledFields.find((field) => field.key === "name" || field.prefillFromUser === "name");
    const customerName = nameField ? String(fieldValues[nameField.key] || "").trim() : "";
    const phoneField = enabledFields.find((field) => field.key === "phone" || field.type === "phone");
    const phone = phoneField ? String(fieldValues[phoneField.key] || "").trim() : "";
    const cpfField = enabledFields.find((field) => field.key === "cpf" || field.type === "cpf");
    const document = cpfField ? String(fieldValues[cpfField.key] || "").trim() : "";

    const timer = setTimeout(() => {
      captureCartEmail({
        visitorId,
        email,
        customerName: customerName || undefined,
        phone: phone || undefined,
        document: document || undefined,
      }).catch(() => { });
    }, 1500);

    return () => clearTimeout(timer);
  }, [fieldValues, enabledFields, hydrated]);

  useEffect(() => {
    if (!pixAvailable && paymentMethod === "PIX" && cardAvailable) {
      setPaymentMethod("CARD");
    }
    if (!cardAvailable && paymentMethod === "CARD" && pixAvailable) {
      setPaymentMethod("PIX");
    }
  }, [cardAvailable, pixAvailable, paymentMethod]);

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

  function validateCheckoutFields() {
    const errors: Record<string, string> = {};
    for (const field of enabledFields) {
      const value = String(fieldValues[field.key] || "").trim();
      if (field.required && !value) {
        errors[field.key] = `${field.label} é obrigatório`;
      }
      if (field.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors[field.key] = "E-mail inválido";
      }
      if ((field.key === "cpf" || field.type === "cpf") && value) {
        const digits = value.replace(/\D/g, "");
        if (digits.length !== 11) errors[field.key] = "CPF inválido";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function revealField(key: string) {
    setMaskedFields((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function resolvePersistUserId() {
    if (user?.id) return user.id;

    try {
      const res = await fetch(`${API_URL}/v2/api/request/me`, {
        credentials: "include",
        headers: getApiHeaders({ "Content-Type": "application/json" }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.id || null;
    } catch {
      return null;
    }
  }

  async function persistCheckoutDataPreference(values: Record<string, string>) {
    const persistUserId = await resolvePersistUserId();

    if (saveForNextPurchase) {
      saveCheckoutData(values, persistUserId);
      return;
    }
    if (hasLoadedSavedData) {
      clearSavedCheckoutData(persistUserId);
    }
  }

  async function createOrderAndRedirect(checkoutDataOverride?: Record<string, string>) {
    setIsSubmitting(true);
    setStatus("Processando seu pedido seguro...");

    const checkoutData = checkoutDataOverride ?? fieldValues;

    try {
      await persistCheckoutDataPreference(checkoutData);

      const recovery = getCartRecoverySession();
      const order = await createOrder(
        items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        {
          couponCode: appliedCoupon?.code ?? null,
          paymentMethod,
          checkoutData,
          deliveryOption,
          recoveryToken: recovery?.token ?? null,
          recoverySource: recovery?.source ?? null,
        }
      );
      clearCartRecoverySession();
      clear();
      const visitorId = getVisitorId();
      if (visitorId) {
        clearAbandonedCart(visitorId).catch(() => { });
      }
      window.location.href = `/checkout/payment/${order.id}?paymentMethod=${paymentMethod}`;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao criar pedido");
      setIsSubmitting(false);
    }
  }

  async function handleAuthSuccess(authedEmail?: string) {
    setAuthModalOpen(false);

    let checkoutData = fieldValues;
    if (authedEmail) {
      const emailField = enabledFields.find((f) => f.key === "email" || f.type === "email");
      if (emailField) {
        checkoutData = { ...fieldValues, [emailField.key]: authedEmail };
        setFieldValues(checkoutData);
      }
    }

    await refreshUser();
    await createOrderAndRedirect(checkoutData);
  }

  async function submitOrder() {
    if (!acceptedTerms || isSubmitting || authLoading) return;
    if (!validateCheckoutFields()) return;

    if (!user) {
      if (authMode === "inline_at_payment") {
        setAuthModalOpen(true);
        return;
      }
      return;
    }

    await createOrderAndRedirect();
  };

  if (!authLoading && !user && authMode === "login_before_checkout") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-12 -mt-32 py-6 md:py-12 relative">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-0 left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="mb-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium mb-4">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-zinc-300">Checkout</span>
          </div>
          <h1 className="text-4xl font-black">Finalizar Compra</h1>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 bg-white/[0.01] border border-primary/5 rounded-md p-6 sm:p-6 gap-4">
              <section className="">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  Formas de pagamento
                </h2>

                <div className="grid gap-4">
                  <button
                    type="button"
                    onClick={() => pixAvailable && setPaymentMethod("PIX")}
                    disabled={!pixAvailable}
                    className={`relative group select-none overflow-hidden text-left ${!pixAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`relative flex items-center justify-between p-4 rounded-md cursor-pointer border transition-colors ${paymentMethod === "PIX" ? "border-primary/20 bg-primary/10" : "border-white/10 bg-transparent"}`}>
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
                          <p className="text-xs text-zinc-500 font-medium mt-1">
                            {pixAvailable ? "Aprovação imediata" : "Ative Pix em um gateway na dashboard"}
                          </p>
                        </div>
                      </div>
                      {paymentMethod === "PIX" && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => cardAvailable && setPaymentMethod("CARD")}
                    disabled={!cardAvailable}
                    className={`relative group select-none cursor-pointer overflow-hidden text-left ${!cardAvailable ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className={`relative flex items-center justify-between p-4 rounded-md border transition-colors ${paymentMethod === "CARD" ? "border-primary/20 bg-primary/10" : "border-white/10 bg-transparent"}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center">
                          <BsCreditCard2FrontFill className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">Cartão</span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium mt-1">
                            {cardAvailable ? "Pague com cartão de crédito" : "Metodo de pagamento não disponível"}
                          </p>
                        </div>
                      </div>
                      {paymentMethod === "CARD" && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </button>
                </div>
              </section>

              {deliverySettings.enabled && (
                <section className="">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    Tipo de entrega
                  </h2>
                  <div className="grid gap-4">
                    <button
                      type="button"
                      onClick={() => setDeliveryOption("standard")}
                      className="text-left cursor-pointer"
                    >
                      <div className={`flex items-center justify-between p-4 rounded-md border transition-colors ${deliveryOption === "standard" ? "border-primary/20 bg-primary/10" : "border-white/10 bg-transparent"}`}>
                        <div>
                          <p className="font-bold text-white">{deliverySettings.standardLabel}</p>
                          <p className="text-xs text-zinc-500 font-medium mt-1">{deliverySettings.standardDescription}</p>
                        </div>
                        <div className="text-sm font-bold text-emerald-400">Grátis</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryOption("express")}
                      className="text-left cursor-pointer"
                    >
                      <div className={`flex items-center justify-between p-4 rounded-md border transition-colors ${deliveryOption === "express" ? "border-primary/20 bg-primary/10" : "border-white/10 bg-transparent"}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{deliverySettings.expressLabel}</p>
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <Zap className="h-2.5 w-2.5 fill-current" /> Mais rápido
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium mt-1">{deliverySettings.expressDescription}</p>
                        </div>
                        <div className="text-sm font-bold text-white">+ {formatPrice(deliverySettings.expressFeeCents)}</div>
                      </div>
                    </button>
                  </div>
                </section>
              )}
            </div>

            <section className="bg-white/[0.01] border border-primary/5 rounded-md p-6 sm:p-6 select-none">
              <h2 className="text-xl font-bold mb-3">Informações de contato</h2>

              {hasLoadedSavedData && (
                <div className="mb-4 flex items-center gap-3 rounded-md bg-primary/10 px-4 py-3 text-sm text-primary">
                  <Lock className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <p>
                    Seus dados salvos foram carregados com proteção parcial. Clique em um campo para visualizar ou editar.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {enabledFields.map((field) => (
                  <CheckoutFieldInput
                    key={field.key}
                    field={field}
                    value={fieldValues[field.key] || ""}
                    error={fieldErrors[field.key]}
                    masked={Boolean(maskedFields[field.key])}
                    onReveal={() => revealField(field.key)}
                    onChange={(value) => {
                      revealField(field.key);
                      setFieldValues((prev) => ({ ...prev, [field.key]: value }));
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next[field.key];
                        return next;
                      });
                    }}
                  />
                ))}
              </div>

              {allFieldsFilled && (
                <div className="flex items-center bg-transparent border border-white/5 px-4 py-3 gap-2 mt-4 rounded-lg">
                  <Toggle
                    pressed={saveForNextPurchase}
                    onPressedChange={setSaveForNextPurchase}
                    variant="default"
                    size="sm"
                    className="h-8 w-8 rounded-sm"
                  >
                    {saveForNextPurchase ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Toggle>
                  <Label htmlFor="save-checkout-data" className="cursor-pointer select-none">
                    <p className="text-sm font-medium text-white">Salvar dados para a próxima compra</p>
                    <p className="text-xs text-white/50 mt-0.5">
                      Armazenados apenas neste dispositivo para agilizar seus próximos pedidos.
                    </p>
                  </Label>
                </div>
              )}
            </section>

            {recommendations.length > 0 && (
              <div className="mt-8 bg-white/[0.01] rounded-md p-5 border border-primary/5">
                <h4 className="text-lg font-bold flex items-center gap-2 mb-4 text-white/90">
                  <Zap className="h-4 w-4 fill-primary text-primary" /> Jogos que combinam com você
                </h4>

                <div className="grid gap-3">
                  {recommendations.map(rec => (
                    <div key={rec.id} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-2.5 rounded-md group hover:bg-white/[0.04] transition-colors">
                      <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-white/5 border border-white/5">
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

            <div className="lg:hidden space-y-2">
              {status && (
                <div className="bg-emerald-500/10 text-emerald-500 text-center text-sm font-bold py-3 rounded-md">
                  {status}
                </div>
              )}

              <Button
                onClick={submitOrder}
                disabled={!acceptedTerms || items.length === 0 || isSubmitting || authLoading}
                className="w-full h-12 rounded-lg text-md font-semibold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : `Pagar ${hydrated ? formatPrice(orderTotal) : "R$ 0,00"}`}
              </Button>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="bg-white/[0.01] border border-primary/5 rounded-md p-6 sm:p-8 sticky top-12">
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
                  <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary/20 rounded-md flex items-center justify-center">
                        <Ticket className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary">Cupom {appliedCoupon.code} está ativado!</div>
                      </div>
                    </div>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            onClick={removeCoupon}
                            size="icon">
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
                          className={`h-12 pl-12 bg-transparent border-white/5 rounded-md focus:border-primary/30 focus:bg-white/2 text-white ${couponError ? "border-red-500/50" : ""}`}
                        />
                      </div>

                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              onClick={handleApplyCoupon}
                              disabled={isApplyingCoupon || !couponInput}
                              className="h-12 p-4 bg-primary font-bold text-white hover:bg-primary/90 rounded-md"
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
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Subtotal</span>
                  <span className="text-white font-medium">{hydrated ? formatPrice(subtotal()) : "R$ 0,00"}</span>
                </div>
                {hydrated && discount() > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Desconto</span>
                    <span className="text-emerald-400 font-medium">- {formatPrice(discount())}</span>
                  </div>
                )}
                {hydrated && deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Entrega expressa</span>
                    <span className="text-white font-medium">+ {formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <Separator className="my-1 bg-white/5" />
                <div className="flex justify-between items-end">
                  <span className="text-lg text-white/60">Valor Total</span>
                  <span className="text-2xl font-semibold text-white">
                    {hydrated ? formatPrice(orderTotal) : "R$ 0,00"}
                  </span>
                </div>
              </div>

              <div className="hidden lg:block space-y-2 mt-4">
                {status && (
                  <div className="bg-emerald-500/10 text-emerald-500 text-center text-sm font-bold py-3 rounded-md">
                    {status}
                  </div>
                )}

                <Button
                  onClick={submitOrder}
                  disabled={!acceptedTerms || items.length === 0 || isSubmitting || authLoading}
                  className="w-full h-12 rounded-md text-md font-semibold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processando...</span>
                    </div>
                  ) : (
                    <>
                      <span>Pagar {hydrated ? formatPrice(orderTotal) : "R$ 0,00"}</span>
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="h-5 w-5 rounded cursor-pointer border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium text-zinc-400 cursor-pointer select-none"
              >
                Eu aceito os <span className="text-white font-semibold decoration-primary underline-offset-4">termos e condições</span> desta compra.
              </label>
            </div>
          </aside>
        </div>
      </div>

      <CheckoutAuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        onSuccess={handleAuthSuccess}
        initialEmail={fieldValues.email || fieldValues["email"] || ""}
      />

      <Dialog open={savePromptOpen} onOpenChange={setSavePromptOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar dados para a próxima compra?</DialogTitle>
            <DialogDescription>
              Podemos guardar suas informações neste dispositivo para preencher o checkout automaticamente da próxima vez.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row gap-2">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => {
                setSaveForNextPurchase(false);
                setSavePromptOpen(false);
              }}
            >
              Agora não
            </Button>
            <Button
              variant="default"
              size="lg"
              className="flex-1"
              onClick={() => {
                setSaveForNextPurchase(true);
                setSavePromptOpen(false);
              }}
            >
              Sim, salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckoutFieldInput({ field, value, error, onChange, masked = false, onReveal, }: { field: CheckoutFieldConfig; value: string; error?: string; onChange: (value: string) => void; masked?: boolean; onReveal?: () => void; }) {
  const iconMap: Record<string, ComponentType<any>> = { email: Mail, phone: Phone, tel: Phone, cpf: FingerprintPattern, };
  const Icon = iconMap[field.type] || iconMap[field.key] || User;
  const displayValue = masked ? maskCheckoutValue(field.key, field.type, value) : value;

  function handleChange(raw: string) {
    if (masked) onReveal?.();

    if (field.key === "cpf" || field.type === "cpf") {
      onChange(formatCpfInput(raw));
      return;
    }
    if (field.key === "phone" || field.type === "tel") {
      onChange(formatPhoneInput(raw));
      return;
    }
    onChange(raw);
  }

  return (
    <div>
      <label htmlFor={field.key} className="text-sm font-medium text-white/40">{field.label}</label>
      <div className="relative">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
        <Input
          id={field.key}
          type={field.type === "cpf" ? "text" : field.type}
          inputMode={field.type === "cpf" || field.type === "tel" ? "numeric" : undefined}
          placeholder={field.placeholder || field.label}
          value={displayValue}
          onFocus={() => masked && onReveal?.()}
          onChange={(e) => handleChange(e.target.value)}
          className={`h-14 pl-12 bg-transparent border-white/5 rounded-lg focus:border-primary/30 focus:bg-white/1 text-white ${error ? "border-red-500/50" : ""} ${masked ? "text-white/60 tracking-wide" : ""}`}
        />
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-400 font-medium px-1">{error}</p>
      )}
    </div>
  );
};