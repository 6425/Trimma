"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Tag,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Discover Salons Near You",
    description:
      "Search by location, service, style, or salon name. Browse verified profiles, ratings, and real customer reviews.",
    icon: MapPin,
    preview: {
      label: "Search & Explore",
      lines: ["Colombo · Haircut", "12 salons found", "★ 4.8 Glamour Lounge · 2.1 km"],
    },
  },
  {
    step: 2,
    title: "Browse Services & Styles",
    description:
      "View detailed service menus, pricing, staff portfolios, and style galleries before you book.",
    icon: Search,
    preview: {
      label: "Service Menu",
      lines: ["Women's Cut — LKR 3,500", "Balayage Color — LKR 12,000", "Keratin Treatment — LKR 8,500"],
    },
  },
  {
    step: 3,
    title: "Pick Your Perfect Time",
    description:
      "See real-time availability across stylists and chairs. No phone calls — just tap the slot that works for you.",
    icon: CalendarClock,
    preview: {
      label: "Live Availability",
      lines: ["Today · 2:30 PM — Available", "Today · 4:00 PM — Available", "Tomorrow · 10:00 AM — Available"],
    },
  },
  {
    step: 4,
    title: "Confirm Instantly",
    description:
      "Secure your appointment with instant confirmation via email and WhatsApp. Reschedule anytime from your account.",
    icon: CalendarCheck,
    preview: {
      label: "Booking Confirmed",
      lines: ["✓ Appointment locked", "✓ Deposit processed", "✓ Reminder scheduled"],
    },
  },
  {
    step: 5,
    title: "Show Up & Glow",
    description:
      "Arrive at your salon, enjoy your service, and leave a verified review to help the community discover great spots.",
    icon: Sparkles,
    preview: {
      label: "Your Experience",
      lines: ["Check in at salon", "Enjoy your treatment", "Rate & review your visit"],
    },
  },
];

const FEATURE_CARDS = [
  {
    icon: Search,
    title: "Smart Search & Filters",
    description: "Find salons by service, district, rating, price range, or style specialty in seconds.",
  },
  {
    icon: CalendarClock,
    title: "Real-Time Booking",
    description: "Lock live time slots 24/7 with instant confirmation — no waiting for callbacks.",
  },
  {
    icon: Star,
    title: "Verified Reviews",
    description: "Read authentic ratings from real clients. Every review is tied to a completed booking.",
  },
  {
    icon: LayoutDashboard,
    title: "Salon Dashboard",
    description: "Manage appointments, staff schedules, services, and revenue from one powerful control panel.",
  },
  {
    icon: Users,
    title: "Staff Scheduling",
    description: "Assign stylists to services, set working hours, and prevent double-bookings automatically.",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description: "Track daily bookings, top services, staff performance, and growth trends at a glance.",
  },
  {
    icon: Tag,
    title: "Deals & Promotions",
    description: "Launch seasonal offers, bundles, and limited-time discounts to fill empty chairs faster.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description: "Reduce no-shows with WhatsApp and email reminders sent before every appointment.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Accept deposits and subscription payments securely with integrated checkout flows.",
  },
  {
    icon: Globe,
    title: "Multi-Location Support",
    description: "Manage multiple branches, territories, and regional teams from a single Trimma account.",
  },
  {
    icon: Heart,
    title: "Customer CRM",
    description: "Build loyalty with visit history, favorites, and targeted re-engagement campaigns.",
  },
  {
    icon: ShieldCheck,
    title: "Vetted Salon Standards",
    description: "Every listed salon is reviewed for hygiene, credentials, and professional service quality.",
  },
];

const BEFORE_ITEMS = [
  "Endless phone calls to check availability",
  "Manual appointment books and missed slots",
  "No-shows with no automated reminders",
  "Scattered spreadsheets for revenue tracking",
  "Hard to attract new customers online",
];

const AFTER_ITEMS = [
  "Instant online booking in under 10 seconds",
  "Live calendar synced across staff and chairs",
  "Automated WhatsApp & email reminders",
  "Real-time dashboard with revenue insights",
  "Discoverable on Sri Lanka's beauty marketplace",
];

