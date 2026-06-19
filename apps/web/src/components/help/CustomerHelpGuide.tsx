"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Sparkles,
  MessageCircle,
  Mail,
  Search,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  Bell,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingGuideDownloads } from "./BookingGuideDownloads";
import { CustomerHelpFaq } from "./CustomerHelpFaq";
import { CUSTOMER_DASHBOARD_OPTIONS } from "@/lib/customer-help-faq";

const CUSTOMER = {
  name: "Nimal Perera",
  email: "nimal@gmail.com",
  phone: "+94771234567",
};

const SALON = {
  name: "Sampath Barber Saloon",
  location: "Kadawatha, Gampaha",
  slug: "sampath-barber-saloon",
  service: "Classic Haircut",
  price: 700,
  deposit: 140,
  balance: 560,
  ref: "TRM-482916",
  stylist: "Kasun Silva",
};

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "dashboard-menu", label: "Customer Dashboard" },
  { id: "discover", label: "Find a Salon" },
  { id: "booking", label: "Book Appointment" },
  { id: "checkout", label: "Checkout & Deposit" },
  { id: "notifications", label: "Notifications" },
  { id: "journey", label: "Booking Journey" },
  { id: "faq", label: "FAQ" },
  { id: "guides", label: "Download Guide" },
  { id: "support", label: "Support" },
] as const;

const JOURNEY_STEPS = [
  { step: "1", title: "Find a salon", desc: "Browse Trimma or search by service and location." },
  { step: "2", title: "Pick service & time", desc: "Choose Classic Haircut, stylist, and an open slot." },
  { step: "3", title: "Pay 20% deposit", desc: "Secure your slot online — LKR 140 on a LKR 700 service." },
  { step: "4", title: "Salon confirms", desc: "WhatsApp + email when pending, then when confirmed." },
  { step: "5", title: "Visit & pay balance", desc: "Pay remaining LKR 560 at the salon after your service." },
  { step: "6", title: "Leave a review", desc: "Rate your visit from My Bookings once your appointment time has passed." },
];

