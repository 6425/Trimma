"use client";

import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import { getSalonOwnerReviews, submitSalonReviewReply } from "@/app/actions/reviews";
import { buildReviewSummary, type SalonReviewSummary } from "@/lib/reviews";
import type { PublicSalonReview } from "@/app/actions/reviews";
import { StarRatingDisplay } from "../../../components/reviews/StarRatingInput";
import { toast } from "sonner";

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [reviews, setReviews] = useState<PublicSalonReview[]>([]);
  const [summary, setSummary] = useState<SalonReviewSummary>(buildReviewSummary([]));
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingReplyId, setSavingReplyId] = useState<string | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setReviews([]);
        setSummary(buildReviewSummary([]));
        return;
      }

      setAccessToken(session.access_token);

      const { data: salon } = await supabase
        .from("salons")
        .select("id")
        .or(`owner_email.eq.${session.user.email},owner_gmail.eq.${session.user.email}`)
        .maybeSingle();

      if (!salon?.id) {
        setReviews([]);
        setSummary(buildReviewSummary([]));
        return;
      }

      const result = await getSalonOwnerReviews(session.access_token, salon.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setReviews(result.reviews);
      setSummary(result.summary);
      setReplyDrafts(
        Object.fromEntries(
          result.reviews.map((review) => [review.id, review.reply?.text || ""])
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadReviews());
  }, []);

  const handleReply = async (reviewId: string) => {
    const replyText = replyDrafts[reviewId] || "";
    if (!accessToken) return;

    setSavingReplyId(reviewId);
    try {
      const result = await submitSalonReviewReply({
        accessToken,
        reviewId,
        replyText,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.updated ? "Reply updated." : "Reply published.");
      await loadReviews();
    } finally {
      setSavingReplyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-6 h-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Star className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Reviews</h1>
            <p className="text-xs text-zinc-500">
              Verified reviews from customers with completed bookings at your salon.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Rating</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-4xl font-black text-[#1A1C29]">
                {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "—"}
              </h2>
              <span className="text-zinc-400 text-sm font-semibold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 text-amber-500 mt-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
            {summary.totalReviews} verified review{summary.totalReviews === 1 ? "" : "s"} from completed appointments.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Rating breakdown</span>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars as 1 | 2 | 3 | 4 | 5];
            const total = summary.totalReviews || 1;
            const percentage = Math.round((count / total) * 100);
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-3 text-right font-bold text-zinc-600">{stars}★</span>
                <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
                <span className="w-8 text-right font-medium text-zinc-400">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <span className="inline-flex bg-white/10 text-white px-3 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider mb-2">
              Trust signal
            </span>
            <h3 className="text-sm font-bold">Verified review system</h3>
            <p className="text-white/60 text-[10px] mt-1.5 leading-relaxed">
              Every review is tied to a real completed booking. Reply publicly to show professionalism and care.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand" />
          Recent Verified Customer Reviews
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-10 text-sm text-zinc-500">
            No verified reviews yet. They will appear here after customers complete appointments and submit feedback.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-800">{review.authorName}</span>
                      <StarRatingDisplay rating={review.rating} />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">Verified completed booking</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-semibold">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {review.comment || "Rated the experience without a written comment."}
                </p>

                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Public salon reply
                  </label>
                  <textarea
                    value={replyDrafts[review.id] || ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))
                    }
                    placeholder="Thank the customer and invite them back..."
                    className="w-full min-h-[88px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
                    maxLength={500}
                  />
                  <Button
                    onClick={() => handleReply(review.id)}
                    disabled={savingReplyId === review.id}
                    className="h-8 rounded-lg bg-brand hover:bg-brand-hover text-white text-[10px] font-bold"
                  >
                    {savingReplyId === review.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : review.reply ? (
                      "Update reply"
                    ) : (
                      "Publish reply"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