const USE_CASES = [
  {
    id: "customers",
    label: "Customers",
    stat: "10 sec",
    statLabel: "Average booking time",
    title: "Book Beauty & Wellness in Minutes",
    description:
      "Discover top-rated salons, compare services and prices, and lock your appointment without picking up the phone.",
    bullets: ["Instant confirmation", "Verified reviews", "Flexible rescheduling", "Zero booking fees"],
    cta: { label: "Find a Salon", href: "/search" },
  },
  {
    id: "owners",
    label: "Salon Owners",
    stat: "3×",
    statLabel: "Faster onboarding",
    title: "Run Your Salon on Trimma OS",
    description:
      "Fill empty chairs, automate scheduling, track revenue, and reach thousands of customers actively searching for beauty services.",
    bullets: ["Appointment automation", "Staff & service management", "Deals & promotions", "Revenue analytics"],
    cta: { label: "List Your Salon", href: "/onboarding" },
  },
  {
    id: "agents",
    label: "Regional Partners",
    stat: "500+",
    statLabel: "Businesses connected",
    title: "Grow Your Territory Network",
    description:
      "Onboard salons, manage leads, explore territories on the map, and help local businesses go digital with Trimma.",
    bullets: ["Lead management", "Territory explorer", "Salon onboarding tools", "Commission tracking"],
    cta: { label: "Partner Portal", href: "/login" },
  },
];

const WHY_CHOOSE = [
  {
    icon: Zap,
    title: "From Discovery to Confirmation",
    description: "Search, book, pay, and manage appointments in one seamless flow — no switching between tools.",
  },
  {
    icon: LayoutDashboard,
    title: "Built for Salon Operations",
    description: "Trimma understands chairs, staff rosters, service menus, and the daily rhythm of running a salon.",
  },
  {
    icon: TrendingUp,
    title: "Grow Without Heavy Software",
    description: "No complicated setup. Onboard in hours, not weeks, with guided tools and regional support.",
  },
  {
    icon: Globe,
    title: "Sri Lanka First, Built to Scale",
    description: "Designed for local districts, currencies, and beauty culture — ready for multi-city expansion.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp-Native Experience",
    description: "Confirmations and reminders where your customers already are — fast, familiar, and reliable.",
  },
  {
    icon: Store,
    title: "Marketplace + Salon Engine",
    description: "Customers discover you on Trimma; you run your business on Trimma OS. One platform, two powerful sides.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Salon Owner, Colombo",
    quote:
      "Trimma cut our no-shows in half. Customers book online, we get instant notifications, and the dashboard shows exactly how each stylist is performing.",
    rating: 5,
  },
  {
    name: "Nimal R.",
    role: "Customer, Kandy",
    quote:
      "I used to call three salons before finding an open slot. Now I book my haircut in under a minute and get a WhatsApp confirmation immediately.",
    rating: 5,
  },
  {
    name: "Dilani M.",
    role: "Spa Manager, Galle",
    quote:
      "The promotions feature helped us fill weekday slots we used to leave empty. Setup was simple and our team picked it up the same day.",
    rating: 5,
  },
  {
    name: "Arjun T.",
    role: "Barbershop Owner, Negombo",
    quote:
      "Staff scheduling used to be a nightmare on paper. Trimma syncs everyone's calendar and we haven't had a double-booking since we switched.",
    rating: 5,
  },
];

