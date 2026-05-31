"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FcGoogle } from "react-icons/fc";
import { FaDiscord } from "react-icons/fa";
import { Mail, Lock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Código inválido");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao verificar código");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "discord") => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/login/${provider}`;
  };

  return (
    <div className="relative flex items-center justify-center overflow-hidden bg-background px-4 mb-12">
      <div className="absolute inset-0 opacity-80" style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`, backgroundSize: "50px 50px" }} />

      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />

      <div className="relative mx-auto z-10 w-full md:w-[600px]">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-white/90">Fazer login</h1>
          <p className="text-white/40 font-light">Entre com sua conta para continuar</p>
        </div>

        <div className="max-w-full rounded-2xl border border-white/5 bg-[#0d0d0d]/90 py-6 px-6 backdrop-blur-sm">
          {step === "email" ? (
            <>
              <div className="space-y-3">
                <button
                  onClick={() => handleOAuth("google")}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/5 text-white/80 transition-all duration-300 hover:bg-white/10"
                >
                  <FcGoogle className="h-5 w-5" />
                  <span className="font-normal">Entrar com Google</span>
                </button>

                <button
                  onClick={() => handleOAuth("discord")}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/5 text-white/80 transition-all duration-300 hover:bg-white/10"
                >
                  <FaDiscord className="h-5 w-5 text-[#5865F2]" />
                  <span className="font-normal">Entrar com Discord</span>
                </button>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-sm text-gray-500">ou</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email:
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-12 w-full rounded-xl border border-white/5 bg-white/5 pl-12 pr-4 text-white placeholder:text-gray-500 focus:border-primary/50 focus:outline-none focus:none transition-all duration-300"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center cursor-pointer justify-center rounded-xl bg-primary text-black transition-all duration-300 hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Entrar"
                  )}
                </button>
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
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Código de verificação:
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="h-12 w-full rounded-xl border border-white/5 bg-white/5 px-4 text-center text-2xl tracking-[0.5em] text-white placeholder:text-gray-500 focus:border-primary/50 focus:outline-none focus:none transition-all duration-300"
                    required
                    disabled={loading}
                  />
                </div>

                {message && (
                  <p className="text-sm text-primary/70">{message}</p>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex h-12 w-full items-center cursor-pointer justify-center rounded-xl bg-primary font-medium text-black transition-all duration-300 hover:bg-primary/80 disabled:opacity-30"
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
          <Link href="#" className="text-primary hover:text-primary/80 transition-all duration-300">
            Termos de Serviço
          </Link>
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
