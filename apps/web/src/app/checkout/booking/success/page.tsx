"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, MessageCircle, Home, CalendarDays } from "lucide-react";
import { toast } from "sonner";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const bookingNo = searchParams.get("booking_no");
  const whatsappSent = searchParams.get("whatsapp_sent") === "true";
  const whatsappError = searchParams.get("whatsapp_error");

  useEffect(() => {
    if (!bookingNo) return;
    toast.success(`Booking ${bookingNo} confirmed!`, {
      duration: 6000,
      position: "top-center",
    });
    if (whatsappSent) {
      toast.success("Receipt sent to your WhatsApp!", {
        position: "top-center",
      });
    }
  }, [bookingNo, whatsappSent]);

  if (!bookingNo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 mb-2">No booking reference found</p>
        <p className="text-sm text-zinc-500 mb-6">
          If you just completed a booking, check your WhatsApp or email for confirmation.
        </p>
        <Link href="/salons" className="text-sm font-bold text-zinc-900 underline">
          Browse salons
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Booking confirmed!</h1>
          <p className="text-sm text-zinc-500">
            Your appointment is reserved. Pay the remaining balance at the salon.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-950 text-white p-5 text-left">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Booking reference</p>
          <p className="font-mono font-black text-lg text-emerald-400 mt-1">{bookingNo}</p>
        </div>

        {!whatsappSent && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2 text-left">
            <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              WhatsApp receipt could not be sent. Save your booking reference above.
              {whatsappError && (
                <>
                  {" "}
                  <span className="block mt-2 text-amber-800/90">{whatsappError}</span>
                </>
              )}
            </span>
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 pt-2">
          <Link
            href="/login?redirectTo=/customer/bookings"
            className="inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
          >
            <CalendarDays className="w-4 h-4" />
            Sign in to view bookings
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 rounded-xl border border-slate-200 text-zinc-900 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
