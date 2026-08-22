"use client";

import { useId, useState } from "react";
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
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Star,
  Store,
  Tag,
  Users,
  X,
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

const CUSTOMER_FEATURES = [
  {
    icon: Search,
    title: "Salon discovery",
    description: "Search by service, district, rating, or style and browse published salon profiles.",
  },
  {
    icon: Tag,
    title: "Services and prices",
    description: "Compare menus, durations, and listed prices before you book.",
  },
  {
    icon: CalendarClock,
    title: "Live availability",
    description: "See open slots across stylists and chairs when the salon has online booking enabled.",
  },
  {
    icon: CreditCard,
    title: "Secure booking and deposits",
    description: "Reserve with a transparent deposit and see the balance due at the salon.",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp and email confirmations",
    description: "Get booking details in the channels you already use.",
  },
  {
    icon: Star,
    title: "Reviews on listings",
    description: "Read ratings and review counts shown on published Trimma listings.",
  },
  {
    icon: CalendarCheck,
    title: "Rescheduling",
    description: "Update an appointment when the salon’s booking rules allow it.",
  },
] as const;

const SALON_FEATURES = [
  {
    icon: CalendarClock,
    title: "Online appointment management",
    description: "See bookings in one calendar instead of juggling calls and paper books.",
  },
  {
    icon: Users,
    title: "Staff and chair scheduling",
    description: "Assign services, set hours, and reduce overlapping bookings.",
  },
  {
    icon: BarChart3,
    title: "Revenue reporting",
    description: "Track bookings, services, and staff performance from the salon dashboard.",
  },
  {
    icon: Heart,
    title: "Customer management",
    description: "Keep visit history and follow up with people who already booked with you.",
  },
  {
    icon: Bell,
    title: "Automated reminders",
    description: "Send WhatsApp and email reminders before appointments.",
  },
  {
    icon: Tag,
    title: "Deals and promotions",
    description: "Publish offers that appear on your profile and the Trimma deals page.",
  },
  {
    icon: Globe,
    title: "Multi-location management",
    description: "Run more than one branch from a single Trimma account when you need it.",
  },
] as const;

const BEFORE_ITEMS = [
  "Phone calls to check availability",
  "Paper books and missed slots",
  "No automated appointment reminders",
];

const AFTER_ITEMS = [
  "Customers book published times online",
  "One calendar for staff and chairs",
  "WhatsApp and email reminders from Trimma",
];

