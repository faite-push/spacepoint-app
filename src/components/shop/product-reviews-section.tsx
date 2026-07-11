"use client";

import { useState } from "react";
import { Calendar, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { fetchProductReviewsClient, type ProductReviewsResponse, type PublicStoreReview, } from "@/lib/store-reviews-api";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  const first = parts[0][0]?.toUpperCase() ?? "";
  if (parts.length === 1) return first;
  return `${first}${parts[parts.length - 1][0]?.toUpperCase() ?? ""}`;
};

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg"; }) {
  const starSize = size === "sm" ? "size-3.5" : size === "lg" ? "size-5" : "size-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            starSize,
            i < rating ? "fill-primary text-primary" : "fill-white/10 text-white/15"
          )}
        />
      ))}
    </div>
  );
};

function RatingDistribution({ distribution, total }: { distribution: ProductReviewsResponse["summary"]["distribution"]; total: number; }) {
  const rows = [5, 4, 3, 2, 1] as const;

  return (
    <div className="space-y-2">
      {rows.map((stars) => {
        const count = distribution[stars] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={stars} className="flex items-center gap-2 text-xs">
            <span className="w-3 text-white/50">{stars}</span>
            <Star className="size-3 fill-primary/80 text-primary/80" />
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-8 text-right text-white/40">{count}</span>
          </div>
        );
      })}
    </div>
  );
};

function ProductReviewCard({ review }: { review: PublicStoreReview }) {
  const message =
    review.comment?.trim() ||
    review.tags?.join(" · ") ||
    "Ótima experiência de compra.";

  return (
    <article className="rounded-lg border border-white/5 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <span className="text-sm font-semibold uppercase text-primary">
              {initialsFromName(review.name)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{review.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
              <Calendar className="size-3 shrink-0" />
              {formatReviewDate(review.dateLabel)}
            </p>
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>

      {review.variantName ? (
        <p className="mt-3 text-xs text-white/45">
          Comprou: <span className="text-white/70">{review.variantName}</span>
        </p>
      ) : null}

      <p className="mt-3 text-sm leading-relaxed text-white/70">{message}</p>

      {review.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-white/5 px-2 py-1 text-xs text-white/60"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {review.sellerResponse ? (
        <div className="mt-4 rounded-md border border-primary/15 bg-primary/5 p-3">
          <p className="mb-1 text-[11px] font-semibold text-primary/80">
            Resposta da loja
          </p>
          <p className="text-sm text-white/75">{review.sellerResponse}</p>
        </div>
      ) : null}
    </article>
  );
};

type ProductReviewsSectionProps = {
  productSlug: string;
  initialData: ProductReviewsResponse;
};

export function ProductReviewsSection({ productSlug, initialData, }: ProductReviewsSectionProps) {
  const [data, setData] = useState(initialData);
  const [loadingMore, setLoadingMore] = useState(false);

  if (data.summary.total === 0) return null;

  const canLoadMore = data.pagination.page < data.pagination.totalPages;

  async function handleLoadMore() {
    if (!canLoadMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchProductReviewsClient(productSlug, {
        page: data.pagination.page + 1,
        limit: data.pagination.limit,
      });
      setData((prev) => ({
        ...next,
        reviews: [...prev.reviews, ...next.reviews],
      }));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="rounded-lg border border-white/5 bg-transparent p-6 lg:p-8 mt-6">
      <div className="mb-6 flex items-center gap-2">
        <Star className="size-5 text-primary" />
        <h2 className="text-2xl font-bold text-white tracking-wide">Avaliações</h2>
      </div>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <div className="rounded-lg border border-white/5 bg-white/[0.02] p-5 h-fit">
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-white leading-none">
              {data.summary.averageRating.toFixed(1)}
            </span>
            <div className="pb-1">
              <Stars rating={Math.round(data.summary.averageRating)} size="sm" />
              <p className="mt-1 text-xs text-white/45">
                {data.summary.total} avaliação{data.summary.total === 1 ? "" : "ões"}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <RatingDistribution
              distribution={data.summary.distribution}
              total={data.summary.total}
            />
          </div>
        </div>

        <div className="space-y-4">
          {data.reviews.map((review) => (
            <ProductReviewCard key={review.id} review={review} />
          ))}

          {canLoadMore ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-transparent hover:bg-white/5"
                disabled={loadingMore}
                onClick={handleLoadMore}
              >
                {loadingMore ? "Carregando..." : "Ver mais avaliações"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export function ProductRatingBadge({ summary, }: { summary: ProductReviewsResponse["summary"]; }) {
  if (!summary.total) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      <Stars rating={Math.round(summary.averageRating)} size="sm" />
      <span className="text-sm text-white/60">
        <span className="font-semibold text-white">{summary.averageRating.toFixed(1)}</span>
        {" · "}
        {summary.total} avaliação{summary.total === 1 ? "" : "ões"}
      </span>
    </div>
  );
};