"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Store,
  CalendarDays,
  Users,
  Clock,
  ShieldCheck,
  MapPin,
  Star,
  ArrowRight,
  PlayCircle,
  BookX,
  PhoneOff,
  UserX,
  FileWarning,
  Armchair,
  HeartCrack,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  CalendarClock,
  Heart,
  Tag,
  BarChart3,
  Smartphone,
  Brain,
  Bell,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  Timer,
  Repeat,
  Search,
  BadgeCheck,
  CalendarCheck,
  ChevronDown,
  Rocket,
  Megaphone,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  getDisplayMonthlyPrice,
  getListMonthlyPrice,
  getDiscountPercentage,
  getAnnualTotal,
  formatLkr,
} from "@/lib/subscription-pricing";

const trustStats = [
  { icon: Store, value: "200+", label: "Salons" },
  { icon: CalendarDays, value: "50,000+", label: "Appointments" },
  { icon: Users, value: "15,000+", label: "Customers" },
  { icon: Clock, value: "24/7", label: "Cloud Access" },
  { icon: ShieldCheck, value: "Secure", label: "Payments" },
  { icon: MapPin, value: "Sri Lanka", label: "Built" },
];

const painPoints = [
  { icon: BookX, title: "Appointment book full of handwriting" },
  { icon: PhoneOff, title: "Customers forget appointments" },
  { icon: UserX, title: "Staff commissions take hours" },
  { icon: FileWarning, title: "Hard to track income" },
  { icon: Armchair, title: "Empty chairs during weekdays" },
  { icon: HeartCrack, title: "Customers never return" },
];

const betterDay = [
  {
    icon: Sunrise,
    time: "Morning",
    text: "Online bookings arrive overnight. Staff schedules auto-filled — no double bookings.",
  },
  {
    icon: Sun,
    time: "Afternoon",
    text: "Walk-ins managed. Payments tracked. Happy customers, on time.",
  },
  {
    icon: Moon,
    time: "Evening",
    text: "Revenue reports ready. See your business grow at a glance.",
  },
  {
    icon: Sparkles,
    time: "Tomorrow",
    text: "Automatic reminders sent. Customers come back for more.",
  },
];

const showcase = [
  {
    icon: Store,
    eyebrow: "All-in-one dashboard",
    title: "Run your entire salon from one screen",
    text: "Bookings, staff, payments and customers — every part of your business in a single real-time dashboard, built for salon owners.",
    bullets: [
      "Live view of today's appointments & revenue",
      "Occupancy and performance at a glance",
      "No spreadsheets, no guesswork",
    ],
    image: "/assets/trimma-os-dashboard.png",
  },
  {
    icon: CalendarClock,
    eyebrow: "Online booking",
    title: "A booking page that fills your calendar",
    text: "Customers book in seconds from anywhere. Trimma prevents double-bookings and confirms every slot automatically.",
    bullets: [
      "24/7 self-service booking",
      "Deposits collected upfront",
      "Fewer no-shows, more revenue",
    ],
    image: "/assets/features/steps/step-3-booking-form.png",
    narrow: true,
  },
  {
    icon: BarChart3,
    eyebrow: "Reports & analytics",
    title: "Know your numbers at a glance",
    text: "See revenue trends, staff performance and what's driving growth — updated in real time, no accountant required.",
    bullets: [
      "Daily revenue breakdown",
      "Per-staff booking trends",
      "Smarter decisions, backed by data",
    ],
    image: "/assets/features/dashboard/analytics-charts.png",
  },
  {
    icon: Users,
    eyebrow: "Staff & commissions",
    title: "Pay your team the right amount, automatically",
    text: "Commissions are calculated for every booking. Review and pay in minutes instead of spending your Sunday on a calculator.",
    bullets: [
      "Automatic commission per service",
      "Per-staff performance tracking",
      "Payroll-ready summaries",
    ],
    image: "/assets/features/dashboard/staff-commission.png",
  },
];

const moreFeatures = [
  { icon: Heart, title: "Customer CRM", text: "Build relationships, track history and grow loyalty." },
  { icon: Tag, title: "Promotions", text: "Create offers and campaigns that fill empty chairs." },
  { icon: Smartphone, title: "Mobile App", text: "Run your salon from your pocket — iOS & Android." },
  { icon: Brain, title: "AI Business Insights", text: "Predict trends and get smart recommendations." },
  { icon: Bell, title: "Automated Reminders", text: "WhatsApp & email reminders cut down no-shows." },
  { icon: CalendarDays, title: "Smart Calendar", text: "No clashes, no double-bookings. Always organised." },
];

