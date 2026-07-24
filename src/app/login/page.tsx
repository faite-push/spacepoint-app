"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { Mail, Lock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { setCsrfToken, getApiHeaders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot, } from "@/components/ui/input-otp";

function safeRedirectPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) return "/";
  return from;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const redirectTo = safeRedirectPath(searchParams.get("from"));

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        no_code: "Código de autorização não recebido.",
        discord_token: "Erro ao obter token do Discord.",
        discord_failed: "Falha na autenticação com Discord.",
        google_token: "Erro ao obter token do Google.",
        google_failed: "Falha na autenticação com Google.",
      };
      setError(errorMessages[errorParam] || "Erro na autenticação.");
    }
  }, [searchParams]);

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

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar código");
      }

      setMessage("Código enviado para seu email!");
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

      if (!res.ok) {
        throw new Error(data.error || "Código inválido");
      }

      if (data.csrfToken) setCsrfToken(data.csrfToken);

      await refreshUser();
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar código");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "discord") => {
    const qs =
      redirectTo !== "/"
        ? `?returnTo=${encodeURIComponent(redirectTo)}`
        : "";
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/login/${provider}${qs}`;
  };

  return (
    <div className="relative py-6 md:py-12 -mt-22">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="relative mx-auto z-10 w-full md:w-[600px]">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white/90">Fazer login</h1>
          <p className="text-white/40 font-light">Entre com sua conta para continuar</p>
        </div>

        <div className="max-w-full rounded-lg border border-white/5 bg-transparent py-6 px-6 backdrop-blur-sm">
          {step === "email" ? (
            <>
              <div className="space-y-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleOAuth("google")}
                  className="h-12 w-full rounded-md border border-white/5"
                >
                  <FcGoogle className="h-5 w-5" />
                  <span className="font-normal">Entrar com Google</span>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleOAuth("discord")}
                  className="h-12 w-full rounded-md border border-white/5"
                >
                  <FaDiscord className="h-5 w-5 text-[#5865F2]" />
                  <span className="font-normal">Entrar com Discord</span>
                </Button>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-sm text-gray-500">ou</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-12 h-12 w-full"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-md border border-white/5"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-2">
                <button
                  onClick={() => setStep("email")}
                  className="flex cursor-pointer items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>
              </div>

              <div className="mb-6 text-center">
                <h2 className="mb-2 text-xl font-semibold text-white">Verificação</h2>
                <p className="text-sm text-gray-400">
                  Digite o código de 6 dígitos enviado para
                </p>
                <p className="mt-1 text-sm font-medium text-primary/80">{email}</p>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="flex justify-center mb-2 block text-sm font-medium text-gray-300">
                    Código de verificação
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={(val) => setCode(val)}
                      disabled={loading}
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="w-12 h-14 text-xl rounded-md border" />
                        <InputOTPSlot index={1} className="w-12 h-14 text-xl rounded-md border" />
                        <InputOTPSlot index={2} className="w-12 h-14 text-xl rounded-md border" />
                        <InputOTPSlot index={3} className="w-12 h-14 text-xl rounded-md border" />
                        <InputOTPSlot index={4} className="w-12 h-14 text-xl rounded-md border" />
                        <InputOTPSlot index={5} className="w-12 h-14 text-xl rounded-md border" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>

                {message && (
                  <p className="text-sm text-primary/70">{message}</p>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex h-12 w-full items-center cursor-pointer justify-center rounded-md bg-primary font-medium text-black transition-all duration-300 hover:bg-primary/80 disabled:opacity-30"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Verificar"
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-gray-500">
                Não recebeu o código?{" "}
                <button
                  onClick={() => handleSendCode({ preventDefault: () => { } } as React.FormEvent)}
                  className="text-primary/80 cursor-pointer hover:text-primary/100 transition-all duration-300"
                  disabled={loading}
                >
                  Reenviar
                </button>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm font-light text-white/60">
          Ao fazer login, você concorda com nossos{" "}
          <Link href="/terms" className="text-primary hover:text-primary/80 transition-all duration-300">
            Termos de Serviço
          </Link>
          {" "}e{" "}
          <Link href="/privacy" className="text-primary hover:text-primary/80 transition-all duration-300">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
