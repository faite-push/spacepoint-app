import Link from "next/link";
import { ExternalLink, Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const GOOGLE_MAPS_URL =
  "https://www.google.com/maps/place/SPACE+POINT+BR/@-7.2093142,-35.9250211,17z/data=!3m1!4b1!4m6!3m5!1s0x7aea18ac87197b5:0x3888113ed3e895d!8m2!3d-7.2093195!4d-35.9224462";

const AVERAGE_RATING = 4.9;
const TOTAL_REVIEWS = 127;

const reviews = [
  {
    id: 1,
    name: "Gabriel Mendonça",
    avatar: "https://i.pravatar.cc/80?img=12",
    initials: "GM",
    rating: 5,
    comment:
      "Comprei um jogo de PS5 e chegou super rápido! Produto original, ativação sem problemas. Muito confiável, já virei cliente fiel.",
    date: "há 2 semanas",
  },
  {
    id: 2,
    name: "Aline Ferreira",
    avatar: "https://i.pravatar.cc/80?img=47",
    initials: "AF",
    rating: 5,
    comment:
      "Atendimento excelente e entrega imediata. Sempre compro aqui quando quero jogos com preço justo. Recomendo 100%!",
    date: "há 1 mês",
  },
  {
    id: 3,
    name: "Lucas Rodrigues",
    avatar: "https://i.pravatar.cc/80?img=33",
    initials: "LR",
    rating: 5,
    comment:
      "Melhor loja de jogos digitais que conheço. Fui atendido prontamente, tirei todas as dúvidas e o código funcionou de primeira.",
    date: "há 3 semanas",
  },
];

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`}
        />
      ))}
    </div>
  );
}

export function GoogleReviewsSection() {
  return (
    <section className="w-full py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 shadow-sm">
            <GoogleIcon className="h-4 w-4" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Google Reviews
            </span>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            O que nossos clientes dizem
          </h2>
          <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
            Mais de {TOTAL_REVIEWS} clientes avaliaram nossa loja no Google. Veja o que eles acharam.
          </p>

          <div className="mt-2 flex items-center gap-4 rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
            <span className="text-5xl font-black text-foreground leading-none">{AVERAGE_RATING}</span>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                Baseado em {TOTAL_REVIEWS} avaliações
              </span>
              <Link
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                Ver todas as avaliações
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Review cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Decorative quote icon */}
              <Quote className="absolute right-5 top-5 h-8 w-8 text-violet-500/10 group-hover:text-violet-500/20 transition-colors" />

              {/* Stars */}
              <StarRow rating={review.rating} />

              {/* Comment */}
              <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                &ldquo;{review.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 ring-2 ring-violet-500/30">
                    <AvatarImage src={review.avatar} alt={review.name} />
                    <AvatarFallback className="bg-violet-600/20 text-xs font-semibold text-violet-300">
                      {review.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">
                      {review.name}
                    </p>
                    {review.date && (
                      <p className="text-[11px] text-muted-foreground">{review.date}</p>
                    )}
                  </div>
                </div>
                <GoogleIcon className="h-4 w-4 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}