const otherSystems = ["Booking only", "No marketing", "Complicated", "Expensive"];
const manualMethod = ["Notebook", "WhatsApp", "Calculator", "Paper"];
const trimmaWay = [
  "Everything connected",
  "Bookings + CRM",
  "Payments + Reports",
  "Staff + Marketing",
  "Grow customers",
];

const growthStats = [
  { icon: TrendingUp, value: "+32%", label: "Increase Revenue", tone: "up" },
  { icon: TrendingDown, value: "-70%", label: "Reduce No Shows", tone: "down" },
  { icon: Timer, value: "15 Hours/Week", label: "Save Admin Time", tone: "neutral" },
  { icon: Repeat, value: "+45%", label: "Customer Retention", tone: "up" },
];

const customerJourney = [
  { icon: Search, label: "Discover Salon" },
  { icon: CalendarClock, label: "Book Online" },
  { icon: Bell, label: "Get Reminder" },
  { icon: BadgeCheck, label: "Visit Salon" },
  { icon: Star, label: "Leave Review" },
  { icon: Heart, label: "Become Regular" },
  { icon: Repeat, label: "Book Again" },
];

const salonJourney = [
  { icon: Rocket, label: "Start Free" },
  { icon: CalendarCheck, label: "More Bookings" },
  { icon: Megaphone, label: "Open 2nd Branch" },
  { icon: Building2, label: "Multiple Branches" },
  { icon: Star, label: "Build a Beauty Brand" },
];

const integrations = [
  "Payhere",
  "WhatsApp",
  "Gmail",
  "Google Maps",
  "Facebook",
  "Instagram",
  "TikTok",
  "Apple Calendar",
  "Google Calendar",
];

const faqs = [
  {
    q: "Can I customize booking times?",
    a: "Yes. Set your working hours, break times, buffer periods, and per-staff availability. Trimma prevents double bookings automatically.",
  },
  {
    q: "Do I need technical knowledge?",
    a: "Not at all. Trimma is designed for salon owners, not developers. If you can use WhatsApp, you can run Trimma.",
  },
  {
    q: "Can I manage branches?",
    a: "Absolutely. Manage multiple locations, staff rosters, and consolidated analytics from a single owner dashboard.",
  },
  {
    q: "How do payments work?",
    a: "Customers can pay a reservation deposit online securely, or pay in full at the salon. You control the policy per service.",
  },
];

const testimonials = [
  {
    name: "Nimali Perera",
    role: "Owner, Bloom Beauty Lounge",
    location: "Colombo",
    avatar: "https://i.pravatar.cc/160?img=47",
    quote:
      "No-shows dropped almost overnight. My chairs stay full on weekdays now, and I finally stopped chasing customers on WhatsApp.",
  },
  {
    name: "Ashan Fernando",
    role: "Founder, Sharp Cuts Barber",
    location: "Kandy",
    avatar: "https://i.pravatar.cc/160?img=13",
    quote:
      "Staff commissions used to take my whole Sunday. Trimma calculates everything automatically — I just review and pay.",
  },
  {
    name: "Dilani Jayawardena",
    role: "Manager, Serenity Spa & Salon",
    location: "Galle",
    avatar: "https://i.pravatar.cc/160?img=32",
    quote:
      "The reports show me exactly which services make money. We opened our second branch within a year of switching.",
  },
];

function StarRow() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="w-4 h-4 fill-[#ffde5a] text-[#ffde5a]" />
      ))}
    </div>
  );
}

function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="rounded-2xl overflow-hidden bg-white ring-1 ring-zinc-200/80 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)]">
      <div className="flex items-center gap-1.5 px-4 h-9 bg-zinc-50 border-b border-zinc-100">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffde5a]" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
      </div>
      <img src={src} alt={alt} className="w-full h-auto block" loading="lazy" />
    </div>
  );
}

