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
  ExternalLink,
} from "lucide-react";
import { FindBookGlowCta } from "../../components/marketplace/FindBookGlowCta";

const SALON_DASHBOARD_ASSETS = {
  sidebar: "/assets/features/dashboard/sidebar-nav.png",
  performance: "/assets/features/dashboard/salon-performance.png",
  income: "/assets/features/dashboard/income-breakdown.png",
  analytics: "/assets/features/dashboard/analytics-charts.png",
  activity: "/assets/features/dashboard/recent-activity.png",
  commission: "/assets/features/dashboard/staff-commission.png",
} as const;

function DashboardPanel({
  src,
  alt,
  priority = false,
  className = "",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={1400}
        height={900}
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 70vw"
        className="h-auto w-full"
      />
    </div>
  );
}

function SalonOwnerDashboardShowcase() {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/60">
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500">
          <LayoutDashboard className="h-3.5 w-3.5 text-[#ffde5a]" />
          trimma.io/dashboard
        </div>
        <span className="hidden rounded-full bg-[#ffde5a]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-800 sm:inline">
          Salon Owner
        </span>
      </div>

      <div className="flex flex-col lg:flex-row">
        <div className="border-b border-zinc-100 bg-zinc-950 lg:w-[220px] lg:shrink-0 lg:border-b-0 lg:border-r">
          <DashboardPanel
            src={SALON_DASHBOARD_ASSETS.sidebar}
            alt="Trimma salon owner dashboard sidebar navigation"
            priority
            className="rounded-none border-0 shadow-none"
          />
        </div>

        <div className="flex-1 space-y-4 bg-slate-50 p-4 lg:p-6">
          <DashboardPanel
            src={SALON_DASHBOARD_ASSETS.performance}
            alt="Salon performance overview with bookings, services, staff, and revenue KPIs"
          />

          <DashboardPanel
            src={SALON_DASHBOARD_ASSETS.analytics}
            alt="Seven-day booking trends by staff and revenue growth charts"
          />

          <DashboardPanel
            src={SALON_DASHBOARD_ASSETS.income}
            alt="Booking income breakdown with service, staff commission, and net totals"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DashboardPanel
              src={SALON_DASHBOARD_ASSETS.activity}
              alt="Recent booking activity feed"
            />
            <DashboardPanel
              src={SALON_DASHBOARD_ASSETS.commission}
              alt="Staff commission breakdown for the last seven days"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────

const STEP_SCREENSHOTS = {
  step1: [
    {
      src: "/assets/features-discover-salon.png",
      alt: "Search salons by service and location on Trimma",
      tab: "Search & Explore",
    },
    {
      src: "/assets/features/steps/step-1-salon-card.png",
      alt: "Verified salon listing with ratings, pricing, and availability",
      tab: "Salon Results",
    },
  ],
  step2: {
    src: "/assets/features/steps/step-2-services.png",
    alt: "Browse salon service menus with pricing and durations",
  },
  step3: {
    src: "/assets/features/steps/step-3-booking-form.png",
    alt: "Select service, stylist, date, and time in the booking form",
  },
  step4: {
    src: "/assets/features/steps/step-4-reserve-slot.png",
    alt: "Reserve your slot with transparent deposit and balance breakdown",
  },
  step5: [
    {
      src: "/assets/features/steps/step-5-payment-email.png",
      alt: "Reservation payment confirmation email from Trimma",
      tab: "Payment Received",
    },
    {
      src: "/assets/features/steps/step-5-confirmed-email.png",
      alt: "Appointment confirmed email with booking details",
      tab: "Confirmed",
    },
  ],
} as const;

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Discover Salons Near You",
    description:
      "Search by location, service, style, or salon name. Browse verified profiles, ratings, and real customer reviews.",
    icon: MapPin,
  },
  {
    step: 2,
    title: "Browse Services & Styles",
    description:
      "View detailed service menus, pricing, staff portfolios, and style galleries before you book.",
    icon: Search,
  },
  {
    step: 3,
    title: "Pick Your Perfect Time",
    description:
      "See real-time availability across stylists and chairs. No phone calls — just tap the slot that works for you.",
    icon: CalendarClock,
  },
  {
    step: 4,
    title: "Confirm Instantly",
    description:
      "Secure your appointment with a small deposit — see exactly what you pay today and the balance due at the salon.",
    icon: CalendarCheck,
  },
  {
    step: 5,
    title: "Show Up & Glow",
    description:
      "Get instant email and WhatsApp confirmations, arrive at your salon, enjoy your service, and leave a verified review.",
    icon: Sparkles,
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
    cta: { label: "Find a Salon", href: "/" },
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
    cta: { label: "Partner Portal", href: "/agent/login" },
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

function SectionBadge({
  children,
  hero = false,
}: {
  children: React.ReactNode;
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        {children}
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-2 bg-[#ffde5a]/10 border border-[#ffde5a]/30 text-[#B8860B] text-sm font-semibold px-4 py-2 rounded-full mb-5">
      <Sparkles className="w-4 h-4 text-[#ffde5a]" />
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

function StepScreenshot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="h-auto w-full"
      />
    </div>
  );
}

function StepVisual({ stepIndex }: { stepIndex: number }) {
  const [activeTab, setActiveTab] = useState(0);

  const stepNumber = stepIndex + 1;

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="absolute inset-0 rounded-[2rem] bg-[#ffde5a]/12 blur-3xl scale-105 pointer-events-none" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-2xl shadow-zinc-200/70">
        <div className="flex items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-[#ffde5a]" />
            trimma.io — Step {stepNumber}
          </div>
        </div>

        <div className="p-3 sm:p-4">
          {stepNumber === 1 && (
            <div className="space-y-3">
              {STEP_SCREENSHOTS.step1.map((shot) => (
                <StepScreenshot key={shot.src} src={shot.src} alt={shot.alt} />
              ))}
            </div>
          )}

          {stepNumber === 2 && (
            <StepScreenshot src={STEP_SCREENSHOTS.step2.src} alt={STEP_SCREENSHOTS.step2.alt} />
          )}

          {stepNumber === 3 && (
            <StepScreenshot src={STEP_SCREENSHOTS.step3.src} alt={STEP_SCREENSHOTS.step3.alt} />
          )}

          {stepNumber === 4 && (
            <StepScreenshot src={STEP_SCREENSHOTS.step4.src} alt={STEP_SCREENSHOTS.step4.alt} />
          )}

          {stepNumber === 5 && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {STEP_SCREENSHOTS.step5.map((shot, index) => (
                  <button
                    key={shot.src}
                    type="button"
                    onClick={() => setActiveTab(index)}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                      activeTab === index
                        ? "bg-zinc-900 text-white shadow-md"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {shot.tab}
                  </button>
                ))}
              </div>
              <StepScreenshot
                src={STEP_SCREENSHOTS.step5[activeTab].src}
                alt={STEP_SCREENSHOTS.step5[activeTab].alt}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function FeaturesContent() {
  const [activeStep, setActiveStep] = useState(0);
  const [activeUseCase, setActiveUseCase] = useState(USE_CASES[0].id);
  const currentUseCase = USE_CASES.find((u) => u.id === activeUseCase) ?? USE_CASES[0];

  return (
    <div className="bg-white text-zinc-900 font-sans">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/featured-hero.webp"
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
              <SectionBadge hero>#1 Salon Booking Platform</SectionBadge>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Find. Book.</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Glow.
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Sri Lanka&apos;s beauty &amp; wellness marketplace and salon operating system — discover top salons,
                book instantly, and power your business with Trimma OS.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/" className="hero-btn-primary px-8 py-4 rounded-2xl">
                  <Search className="w-4 h-4" />
                  Explore Salons
                </Link>
                <Link href="/onboarding" className="hero-btn-secondary px-8 py-4 rounded-2xl">
                  <Store className="w-4 h-4" />
                  List Your Business
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
                        ? "bg-white border-[#ffde5a]/40 shadow-lg shadow-[#ffde5a]/10"
                        : "bg-white/60 border-zinc-200 hover:border-zinc-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                          isActive ? "bg-[#ffde5a] text-black" : "bg-zinc-100 text-zinc-500"
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
            <StepVisual key={activeStep} stepIndex={activeStep} />
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
                  className="group bg-white border border-zinc-200 hover:border-[#ffde5a]/40 rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ffde5a]/10 flex items-center justify-center group-hover:bg-[#ffde5a]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#B8860B] group-hover:text-[#ffde5a] transition-colors" />
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
            <div className="bg-[#0B0B0B] border border-[#ffde5a]/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,222,90,0.12)_0%,_transparent_55%)] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#ffde5a]/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-[#ffde5a]" />
                  </div>
                  <h3 className="font-bold text-white text-xl">After Trimma</h3>
                </div>
                <p className="text-zinc-400 text-sm mb-6">Automated booking &amp; salon growth</p>
                <ul className="space-y-3">
                  {AFTER_ITEMS.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                      <Check className="w-4 h-4 text-[#ffde5a] shrink-0 mt-0.5" />
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
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <SectionBadge>Salon Dashboard</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Inside the Trimma OS Dashboard
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed mb-6">
              The salon owner dashboard at{" "}
              <code className="rounded-md bg-white px-2 py-0.5 text-sm font-semibold text-zinc-800 border border-zinc-200">
                /dashboard
              </code>{" "}
              brings bookings, staff, services, and revenue into one professional workspace.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-[#B8860B] transition-colors"
            >
              Open Salon Dashboard
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          <SalonOwnerDashboardShowcase />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { icon: CalendarClock, label: "Live Calendar" },
              { icon: Users, label: "Staff Rosters" },
              { icon: BarChart3, label: "Revenue Insights" },
              { icon: Tag, label: "Deals & Promos" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white border border-zinc-200 rounded-2xl px-4 py-3 shadow-sm"
              >
                <Icon className="w-5 h-5 text-[#ffde5a]" />
                <span className="text-sm font-semibold text-zinc-800">{label}</span>
              </div>
            ))}
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
                    ? "bg-[#ffde5a] text-black shadow-lg shadow-[#ffde5a]/25"
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
                <span className="text-4xl font-black text-[#ffde5a]">{currentUseCase.stat}</span>
                <span className="text-sm font-semibold text-zinc-500">{currentUseCase.statLabel}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-zinc-950 mb-3">{currentUseCase.title}</h3>
              <p className="text-zinc-500 leading-relaxed mb-6 max-w-xl">{currentUseCase.description}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                {currentUseCase.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
                    <Check className="w-4 h-4 text-[#ffde5a] shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={currentUseCase.cta.href}
                className="inline-flex items-center gap-2 bg-[#ffde5a] hover:bg-[#ffe680] text-black font-bold px-6 py-3 rounded-xl transition-all"
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
                      ? "bg-[#ffde5a]/10 border-[#ffde5a]/30 text-[#B8860B]"
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
                  <div className="w-11 h-11 rounded-xl bg-[#ffde5a]/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-[#ffde5a]" />
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
                    <Star key={i} className="w-4 h-4 fill-[#ffde5a] text-[#ffde5a]" />
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
            <div className="inline-flex items-center gap-2 bg-[#ffde5a]/10 border border-[#ffde5a]/30 text-[#B8860B] text-sm font-semibold px-4 py-2 rounded-full mb-5">
              <HelpCircle className="w-4 h-4 text-[#ffde5a]" />
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

      <FindBookGlowCta />
    </div>
  );
}
