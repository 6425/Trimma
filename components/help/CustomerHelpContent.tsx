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
  LogIn,
  Mail,
  MessageCircle,
  Scissors,
  Search,
  User,
} from "lucide-react";
import { BookingGuideDownloads } from "@/components/help/BookingGuideDownloads";
import { CustomerHelpFaq } from "@/components/help/CustomerHelpFaq";
import { CUSTOMER_DASHBOARD_OPTIONS } from "@/lib/customer-help-faq";
import {
  TRIMMA_SUPPORT_EMAIL,
  TRIMMA_WHATSAPP_DISPLAY,
  TRIMMA_WHATSAPP_URL,
} from "@/lib/trimma-contact";

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
    <div className="bg-white text-zinc-900">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/customer-help-hero.webp"
          alt=""
          width={1920}
          height={500}
          decoding="async"
          fetchPriority="high"
          className="home-hero-bg-image absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="home-hero-left-overlay absolute inset-0 hidden lg:block pointer-events-none" aria-hidden="true" />
        <div className="home-hero-mobile-overlay lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="home-hero-content-col home-hero-content hero-ink text-left w-full lg:w-1/2 flex flex-col justify-center p-[3%]">
            <div className="home-hero-top">
              <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
                <HelpCircle className="w-3.5 h-3.5" />
                For customers
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Customer</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Help
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                How to find salons, book appointments, pay your deposit, and manage your Trimma account.
                This page is for <strong>customers</strong> — not salon owners.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/" className="hero-btn-primary px-8 py-4 rounded-2xl">
                  <Search className="w-4 h-4" />
                  Find a salon
                </Link>
                <Link href="/login?redirectTo=/customer" className="hero-btn-secondary px-8 py-4 rounded-2xl">
                  <LogIn className="w-4 h-4" />
                  Sign in to your account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 sm:px-6 sm:py-14 space-y-10">
      <section id="how-to-book" className="scroll-mt-24 space-y-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-[#ffde5a]" />
          <h2 className="text-xl font-bold text-zinc-900">How to book</h2>
        </div>
        <ol className="space-y-3">
          {BOOKING_STEPS.map((step, index) => (
            <li
              key={step}
              className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 leading-relaxed"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffde5a] text-xs font-black text-zinc-900">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="payment" className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#ffde5a]" />
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
          <BookOpen className="w-5 h-5 text-[#ffde5a]" />
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
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-[#ffde5a]/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffde5a]/15 text-zinc-900 flex items-center justify-center shrink-0">
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
            href={`mailto:${TRIMMA_SUPPORT_EMAIL}`}
            className="flex items-center gap-2 text-sm font-semibold text-white hover:text-[#ffde5a] transition-colors"
          >
            <Mail className="w-4 h-4" />
            {TRIMMA_SUPPORT_EMAIL}
          </a>
          <a
            href={TRIMMA_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-[#ffde5a] transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            WhatsApp · {TRIMMA_WHATSAPP_DISPLAY}
          </a>
          <Link
            href="/contact"
            className="inline-flex text-sm font-bold text-[#ffde5a] hover:underline"
          >
            Contact Trimma →
          </Link>
        </div>
      </section>

      <p className="text-xs text-zinc-500 text-center pb-4">
        Salon owners and partners should use{" "}
        <Link href="/dashboard/help" className="font-semibold text-zinc-700 underline hover:text-[#ffde5a]">
          Salon Help
        </Link>{" "}
        in the salon dashboard instead of this page.
      </p>
      </div>
    </div>
  );
}