export function PreviewLandingContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pricingPlans = DEFAULT_SUBSCRIPTION_PLANS.filter((p) =>
    ["Starter", "Pro", "Elite"].includes(p.name)
  );

  return (
    <div className="bg-white text-zinc-900 font-sans overflow-x-hidden">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white">
        {/* soft ambient backdrop */}
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-24 -right-24 w-[36rem] h-[36rem] rounded-full bg-[#ffde5a]/20 blur-3xl" />
          <div className="absolute top-40 -left-32 w-[30rem] h-[30rem] rounded-full bg-indigo-200/30 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              The all-in-one salon platform for Sri Lanka
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-zinc-900">
              Grow Your Salon.
              <br />
              Not Your Stress.
            </h1>
            <p className="mt-6 text-lg text-zinc-600 max-w-xl leading-relaxed">
              Get more bookings, reduce no-shows, manage your team, increase
              repeat customers, and grow your revenue — all from one platform.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button variant="default" size="xl" className="w-full sm:w-auto rounded-xl">
                  Start Free <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/features" className="w-full sm:w-auto">
                <Button variant="dark" size="xl" className="w-full sm:w-auto rounded-xl">
                  <PlayCircle className="w-4 h-4" /> Watch Demo
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <StarRow />
              <span className="text-sm font-semibold text-zinc-500">
                Trusted by salons across Sri Lanka
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-[#ffde5a]/30 via-transparent to-indigo-300/20 blur-2xl" />
            <img
              src="/assets/dashboard_mockup.jpg"
              alt="Trimma salon dashboard on laptop, tablet and phone"
              className="relative w-full rounded-2xl shadow-2xl ring-1 ring-black/5"
            />
          </div>
        </div>

        {/* Trust stats bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg ring-1 ring-zinc-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
            {trustStats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-5 py-4 justify-center sm:justify-start">
                <s.icon className="w-5 h-5 text-zinc-900 shrink-0" />
                <div className="leading-tight">
                  <div className="text-sm font-black">{s.value}</div>
                  <div className="text-[11px] text-zinc-500 font-medium">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SOUND FAMILIAR ============ */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl lg:text-4xl font-black text-center tracking-tight">
            Sound Familiar?
          </h2>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {painPoints.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-red-100 bg-red-50/50 p-5 text-center flex flex-col items-center gap-3"
              >
                <div className="w-11 h-11 rounded-full bg-white ring-1 ring-red-100 flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-xs font-semibold text-zinc-600 leading-snug">
                  {p.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ A BETTER DAY ============ */}
      <section className="py-16 lg:py-20 bg-[#FFFEF0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl lg:text-4xl font-black text-center tracking-tight">
            A Better Day with Trimma
          </h2>
          <div className="mt-12 grid md:grid-cols-4 gap-6">
            {betterDay.map((d, i) => (
              <div key={d.time} className="relative">
                <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-100 h-full">
                  <div className="w-12 h-12 rounded-xl bg-[#ffde5a] flex items-center justify-center mb-4">
                    <d.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="font-black text-lg">{d.time}</h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{d.text}</p>
                </div>
                {i < betterDay.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 w-6 h-6 text-[#ffde5a] z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRODUCT SHOWCASE (zig-zag) ============ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
              Everything You Need to Grow
            </h2>
            <p className="mt-4 text-zinc-600">
              One connected platform — see exactly how Trimma runs your salon.
            </p>
          </div>

          <div className="mt-16 space-y-20 lg:space-y-28">
            {showcase.map((s, i) => {
              const flip = i % 2 === 1;
              return (
                <div
                  key={s.title}
                  className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center"
                >
                  <div className={flip ? "lg:order-2" : ""}>
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#FFFEF0] ring-1 ring-[#ffde5a]/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-800">
                      <s.icon className="w-3.5 h-3.5" />
                      {s.eyebrow}
                    </span>
                    <h3 className="mt-4 text-2xl lg:text-3xl font-black tracking-tight leading-tight">
                      {s.title}
                    </h3>
                    <p className="mt-4 text-zinc-600 leading-relaxed max-w-lg">
                      {s.text}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {s.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm font-medium text-zinc-700">
                          <span className="mt-0.5 w-5 h-5 rounded-full bg-[#ffde5a] flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-black" />
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`${flip ? "lg:order-1" : ""} ${
                      s.narrow ? "mx-auto w-full max-w-[300px] lg:max-w-[320px]" : ""
                    }`}
                  >
                    <BrowserFrame src={s.image} alt={s.title} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secondary features */}
          <div className="mt-20 lg:mt-28 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {moreFeatures.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-[#ffde5a] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-black" />
                </div>
                <h4 className="font-black">{f.title}</h4>
                <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHY TRIMMA IS DIFFERENT ============ */}
      <section className="py-16 lg:py-20 bg-[#0B0B0B] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl lg:text-4xl font-black text-center tracking-tight">
            Why Trimma is Different
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-7">
              <h3 className="font-bold text-lg text-zinc-300">Other Systems</h3>
              <ul className="mt-5 space-y-3">
                {otherSystems.map((o) => (
                  <li key={o} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <X className="w-4 h-4 text-red-400 shrink-0" /> {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-7">
              <h3 className="font-bold text-lg text-zinc-300">Manual Method</h3>
              <ul className="mt-5 space-y-3">
                {manualMethod.map((o) => (
                  <li key={o} className="flex items-center gap-2.5 text-sm text-zinc-400">
                    <X className="w-4 h-4 text-red-400 shrink-0" /> {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-[#ffde5a] text-black p-7 shadow-2xl shadow-[#ffde5a]/20 relative">
              <div className="w-11 h-11 rounded-xl bg-black flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-[#ffde5a]" />
              </div>
              <h3 className="font-black text-lg">Trimma</h3>
              <ul className="mt-5 space-y-3">
                {trimmaWay.map((o) => (
                  <li key={o} className="flex items-center gap-2.5 text-sm font-semibold">
                    <Check className="w-4 h-4 shrink-0" /> {o}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ GROWTH STATS ============ */}
      <section className="py-14 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {growthStats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-zinc-100 bg-white p-6 text-center shadow-sm"
            >
              <s.icon
                className={`w-6 h-6 mx-auto mb-3 ${
                  s.tone === "up"
                    ? "text-emerald-500"
                    : s.tone === "down"
                    ? "text-emerald-500"
                    : "text-zinc-900"
                }`}
              />
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs text-zinc-500 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ JOURNEYS ============ */}
      <section className="py-16 lg:py-20 bg-[#FFFEF0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 gap-12">
          <div>
            <h3 className="text-xl font-black text-center mb-8">Customer Journey</h3>
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-5">
              {customerJourney.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center w-16 text-center">
                    <div className="w-11 h-11 rounded-full bg-[#ffde5a] flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-black" />
                    </div>
                    <span className="mt-2 text-[10px] font-semibold text-zinc-600 leading-tight">
                      {step.label}
                    </span>
                  </div>
                  {i < customerJourney.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-zinc-300 mb-5" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-center mb-8">Salon Growth Journey</h3>
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-5">
              {salonJourney.map((step, i) => (
                <div key={step.label} className="flex items-center">
                  <div className="flex flex-col items-center w-16 text-center">
                    <div className="w-11 h-11 rounded-full bg-black flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-[#ffde5a]" />
                    </div>
                    <span className="mt-2 text-[10px] font-semibold text-zinc-600 leading-tight">
                      {step.label}
                    </span>
                  </div>
                  {i < salonJourney.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-zinc-300 mb-5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl lg:text-4xl font-black text-center tracking-tight">
            Loved by Salon Owners
          </h2>
          <p className="mt-4 text-center text-zinc-600 max-w-2xl mx-auto">
            Real results from beauty businesses growing with Trimma across Sri Lanka.
          </p>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-3xl border border-zinc-100 bg-white p-7 shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                <StarRow />
                <p className="mt-4 text-sm text-zinc-700 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#ffde5a]"
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-black">{t.name}</div>
                    <div className="text-[11px] text-zinc-500 font-medium">{t.role}</div>
                    <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {t.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ INTEGRATIONS ============ */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tight">
            Works with Your Favourite Tools
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {integrations.map((tool) => (
              <span
                key={tool}
                className="px-4 py-2 rounded-full bg-zinc-50 ring-1 ring-zinc-200 text-sm font-semibold text-zinc-700"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="py-16 lg:py-24 bg-[#FFFEF0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight">
              Simple Pricing. No Hidden Fees.
            </h2>
            <p className="mt-4 text-zinc-600">
              Introductory rates on monthly billing. Start free, upgrade anytime.
            </p>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan) => {
              const isPro = plan.name.toLowerCase() === "pro";
              const displayMonthly = getDisplayMonthlyPrice(plan, "monthly");
              const listMonthly = getListMonthlyPrice(plan);
              const discount = getDiscountPercentage(plan);
              const annualTotal = getAnnualTotal(plan);
              const displayName =
                plan.name === "Pro"
                  ? "Professional"
                  : plan.name === "Elite"
                  ? "Enterprise"
                  : plan.name;
              const features = plan.feature_flags?.features || [];

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-8 flex flex-col relative transition-all duration-300 ${
                    isPro
                      ? "bg-[#0B0B0B] text-white shadow-2xl scale-[1.03]"
                      : "bg-white text-zinc-900 ring-1 ring-zinc-100 shadow-sm"
                  }`}
                >
                  {isPro && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ffde5a] text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Most Popular
                    </div>
                  )}
                  <h3
                    className={`text-sm font-bold uppercase tracking-widest ${
                      isPro ? "text-[#ffde5a]" : "text-zinc-500"
                    }`}
                  >
                    {displayName}
                  </h3>
                  {discount > 0 && (
                    <p className={`text-sm line-through mt-3 ${isPro ? "text-zinc-500" : "text-zinc-400"}`}>
                      {formatLkr(listMonthly)}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-black">{formatLkr(displayMonthly)}</span>
                    <span className={`text-xs font-semibold ${isPro ? "text-zinc-400" : "text-zinc-400"}`}>
                      /month
                    </span>
                  </div>
                  <p className={`text-xs mt-2 ${isPro ? "text-zinc-400" : "text-zinc-500"}`}>
                    or {formatLkr(annualTotal)} billed annually
                  </p>

                  <ul className="mt-6 space-y-3 flex-1">
                    <li className={`flex items-center gap-2.5 text-sm ${isPro ? "text-zinc-200" : "text-zinc-700"}`}>
                      <Check className="w-4 h-4 text-[#ffde5a] shrink-0" /> Up to {plan.max_staff} staff
                    </li>
                    <li className={`flex items-center gap-2.5 text-sm ${isPro ? "text-zinc-200" : "text-zinc-700"}`}>
                      <Check className="w-4 h-4 text-[#ffde5a] shrink-0" />{" "}
                      {plan.max_services >= 9999 ? "Unlimited" : plan.max_services} services
                    </li>
                    <li className={`flex items-center gap-2.5 text-sm ${isPro ? "text-zinc-200" : "text-zinc-700"}`}>
                      <Check className="w-4 h-4 text-[#ffde5a] shrink-0" /> {plan.max_images} gallery images
                    </li>
                    {features.map((feat) => (
                      <li
                        key={feat}
                        className={`flex items-center gap-2.5 text-sm ${isPro ? "text-zinc-200" : "text-zinc-700"}`}
                      >
                        <Check className="w-4 h-4 text-[#ffde5a] shrink-0" /> {feat}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/checkout/subscription?plan=${encodeURIComponent(plan.name.toLowerCase())}&cycle=monthly`}
                    className="mt-8 w-full"
                  >
                    <Button
                      variant={isPro ? "default" : "dark"}
                      size="lg"
                      className="w-full rounded-xl"
                    >
                      Start Free
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h3 className="text-2xl font-black text-center mb-8">
              Frequently Asked Questions
            </h3>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={faq.q}
                  className="rounded-2xl bg-white ring-1 ring-zinc-100 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                  >
                    <span className="font-bold text-sm pr-4">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 -mt-1 text-sm text-zinc-600 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ BOTTOM CTA ============ */}
      <section className="py-16 lg:py-20 bg-[#0B0B0B] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Your salon deserves more
              <br />
              than <span className="text-[#ffde5a]">notebooks and spreadsheets</span>
            </h2>
            <div className="mt-5 flex items-center gap-3">
              <StarRow />
              <span className="text-sm text-zinc-400 font-medium">
                Join 200+ successful salons growing with Trimma
              </span>
            </div>
          </div>
          <Link href="/onboarding" className="w-full lg:w-auto shrink-0">
            <Button variant="default" size="xl" className="w-full lg:w-auto rounded-xl">
              Start Free Today <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