function MockFrame({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden shadow-sm ${className}`}
    >
      <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Live UI preview
        </span>
        <span className="text-[10px] font-semibold text-zinc-400">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MarketplaceMockup() {
  return (
    <div className="rounded-xl bg-[#0B0B0B] p-4 text-white space-y-3">
      <div className="text-xs font-black">Sri Lanka&apos;s Beauty & Wellness Marketplace</div>
      <div className="bg-[#ffc800] rounded-lg p-1.5 space-y-1 border-2 border-white/20">
        <div className="bg-white rounded-md px-2 py-1.5 text-[9px] text-zinc-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Where are you?
        </div>
        <div className="bg-white rounded-md px-2 py-1.5 text-[9px] text-zinc-500 flex items-center gap-1">
          <Search className="w-3 h-3" /> Haircut, colour, spa…
        </div>
        <div className="bg-[#e6b400] text-black text-[9px] font-bold py-1.5 rounded-md text-center">
          Search
        </div>
      </div>
      <div className="flex gap-2">
        <span className="bg-[#ffc800] text-black text-[9px] font-bold px-2 py-1 rounded-md">Book Now</span>
        <span className="border border-[#ffc800]/50 bg-[#ffc800]/10 text-[#ffc800] text-[9px] font-bold px-2 py-1 rounded-md">
          List Your Business
        </span>
      </div>
    </div>
  );
}

function BookingSheetMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-[10px]">
      <div className="px-3 py-2 bg-zinc-950 text-white font-bold">Book at {SALON.name}</div>
      <div className="p-3 space-y-2">
        {["1. Services", "2. Stylist", "3. Date & Time", "4. Your Details", "5. Summary"].map((s, i) => (
          <div
            key={s}
            className={`flex items-center justify-between py-1 border-b border-slate-100 ${
              i === 0 ? "text-brand font-bold" : "text-zinc-600"
            }`}
          >
            <span>{s}</span>
            {i === 0 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          </div>
        ))}
        <div className="pt-1 font-bold text-zinc-900">
          {SALON.service} — LKR {SALON.price}
        </div>
        <div className="bg-[#ffc800] text-black text-center py-1.5 rounded-lg font-bold">Continue</div>
      </div>
    </div>
  );
}

function CustomerSidebarMockup() {
  const menuItems = CUSTOMER_DASHBOARD_OPTIONS.slice(0, 4);
  const accountItems = [
    { title: "Profile", path: "/customer/profile" },
    { title: "Help", path: "/customer/help" },
    { title: "Support", path: "/customer/support" },
  ];

  return (
    <div className="rounded-xl bg-zinc-50 border border-slate-200 p-3 w-full max-w-[220px] shrink-0">
      <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2 px-1">Menu</div>
      {menuItems.map((item, index) => (
        <Link
          key={item.path}
          href={item.path}
          className={`block px-2 py-1.5 rounded-lg text-[10px] font-semibold mb-0.5 ${
            index === 0 ? "bg-[#ffc800] text-black" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {item.title}
        </Link>
      ))}
      <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-3 mb-2 px-1">
        Account
      </div>
      {accountItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`block px-2 py-1.5 rounded-lg text-[10px] font-semibold mb-0.5 ${
            item.path === "/customer/help" ? "bg-[#ffc800] text-black" : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}

function SectionCard({
  id,
  icon: Icon,
  title,
  path,
  description,
  features,
  tips,
  mockup,
  publicOnly,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  path?: string;
  description: string;
  features: string[];
  tips?: string[];
  mockup?: React.ReactNode;
  publicOnly?: boolean;
}) {
  return (
    <section id={id} className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">{title}</h2>
              {publicOnly && (
                <Badge className="bg-brand/10 text-brand border-none text-[9px] font-bold uppercase">
                  No login required
                </Badge>
              )}
              {path && (
                <Link
                  href={path}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline"
                >
                  Open page <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">What you can do</h3>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {tips && tips.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 mt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">Pro tips</h4>
              <ul className="space-y-1.5">
                {tips.map((t) => (
                  <li key={t} className="text-xs text-amber-900/90 leading-relaxed">
                    • {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {mockup && <MockFrame title={title}>{mockup}</MockFrame>}
      </div>
    </section>
  );
}

export function CustomerHelpGuide() {
  const [activeNav, setActiveNav] = useState<string>("overview");

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-16 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-primary-gradient text-zinc-900 p-6 sm:p-10 border border-brand/20">
        <Sparkles className="absolute -right-8 -top-8 w-40 h-40 text-black/10" />
        <div className="relative z-10 max-w-2xl">
          <span className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Customer Handbook
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Trimma Booking Guide
          </h1>
          <p className="text-sm text-zinc-800 leading-relaxed mb-4">
            Everything you need to find, book, and enjoy beauty & wellness services in Sri Lanka.
            Examples use <strong className="text-zinc-950">{CUSTOMER.name}</strong> booking{" "}
            <strong className="text-zinc-950">{SALON.service}</strong> at{" "}
            <strong className="text-zinc-950">{SALON.name}</strong> ({SALON.location}).
            This guide is <strong className="text-zinc-950">public</strong> — no login required to read it.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button variant="hero" className="h-9 rounded-xl hero-btn-compact text-xs font-bold">
                Find a salon
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="h-9 rounded-xl hero-btn-secondary text-xs font-bold px-4">
                Sign up with Google
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        <nav className="lg:sticky lg:top-24 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm max-h-[70vh] overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 px-2 py-1 mb-1">
            On this page
          </p>
          {NAV_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeNav === id
                  ? "bg-brand/10 text-brand"
                  : "text-zinc-600 hover:bg-slate-50 hover:text-zinc-900"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="space-y-8 min-w-0">
          <section id="overview" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Getting started</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Trimma connects you with verified salons, barbers, spas, and wellness studios across
              Sri Lanka. Search by location and service, book in a few taps, pay a small deposit
              online, and enjoy your appointment — then leave an honest review to help others.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Discover", desc: "Home, search, locations, categories, deals" },
                { step: "2", title: "Book", desc: "Service, stylist, time, 20% deposit checkout" },
                { step: "3", title: "Manage", desc: "Dashboard, bookings, favorites, reviews" },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <span className="text-[10px] font-black text-brand bg-brand/10 w-6 h-6 rounded-full inline-flex items-center justify-center mb-2">
                    {s.step}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900">{s.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="dashboard-menu" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 mb-2">Customer dashboard</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                After you sign in, these are the sections in your customer account. Open{" "}
                <Link href="/customer/help" className="text-brand font-bold hover:underline">
                  Help
                </Link>{" "}
                inside the dashboard for quick links to each area.
              </p>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              <CustomerSidebarMockup />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CUSTOMER_DASHBOARD_OPTIONS.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 hover:border-brand/40 transition-colors"
                  >
                    <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <SectionCard
            id="discover"
            icon={Search}
            title="Find a Salon"
            path="/"
            publicOnly
            description="Browse the Trimma marketplace, search by service and location, open a salon profile, then tap Book to start your appointment."
            features={[
              "Home and search — filter by service, category, and location",
              "Locations hub — provinces, districts, and cities across Sri Lanka",
              "Salon profile — services, staff, gallery, reviews, hours, and Book button",
              "Deals page — promotional packages from partner salons",
              "Favorite heart — save salons when signed in",
            ]}
            tips={[
              `Example: search near ${SALON.location} to find salons like ${SALON.name}.`,
              "Check salon working hours before choosing a time slot.",
            ]}
            mockup={<MarketplaceMockup />}
          />

          <SectionCard
            id="booking"
            icon={Calendar}
            title="Book Appointment"
            publicOnly
            description={`The booking sheet walks you through five steps to reserve ${SALON.service} with ${SALON.stylist} at ${SALON.name}.`}
            features={[
              "Step 1 — Select one or more services from the menu",
              "Step 2 — Choose your preferred stylist (or Any Available)",
              "Step 3 — Pick date and time from real-time available slots",
              "Step 4 — Phone lookup to autofill, then full name, email, phone, and optional notes",
              "Step 5 — Review summary, deposit breakdown, policy acknowledgements, then payment",
              "Only open time slots are shown — already-booked times aren't selectable",
              "Booking reference assigned after successful deposit (e.g. TRM-482916)",
            ]}
            tips={[
              "If a slot disappears at checkout, refresh and choose the next open time.",
              "Multi-service bookings use combined duration for slot length.",
              "Use the same email for booking and Google sign-in so appointments appear in My Bookings.",
            ]}
            mockup={<BookingSheetMockup />}
          />

          <SectionCard
            id="checkout"
            icon={CreditCard}
            title="Checkout & Deposit"
            path="/checkout/booking"
            description={`Secure payment for the 20% reservation deposit. For ${CUSTOMER.name}'s LKR ${SALON.price} haircut, the online deposit is LKR ${SALON.deposit}.`}
            features={[
              "Order summary — services, stylist, date/time, salon name",
              "Deposit line — 20% of total service price",
              "Balance due at salon — remaining 80% shown clearly",
              "Card payment via secure Stripe checkout",
              "Success page — booking reference and sign-in prompt for My Bookings",
              "Receipt email sent to your inbox",
            ]}
            tips={[
              "Keep your booking reference (TRM-…) for salon check-in.",
            ]}
          />

          <SectionCard
            id="notifications"
            icon={Bell}
            title="Notifications"
            publicOnly
            description="Stay informed from booking through your visit."
            features={[
              "Reservation paid — email and WhatsApp right after checkout",
              "Salon confirms — email and WhatsApp when the owner accepts your slot",
              "Reschedule or cancellation — messages if your appointment changes",
              "Review invitation — after your visit is marked completed",
              "Optional Telegram alerts if you connect Telegram to your Trimma account",
            ]}
            tips={[
              "Add your Sri Lankan mobile number in booking Step 4 for WhatsApp updates.",
            ]}
          />

          <section id="journey" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">End-to-end booking journey</h2>
            <p className="text-sm text-zinc-600 mb-6">
              Follow this path from first search to post-visit review — using {SALON.name} as the
              example salon.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {JOURNEY_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <span className="text-[10px] font-black text-brand bg-brand/10 w-6 h-6 rounded-full inline-flex items-center justify-center mb-2">
                    {s.step}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900">{s.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="faq" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Frequently asked questions</h2>
            <CustomerHelpFaq defaultOpenIndex={0} />
          </section>

          <BookingGuideDownloads />

          <section id="support" className="scroll-mt-24">
            <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-6 sm:p-8 border border-white/10">
              <div className="relative z-10 grid sm:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-3">
                    Customer support
                  </span>
                  <h3 className="text-xl font-bold mb-2">Need more help?</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Our team supports customers across Sri Lanka — booking issues, payments,
                    cancellations, and account questions.
                  </p>
                </div>
                <div className="space-y-4">
                  <a
                    href="mailto:support@trimma.io"
                    className="flex items-center gap-3 text-sm font-semibold text-white/90 hover:text-[#ffc800] transition-colors"
                  >
                    <Mail className="w-5 h-5 text-brand" />
                    support@trimma.io
                  </a>
                  <div className="flex items-center gap-3 text-sm font-semibold text-white/90">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    WhatsApp Customer Support
                  </div>
                  <Link href="/customer/support">
                    <Button className="w-full sm:w-auto h-10 rounded-xl bg-[#ffc800] hover:bg-[#ffc800]/90 text-black font-bold text-xs">
                      Open support centre
                    </Button>
                  </Link>
                  <Link
                    href="/customer/help"
                    className="block text-xs font-semibold text-white/70 hover:text-[#ffc800] transition-colors"
                  >
                    Signed in? Open dashboard help →
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
