"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  HelpCircle,
  KanbanSquare,
  Map,
  MapPin,
  MessageCircle,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { AgentApplicationForm } from "../../components/careers/AgentApplicationForm";

// ─── Data ────────────────────────────────────────────────────────────────────

const HERO_STATS = [
  { value: "Rs 15,000+", label: "Top monthly earners" },
  { value: "500+", label: "Salons in network" },
  { value: "10%", label: "Commission tier" },
];

const EARNING_TIERS = [
  {
    salons: 5,
    amount: "Rs 3,750+",
    period: "conversion rewards",
    label: "Starter Agent",
    popular: false,
  },
  {
    salons: 20,
    amount: "Rs 15,000+",
    period: "conversion rewards",
    label: "Growth Agent",
    popular: true,
  },
  {
    salons: 50,
    amount: "Rs 37,500+",
    period: "conversion rewards",
    label: "Power Agent",
    popular: false,
  },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Apply to Join",
    description:
      "Submit your application and tell us about your territory experience. Trimma reviews profiles and onboard approved agents quickly.",
    icon: UserPlus,
  },
  {
    step: 2,
    title: "Onboard Salons in Your Territory",
    description:
      "Use the Agent Cockpit, Territory Explorer, and Field Editor to verify leads, invite owners, and activate live salon profiles.",
    icon: Building2,
  },
  {
    step: 3,
    title: "Earn Commission",
    description:
      "Get paid conversion rewards when salons go live, plus ongoing booking and subscription commissions tracked in your ledger.",
    icon: Wallet,
  },
];

const BENEFITS = [
  {
    icon: KanbanSquare,
    title: "Agent Cockpit Dashboard",
    description:
      "Track assigned salons, onboarding progress, live conversions, and total earnings from one central workspace.",
  },
  {
    icon: Map,
    title: "Territory Explorer",
    description:
      "Discover salons on the map, search by business name, filter by district, and claim leads in your assigned territories.",
  },
  {
    icon: ClipboardList,
    title: "Field Editor & Lead Sheet",
    description:
      "Verify salon details, update services and staff, invite owners, and move leads through the onboarding pipeline.",
  },
  {
    icon: Wallet,
    title: "Commission Ledger",
    description:
      "View conversion rewards, booking commissions, and subscription payouts in real time with weekly breakdowns.",
  },
  {
    icon: Target,
    title: "High-Converting Onboarding Flow",
    description:
      "Trimma gives agents structured tools to turn Google leads into verified, bookable salons — fast.",
  },
  {
    icon: MessageCircle,
    title: "Dedicated Agent Support",
    description:
      "Regional specialists and the Agent Help guide support you with onboarding tips, territory strategy, and priority assistance.",
  },
];

const AGENT_FEATURES = [
  { icon: Building2, label: "My Salons" },
  { icon: MapPin, label: "Territory Explorer" },
  { icon: UserPlus, label: "Add Manual Lead" },
  { icon: ClipboardList, label: "Field Editor" },
  { icon: Check, label: "Field Editor" },
  { icon: BarChart3, label: "Commission Ledger" },
];

