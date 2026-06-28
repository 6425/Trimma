"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  TRIMMA_WHATSAPP_DISPLAY,
  TRIMMA_WHATSAPP_URL,
} from "@/lib/trimma-contact";
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  MessageCircle,
  Mail,
  LayoutDashboard,
  Calendar,
  Briefcase,
  Users,
  UserPlus,
  Scissors,
  Tag,
  Share2,
  Star,
  BarChart3,
  DollarSign,
  CreditCard,
  Store,
  Settings,
  Bell,
  LogOut,
  Search,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  CalendarDays,
  Handshake,
  TrendingUp,
  Menu,
  ExternalLink,
} from "lucide-react";
import { VerifiedSalonBadge } from "../marketplace/VerifiedSalonBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalonOwnerGuideDownloads } from "../help/SalonOwnerGuideDownloads";

const SALON = {
  name: "Sampath Barber Saloon",
  location: "Kadawatha, Gampaha",
  slug: "sampath-barber-saloon",
  service: "Classic Haircut",
  servicePrice: 700,
  bookingRef: "TRM-482916",
  customer: "Nimal Perera",
};

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "onboarding", label: "Getting live on Trimma" },
  { id: "global", label: "Layout & Header" },
  { id: "dashboard", label: "Dashboard" },
  { id: "bookings", label: "Bookings" },
  { id: "calendar", label: "Calendar" },
  { id: "customers", label: "Customers" },
  { id: "staff", label: "Staff" },
  { id: "services", label: "Services" },
  { id: "packages", label: "Packages" },
  { id: "social", label: "Social Media" },
  { id: "reviews", label: "Reviews" },
  { id: "analytics", label: "Analytics" },
  { id: "finance", label: "Finance" },
  { id: "billing", label: "Billing" },
  { id: "profile", label: "Salon Profile" },
  { id: "settings", label: "Settings" },
  { id: "commission", label: "Commission Model" },
  { id: "guides", label: "Download Handbook" },
  { id: "faq", label: "FAQ" },
  { id: "support", label: "Support" },
] as const;

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

