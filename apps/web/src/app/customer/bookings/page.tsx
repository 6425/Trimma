"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarDays, MapPin, Scissors, Clock, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ReviewableBooking } from "@/app/actions/reviews";
import { fetchCustomerBookingsPage } from "@/app/actions/customer-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import { ReviewFormDialog } from "../../../components/reviews/ReviewFormDialog";

function BookingsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<ReviewableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [activeReviewBooking, setActiveReviewBooking] = useState<ReviewableBooking | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const result = await withTimeout(
        fetchCustomerBookingsPage(),
        20000,
        "Loading timed out. Refresh the page."
      );

      if (result.success === false) {
        if (result.error.includes("sign in") || result.error.includes("session expired")) {
          router.replace("/login?redirectTo=/customer/bookings");
          return;
        }
        throw new Error(result.error);
      }

      setAccessToken(result.accessToken);
      setBookings(result.bookings);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadBookings();
    });
  }, [loadBookings]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const reviewBookingId = searchParams.get("review");
      if (!reviewBookingId || bookings.length === 0) return;

      const booking = bookings.find((item) => item.id === reviewBookingId);
      if (booking?.canReview) {
        setActiveReviewBooking(booking);
        setReviewDialogOpen(true);
      }
    });
  }, [searchParams, bookings]);

  const openReviewDialog = (booking: ReviewableBooking) => {
    setActiveReviewBooking(booking);
    setReviewDialogOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">My Bookings</h1>
          <p className="text-sm text-zinc-400 mt-1">View, track, and review your salon appointments.</p>
        </div>

        <Link href="/salons" className="group/button inline-flex shrink-0 items-center justify-center max-w-full bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold text-xs h-10 px-4 transition-all">
          <Scissors className="w-4 h-4 mr-2" />
          Book New Appointment
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#F5B700]"></div>
          <p className="text-sm text-zinc-400 font-bold">Loading your appointments...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-zinc-900/50 rounded-3xl border border-white/10 p-10 md:p-16 text-center max-w-xl mx-auto mt-8 shadow-sm backdrop-blur-sm">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-zinc-600 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-white">No appointments scheduled</h3>
          <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto leading-relaxed">
            You don&apos;t have any bookings yet. Find a professional salon nearby and book your first experience.
          </p>
          <Link href="/salons" className="group/button inline-flex shrink-0 items-center justify-center max-w-full mt-6 bg-[#F5B700] hover:bg-[#F5B700]/90 text-black rounded-xl font-bold px-6 py-2.5 transition-all">
            Explore Salons
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-zinc-900/50 rounded-2xl border border-white/10 hover:border-[#F5B700]/30 hover:bg-[#F5B700]/5 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-start gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 flex items-center justify-center shrink-0">
                  <Scissors className="w-6 h-6 text-zinc-300" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-white text-base">{booking.salonName}</h3>
                    <Badge
                      variant={booking.status === "confirmed" ? "default" : booking.status === "pending" ? "secondary" : "outline"}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 tracking-wide rounded-md border-none ${
                        booking.status === "confirmed"
                          ? "bg-[#F5B700]/10 text-[#F5B700]"
                          : booking.status === "pending"
                            ? "bg-amber-500/10 text-amber-500"
                            : booking.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-white/10 text-zinc-400"
                      }`}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#F5B700]/60" />
                    <span>{booking.salonSlug ? booking.salonName : "Sri Lanka"}</span>
                  </div>

                  <div className="text-xs font-mono font-bold text-zinc-500 mt-2">
                    ID: <span className="text-zinc-400">{booking.bookingNo}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-4 sm:gap-10 md:gap-4 lg:gap-10 pt-4 md:pt-0 border-t border-white/10 md:border-t-0 justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-200 text-xs font-extrabold">
                    <CalendarDays className="w-4 h-4 text-[#F5B700]" />
                    <span>{booking.bookingDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>{booking.bookingTime}</span>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 md:items-end">
                  {booking.canReview ? (
                    <Button
                      onClick={() => openReviewDialog(booking)}
                      className="bg-[#F5B700] hover:bg-[#F5B700]/90 text-black font-bold rounded-xl h-10 px-4"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      {booking.hasReview ? "Edit review" : "Leave review"}
                    </Button>
                  ) : booking.hasReview ? (
                    <div className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Review submitted
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeReviewBooking && accessToken ? (
        <ReviewFormDialog
          key={activeReviewBooking.id}
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          accessToken={accessToken}
          bookingId={activeReviewBooking.id}
          salonName={activeReviewBooking.salonName}
          bookingNo={activeReviewBooking.bookingNo}
          initialRating={activeReviewBooking.existingReview?.rating || 0}
          initialComment={activeReviewBooking.existingReview?.comment || ""}
          onSubmitted={loadBookings}
        />
      ) : null}
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-500">Loading Appointments...</div>}>
      <BookingsListContent />
    </Suspense>
  );
}
