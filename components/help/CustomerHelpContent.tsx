"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CreditCard,
  ExternalLink,
  Heart,
  HelpCircle,
  Home,
  LifeBuoy,
  Mail,
  MessageCircle,
  Scissors,
  Search,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingGuideDownloads } from "@/components/help/BookingGuideDownloads";
import { CustomerHelpFaq } from "@/components/help/CustomerHelpFaq";
import { CUSTOMER_DASHBOARD_OPTIONS } from "@/lib/customer-help-faq";

const BOOKING_STEPS = [
  "Browse salons on Trimma or search by service and location.",
  "Open a salon profile and tap Book — choose services, stylist, and an open time slot.",
  "Enter your name, email, and phone, then pay the 20% reservation deposit online.",
  "Wait for the salon to confirm your appointment — we notify you by email and WhatsApp.",
  "Visit the salon, pay the remaining balance there, then leave a review from My Bookings.",
];

const ICONS: Record<string, React.ReactNode> = {
  Dashboard: <Home className="w-5 h-5" />,
  "My Bookings": <CalendarDays className="w-5 h-5" />,
  "Favorite Salons": <Heart className="w-5 h-5" />,
  "Saved Styles": <Scissors className="w-5 h-5" />,
  Profile: <User className="w-5 h-5" />,
  Support: <LifeBuoy className="w-5 h-5" />,
};

export function CustomerHelpContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 sm:py-14 space-y-10">
      <header className="space-y-4 border-b border-zinc-200 pb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#ffc800]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-yellow-800">
          <HelpCircle className="w-3.5 h-3.5" />
          For customers
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
          Customer Help
        </h1>
        <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl">
          How to find salons, book appointments, pay your deposit, and manage your Trimma account.
          This page is for <strong className="text-zinc-900">customers</strong> — not salon owners.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href="/">
            <Button className="h-10 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 font-bold text-sm">
              Find a salon
            </Button>
          </Link>
          <Link href="/login?redirectTo=/customer">
            <Button
              variant="outline"
              className="h-10 rounded-xl border-zinc-300 font-bold text-sm"
            >
              Sign in to your account
            </Button>
          </Link>
        </div>
      </header>

      <section id="how-to-book" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-[#ffc800]" />
          <h2 className="text-xl font-bold text-zinc-900">How to book</h2>
        </div>
        <ol className="space-y-3">
          {BOOKING_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 leading-relaxed"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffc800] text-xs font-black text-zinc-900">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="payment" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#ffc800]" />
          <h2 className="text-lg font-bold text-zinc-900">Deposit and payment</h2>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Trimma collects a <strong className="text-zinc-900">20% reservation deposit</strong> online
          when you book. The remaining <strong className="text-zinc-900">80%</strong> is paid at the
          salon after your service. Your booking reference (for example TRM-482916) is shown after
          checkout and in your confirmation messages.
        </p>
      </section>

      <section id="account" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#ffc800]" />
          <h2 className="text-xl font-bold text-zinc-900">Your customer account</h2>
        </div>
        <p className="text-sm text-zinc-600 leading-relaxed">
          Sign in with Google to access your customer dashboard. You can still book as a guest without
          an account — use the same email when signing in later to see your appointments.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CUSTOMER_DASHBOARD_OPTIONS.map((item) => (
            <Link
              key={item.path}
              href={`/login?redirectTo=${encodeURIComponent(item.path)}`}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-[#ffc800]/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffc800]/15 text-zinc-900 flex items-center justify-center shrink-0">
                  {ICONS[item.title]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900">{item.title}</h3>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="faq" className="scroll-mt-24 space-y-4">
        <h2 className="text-xl font-bold text-zinc-900">Frequently asked questions</h2>
        <CustomerHelpFaq defaultOpenIndex={0} />
      </section>

      <BookingGuideDownloads />

      <section id="support" className="scroll-mt-24 rounded-2xl bg-zinc-950 text-white p-6 sm:p-8 border border-white/10">
        <h2 className="text-lg font-bold mb-2">Still need help?</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-4">
          Our team can help with bookings, payments, cancellations, and account questions.
        </p>
        <div className="space-y-3">
          <a
            href="mailto:support@trimma.io"
            className="flex items-center gap-2 text-sm font-semibold text-white hover:text-[#ffc800] transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@trimma.io
          </a>
          <p className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            WhatsApp customer support
          </p>
          <Link
            href="/contact"
            className="inline-flex text-sm font-bold text-[#ffc800] hover:underline"
          >
            Contact Trimma →
          </Link>
        </div>
      </section>

      <p className="text-xs text-zinc-500 text-center pb-4">
        Salon owners and partners should use{" "}
        <Link href="/dashboard/help" className="font-semibold text-zinc-700 underline hover:text-[#ffc800]">
          Salon Help
        </Link>{" "}
        in the salon dashboard instead of this page.
      </p>
    </div>
  );
}
