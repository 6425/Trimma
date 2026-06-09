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
  staffName?: string | null;
  initialRating?: number;
  initialStaffRating?: number;
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
  staffName,
  initialRating = 0,
  initialStaffRating = 0,
  initialComment = "",
  onSubmitted,
}: ReviewFormDialogProps) {
  const [rating, setRating] = useState(initialRating);
  const [staffRating, setStaffRating] = useState(initialStaffRating);
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
        staffRating: staffName ? staffRating || undefined : undefined,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      if ("staffReviewWarning" in result && result.staffReviewWarning) {
        toast.warning(result.staffReviewWarning);
      } else {
        toast.success(result.updated ? "Review updated." : "Thank you for your verified review!");
      }
      onOpenChange(false);
      onSubmitted?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="trimma-light-context sm:max-w-lg rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-900">Leave a verified review</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Booking {bookingNo} at {salonName}. Share your experience after your confirmed visit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Salon experience</p>
            <StarRatingInput value={rating} onChange={setRating} disabled={saving} />
          </div>

          {staffName ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Stylist: {staffName}
              </p>
              <StarRatingInput value={staffRating} onChange={setStaffRating} disabled={saving} />
            </div>
          ) : null}

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

        <DialogFooter className="border-t border-zinc-200 bg-zinc-50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="border-zinc-300 bg-white !text-zinc-700 hover:bg-zinc-100 hover:!text-zinc-900 hover:border-zinc-400"
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving} className="!text-black">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