const FAQS = [
  {
    q: "Is Trimma free for customers to book?",
    a: "Yes. Customers pay zero booking fees on Trimma. You see transparent service pricing upfront with no hidden checkout surcharges.",
  },
  {
    q: "How do salon owners get started?",
    a: "Visit our onboarding page, submit your salon details, and a Trimma specialist helps you set up services, staff, and your live profile — typically within 24 hours.",
  },
  {
    q: "Can I manage multiple staff and services?",
    a: "Absolutely. Assign services to stylists, set individual working hours, manage chair capacity, and control availability from your salon dashboard.",
  },
  {
    q: "Does Trimma support payments and deposits?",
    a: "Yes. Trimma supports secure deposit collection at booking and subscription billing for salon plans, keeping payments integrated with your workflow.",
  },
  {
    q: "What types of businesses can use Trimma?",
    a: "Salons, barbershops, nail studios, spas, bridal studios, skincare clinics, yoga studios, men's grooming centres, and more.",
  },
  {
    q: "Can I run promotions and deals?",
    a: "Yes. Create seasonal campaigns, service bundles, and limited-time offers that appear on your salon profile and the Trimma deals page.",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-[#F5B700]/10 border border-[#F5B700]/30 text-[#B8860B] text-sm font-semibold px-4 py-2 rounded-full mb-5">
      <Sparkles className="w-4 h-4 text-[#F5B700]" />
      {children}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="font-semibold text-zinc-900 text-[15px] leading-snug">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
      >
        <p className="px-6 pb-5 text-zinc-600 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

function StepPreview({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute inset-0 rounded-3xl bg-[#F5B700]/15 blur-3xl scale-110 pointer-events-none" />
      <div className="relative bg-[#0B0B0B] rounded-3xl shadow-2xl border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#F5B700] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-white text-sm">Trimma</span>
          </div>
          <span className="text-xs text-[#F5B700] bg-[#F5B700]/10 px-2 py-1 rounded-full font-semibold">
            {label}
          </span>
        </div>
        <div className="space-y-2.5">
          {lines.map((line) => (
            <div
              key={line}
              className="rounded-xl px-4 py-3 text-sm bg-[#151515] border border-white/5 text-zinc-300"
            >
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function FeaturesContent() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(USE_CASES[0].id);
  const currentStep = HOW_IT_WORKS[activeStep];
  const currentUseCase = USE_CASES.find((u) => u.id === activeUseCase) ?? USE_CASES[0];

  return (
    <div className="bg-white text-zinc-900 font-sans">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,183,0,0.14)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#0B0B0B_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionBadge>#1 Salon Booking Platform</SectionBadge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 leading-[1.1] mb-6 tracking-tight">
              Find. Book.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFC947] to-[#F5B700]">
                Glow.
              </span>
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-lg">
              Sri Lanka&apos;s beauty &amp; wellness marketplace and salon operating system — discover top salons,
              book instantly, and power your business with Trimma OS.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-[#F5B700] hover:bg-[#FFC947] text-black font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-[#F5B700]/25 hover:scale-[1.02]"
              >
                <Search className="w-4 h-4" />
                Explore Salons
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-zinc-200 hover:border-[#F5B700]/50 text-zinc-900 font-bold px-8 py-4 rounded-2xl transition-all hover:scale-[1.02]"
              >
                <Store className="w-4 h-4" />
                List Your Business
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#F5B700]/10 blur-2xl pointer-events-none" />
            <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-200">
              <Image
                src="/assets/dashboard_mockup.jpg"
                alt="Trimma dashboard preview"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-white text-sm font-bold">Trimma OS Dashboard</span>
                <Link
                  href="/contact"
                  className="text-xs font-semibold text-black bg-[#F5B700] hover:bg-[#FFC947] px-3 py-1 rounded-full transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>How It Works</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Five Steps to Your Perfect Appointment
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              From discovery to confirmation — book beauty and wellness services in minutes, not hours.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-3">
              {HOW_IT_WORKS.map((item, index) => {
                const Icon = item.icon;
                const isActive = index === activeStep;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`w-full text-left rounded-2xl border p-5 transition-all duration-300 ${
                      isActive
                        ? "bg-white border-[#F5B700]/40 shadow-lg shadow-[#F5B700]/10"
                        : "bg-white/60 border-zinc-200 hover:border-zinc-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                          isActive ? "bg-[#F5B700] text-black" : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {isActive ? <Icon className="w-5 h-5" /> : item.step}
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900 text-base mb-1">{item.title}</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <p className="text-center text-sm text-zinc-400 font-medium pt-2">
                {activeStep + 1} / {HOW_IT_WORKS.length}
              </p>
            </div>
            <StepPreview label={currentStep.preview.label} lines={currentStep.preview.lines} />
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>Features</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Everything You Need in One Platform
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              A complete toolkit for customers who want seamless bookings and salon owners who want powerful growth tools.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_CARDS.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-white border border-zinc-200 hover:border-[#F5B700]/40 rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F5B700]/10 flex items-center justify-center group-hover:bg-[#F5B700]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#B8860B] group-hover:text-[#F5B700] transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-lg mb-2">{feature.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-[#B8860B] transition-colors"
            >
              See Pricing Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Before vs After ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>See the Difference</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Before vs After Trimma
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Why struggle with phone calls and paper books when you can automate the entire booking experience?
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-zinc-900 text-xl">Before Trimma</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-6">Manual scheduling &amp; missed opportunities</p>
              <ul className="space-y-3">
                {BEFORE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-zinc-600">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#0B0B0B] border border-[#F5B700]/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,183,0,0.12)_0%,_transparent_55%)] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#F5B700]/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-[#F5B700]" />
                  </div>
                  <h3 className="font-bold text-white text-xl">After Trimma</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-6">Automated booking &amp; salon growth</p>
                <ul className="space-y-3">
                  {AFTER_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-[#F5B700] shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dashboard Showcase ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-6 rounded-[2rem] bg-[#F5B700]/10 blur-3xl pointer-events-none" />
              <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 bg-zinc-50">
                <Image
                  src="/assets/trimma-os-dashboard.png"
                  alt="Trimma OS Agent Cockpit dashboard"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain object-top"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <SectionBadge>Salon Dashboard</SectionBadge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
                Inside the Trimma OS Dashboard
              </h2>
              <p className="text-zinc-500 text-lg leading-relaxed mb-8">
                A professional control panel built for salon owners — manage bookings, staff, services, and revenue
                without juggling multiple tools.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: CalendarClock, label: "Live Calendar" },
                  { icon: Users, label: "Staff Rosters" },
                  { icon: BarChart3, label: "Revenue Insights" },
                  { icon: Tag, label: "Deals & Promos" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3"
                  >
                    <Icon className="w-5 h-5 text-[#F5B700]" />
                    <span className="text-sm font-semibold text-zinc-800">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <SectionBadge>Use Cases</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Built for Every Role
            </h2>
            <p className="text-zinc-500 text-lg">No matter who you are, Trimma adapts to your workflow.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {USE_CASES.map((uc) => (
              <button
                key={uc.id}
                type="button"
                onClick={() => setActiveUseCase(uc.id)}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeUseCase === uc.id
                    ? "bg-[#F5B700] text-black shadow-lg shadow-[#F5B700]/25"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {uc.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-8 lg:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div>
              <div className="inline-flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black text-[#F5B700]">{currentUseCase.stat}</span>
                <span className="text-sm font-semibold text-zinc-500">{currentUseCase.statLabel}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-950 mb-3">{currentUseCase.title}</h3>
              <p className="text-zinc-500 leading-relaxed mb-6 max-w-xl">{currentUseCase.description}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                {currentUseCase.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
                    <Check className="w-4 h-4 text-[#F5B700] shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={currentUseCase.cta.href}
                className="inline-flex items-center gap-2 bg-[#F5B700] hover:bg-[#FFC947] text-black font-bold px-6 py-3 rounded-xl transition-all"
              >
                {currentUseCase.cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="hidden lg:flex flex-col gap-3 w-48">
              {["Booking Flow", "Salon Profile", "Dashboard View", "Deals Page"].map((label, i) => (
                <div
                  key={label}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold border ${
                    i === 0
                      ? "bg-[#F5B700]/10 border-[#F5B700]/30 text-[#B8860B]"
                      : "bg-zinc-50 border-zinc-200 text-zinc-500"
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>Why Choose Us</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Why Choose Trimma
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Discovery, booking, salon management, and growth — unified in one platform built for beauty professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY_CHOOSE.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-3xl border border-zinc-200 bg-white p-6 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-[#F5B700]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#F5B700]" />
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>Testimonials</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Loved by Salons &amp; Customers
            </h2>
            <p className="text-zinc-500 text-lg">Real results from real users across Sri Lanka.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#F5B700] text-[#F5B700]" />
                  ))}
                </div>
                <p className="text-zinc-600 text-sm leading-relaxed flex-1 mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <div className="font-bold text-zinc-900 text-sm">{t.name}</div>
                  <div className="text-zinc-400 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#F5B700]/10 border border-[#F5B700]/30 text-[#B8860B] text-sm font-semibold px-4 py-2 rounded-full mb-5">
              <HelpCircle className="w-4 h-4 text-[#F5B700]" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 bg-[#0B0B0B] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,183,0,0.18)_0%,_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Ready to Find, Book &amp; Glow?
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join Sri Lanka&apos;s leading beauty marketplace — whether you&apos;re booking your next appointment or
            growing your salon business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-[#F5B700] hover:bg-[#FFC947] text-black font-bold px-10 py-4 rounded-2xl transition-all hover:scale-[1.03] shadow-lg shadow-[#F5B700]/20"
            >
              <Search className="w-4 h-4" />
              Book a Salon
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 border border-[#F5B700]/50 bg-[#F5B700]/10 text-[#F5B700] hover:bg-[#F5B700]/20 hover:text-[#FFC947] font-bold px-10 py-4 rounded-2xl transition-all hover:scale-[1.03]"
            >
              <Store className="w-4 h-4" />
              List Your Salon
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
