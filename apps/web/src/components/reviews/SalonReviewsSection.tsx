"use client";

import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, MessageSquare, Star } from "lucide-react";
import type { PublicSalonReview } from "@/app/actions/reviews";
import type { SalonReviewSummary } from "@/lib/reviews";
import { StarRatingDisplay } from "./StarRatingInput";

type SalonReviewsSectionProps = {
  reviews: PublicSalonReview[];
  summary: SalonReviewSummary;
};

export function SalonReviewsSection({ reviews, summary }: SalonReviewsSectionProps) {
  const distributionTotal = Object.values(summary.distribution).reduce((sum, count) => sum + count, 0);

  return (
    <section id="reviews" className="space-y-6 scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Verified Customer Reviews</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Only customers with a confirmed Trimma booking can leave a public review.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          <div>
            <p className="text-lg font-black text-zinc-900 leading-none">
              {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "New"}
            </p>
            <p className="text-[11px] text-zinc-500 font-semibold">
              {summary.totalReviews} verified review{summary.totalReviews === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Rating breakdown</p>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars as 1 | 2 | 3 | 4 | 5];
            const width = distributionTotal > 0 ? Math.round((count / distributionTotal) * 100) : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-bold text-zinc-600">{stars}★</span>
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${width}%` }} />
                </div>
                <span className="w-6 text-right font-medium text-zinc-400">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
              <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="font-bold text-zinc-800">No verified reviews yet</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
                Reviews appear here after customers book through Trimma, attend their visit, and share feedback.
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-zinc-900">{review.authorName}</span>
                      {review.verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified booking
                        </span>
                      )}
                    </div>
                    <StarRatingDisplay rating={review.rating} />
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {review.comment ? (
                  <p className="text-sm text-zinc-600 leading-relaxed">{review.comment}</p>
                ) : (
                  <p className="text-sm text-zinc-400 italic">Rated the experience without a written comment.</p>
                )}

                {review.reply ? (
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1">Salon reply</p>
                    <p className="text-sm text-zinc-700 leading-relaxed">{review.reply.text}</p>
                  </div>
                ) : null}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
