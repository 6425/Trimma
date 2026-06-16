"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ShieldCheck, Star, Trash2, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchAdminReviewsPage,
  moderateAdminReview,
  type AdminReviewRow,
} from "@/app/actions/admin-reviews";
import { StarRatingDisplay } from "../../../components/reviews/StarRatingInput";
import { toast } from "sonner";

type ReviewTab = "all" | "verified" | "legacy" | "hidden";

export default function AdminReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ReviewTab>("all");

  const loadReviews = async () => {
    setLoading(true);
    try {
      const result = await fetchAdminReviewsPage();
      if (result.success === false) {
        toast.error(result.error);
        setReviews([]);
        return;
      }
      setReviews(result.reviews);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadReviews());
  }, []);

  const counts = useMemo(
    () => ({
      verified: reviews.filter((review) => review.verified).length,
      legacy: reviews.filter((review) => review.legacy).length,
      hidden: reviews.filter((review) => review.status !== "published").length,
    }),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    if (activeTab === "verified") return reviews.filter((review) => review.verified);
    if (activeTab === "legacy") return reviews.filter((review) => review.legacy);
    if (activeTab === "hidden") return reviews.filter((review) => review.status !== "published");
    return reviews;
  }, [reviews, activeTab]);

  const handleModerate = async (reviewId: string, action: "publish" | "hide" | "delete") => {
    setProcessingId(reviewId);
    try {
      const result = await moderateAdminReview(reviewId, action);
      if (result.success === false) {
        toast.error(result.error);
        return;
      }
      toast.success(
        action === "delete"
          ? "Review deleted."
          : action === "publish"
            ? "Review published."
            : "Review hidden."
      );
      await loadReviews();
    } finally {
      setProcessingId(null);
    }
  };

  const tabClass = (tab: ReviewTab) =>
    `rounded-xl px-4 py-2 text-xs font-bold transition-all ${
      activeTab === tab
        ? "bg-[#f9e000] text-black shadow-sm"
        : "bg-white text-zinc-600 border border-zinc-200 hover:border-[#f9e000]/40"
    }`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <Star className="w-6 h-6 text-brand" />
          Review Moderation
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Only verified booking reviews can be published on public salon pages. Legacy reviews stay hidden.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveTab("all")} className={tabClass("all")}>
          All ({reviews.length})
        </button>
        <button type="button" onClick={() => setActiveTab("verified")} className={tabClass("verified")}>
          Verified ({counts.verified})
        </button>
        <button type="button" onClick={() => setActiveTab("legacy")} className={tabClass("legacy")}>
          Legacy ({counts.legacy})
        </button>
        <button type="button" onClick={() => setActiveTab("hidden")} className={tabClass("hidden")}>
          Hidden ({counts.hidden})
        </button>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-zinc-500">
          No reviews in this view.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-zinc-900">{review.salonName}</h3>
                    <Badge
                      className={
                        review.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-none"
                          : "bg-zinc-100 text-zinc-600 border-none"
                      }
                    >
                      {review.status}
                    </Badge>
                    {review.verified ? (
                      <Badge className="bg-blue-50 text-blue-700 border-none flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified booking
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 border-none flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Legacy — not publishable
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                      <span>Salon</span>
                      <StarRatingDisplay rating={review.rating} size="sm" />
                    </div>
                    {review.staffRating ? (
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
                        <span>Stylist</span>
                        <StarRatingDisplay rating={review.staffRating} size="sm" />
                      </div>
                    ) : null}
                  </div>

                  {review.comment ? (
                    <p className="text-sm text-zinc-600 leading-relaxed">{review.comment}</p>
                  ) : (
                    <p className="text-sm text-zinc-400 italic">No written comment.</p>
                  )}

                  <div className="text-xs text-zinc-400 flex flex-wrap gap-3">
                    <span>{review.customerEmail}</span>
                    {review.bookingNo ? <span>Booking {review.bookingNo}</span> : null}
                    <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {review.status !== "published" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === review.id || !review.verified}
                      onClick={() => handleModerate(review.id, "publish")}
                      title={review.verified ? "Publish review" : "Only verified booking reviews can be published"}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === review.id}
                      onClick={() => handleModerate(review.id, "hide")}
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Hide
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={processingId === review.id}
                    onClick={() => handleModerate(review.id, "delete")}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
