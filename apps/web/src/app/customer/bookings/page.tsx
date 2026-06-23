"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarDays, MapPin, Scissors, Clock, CheckCircle2, Star, Info, CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type ReviewableBooking } from "@/app/actions/reviews";
import { fetchCustomerBookingsPage } from "@/app/actions/customer-dashboard-data";
import { requestCustomerReschedule } from "@/app/actions/customer-booking-reschedule";
import { withTimeout } from "@/lib/promise-timeout";
import { getCustomerReviewUiState } from "@/lib/reviews";
import { ReviewFormDialog } from "../../../components/reviews/ReviewFormDialog";
import { StarRatingDisplay } from "../../../components/reviews/StarRatingInput";
import { toast } from "sonner";
import { customerBtnClass, customerTabClass } from "@/lib/customer-dashboard-ui";

type BookingTab = "all" | "ready" | "reviewed";

const NON_RESCHEDULABLE_STATUSES = new Set(["completed", "canceled", "cancelled", "no_show"]);

function canRequestReschedule(booking: ReviewableBooking): boolean {
  const status = String(booking.status || "").toLowerCase();
  if (NON_RESCHEDULABLE_STATUSES.has(status)) return false;
  if (booking.rescheduleRequested && booking.rescheduleStatus === "pending_salon") return false;
  return status === "confirmed" || status === "pending" || status === "rescheduled";
}

function BookingsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<ReviewableBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [activeReviewBooking, setActiveReviewBooking] = useState<ReviewableBooking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<ReviewableBooking | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);

  const activeTab = (searchParams.get("tab") as BookingTab) || "all";
  const validTab: BookingTab = ["all", "ready", "reviewed"].includes(activeTab) ? activeTab : "all";

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

  const counts = useMemo(
    () => ({
      ready: bookings.filter((b) => b.canReview).length,
      reviewed: bookings.filter((b) => b.hasReview).length,
    }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    if (validTab === "ready") return bookings.filter((b) => b.canReview);
    if (validTab === "reviewed") return bookings.filter((b) => b.hasReview);
    return bookings;
  }, [bookings, validTab]);

  const setTab = (tab: BookingTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "all") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    const query = params.toString();
    router.replace(query ? `/customer/bookings?${query}` : "/customer/bookings");
  };

  const openReviewDialog = (booking: ReviewableBooking) => {
    setActiveReviewBooking(booking);
    setReviewDialogOpen(true);
  };

  const openRescheduleDialog = (booking: ReviewableBooking) => {
    setRescheduleBooking(booking);
    setRescheduleDate(booking.bookingDate || "");
    setRescheduleTime((booking.bookingTime || "12:00:00").slice(0, 5));
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) return;
    setRescheduleSubmitting(true);
    try {
      const result = await requestCustomerReschedule(
        rescheduleBooking.id,
        rescheduleDate,
        rescheduleTime
      );
      if (result.success === false) throw new Error(result.error);
      toast.success("Reschedule request sent to the salon.");
      setRescheduleBooking(null);
      await loadBookings();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send reschedule request.");
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const renderReviewSection = (booking: ReviewableBooking) => {
    const reviewState = getCustomerReviewUiState(booking);
    if (!reviewState) return null;

    if (reviewState.kind === "action") {
      return (
        <Button
          onClick={() => openReviewDialog(booking)}
          className={`${customerBtnClass} h-10 px-4`}
        >
          <Star className="w-4 h-4 mr-2" />
          {reviewState.actionLabel}
        </Button>
      );
    }

    if (reviewState.kind === "submitted") {
      return (
        <div className="flex flex-col items-end gap-2">
          <StarRatingDisplay rating={reviewState.rating} size="md" />
          <div className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Review submitted
          </div>
          {booking.canReview ? (
            <button
              type="button"
              onClick={() => openReviewDialog(booking)}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 underline underline-offset-2"
            >
              Edit review
            </button>
          ) : null}
        </div>
      );
    }

    const isWaiting = reviewState.kind === "waiting";
    return (
      <div
        className={`flex items-start gap-2 max-w-[220px] text-right ${
          isWaiting ? "text-amber-600" : "text-zinc-500"
        }`}
      >
        <Info className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isWaiting ? "text-amber-500" : "text-zinc-400"}`} />
        <p className="text-[11px] font-semibold leading-relaxed">{reviewState.message}</p>
      </div>
    );
  };

  const tabButtonClass = (tab: BookingTab) => customerTabClass(validTab === tab);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">My Bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">View, track, and review your salon appointments.</p>
        </div>

        <Link href="/" className={`${customerBtnClass} text-xs h-10 px-4 gap-2`}>
          <Scissors className="w-4 h-4 mr-2" />
          Book New Appointment
        </Link>
      </div>

      {!loading && bookings.length > 0 ? (
        <div className="rounded-2xl border border-[#ffc800]/20 bg-[#ffc800]/5 px-4 py-3 flex gap-3 items-start">
          <Star className="w-4 h-4 text-[#ffc800] shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-700 leading-relaxed">
            <span className="font-bold text-zinc-900">How reviews work:</span> Once your confirmed appointment time has
            passed, a <span className="font-bold">Leave review</span> button appears here. You can rate the salon and
            stylist, and update your review anytime.
          </p>
        </div>
      ) : null}

      {!loading && bookings.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setTab("all")} className={tabButtonClass("all")}>
            All ({bookings.length})
          </button>
          <button type="button" onClick={() => setTab("ready")} className={tabButtonClass("ready")}>
            Ready to review ({counts.ready})
          </button>
          <button type="button" onClick={() => setTab("reviewed")} className={tabButtonClass("reviewed")}>
            My reviews ({counts.reviewed})
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffc800]"></div>
          <p className="text-sm text-zinc-400 font-bold">Loading your appointments...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-10 md:p-16 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-zinc-400 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-zinc-900">No appointments scheduled</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
            You don&apos;t have any bookings yet. Find a professional salon nearby and book your first experience.
          </p>
          <Link href="/" className={`${customerBtnClass} mt-6 px-6 py-2.5`}>
            Explore Salons
          </Link>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-10 md:p-16 text-center max-w-xl mx-auto shadow-sm">
          <Star className="w-14 h-14 mx-auto mb-4 text-zinc-300 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-zinc-900">
            {validTab === "ready" ? "No reviews ready yet" : "No reviews submitted yet"}
          </h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
            {validTab === "ready"
              ? "Reviews unlock after your confirmed appointment time has passed."
              : "Once you leave a review for a completed visit, it will show up here."}
          </p>
          {validTab !== "all" ? (
            <button
              type="button"
              onClick={() => setTab("all")}
              className={`${customerBtnClass} mt-6 px-5 py-2 text-xs`}
            >
              View all bookings
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-zinc-200 hover:border-[#ffc800]/50 hover:bg-[#ffc800]/5 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 flex items-center justify-center shrink-0">
                  <Scissors className="w-6 h-6 text-zinc-600" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-zinc-900 text-base">{booking.salonName}</h3>
                    <Badge
                      variant={booking.status === "confirmed" ? "default" : booking.status === "pending" ? "secondary" : "outline"}
                      className={`text-[9px] font-black uppercase px-2 py-0.5 tracking-wide rounded-md border-none ${
                        booking.status === "confirmed"
                          ? "bg-[#ffc800]/10 text-[#ffc800]"
                          : booking.status === "pending"
                            ? "bg-amber-500/10 text-amber-500"
                            : booking.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#ffc800]/80" />
                    <span>{booking.salonSlug ? booking.salonName : "Sri Lanka"}</span>
                  </div>

                  <div className="text-xs font-mono font-bold text-zinc-400 mt-2">
                    ID: <span className="text-zinc-600">{booking.bookingNo}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-4 sm:gap-10 md:gap-4 lg:gap-10 pt-4 md:pt-0 border-t border-zinc-200 md:border-t-0 justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-800 text-xs font-extrabold">
                    <CalendarDays className="w-4 h-4 text-[#ffc800]" />
                    <span>{booking.bookingDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-600 text-xs font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>{booking.bookingTime}</span>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 md:items-end min-w-0 w-full sm:min-w-[180px] sm:w-auto shrink-0">
                  {booking.rescheduleRequested && booking.rescheduleStatus === "pending_salon" ? (
                    <Badge className="bg-amber-500/10 text-amber-700 border-none text-[10px] font-black uppercase tracking-wide w-fit">
                      Reschedule pending
                    </Badge>
                  ) : null}
                  {canRequestReschedule(booking) ? (
                    <Button
                      type="button"
                      onClick={() => openRescheduleDialog(booking)}
                      className={`${customerBtnClass} h-9 text-xs px-4`}
                    >
                      <CalendarClock className="w-4 h-4 mr-2" />
                      Request reschedule
                    </Button>
                  ) : null}
                  {renderReviewSection(booking)}
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
          staffName={activeReviewBooking.staffName}
          initialRating={activeReviewBooking.existingReview?.rating || 0}
          initialStaffRating={activeReviewBooking.existingReview?.staffRating || 0}
          initialComment={activeReviewBooking.existingReview?.comment || ""}
          onSubmitted={loadBookings}
        />
      ) : null}

      {rescheduleBooking ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-zinc-200 shadow-2xl space-y-6 text-left">
            <div>
              <h3 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#ffc800]" />
                Request reschedule
              </h3>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Booking <strong>{rescheduleBooking.bookingNo}</strong> at {rescheduleBooking.salonName}.
                The salon will review your preferred new time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Preferred date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full h-11 px-4 border border-zinc-200 focus:border-[#ffc800] rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  Preferred time
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full h-11 px-4 border border-zinc-200 focus:border-[#ffc800] rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 justify-end">
              <Button
                size="sm"
                onClick={() => setRescheduleBooking(null)}
                className={`${customerBtnClass} h-10 text-xs px-4`}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void handleRescheduleSubmit()}
                disabled={rescheduleSubmitting || !rescheduleDate || !rescheduleTime}
                className={`${customerBtnClass} h-10 px-5 text-xs`}
              >
                {rescheduleSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                    Sending...
                  </>
                ) : (
                  "Send request"
                )}
              </Button>
            </div>
          </div>
        </div>
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
