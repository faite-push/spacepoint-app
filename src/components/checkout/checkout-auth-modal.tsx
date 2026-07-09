"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { Mail, ArrowLeft, Loader2, AlertCircle } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { setCsrfToken, getApiHeaders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CheckoutAuthModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (email?: string) => void | Promise<void>;
  initialEmail?: string;
};

export function CheckoutAuthModal({
  open,
  onOpenChange,
  onSuccess,
  initialEmail = "",
}: CheckoutAuthModalProps) {
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function resetState() {
    setStep("email");
    setCode("");
    setError("");
    setMessage("");
    setLoading(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetState();
    if (next && initialEmail && !email) setEmail(initialEmail);
    onOpenChange(next);
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar código");

      setMessage("Código enviado para seu e-mail!");
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar código");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getApiHeaders() },
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código inválido");

      if (data.csrfToken) setCsrfToken(data.csrfToken);
      await refreshUser();
      resetState();
      await onSuccess(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar código");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "discord") => {
    const returnTo = encodeURIComponent("/checkout");
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/login/${provider}?returnTo=${returnTo}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border-white/10 bg-background sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>Entre para finalizar</DialogTitle>
          <DialogDescription>
            Faça login para concluir o pagamento. Seus dados do checkout serão mantidos.
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("google")}
                className="h-11 w-full border-white/10"
              >
                <FcGoogle className="h-5 w-5" />
                <span>Entrar com Google</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuth("discord")}
                className="h-11 w-full border-white/10"
              >
                <FaDiscord className="h-5 w-5 text-[#5865F2]" />
                <span>Entrar com Discord</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form onSubmit={handleSendCode} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar código"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Código enviado para <span className="font-medium text-white">{email}</span>
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} disabled={loading}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-10 rounded-md border" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {message && <p className="text-center text-sm text-primary/80">{message}</p>}

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" disabled={loading || code.length !== 6} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar e pagar"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Não recebeu?{" "}
              <button
                type="button"
                onClick={() => handleSendCode({ preventDefault: () => {} } as React.FormEvent)}
                className="text-primary hover:underline"
                disabled={loading}
              >
                Reenviar código
              </button>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