function SidebarMockup() {
  const items = [
    { icon: LayoutDashboard, label: "Dashboard", active: false },
    { icon: Calendar, label: "Bookings", active: false },
    { icon: Briefcase, label: "Calendar", active: false },
    { icon: Users, label: "Customers", active: false },
    { icon: UserPlus, label: "Staff", active: false },
    { icon: Scissors, label: "Services", active: false },
    { icon: Tag, label: "Packages", active: false },
    { icon: Share2, label: "Social Media", active: false },
    { icon: Star, label: "Reviews", active: false },
    { icon: BarChart3, label: "Reports & Analytics", active: false },
    { icon: DollarSign, label: "Finance & Commissions", active: false },
    { icon: CreditCard, label: "Subscription & Billing", active: false },
    { icon: Store, label: "Salon Profile", active: true },
  ];

  return (
    <div className="rounded-xl bg-[#0B0B0B] p-3 text-white w-full max-w-[220px] shrink-0">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-2 px-2">
        Workspace
      </div>
      <div className="space-y-0.5 max-h-[280px] overflow-hidden">
        {items.map(({ icon: Icon, label, active }) => (
          <div
            key={label}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-medium ${
              active ? "bg-[#ffc800] text-black font-semibold" : "text-white/90"
            }`}
          >
            <Icon className="w-3 h-3 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t border-white/10 space-y-0.5">
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-white/80">
          <Settings className="w-3 h-3" /> Settings
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#ffc800] text-black text-[10px] font-semibold">
          <HelpCircle className="w-3 h-3" /> Salon Help
        </div>
        <div className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-red-400">
          <LogOut className="w-3 h-3" /> Logout
        </div>
      </div>
    </div>
  );
}

function HeaderMockup() {
  return (
    <div className="rounded-xl bg-[#0B0B0B] border border-white/10 px-3 py-2 flex items-center justify-between">
      <div className="hidden sm:flex items-center gap-2 flex-1 max-w-[140px]">
        <Search className="w-3 h-3 text-white/50" />
        <span className="text-[10px] text-white/40">Search...</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="lg:hidden p-1.5 text-white/80">
          <Menu className="w-4 h-4" />
        </button>
        <div className="relative p-1.5">
          <Bell className="w-4 h-4 text-white" />
          <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#ffc800]" />
        </div>
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-semibold text-white leading-tight truncate max-w-[100px]">
              {SALON.name}
            </div>
            <div className="text-[9px] text-white/50">Business Plan</div>
          </div>
          <div className="w-7 h-7 rounded-full bg-[#ffc800] text-black text-[9px] font-black flex items-center justify-center border-2 border-[#ffc800]/30">
            SA
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  const kpis = [
    { label: "Total Bookings", value: "24" },
    { label: "Active Services", value: "6" },
    { label: "Total Staff", value: "3" },
    { label: "Total Revenue", value: "LKR 18,400" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-zinc-900">Salon Performance</div>
          <div className="text-[10px] text-zinc-500">
            Welcome back. Here is what is happening at {SALON.name} today.
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white text-[10px] text-zinc-600">
          <RefreshCw className="w-3 h-3" /> Refresh
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-primary/20 bg-primary/30 p-3"
          >
            <div className="text-[9px] font-medium text-zinc-700">{k.label}</div>
            <div className="text-sm font-bold text-zinc-900 mt-0.5">{k.value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-3 text-[10px]">
        <div className="font-bold text-zinc-800 mb-2 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-indigo-500" />
          Booking Income Breakdown (Last 7 Days)
        </div>
        <div className="grid grid-cols-5 gap-1 text-center text-[9px] text-zinc-500 font-semibold border-b pb-1">
          <span>Booking</span>
          <span>Amount</span>
          <span>Res. Fee</span>
          <span>Salon Share</span>
          <span>Your Income</span>
        </div>
        <div className="grid grid-cols-5 gap-1 text-center text-[9px] py-1.5 font-medium text-zinc-800">
          <span className="truncate">{SALON.bookingRef}</span>
          <span>700</span>
          <span>140</span>
          <span className="text-teal-700">70</span>
          <span className="text-emerald-700 font-bold">630</span>
        </div>
      </div>
    </div>
  );
}

function BookingsMockup() {
  const tabs = ["Pending", "Confirmed", "Rescheduled", "Cancelled"];
  return (
    <div className="space-y-3">
      <div className="flex gap-1 flex-wrap">
        {tabs.map((t, i) => (
          <span
            key={t}
            className={`text-[9px] font-bold px-2.5 py-1 rounded-lg ${
              i === 0
                ? "bg-zinc-900 text-white"
                : "bg-slate-100 text-zinc-600"
            }`}
          >
            {t} {i === 0 ? "2" : ""}
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_auto] gap-2 p-3 items-center border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-zinc-900">{SALON.bookingRef}</div>
            <div className="text-[10px] text-zinc-500">
              {SALON.customer} · {SALON.service} · LKR {SALON.servicePrice}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Today · 04:00 PM</div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-extrabold uppercase">
              Pending
            </Badge>
            <span className="text-[9px] font-bold px-2 py-1 rounded-lg border border-zinc-200 text-zinc-700">
              Action ▾
            </span>
          </div>
        </div>
        <div className="px-3 py-2 bg-zinc-50 text-[9px] text-zinc-500">
          Actions: Confirm · Reschedule · Mark Reserved Paid · View Booking
        </div>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-zinc-900">June 2026</span>
        <span className="text-[9px] font-bold uppercase text-brand bg-rose-50 px-2 py-0.5 rounded-full">
          Weekly View
        </span>
      </div>
      <div className="grid grid-cols-8 gap-px bg-slate-200 rounded-lg overflow-hidden text-[8px]">
        <div className="bg-zinc-50 p-1.5 font-bold text-zinc-400">Time</div>
        {days.map((d) => (
          <div key={d} className="bg-zinc-50 p-1.5 text-center font-bold text-zinc-500">
            {d}
          </div>
        ))}
        <div className="bg-white p-1.5 text-zinc-500">10:00</div>
        {days.map((d, i) => (
          <div key={`${d}-slot`} className="bg-white p-1 min-h-[28px]">
            {i === 2 && (
              <div className="rounded px-1 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[7px] font-semibold truncate">
                {SALON.customer}
              </div>
            )}
            {i === 4 && (
              <div className="rounded px-1 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[7px] font-semibold truncate">
                Walk-in
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ListingMockup() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex">
      <div className="w-24 sm:w-28 bg-slate-200 shrink-0 min-h-[88px]" />
      <div className="flex-1 p-3 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <span className="text-xs font-bold text-zinc-900 truncate">{SALON.name}</span>
          <VerifiedSalonBadge size="xs" className="shrink-0 scale-90 origin-right" />
        </div>
        <div className="flex items-center gap-2 mt-1 text-[9px] text-zinc-500">
          <span className="font-bold bg-slate-100 text-zinc-600 px-1.5 py-0.5 rounded uppercase">
            New
          </span>
          <span>No reviews yet</span>
          <MapPin className="w-2.5 h-2.5 text-brand" />
          <span>{SALON.location}</span>
        </div>
        <div className="text-[9px] text-zinc-600 mt-1">
          Popular: <span className="font-semibold">{SALON.service}</span>
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-[8px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded w-fit">
          <CalendarDays className="w-2.5 h-2.5" />
          Open now · Next slot Today 4:00 PM
        </div>
      </div>
      <div className="p-3 border-l border-slate-100 text-right shrink-0 hidden sm:block">
        <div className="text-[8px] text-zinc-400 uppercase font-bold">From</div>
        <div className="text-sm font-black">LKR {SALON.servicePrice}</div>
      </div>
    </div>
  );
}

function CommissionMockup() {
  const amount = 2000;
  const resFee = amount * 0.2;
  const salon = amount * 0.1;
  const platformNet = amount * 0.08;
  const agent = amount * 0.02;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="text-xs font-bold text-zinc-900">
        Example: {SALON.service} — LKR {amount.toLocaleString()} service total
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          { label: "Reservation (20%)", value: resFee, color: "text-zinc-800" },
          { label: "Salon (10%)", value: salon, color: "text-teal-700" },
          { label: "Platform net (8%)", value: platformNet, color: "text-zinc-900" },
          { label: "Agent (2%)", value: agent, color: "text-brand" },
        ].map((row) => (
          <div key={row.label} className="rounded-lg bg-slate-50 p-2 border border-slate-100">
            <div className="text-[9px] text-zinc-500 font-semibold">{row.label}</div>
            <div className={`text-sm font-black ${row.color}`}>
              LKR {row.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-500 leading-relaxed">
        The customer pays a 20% reservation fee online. Half goes to your salon upfront; the
        platform share may include a referring agent commission when applicable.
      </p>
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
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  path: string;
  description: string;
  features: string[];
  tips?: string[];
  mockup?: React.ReactNode;
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
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                {title}
              </h2>
              <Link
                href={path}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline"
              >
                Open in workspace <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500">
            What you can do
          </h3>
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
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">
                Pro tips
              </h4>
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
        {mockup && (
          <MockFrame title={title}>{mockup}</MockFrame>
        )}
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "How do I get my salon live on Trimma?",
    a: "Sign in from trimma.com/onboarding with Google, then open Salon Profile and add your business name, address, map pin, hero image, and a mobile number or email. Click Submit for Booking Approval. Your assigned Trimma agent reviews your profile, enables booking, and Trimma admin gives final verification. After that your salon appears on the marketplace and customers can book online.",
  },
  {
    q: "What happens after I submit for booking approval?",
    a: "Your status becomes Owner Activated. Your Trimma field agent is notified automatically. They review your salon details, then enable booking and send your salon to Trimma admin for final verification. You will see progress banners in your dashboard while you wait.",
  },
  {
    q: "I signed up with Google — do I need a Trimma agent invite email?",
    a: "No. Self onboarding assigns a field agent in your district when you sign up. Complete your profile and submit for booking approval — your agent is notified and will review from their Trimma workspace. If a Trimma agent invited you separately, use the link in their email to sign in with the same Gmail they invited.",
  },
  {
    q: "What is the difference between booking approval and the Verified badge?",
    a: "Booking approval lets customers book your salon on Trimma after agent and admin review. The Verified badge and 50% online reservation deposits require completed business information and bank verification documents under Salon Profile → Business Info and Bank Info tabs.",
  },
  {
    q: "Why do some time slots show as already booked?",
    a: "Trimma blocks slots that conflict with pending, confirmed, or in-progress appointments. Stylist schedules and service duration are respected. If a slot turns unavailable at checkout, refresh the calendar and pick another open time.",
  },
  {
    q: "When can customers leave a verified review?",
    a: "Reviews unlock only after a real completed booking tied to that appointment. Legacy or manual ratings without a booking are not shown publicly on your marketplace listing.",
  },
  {
    q: "How do I increase staff or service limits?",
    a: "Go to Subscription & Billing and upgrade from Free to Starter, Pro, or Elite. Higher tiers unlock more staff slots, services, gallery images, and promotion packages.",
  },
  {
    q: "What image sizes should I upload?",
    a: "Logo: 500×500px (max 2MB). Hero and featured photos: 800×600px (max 3MB each). Use JPEG or PNG for best results.",
  },
  {
    q: "How are booking notifications sent?",
    a: "Customers receive email confirmations on booking. With WhatsApp connected under Social Media, reminders and payment receipts can also be sent automatically.",
  },
];

export function SalonOwnerHelpGuide() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeNav, setActiveNav] = useState<string>("overview");

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-16 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-6 sm:p-10 border border-white/10">
        <Sparkles className="absolute -right-8 -top-8 w-40 h-40 text-[#ffc800]/10" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 bg-[#ffc800]/15 text-[#ffc800] border border-[#ffc800]/25 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Salon Owner Handbook
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Trimma Workspace Guide
          </h1>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            Everything in your salon dashboard — explained step by step, including how self
            onboarding, booking approval, and going live on Trimma work today.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/profile">
              <Button className="h-9 rounded-xl bg-[#ffc800] hover:bg-[#ffc800]/90 text-black text-xs font-bold">
                Complete {SALON.name} profile
              </Button>
            </Link>
            <Link href={`/salons/${SALON.slug}`} target="_blank">
              <Button
                variant="outline"
                className="h-9 rounded-xl border-[#ffc800]/50 bg-[#ffc800]/10 !text-[#ffc800] hover:bg-[#ffc800]/20 hover:border-[#ffc800] hover:!text-[#ffd633] text-xs font-bold"
              >
                View public listing
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        {/* Sticky TOC */}
        <nav className="lg:sticky lg:top-20 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm max-h-[70vh] overflow-y-auto">
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
          {/* Overview */}
          <section id="overview" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Getting started</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Your Trimma workspace is the control centre for your salon. Use the left sidebar for
              daily tools. Settings, Salon Help, and Logout sit at the bottom of the sidebar — there
              is only one help menu: <strong>Salon Help</strong>.
            </p>
            <MockFrame title="Marketplace listing preview">
              <ListingMockup />
            </MockFrame>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Salon Profile", desc: "Name, address, map pin, hero image, contact" },
                { step: "2", title: "Submit for approval", desc: "Agent review → admin verification" },
                { step: "3", title: "Run your salon", desc: "Bookings, staff, services, finance" },
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

          {/* Onboarding — primary self-serve workflow */}
          <section id="onboarding" className="scroll-mt-24 bg-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-indigo-50 bg-indigo-50/40">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight mb-1">
                    Getting live on Trimma
                  </h2>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    Most salon owners start with <strong>self onboarding</strong> — sign in with Google
                    at <Link href="/onboarding" className="text-indigo-700 font-semibold hover:underline">trimma.com/onboarding</Link>.
                    Trimma creates your salon draft and assigns a field agent in your area. Follow the
                    steps below in order.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8 space-y-6">
              <ol className="space-y-4">
                {[
                  {
                    title: "Sign in with Google",
                    body: "Open /onboarding and sign in with the Gmail you want on your salon account. Trimma creates your owner dashboard and a draft salon automatically.",
                  },
                  {
                    title: "Complete Salon Profile (booking essentials)",
                    body: "Go to Salon Profile and add: business name, address, map location pin, hero image, and a mobile number or email. The progress banner at the top of your dashboard shows what is still missing.",
                  },
                  {
                    title: "Submit for Booking Approval",
                    body: "When the essentials are complete, click Submit for Booking Approval on Salon Profile. Your assigned Trimma agent is notified by email and WhatsApp to review your submission.",
                  },
                  {
                    title: "Agent review",
                    body: "Your Trimma field agent checks your salon details in their workspace. They may contact you if anything needs correcting. When satisfied, they enable booking and send your salon to Trimma admin.",
                  },
                  {
                    title: "Admin verification → live",
                    body: "Trimma admin gives final approval. Your salon then goes live on the marketplace and customers can book online. You will see a verified/live status in your dashboard.",
                  },
                  {
                    title: "Optional: Verified badge & reservation deposits",
                    body: "After you are live, complete Business Info and Bank Info (with required documents) on Salon Profile to earn the Trimma Verified badge and enable 50% online reservation deposits on customer bookings.",
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-xs font-black">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">{step.title}</h3>
                      <p className="text-sm text-zinc-600 leading-relaxed mt-1">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2">
                  If a Trimma agent invited you by email
                </h3>
                <p className="text-sm text-amber-900/90 leading-relaxed">
                  Sign in with the same Gmail address the agent invited. Complete your Salon Profile
                  and submit for booking approval the same way — your agent already has your salon in
                  their queue and will review after you submit.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">
                  What you will see in your dashboard
                </h3>
                <div className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-700">
                  {[
                    "Green welcome banner — profile incomplete, go to Salon Profile",
                    "Progress banner — booking essentials, business info, bank docs",
                    "Awaiting Verification — after you submit, before agent/admin approve",
                    "Resubmit Booking Approval — if your agent asks for profile corrections",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/dashboard/profile">
                <Button className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold">
                  Open Salon Profile
                </Button>
              </Link>
            </div>
          </section>

          {/* Global layout */}
          <section id="global" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Layout & header</h2>
            <p className="text-sm text-zinc-600 mb-6">
              These elements are always available while you work in the dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <SidebarMockup />
              <div className="flex-1 space-y-3">
                <HeaderMockup />
                <div className="rounded-xl bg-emerald-600 text-white text-[10px] px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    Welcome banner — complete Salon Profile, then submit for booking approval
                  </span>
                  <span className="font-bold underline">Go to Salon Profile →</span>
                </div>
              </div>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-700">
              {[
                "Notification bell — new bookings, approve pending reservations, mark read",
                "Search bar (desktop) — quick lookup (expanding)",
                "Salon avatar — opens Salon Profile; shows plan tier",
                "Mobile menu — hamburger opens the full sidebar drawer",
                "Settings (sidebar footer) — shortcut hub to key setup pages",
                "Salon Help (sidebar footer) — this handbook; only one help entry",
                "Logout — ends your session securely",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <SectionCard
            id="dashboard"
            icon={LayoutDashboard}
            title="Dashboard"
            path="/dashboard"
            description={`Your morning briefing for ${SALON.name}. KPIs, income breakdown, charts, and recent activity update automatically every 45 seconds.`}
            features={[
              "Total Bookings, Active Services, Total Staff, and Total Revenue cards",
              "Manual Refresh and auto-refresh when you return to the tab",
              "Booking Income Breakdown — reservation fee, salon share, and true income per booking",
              "Staff Booking Trend and Revenue Trend charts",
              "Recent Activity feed — bookings, services, and staff updates",
            ]}
            tips={[
              "Use the income table to reconcile what customers paid online vs. balance due at the chair.",
              "Revenue is gross booking value (full service price), not deposit only.",
            ]}
            mockup={<DashboardMockup />}
          />

          <SectionCard
            id="bookings"
            icon={Calendar}
            title="Bookings"
            path="/dashboard/bookings"
            description="Manage the full appointment lifecycle — from pending online requests through completion, payment, and cancellation."
            features={[
              "Tabs: Pending · Confirmed · Rescheduled · Cancelled (with counts)",
              "Search by customer email or booking reference (e.g. TRM-482916)",
              "Context Action menu per booking — only valid actions for that status",
              "Pending: Confirm, Reschedule, View",
              "Confirmed: Start Service, Reschedule, No-Show, Cancel",
              "In Progress: Complete Service",
              "Payment: Mark Reserved Commission Paid · Mark Fully Paid",
              "Booking detail page with visual timeline and full customer/service/payment info",
              "On Complete — automatic review request email to customer",
              "On Cancel — WhatsApp + email cancellation notifications",
            ]}
            tips={[
              "Approve pending bookings quickly from the notification bell or Bookings tab.",
              "Reschedule from the action menu, or approve customer requests from the bookings banner.",
            ]}
            mockup={<BookingsMockup />}
          />

          <SectionCard
            id="calendar"
            icon={Briefcase}
            title="Calendar"
            path="/dashboard/calendar"
            description="Weekly visual schedule aligned to your salon hours. See every stylist appointment at a glance."
            features={[
              "Monday–Sunday weekly grid with hour rows",
              "Colour codes: Pending (rose), Confirmed (green), Completed (blue), Cancelled (grey)",
              "Previous / next week navigation",
              "Book Appointment — walk-in or manual booking modal",
              "Filter Stylists control",
              "Grid hours adapt to your configured operating hours",
            ]}
            mockup={<CalendarMockup />}
          />

          <SectionCard
            id="customers"
            icon={Users}
            title="Customers"
            path="/dashboard/customers"
            description="Your client database built automatically from bookings at Sampath Barber Saloon."
            features={[
              "Summary: Total Customers, New This Month, VIP (3+ visits), Average Rating",
              "Search by name, email, or phone",
              "Table: client details, total bookings, lifetime value, rating, last visit",
              "Connect shortcuts (email / message)",
              "Add Customer — register a client manually",
            ]}
          />

          <SectionCard
            id="staff"
            icon={UserPlus}
            title="Staff"
            path="/dashboard/staff"
            description="Build your team profile. Staff limits depend on your subscription tier."
            features={[
              "Add stylist: name, email, role, photo (crop upload)",
              "Weekly schedule per day — open/closed, start/end times",
              "Buffer time between appointments",
              "Commission rate per staff member",
              "Assign services with per-service duration, commission, and buffer",
              "Edit, activate/deactivate, or delete staff",
              "Schedules drive which slots appear online for each stylist",
            ]}
            tips={[
              "Free plan allows 2 staff; Starter 5, Pro 10, Elite up to 30.",
              "Deactivate instead of delete to preserve booking history.",
            ]}
          />

          <SectionCard
            id="services"
            icon={Scissors}
            title="Services"
            path="/dashboard/services"
            description="Your public service menu — prices, durations, categories, and optional discounts."
            features={[
              "Browse by category tab; search your catalog",
              "Import from Trimma global service library — set your price and duration",
              "Edit: name, category, price, duration, description, image, active/inactive",
              "Service discounts with end date (on eligible plans)",
              "Delete services from your active catalog",
              "Plan limits on total services and category count",
            ]}
            tips={[`${SALON.service} at LKR ${SALON.servicePrice} is a typical single-service listing.`]}
          />

          <SectionCard
            id="packages"
            icon={Tag}
            title="Packages"
            path="/dashboard/packages"
            description="Create bundled deals and promotions for the marketplace Deals section."
            features={[
              "Promotion types: seasonal, gift, percent-off, and more",
              "Package price vs original price with savings label",
              "Included services list (one per line)",
              "Start and end dates with remaining-days badge",
              "Create, edit, activate/deactivate, and delete packages",
              "Packages surface on your public salon page and Deals browse",
            ]}
          />

          <SectionCard
            id="social"
            icon={Share2}
            title="Social Media"
            path="/dashboard/social"
            description="Connect external channels so customers can discover and book Sampath Barber Saloon."
            features={[
              "Facebook Booking Page — sync CTA bookings (Connected)",
              "WhatsApp Automated Agent — confirmations, reminders, receipts (Connected)",
              "TikTok Action Link — booking URL in profile bio (connect when ready)",
              "Google Business Directory — Maps/Search integration (connect when ready)",
              "Per-channel Connect, Settings, and status badges",
            ]}
          />

          <SectionCard
            id="reviews"
            icon={Star}
            title="Reviews"
            path="/dashboard/reviews"
            description="Verified feedback from customers who completed real appointments."
            features={[
              "Average rating and 5★–1★ distribution chart",
              "Only booking-linked verified reviews shown publicly",
              "Review list with customer name, stars, comment, date",
              "Public salon reply — publish or update up to 500 characters",
              "Replies appear on your public salon page",
            ]}
            tips={[
              "Reply professionally — it builds trust for new customers in Kadawatha.",
              "Until first verified review, marketplace shows New · No reviews yet.",
            ]}
          />

          <SectionCard
            id="analytics"
            icon={BarChart3}
            title="Reports & Analytics"
            path="/dashboard/analytics"
            description="Deeper performance metrics beyond the main dashboard."
            features={[
              "KPIs: Revenue, Bookings, Average Order Value, Staff Utilization %",
              "Timeframe: Last 30 Days with week navigation",
              "Daily revenue bar chart for selected week",
              "Top 5 stylists — bookings, utilization %, revenue",
              "Based on confirmed, in-progress, and completed bookings",
            ]}
          />

          <SectionCard
            id="finance"
            icon={DollarSign}
            title="Finance & Commissions"
            path="/dashboard/finance"
            description="Reservation-fee ledger for your salon — what Trimma collected online and how it splits."
            features={[
              "KPI cards: Gross Bookings, Platform Fee, Salon Reservation Share, Agent Commission",
              "Filters: All · Settled · Pending · Cancelled",
              "Per-booking income breakdown table (same as Dashboard)",
              "Export Ledger button",
              "Tracks salon_upfront_amount, platform_commission_amount, agent_commission_amount",
            ]}
            mockup={<CommissionMockup />}
          />

          <SectionCard
            id="billing"
            icon={CreditCard}
            title="Subscription & Billing"
            path="/dashboard/billing"
            description="Your Trimma membership — limits for staff, services, images, and promotions."
            features={[
              "Active plan card: tier name, limits, next invoice date",
              "Monthly / Annual billing toggle",
              "Compare Free, Starter, Pro, Elite plans",
              "Per-plan: staff slots, services, gallery images, promotion packages",
              "Upgrade via checkout when on a lower tier",
              "Invoice history with reference numbers and payment status",
            ]}
          />

          <SectionCard
            id="profile"
            icon={Store}
            title="Salon Profile"
            path="/dashboard/profile"
            description="Your public storefront and the centre of onboarding. Complete booking essentials here first, then submit for booking approval."
            features={[
              "Booking essentials: business name, address, map pin, hero image, phone or email",
              "Submit for Booking Approval — sends your profile to your assigned Trimma agent",
              "Resubmit Booking Approval — if your agent returns the profile for corrections",
              "Tab: Business Operations — logo, cover, hero, featured gallery (plan limits)",
              "Location: address, province, district, map coordinates",
              "Weekly operating hours per day; amenities checklist",
              "Quick-add services and staff from profile",
              "Marketplace live preview panel and Store QR Flyer",
              "Tab: Business Info — legal/registration details for Verified badge",
              "Tab: Bank Info — payout account and verification documents for 50% reservation deposits",
            ]}
            tips={[
              "Submit for Booking Approval only after name, address, map pin, hero image, and contact are saved.",
              "Services and staff can be added before or after approval, but booking needs agent + admin sign-off first.",
              "Changing salon name may update your public URL slug — share the new link after save.",
            ]}
          />

          <SectionCard
            id="settings"
            icon={Settings}
            title="Settings"
            path="/dashboard/settings"
            description="Shortcut control centre in the sidebar footer — not duplicated in the main workspace menu."
            features={[
              "Quick link: Salon Profile",
              "Quick link: Services & Catalog",
              "Quick link: Staff & Stylists",
              "Quick link: Billing & Subscriptions",
              "Security & Credentials information card",
              "Salon Help lives in the sidebar footer — use it for onboarding and workspace guidance",
            ]}
          />

          {/* Commission model */}
          <section
            id="commission"
            className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8"
          >
            <h2 className="text-lg font-bold text-zinc-900 mb-2 flex items-center gap-2">
              <Handshake className="w-5 h-5 text-brand" />
              Reservation commission model
            </h2>
            <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
              When a customer books {SALON.service} online, Trimma collects a 20% reservation fee.
              The table below uses a LKR 2,000 example (multiple services or premium cuts).
            </p>
            <CommissionMockup />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <th className="text-left px-4 py-3">Party</th>
                    <th className="text-left px-4 py-3">% of service</th>
                    <th className="text-right px-4 py-3">LKR 2,000 example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-zinc-700">
                  {[
                    ["Customer reservation fee", "20%", "400"],
                    ["Salon upfront share", "10%", "200"],
                    ["Platform (net, after agent)", "8%", "160"],
                    ["Referring agent (if any)", "2%", "40"],
                  ].map(([party, pct, amt]) => (
                    <tr key={party}>
                      <td className="px-4 py-3 font-medium">{party}</td>
                      <td className="px-4 py-3">{pct}</td>
                      <td className="px-4 py-3 text-right font-bold">LKR {amt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <SalonOwnerGuideDownloads />

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand" />
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.q}
                    className="border border-zinc-100 rounded-2xl overflow-hidden bg-zinc-50/50"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between font-bold text-sm text-zinc-800 text-left hover:bg-zinc-100/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Support */}
          <section id="support" className="scroll-mt-24">
            <div className="bg-zinc-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden">
              <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12" />
              <div className="relative z-10 grid sm:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-3">
                    Contact support
                  </span>
                  <h3 className="text-xl font-bold mb-2">Need more help?</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Our team supports salon owners across Sri Lanka — setup, billing, bookings,
                    and marketplace visibility for shops like {SALON.name}.
                  </p>
                </div>
                <div className="space-y-4">
                  <a
                    href="mailto:support@trimma.com"
                    className="flex items-center gap-3 text-sm font-semibold text-white/90 hover:text-[#ffc800] transition-colors"
                  >
                    <Mail className="w-5 h-5 text-brand" />
                    support@trimma.com
                  </a>
                  <a
                    href={TRIMMA_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm font-semibold text-white/90 hover:text-[#ffc800] transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    WhatsApp Live Chat · {TRIMMA_WHATSAPP_DISPLAY}
                  </a>
                  <Link href="/dashboard/profile">
                    <Button className="w-full sm:w-auto h-10 rounded-xl bg-[#ffc800] hover:bg-[#ffc800]/90 text-black font-bold text-xs">
                      Return to {SALON.name} profile
                    </Button>
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
