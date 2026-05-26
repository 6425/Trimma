"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { submitBookingReview } from "@/app/actions/reviews";
import { StarRatingInput } from "./StarRatingInput";
import { toast } from "sonner";

type ReviewFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string;
  bookingId: string;
  salonName: string;
  bookingNo: string;
  initialRating?: number;
  initialComment?: string | null;
  onSubmitted?: () => void;
};

export function ReviewFormDialog({
  open,
  onOpenChange,
  accessToken,
  bookingId,
  salonName,
  bookingNo,
  initialRating = 0,
  initialComment = "",
  onSubmitted,
}: ReviewFormDialogProps) {
  const [rating, setRating] = useState(initialRating);
  const [reviewText, setReviewText] = useState(initialComment || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error("Please select a star rating.");
      return;
    }

    try {
      setSaving(true);
      const result = await submitBookingReview({
        accessToken,
        bookingId,
        rating,
        reviewText,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(result.updated ? "Review updated." : "Thank you for your verified review!");
      onOpenChange(false);
      onSubmitted?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Leave a verified review</DialogTitle>
          <DialogDescription>
            Booking {bookingNo} at {salonName}. Only customers with completed appointments can review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Overall rating</p>
            <StarRatingInput value={rating} onChange={setRating} disabled={saving} />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Written review (optional)
            </p>
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
              placeholder="Share what you liked about the service, staff, and experience..."
              className="min-h-[120px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              maxLength={500}
              disabled={saving}
            />
            <p className="text-[10px] text-zinc-400 mt-2">
              {reviewText.trim().length}/500 characters. If you add text, use at least 20 characters.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
