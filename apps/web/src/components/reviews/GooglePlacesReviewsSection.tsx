"use client";

import { Star } from "lucide-react";
import type { GooglePlaceReviewSnippet } from "@/lib/salon-public-listing";

type GooglePlacesReviewsSectionProps = {
  reviews: GooglePlaceReviewSnippet[];
  averageRating: number;
  totalReviews: number;
};

export function GooglePlacesReviewsSection({
  reviews,
  averageRating,
  totalReviews,
}: GooglePlacesReviewsSectionProps) {
  return (
    <section id="reviews" className="space-y-6 scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Google Reviews</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Public ratings from Google Maps. Claim this business to collect verified Trimma booking reviews too.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
          <div>
            <p className="text-lg font-black text-zinc-900 leading-none">
              {averageRating > 0 ? averageRating.toFixed(1) : "New"}
            </p>
            <p className="text-[11px] text-zinc-500 font-semibold">
              {totalReviews.toLocaleString()} Google review{totalReviews === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
            <h3 className="font-bold text-zinc-800">No Google review snippets yet</h3>
            <p className="text-sm text-zinc-500 mt-1 max-w-md mx-auto">
              This listing shows the Google rating summary. Individual review text will appear after the next Google sync.
            </p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <article
              key={`${review.author_name}-${index}`}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-zinc-900">{review.author_name || "Google user"}</p>
                  {review.relative_time_description ? (
                    <p className="text-xs text-zinc-500">{review.relative_time_description}</p>
                  ) : null}
                </div>
                {review.rating ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {review.rating.toFixed(1)}
                  </div>
                ) : null}
              </div>
              {review.text ? (
                <p className="text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">{review.text}</p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