const FAQS = [
  {
    q: "What does a Trimma Agent do?",
    a: "Agents onboard salons in assigned territories — verifying business details, helping owners activate profiles, enabling bookings, and earning commission when salons go live on Trimma.",
  },
  {
    q: "How much commission can I earn?",
    a: "Agents earn conversion rewards when salons are verified and go live, plus booking and subscription commissions tracked in the Commission Ledger. Rates depend on your assigned commission tier.",
  },
  {
    q: "Is there a cost to become a Trimma Agent?",
    a: "No. Joining the Trimma Agent program is free. You need approval from Trimma and an assigned territory before accessing the Agent Portal.",
  },
  {
    q: "How do I track my referrals and earnings?",
    a: "The Agent Cockpit shows assigned salons, live conversions, and total earnings. The Commission Ledger breaks down conversion rewards, booking commissions, and subscription payouts.",
  },
  {
    q: "Do I need salon industry experience?",
    a: "Sales, field operations, or local business development experience helps, but Trimma provides Agent Help guides, onboarding workflows, and regional support to get you started.",
  },
  {
    q: "What tools do agents use daily?",
    a: "Agent Cockpit, My Salons, Territory Explorer, Lead Sheet, Field Editor, and Commission Ledger — all inside the Trimma Agent Portal.",
  },
  {
    q: "Is there a limit to how much I can earn?",
    a: "No cap. The more salons you onboard and keep active in your territory, the more conversion rewards and ongoing commissions you can earn.",
  },
  {
    q: "How do I apply?",
    a: "Use the application form on this page. Submit your personal details, territory, NIC, and bank account information. Trimma admin reviews requests in the Agent Requests dashboard.",
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

// ─── Main Page ───────────────────────────────────────────────────────────────

export function CareersContent() {
  return (
    <div className="bg-white text-zinc-900 font-sans">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/careers-hero.webp"
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
              <SectionBadge hero>Agent Careers</SectionBadge>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Grow Your Career</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  With Trimma
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Join the Trimma Agent program and earn commission by onboarding salons in your territory.
                Use powerful field tools, track earnings in real time, and build a recurring income stream.
              </p>

              <div className="grid grid-cols-3 gap-4">
                {HERO_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/80 border border-zinc-200 rounded-2xl px-3 py-4 text-center"
                  >
                    <div className="text-lg sm:text-xl font-black text-[#ffde5a]">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs font-semibold text-zinc-500 mt-1 leading-tight">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#apply"
                  className="hero-btn-primary px-8 py-4 rounded-2xl"
                >
                  <Briefcase className="w-4 h-4" />
                  Become an Agent
                </a>
                <a
                  href="#how-it-works"
                  className="hero-btn-secondary px-8 py-4 rounded-2xl"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Earnings Potential ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>Earnings Potential</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              See How Much You Could Earn
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Earn conversion rewards when salons go live, plus booking and subscription commissions.
              See your potential below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {EARNING_TIERS.map((tier) => (
              <div
                key={tier.label}
                className={`relative bg-white rounded-3xl border p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  tier.popular
                    ? "border-[#ffde5a] shadow-lg shadow-[#ffde5a]/15 ring-2 ring-[#ffde5a]/20"
                    : "border-zinc-200 shadow-sm"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ffde5a] text-black text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-sm font-bold text-zinc-500 mb-2">{tier.salons} live salons</div>
                <div className="text-4xl font-black text-zinc-950 mb-1">{tier.amount}</div>
                <div className="text-sm text-zinc-400 mb-4">{tier.period}</div>
                <div
                  className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                    tier.popular ? "bg-[#ffde5a]/15 text-[#B8860B]" : "bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {tier.label}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-zinc-400 mt-8 max-w-xl mx-auto">
            Based on standard conversion rewards. Booking and subscription commissions add additional recurring income.
          </p>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>How It Works</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Start Earning in 3 Simple Steps
            </h2>
            <p className="text-zinc-500 text-lg">Getting started as a Trimma Agent is quick and structured.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {HOW_IT_WORKS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#ffde5a] text-black font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#ffde5a]/25">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-[#ffde5a]/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-[#ffde5a]" />
                  </div>
                  <h3 className="font-bold text-zinc-900 text-xl mb-3">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Agent Tools Preview ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionBadge>Agent Portal</SectionBadge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
                Everything Agents Need to Succeed
              </h2>
              <p className="text-zinc-500 text-lg leading-relaxed mb-8">
                From lead discovery to commission payouts — Trimma gives field agents a complete toolkit
                to onboard salons and grow their territory.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AGENT_FEATURES.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 bg-white border border-zinc-200 rounded-xl px-3 py-3"
                  >
                    <Icon className="w-4 h-4 text-[#ffde5a] shrink-0" />
                    <span className="text-xs font-semibold text-zinc-800">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0B0B0B] rounded-3xl p-8 border border-[#ffde5a]/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,222,90,0.12)_0%,_transparent_55%)] pointer-events-none" />
              <div className="relative space-y-4">
                <div className="text-xs font-bold uppercase tracking-widest text-[#ffde5a] mb-2">
                  Onboarding Pipeline
                </div>
                {[
                  "Assigned → Field verified",
                  "Owner invited → Owner activated",
                  "Pending review → Live / Verified",
                ].map((step) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 bg-[#151515] border border-white/5 rounded-xl px-4 py-3"
                  >
                    <Check className="w-4 h-4 text-[#ffde5a] shrink-0" />
                    <span className="text-sm text-zinc-300 font-medium">{step}</span>
                  </div>
                ))}
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-[#ffde5a] hover:text-[#ffe680] transition-colors"
                >
                  Access Agent Portal
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Join ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <SectionBadge>Why Join Us</SectionBadge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Benefits That Set Trimma Agents Apart
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Everything you need to onboard salons, track performance, and grow your earnings.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group bg-white border border-zinc-200 hover:border-[#ffde5a]/40 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#ffde5a]/10 flex items-center justify-center mb-4 group-hover:bg-[#ffde5a]/20 transition-colors">
                    <Icon className="w-6 h-6 text-[#ffde5a]" />
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Growing Network ── */}
      <section className="py-16 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Users, value: "500+", label: "Businesses connected" },
              { icon: MapPin, value: "25+", label: "Districts covered" },
              { icon: TrendingUp, value: "3×", label: "Faster onboarding" },
              { icon: Target, value: "10%", label: "Agent commission tier" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#ffde5a]/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-[#ffde5a]" />
                  </div>
                  <div className="text-2xl font-black text-zinc-950 mb-1">{stat.value}</div>
                  <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Application Form ── */}
      <AgentApplicationForm />

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
            <p className="text-zinc-500">Got questions? We&apos;ve got answers.</p>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,222,90,0.18)_0%,_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight">
            Ready to Start Your Agent Career?
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join Trimma agents already earning by onboarding salons and growing beauty businesses
            across Sri Lanka.
          </p>
          <a
            href="#apply"
            className="inline-flex items-center justify-center gap-2 bg-[#ffde5a] hover:bg-[#ffe680] text-black font-bold px-10 py-4 rounded-2xl transition-all hover:scale-[1.03] shadow-lg shadow-[#ffde5a]/20 mb-8"
          >
            <Briefcase className="w-4 h-4" />
            Apply to Become an Agent
          </a>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-zinc-500">
            {["Free to apply", "10% commission tier", "Real-time earnings dashboard"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#ffde5a]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
