"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sendWhatsAppReservationPaidNotification } from "../actions/whatsapp";
import { formatLkr, getBookingAmount, getBookingBalance } from "@/lib/dashboard-stats";
import { fetchCustomerDashboardPage, type CustomerDashboardBooking } from "@/app/actions/customer-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";

function DashboardContent() {
  const router = useRouter();
  const [userName, setUserName] = useState("Guest");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("Member");
  const [upcomingBookings, setUpcomingBookings] = useState<CustomerDashboardBooking[]>([]);
  const [bookingStats, setBookingStats] = useState({ total: 0, upcoming: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (searchParams.get("payment_success") === "true") {
        const bookingNo = searchParams.get("booking_no");
        const whatsappSentFromCheckout = searchParams.get("whatsapp_sent") === "true";

        toast.success(`Payment successful! Booking ${bookingNo} is confirmed.`, {
          duration: 5000,
          position: "top-center",
        });

        if (bookingNo) {
          const dedupKey = `trimma-wa-${bookingNo}`;

          if (whatsappSentFromCheckout) {
            sessionStorage.setItem(dedupKey, "sent");
            toast.success("Receipt sent to your WhatsApp! 📱", {
              position: "top-center",
            });
          } else if (!sessionStorage.getItem(dedupKey)) {
            sendWhatsAppReservationPaidNotification(bookingNo).then((res) => {
              sessionStorage.setItem(dedupKey, res?.success ? "sent" : "failed");
              if (res?.success) {
                toast.success("Receipt sent to your WhatsApp! 📱", {
                  position: "top-center",
                });
              } else if (res?.error && res.error !== "Disabled") {
                console.error("WhatsApp dispatch failure:", res.error);
                toast.error(`Booking confirmed, but WhatsApp receipt failed: ${res.error}`, {
                  position: "top-center",
                });
              }
            });
          }
        }

        window.history.replaceState(null, "", "/customer");
      }
    });
  }, [searchParams]);

  const loadDashboard = useCallback(async () => {
    setLoadError(null);
    try {
      const result = await withTimeout(
        fetchCustomerDashboardPage(),
        20000,
        "Loading timed out. Refresh the page."
      );

      if (result.success === false) {
        if (result.error.includes("sign in") || result.error.includes("session expired")) {
          router.replace("/login?redirectTo=/customer");
          return;
        }
        throw new Error(result.error);
      }

      setUserName(result.userName);
      setAvatarUrl(result.avatarUrl);
      setUserRole(result.userRole);
      setUpcomingBookings(result.upcomingBookings);
      setBookingStats(result.bookingStats);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load your dashboard.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void loadDashboard();
    });
  }, [loadDashboard]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4 text-center">
        <p className="text-zinc-400 max-w-md">{loadError}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void loadDashboard();
          }}
          className="inline-flex items-center gap-2 bg-[#ffc800] text-black font-bold rounded-xl px-4 py-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12 min-w-0">
      <section className="bg-white rounded-3xl p-6 md:p-10 text-zinc-900 relative overflow-hidden shadow-sm border border-zinc-200">
        <div className="absolute inset-0 bg-gradient-to-r from-white to-zinc-50 z-0"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ffc800]/10 blur-3xl rounded-full z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-zinc-200">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                {getGreeting()}, {userName} 👋
              </h1>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Badge variant="secondary" className="bg-[#ffc800] text-black border border-black/10 font-semibold text-xs px-2.5 py-0.5">
                  {userRole}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-medium">
          <Link href="/" className="trimma-customer-action-btn group/button inline-flex shrink-0 items-center justify-center max-w-full bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-[#ffc800]/10 hover:text-[#ffc800] hover:border-[#ffc800]/30 h-12 rounded-xl w-full transition-all">
            Book Now
          </Link>
          <Link href="/" className="trimma-customer-action-btn group/button inline-flex shrink-0 items-center justify-center max-w-full bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-[#ffc800]/10 hover:text-[#ffc800] hover:border-[#ffc800]/30 h-12 rounded-xl w-full transition-all">
            Find Salons
          </Link>
          <Link href="/customer/styles" className="trimma-customer-action-btn group/button inline-flex shrink-0 items-center justify-center max-w-full bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-[#ffc800]/10 hover:text-[#ffc800] hover:border-[#ffc800]/30 h-12 rounded-xl w-full transition-all">
            Saved Styles
          </Link>
          <Link href="/customer/bookings" className="trimma-customer-action-btn group/button inline-flex shrink-0 items-center justify-center max-w-full bg-zinc-100 border border-zinc-200 text-zinc-800 hover:bg-[#ffc800]/10 hover:text-[#ffc800] hover:border-[#ffc800]/30 h-12 rounded-xl w-full transition-all">
            History
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Bookings", value: bookingStats.total },
          { label: "Upcoming", value: bookingStats.upcoming },
          { label: "Completed", value: bookingStats.completed },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-4 border border-zinc-200 text-center shadow-sm">
            <p className="text-2xl font-black text-zinc-900">{stat.value}</p>
            <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wide mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-zinc-900">Upcoming Bookings</h2>
        {upcomingBookings.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20 text-zinc-400" />
            <p>You have no upcoming bookings.</p>
            <Link href="/" className="inline-flex mt-2 text-[#ffc800] hover:text-[#ffc800]/80 underline-offset-4 hover:underline text-sm font-semibold transition-all">
              Browse salons to book
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingBookings.map((booking) => {
              const total = Number(booking.amount ?? 0);
              const paid = getBookingAmount(booking);
              const balance = getBookingBalance(booking);

              return (
                <div
                  key={booking.id}
                  className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:border-[#ffc800]/50 hover:bg-[#ffc800]/5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-900">{booking.salons?.name || "Trimma Partner Salon"}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-600">
                      <CalendarDays className="w-4 h-4 text-[#ffc800]/80" />
                      <span>
                        {booking.booking_date} at {booking.booking_time}
                      </span>
                    </div>
                    {booking.salons?.city ? <p className="text-xs text-zinc-500 mt-1">{booking.salons.city}</p> : null}
                  </div>
                  <div className="text-left sm:text-right flex flex-col items-start sm:items-end gap-1.5 w-full sm:w-auto sm:max-w-[240px] shrink-0">
                    <span className="font-bold text-zinc-900">Total: Rs. {formatLkr(total)}</span>

                    {["confirmed", "pending", "reservation_paid"].includes(String(booking.status || "").toLowerCase()) ? (
                      <>
                        <Badge className="bg-[#ffc800]/10 hover:bg-[#ffc800]/20 text-[#ffc800] border-none font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wide">
                          Deposit Paid (Rs. {formatLkr(paid)})
                        </Badge>
                        <span className="text-[9px] text-zinc-500 font-medium text-right">
                          Balance (Rs. {formatLkr(balance)}) to be paid at salon
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-[9px] uppercase border-zinc-200 text-zinc-500">
                        {booking.status}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