const USE_CASES = [
  {
    id: "customers",
    label: "Customers",
    title: "Book beauty and wellness without the back-and-forth",
    description:
      "Discover published salons, compare listed services and prices, and book when the business has online booking turned on.",
    bullets: ["Confirmations by email and WhatsApp", "Reviews shown on listings", "Reschedule when salon rules allow"],
    cta: { label: "Find a Salon", href: "/" },
  },
  {
    id: "owners",
    label: "Salon owners",
    title: "Run day-to-day operations in Trimma OS",
    description:
      "Manage appointments, staff, services, and promotions from the salon dashboard after you claim or list your business.",
    bullets: ["Appointment calendar", "Staff and service setup", "Deals, reporting, and reminders"],
    cta: { label: "Grow My Salon", href: "/onboarding" },
  },
  {
    id: "agents",
    label: "Regional partners",
    title: "Help local salons go live on Trimma",
    description:
      "Onboard businesses, manage leads, and work a territory from the partner portal.",
    bullets: ["Lead management", "Territory tools", "Salon onboarding"],
    cta: { label: "Partner Portal", href: "/agent/login" },
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
  const panelId = useId();
  const buttonId = useId();
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden bg-white">
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className="w-full min-h-11 flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-zinc-50 transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        <span className="font-semibold text-zinc-900 text-[15px] leading-snug">{q}</span>
        <ChevronDown
          className={`w-5 h-5 text-zinc-400 shrink-0 motion-reduce:transition-none transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className={open ? "block" : "hidden"}
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
                    className={`flex-1 min-h-11 rounded-xl px-3 py-2 text-xs font-bold motion-reduce:transition-none transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                      activeTab === index
                        ? "bg-zinc-900 text-white shadow-md"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                    role="tab"
                    aria-selected={activeTab === index}
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
  const [audience, setAudience] = useState<"customer" | "salon">("customer");
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const currentUseCase = USE_CASES.find((u) => u.id === activeUseCase) ?? USE_CASES[0];
  const featureList = audience === "customer" ? CUSTOMER_FEATURES : SALON_FEATURES;
  const visibleFeatures = showAllFeatures ? featureList : featureList.slice(0, 6);

  return (
    <div className="bg-white text-zinc-900 font-sans">
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/featured-hero.webp"
          alt="Customers and salons using Trimma to find, book, and manage beauty appointments"
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
              <SectionBadge hero>Sri Lanka&apos;s Beauty &amp; Wellness Booking Platform</SectionBadge>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Find. Book.</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Glow.
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Book trusted beauty and wellness services across Sri Lanka—or manage and grow your salon with Trimma OS.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/" className="hero-btn-primary min-h-11 px-8 py-4 rounded-2xl w-full sm:w-auto justify-center">
                  <Search className="w-4 h-4" />
                  Find a Salon
                </Link>
                <Link href="/onboarding" className="hero-btn-secondary min-h-11 px-8 py-4 rounded-2xl w-full sm:w-auto justify-center">
                  <Store className="w-4 h-4" />
                  Grow My Salon
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <p className="text-center text-sm font-semibold text-zinc-500 mb-3">I want to…</p>
          <div
            role="tablist"
            aria-label="Choose how you want to use Trimma"
            className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row"
          >
            {(
              [
                { id: "customer" as const, label: "I want to book a salon" },
                { id: "salon" as const, label: "I want to grow my salon" },
              ] as const
            ).map((tab) => {
              const selected = audience === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`features-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`features-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => {
                    setAudience(tab.id);
                    setShowAllFeatures(false);
                    setActiveUseCase(tab.id === "customer" ? "customers" : "owners");
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                    event.preventDefault();
                    setAudience(tab.id === "customer" ? "salon" : "customer");
                  }}
                  className={`min-h-11 flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                    selected
                      ? "bg-[#ffde5a] text-black shadow-md"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {audience === "customer" ? (
      <section
        id="features-panel-customer"
        role="tabpanel"
        aria-labelledby="features-tab-customer"
        className="py-12 sm:py-16 bg-zinc-50"
      >
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
                    aria-pressed={isActive}
                    className={`w-full min-h-11 text-left rounded-2xl border p-5 motion-reduce:transition-none transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
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
      ) : null}

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <SectionBadge>{audience === "customer" ? "For customers" : "For salon owners"}</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              {audience === "customer" ? "Book with more clarity" : "Run the salon from one dashboard"}
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              {audience === "customer"
                ? "Discovery, listed prices, availability, deposits, confirmations, and reviews — in one booking flow."
                : "Appointments, staff, revenue, customers, reminders, and promotions in Trimma OS."}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-white border border-zinc-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ffde5a]/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#B8860B]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 text-lg mb-2">{feature.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {featureList.length > 6 ? (
            <div className="text-center mt-8">
              <button
                type="button"
                aria-expanded={showAllFeatures}
                onClick={() => setShowAllFeatures((open) => !open)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
              >
                {showAllFeatures ? "Show fewer features" : "View All Features"}
                <ChevronDown className={`w-4 h-4 motion-reduce:transition-none transition-transform ${showAllFeatures ? "rotate-180" : ""}`} />
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {audience === "salon" ? (
      <section
        id="features-panel-salon"
        role="tabpanel"
        aria-labelledby="features-tab-salon"
        className="py-12 sm:py-16 bg-zinc-50"
      >
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
          <div className="mt-12 max-w-3xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 mb-3 tracking-tight">
              Inside the Trimma OS dashboard
            </h2>
            <p className="text-zinc-500 leading-relaxed mb-6">
              Bookings, staff, services, and revenue in one workspace after you sign in as a salon owner.
            </p>
            <Link
              href="/onboarding"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-zinc-900 hover:text-[#B8860B] transition-colors"
            >
              Grow My Salon
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-8">
            <SalonOwnerDashboardShowcase />
          </div>
        </div>
      </section>
      ) : null}

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <SectionBadge>Use Cases</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Built for Every Role
            </h2>
            <p className="text-zinc-500 text-lg">No matter who you are, Trimma adapts to your workflow.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-10" role="tablist" aria-label="Trimma use cases">
            {USE_CASES.map((uc) => (
              <button
                key={uc.id}
                type="button"
                role="tab"
                aria-selected={activeUseCase === uc.id}
                onClick={() => setActiveUseCase(uc.id)}
                className={`min-h-11 px-6 py-2.5 rounded-full text-sm font-bold motion-reduce:transition-none transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
                  activeUseCase === uc.id
                    ? "bg-[#ffde5a] text-black shadow-lg shadow-[#ffde5a]/25"
                    : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {uc.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-zinc-200 rounded-3xl p-8 lg:p-12 shadow-sm">
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
              className="inline-flex min-h-11 items-center gap-2 bg-[#ffde5a] hover:bg-[#ffe680] text-black font-bold px-6 py-3 rounded-xl"
            >
              {currentUseCase.cta.label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
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
