"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  MessageCircle,
  Mail,
  Home,
  Building2,
  KanbanSquare,
  UserPlus,
  MapPin,
  CheckCircle2,
  Wallet,
  User,
  Search,
  Bell,
  ExternalLink,
  Map,
  Target,
  ClipboardList,
  ArrowRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAgentPortal } from "@/lib/agent-portal-provider";
import { PortalGuideDownloads } from "../help/PortalGuideDownloads";

const AGENT = {
  name: "Nimal Fernando",
  territory: "Gampaha District",
  email: "nimal@trimma.com",
};

const SALON = {
  name: "City Cuts Barber",
  location: "Kadawatha, Gampaha",
  ownerGmail: "citycuts.trimma@gmail.com",
  slug: "city-cuts-barber",
  service: "Classic Haircut",
  servicePrice: 750,
};

const AGENT_NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Role & Responsibilities" },
  { id: "layout", label: "Layout & Header" },
  { id: "dashboard", label: "Agent Cockpit" },
  { id: "my-salons", label: "My Salons" },
  { id: "salon-creation", label: "Salon Creation" },
  { id: "manual-lead", label: "Add Manual Lead" },
  { id: "field-editor", label: "Field Editor" },
  { id: "territory", label: "Territory Explorer" },
  { id: "approval", label: "Salon Approval" },
  { id: "commissions", label: "Commissions" },
  { id: "tasks", label: "Work Queue" },
  { id: "profile", label: "My Profile" },
  { id: "pipeline", label: "Onboarding Pipeline" },
  { id: "guides", label: "Download Guide" },
  { id: "faq", label: "FAQ" },
  { id: "support", label: "Support" },
] as const;

const REGIONAL_HEAD_NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "roles", label: "Role & Responsibilities" },
  { id: "layout", label: "Layout & Header" },
  { id: "dashboard", label: "Dashboard" },
  { id: "my-team", label: "My Team" },
  { id: "my-salons", label: "My Salons" },
  { id: "salon-creation", label: "Salon Creation" },
  { id: "manual-lead", label: "Add Manual Lead" },
  { id: "field-editor", label: "Field Editor" },
  { id: "territory", label: "Territory Explorer" },
  { id: "approval", label: "Salon Approval" },
  { id: "commissions", label: "Commissions" },
  { id: "profile", label: "My Profile" },
  { id: "pipeline", label: "Onboarding Pipeline" },
  { id: "guides", label: "Download Guide" },
  { id: "faq", label: "FAQ" },
  { id: "support", label: "Support" },
] as const;

const PIPELINE_STEPS = [
  { status: "Assigned", code: "ASSIGNED_TO_AGENT", desc: "Admin assigns a Google lead or you create a manual lead." },
  { status: "Field verified", code: "AGENT_VERIFIED", desc: "You complete the Field Editor with accurate salon data." },
  { status: "Owner invited", code: "OWNER_INVITED", desc: "Invitation email and WhatsApp sent to the owner Gmail." },
  { status: "Owner activated", code: "OWNER_ACTIVATED", desc: "Owner finishes their profile inside the salon dashboard." },
  { status: "Pending admin review", code: "PENDING_ADMIN_VERIFICATION", desc: "You enable booking and submit to Trimma admin." },
  { status: "Live / Verified", code: "AGENT_APPROVED / VERIFIED", desc: "Salon is public on the marketplace and can take bookings." },
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

function AgentSidebarMockup() {
  const items = [
    { label: "Dashboard", active: false },
    { label: "My Profile", active: false },
    { label: "My Salons", active: false },
    { label: "Territory Explorer", active: false },
    { label: "Add Manual Lead", active: false },
    { label: "Salon Creation", active: false },
    { label: "Salon Approval", active: false },
    { label: "Commissions", active: false },
    { label: "Agent Help", active: true },
  ];

  return (
    <div className="rounded-xl bg-[#0B0B0B] p-3 text-white w-full max-w-[220px] shrink-0">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-2 px-2">
        Agent Portal
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold mb-0.5 ${
            item.active ? "bg-[#F5B700] text-black" : "text-white/80"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-black" : "bg-white/30"}`} />
          {item.label}
        </div>
      ))}
      <div className="mt-3 pt-2 border-t border-white/10 text-[9px] text-red-400 font-semibold px-2">
        Logout
      </div>
    </div>
  );
}

function CockpitMockup() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-sm font-black text-zinc-900">Agent Cockpit</div>
          <div className="text-[10px] text-zinc-500">Welcome back, {AGENT.name}</div>
        </div>
        <div className="bg-[#F5B700] text-black text-[9px] font-bold px-3 py-1.5 rounded-lg">
          View Lead Sheet
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["Assigned", "In Progress", "Live", "Earnings"].map((k) => (
          <div key={k} className="rounded-lg border border-slate-200 bg-white p-2">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">{k}</div>
            <div className="text-sm font-black text-zinc-900">{k === "Earnings" ? "Rs 12,400" : "8"}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-[10px] text-emerald-800 font-semibold">
        Today&apos;s Priorities — View My Salons · Open Field Editor
      </div>
    </div>
  );
}

function FieldEditorMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-[10px]">
      <div className="px-3 py-2 bg-zinc-950 text-white font-bold flex justify-between">
        <span>Field Editor — {SALON.name}</span>
        <Badge className="bg-amber-100 text-amber-700 border-none text-[8px]">Assigned</Badge>
      </div>
      <div className="p-3 space-y-2">
        {[
          "1. Salon & Owner Details",
          "2. Agent Field Data",
          "3. Included Services",
          "4. Add Staff",
          "5. Amenities & Facilities",
        ].map((s) => (
          <div key={s} className="flex items-center justify-between py-1 border-b border-slate-100">
            <span className="font-semibold text-zinc-700">{s}</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <span className="flex-1 text-center py-1.5 rounded-lg border border-slate-200 font-bold text-zinc-600">
            Save Draft
          </span>
          <span className="flex-1 text-center py-1.5 rounded-lg bg-[#F5B700] text-black font-bold">
            Send to Owner
          </span>
        </div>
      </div>
    </div>
  );
}

function PipelineMockup() {
  return (
    <div className="space-y-2">
      {PIPELINE_STEPS.map((step, i) => (
        <div key={step.code} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#F5B700]/20 border border-[#F5B700]/40 text-[#F5B700] text-[9px] font-black flex items-center justify-center">
              {i + 1}
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="w-px h-4 bg-slate-200 my-0.5" />
            )}
          </div>
          <div className="flex-1 pb-1">
            <div className="text-xs font-bold text-zinc-900">{step.status}</div>
            <div className="text-[10px] text-zinc-500">{step.desc}</div>
          </div>
        </div>
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
  const { remap } = useAgentPortal();
  const href = remap(path);

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
              <Link
                href={href}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline"
              >
                Open in portal <ExternalLink className="w-3 h-3" />
              </Link>
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

const AGENT_FAQS = [
  {
    q: "What is the difference between Google Leads and Manual Salon Leads?",
    a: "Google Leads are salons assigned to you by admin from territory discovery data. Manual Salon Leads are businesses you add yourself via Add Manual Lead when you find them in the field. Both open in the same Field Editor for verification and owner invitation.",
  },
  {
    q: "When can I send an invitation to the salon owner?",
    a: `After you complete the Field Editor with owner Gmail (e.g. ${SALON.ownerGmail}), WhatsApp number, address, services, and hero image. Use Send to Salon Owner for Review or Send Invitation depending on the salon's current status.`,
  },
  {
    q: "What does Enable Booking & Send to Admin do?",
    a: `When the owner has activated their account (${SALON.name} status Owner activated), you review their profile and submit to Trimma admin. Booking is enabled and the salon moves to Pending admin verification until admin approves the public listing.`,
  },
  {
    q: "How do I earn booking commissions?",
    a: "You earn a percentage of reservation fees from completed or confirmed bookings at salons you referred. Open Commissions to see weekly totals, per-booking cuts, and your all-time booking volume.",
  },
  {
    q: "How do subscription conversion rewards work?",
    a: "When a referred salon pays a Trimma subscription, you receive a conversion reward based on your agent commission tier. These appear in the Subscription Commissions section of the ledger.",
  },
  {
    q: "Why can't I search on Territory Explorer?",
    a: "You need at least one territory assigned by admin. If territories are empty, contact your Trimma admin. Once assigned, pick a category, territory, and result limit, then click Search Businesses.",
  },
];

const REGIONAL_HEAD_FAQS = [
  ...AGENT_FAQS,
  {
    q: "How do I sign in as a Regional Head?",
    a: "Use trimma.io/agent/login with your regional head email and password (same login page as field agents). After login you are redirected to /regional-head — your dedicated portal with My Team and regional commission tools.",
  },
  {
    q: "What is My Team and how do commission splits work?",
    a: "My Team lists every sub-agent assigned under you. For each agent you set a split percentage (0–100) — the share of their booking and subscription commission they keep. Save per agent. Review splits monthly and align with Trimma admin commission policy.",
  },
  {
    q: "Can I onboard salons myself as a Regional Head?",
    a: "Yes. You have the full agent toolkit — Territory Explorer, Add Manual Lead, Salon Creation, Field Editor, and Salon Approval. Use the same onboarding pipeline as your sub-agents and coach them using this guide.",
  },
];

function RegionalHeadSidebarMockup() {
  const items = [
    { label: "Dashboard", active: false },
    { label: "My Profile", active: false },
    { label: "Regional Head Help", active: true },
    { label: "My Salons", active: false },
    { label: "Territory Explorer", active: false },
    { label: "Salon Creation", active: false },
    { label: "Commissions", active: false },
    { label: "My Team", active: false },
  ];

  return (
    <div className="rounded-xl bg-[#0B0B0B] p-3 text-white w-full max-w-[220px] shrink-0">
      <div className="text-[9px] font-bold uppercase tracking-widest text-white/50 mb-2 px-2">
        Regional Head Portal
      </div>
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] font-semibold mb-0.5 ${
            item.active ? "bg-[#F5B700] text-black" : "text-white/80"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-black" : "bg-white/30"}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

function TeamMockup() {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex justify-between items-center">
        <span className="font-black text-zinc-900">My Team</span>
        <span className="text-zinc-400">3 sub-agents</span>
      </div>
      {[
        { name: "Kasun Perera", salons: 12, live: 5, split: 70 },
        { name: "Dilani Silva", salons: 8, live: 3, split: 65 },
      ].map((a) => (
        <div key={a.name} className="rounded-lg border border-slate-200 bg-white p-2 flex items-center justify-between gap-2">
          <div>
            <div className="font-bold text-zinc-900">{a.name}</div>
            <div className="text-zinc-500">{a.salons} salons · {a.live} live</div>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold text-brand">{a.split}%</span>
            <span className="px-2 py-1 rounded bg-[#F5B700] text-black font-bold">Save</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentHelpGuide() {
  const { path, base } = useAgentPortal();
  const isRegionalHead = base === "/regional-head";
  const navSections = isRegionalHead ? REGIONAL_HEAD_NAV_SECTIONS : AGENT_NAV_SECTIONS;
  const faqs = isRegionalHead ? REGIONAL_HEAD_FAQS : AGENT_FAQS;
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
        <Sparkles className="absolute -right-8 -top-8 w-40 h-40 text-[#F5B700]/10" />
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 bg-[#F5B700]/15 text-[#F5B700] border border-[#F5B700]/25 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            {isRegionalHead ? "Regional Head Handbook" : "Agent Field Handbook"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            {isRegionalHead ? "Trimma Regional Head Portal Guide" : "Trimma Agent Portal Guide"}
          </h1>
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            {isRegionalHead ? (
              <>
                Lead your agent team, onboard salons, and grow your territory — explained step by step.
                Examples use <strong className="text-white">{SALON.name}</strong> ({SALON.location}) so you
                can coach sub-agents and follow the same pipeline from lead to live salon and commission payout.
              </>
            ) : (
              <>
                Everything in your agent workspace — explained step by step. Examples use{" "}
                <strong className="text-white">{SALON.name}</strong> ({SALON.location}) and agent{" "}
                <strong className="text-white">{AGENT.name}</strong> ({AGENT.territory}) so you can follow
                real workflows from lead assignment to live salon and commission payout.
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {isRegionalHead ? (
              <Link href={path("/team")}>
                <Button className="h-9 rounded-xl bg-[#F5B700] hover:bg-[#F5B700]/90 text-black text-xs font-bold">
                  Open My Team
                </Button>
              </Link>
            ) : null}
            <Link href={path("/leads")}>
              <Button
                className={`h-9 rounded-xl bg-[#F5B700] hover:bg-[#F5B700]/90 text-black text-xs font-bold ${isRegionalHead ? "" : ""}`}
              >
                Open Salon Creation
              </Button>
            </Link>
            <Link href={path("/salons")}>
              <Button
                variant="outline"
                className="h-9 rounded-xl border-[#F5B700]/50 bg-[#F5B700]/10 !text-[#F5B700] hover:bg-[#F5B700]/20 hover:border-[#F5B700] hover:!text-[#FFC947] text-xs font-bold"
              >
                View My Salons
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
          {navSections.map(({ id, label }) => (
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
              {isRegionalHead
                ? "Your Regional Head Portal extends the agent workspace with team management. Onboard salons directly, coach sub-agents, set commission splits, and monitor territory performance — all from one workspace. Sign in at trimma.io/agent/login with your regional head credentials."
                : "Your Agent Portal is the sales operating system for Trimma field agents. Sign in at trimma.io/agent/login with your agent email and password. Discover salons in your territory, verify business details, invite owners, enable bookings, and track referral commissions — all from one workspace."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Discover & assign", desc: "Territory Explorer or admin-assigned Google leads" },
                { step: "2", title: "Verify & invite", desc: "Field Editor — owner Gmail, services, staff, amenities" },
                { step: "3", title: "Go live & earn", desc: "Owner activates → you approve → admin verifies → commissions" },
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

          <section id="roles" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Your role & responsibilities</h2>
            <p className="text-sm text-zinc-600 mb-6">
              {isRegionalHead
                ? "As a Trimma Regional Head you lead field agents in your province or district. You onboard salons yourself and ensure every sub-agent follows the same professional onboarding standard."
                : "As a Trimma Field Agent you are the on-the-ground partner for salon owners. Your job is to discover, verify, invite, and support salons until they are live on the marketplace."}
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(isRegionalHead
                ? [
                    "Sign in at /agent/login — redirected to /regional-head after authentication",
                    "Lead and coach sub-agents assigned under your regional structure",
                    "Set commission split % per sub-agent on My Team (0–100)",
                    "Onboard salons directly — Territory Explorer, Manual Lead, Field Editor",
                    "Monitor team pipeline — ensure no salon stalls at Owner invited or activated",
                    "Review Salon Approval queue for salons in your regional scope",
                    "Earn personal referral commissions plus oversight of team activity",
                    "Escalate territory, commission, or admin approval issues to agents@trimma.com",
                  ]
                : [
                    "Sign in at /agent/login with email and password (not Google)",
                    "Work only in territories assigned to you by Trimma admin",
                    "Discover salons via Territory Explorer or admin-assigned Google leads",
                    "Verify business data on site using the 5-section Field Editor",
                    "Invite owners via their real Gmail — salon owners sign in with Google only",
                    "Follow up until owner activates their Trimma salon dashboard",
                    "Enable booking and submit complete profiles to Trimma admin",
                    "Track weekly booking + subscription commissions on the Commissions page",
                  ]
              ).map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-zinc-700 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="layout" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Layout & header</h2>
            <p className="text-sm text-zinc-600 mb-6">
              {isRegionalHead
                ? "The regional head portal uses a dark sidebar on desktop and a bottom nav on mobile. Overview, Salons, and Performance sections include My Team — unique to regional heads."
                : "The agent portal uses a dark sidebar on desktop and a bottom nav on mobile. All tools are grouped under Overview, Salons, and Performance."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {isRegionalHead ? <RegionalHeadSidebarMockup /> : <AgentSidebarMockup />}
              <div className="flex-1 space-y-3">
                <div className="rounded-xl bg-[#0B0B0B] border border-white/10 px-3 py-2 flex items-center justify-between text-white text-[10px]">
                  <span className="font-bold">Sales Operating System</span>
                  <div className="flex gap-2 items-center">
                    <Search className="w-3.5 h-3.5 text-white/60" />
                    <Bell className="w-3.5 h-3.5 text-white/60" />
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-[10px] text-zinc-600">
                  Main content area — light background for readability
                </div>
              </div>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-700">
              {(isRegionalHead
                ? [
                    "Sidebar — Dashboard, Profile, Regional Head Help, Salons tools, Commissions, My Team",
                    "My Team — sub-agent list, salon counts, commission split % editor",
                    "Header search (desktop) — quick lookup for leads and salons",
                    "Notification bell — alerts for assignments and owner actions",
                    "Mobile bottom nav — Home, Salons, Editor, Team, Profile",
                    "Logout — bottom of sidebar; ends your session securely",
                  ]
                : [
                    "Sidebar — Dashboard, Profile, Salons, Territory, Leads, Approval, Commissions, Agent Help",
                    "Header search (desktop) — quick lookup for leads and salons",
                    "Notification bell — alerts for assignments and owner actions",
                    "Mobile bottom nav — Home, Salons, Editor, Profile",
                    "Logout — bottom of sidebar; ends your session securely",
                    "Active page — highlighted in brand yellow with black text",
                  ]
              ).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <SectionCard
            id="dashboard"
            icon={Home}
            title="Agent Cockpit"
            path="/agent"
            description={`Your morning briefing as ${AGENT.name}. KPIs, priorities, recent salons, territory card, and earnings snapshot update when you load the dashboard.`}
            features={[
              "KPI cards — Assigned Salons, In Progress, Live Salons, Total Earnings (Rs)",
              "View Lead Sheet — jump straight to Salon Creation / Field Editor",
              "Today's Priorities — View My Salons and Open Field Editor shortcuts",
              "Recent Assigned Salons — status badge, address, phone, Google rating",
              "Agent Territory Explorer card — shows your assigned territory label",
              "Referral Earnings — conversion rewards + booking commissions breakdown",
              "Salons Needing Action — call, message, or visit tasks with relative timestamps",
            ]}
            tips={[
              "Start each day from the Cockpit to see which salons need owner follow-up.",
              "Live Salons count reflects AGENT_APPROVED and VERIFIED statuses only.",
            ]}
            mockup={<CockpitMockup />}
          />

          {isRegionalHead ? (
            <SectionCard
              id="my-team"
              icon={Users}
              title="My Team"
              path="/agent/team"
              description="Manage sub-agents under your regional structure. View their salon pipeline, live count, booking volume, and set commission split percentages."
              features={[
                "Sub-agent table — name, email, assigned salons, live salons, booking volume",
                "Commission split % — editable per agent (0–100); share they keep from their commission",
                "Save per agent — persists split to Trimma admin commission structure",
                "Team earnings visibility — monitor which agents need coaching on stalled pipelines",
                "Regional commission view — your share and team splits also appear on Commissions page",
              ]}
              tips={[
                "Review split percentages monthly and align with Trimma admin policy.",
                "Share the Agent Portal Guide Word doc with new sub-agents so they follow the same onboarding steps.",
                "Follow up when an agent has many salons stuck at Owner invited.",
              ]}
              mockup={<TeamMockup />}
            />
          ) : null}

          <SectionCard
            id="my-salons"
            icon={Building2}
            title="My Salons"
            path="/agent/salons"
            description={`Read-only roster of every salon assigned to you — including ${SALON.name}. Filter, search, and jump to manage or view live listings.`}
            features={[
              "Summary cards — Total assigned, In progress, Needs action, Live / verified",
              "Filter tabs — All · In progress · Needs action · Live (with counts)",
              "Search by name, phone, owner Gmail, address, or category",
              "Table columns — Salon, Status, Contact, Owner Gmail, Subscription, Actions",
              "Manage — opens Field Editor for that salon (/agent/leads?open=id)",
              "View — external link to public marketplace listing when live",
              "Add Salon — shortcut to Add Manual Lead",
              "Open Field Editor — shortcut to Salon Creation",
            ]}
            tips={[
              "Needs action = Assigned, Field verified, or Owner invited — follow up with the owner.",
              "Subscription column shows plan charge when the salon is on a paid tier.",
            ]}
          />

          <SectionCard
            id="salon-creation"
            icon={KanbanSquare}
            title="Salon Creation"
            path="/agent/leads"
            description="Primary Field Editor hub. Verify Google leads assigned by admin and process manual onboarding leads through the same workflow."
            features={[
              "Stats — My Salons count, Verified count, Owner Invited count",
              "Google Leads tab — admin-assigned salons from territory data",
              "Salon Leads (Manual) tab — leads you created in the field",
              "Google sub-tabs — Assigned · Published · Invited/Owner Action",
              "Lead cards — hero image, status badge, completion %, admin notes",
              "Completion checklist — owner Gmail, phone, address, category, hero, summary, hours",
              "Manual leads table — Business Name, Owner, Location, Contact, Edit/Process",
              "Deep link — /agent/leads?open={salonId} auto-opens Field Editor",
            ]}
            tips={[
              "Always set owner Gmail before sending invitations — invites go to that address.",
              "Published (PUBLISHED_UNBOOKABLE) means the owner can preview the listing before activating.",
            ]}
          />

          <SectionCard
            id="manual-lead"
            icon={UserPlus}
            title="Add Manual Lead"
            path="/agent/leads/new"
            description={`Create a salon you discovered in the field — e.g. ${SALON.name} on ${SALON.location} High Street — with full profile data before inviting the owner.`}
            features={[
              "Basic Details — salon name, category (max 2), address, WhatsApp, owner Gmail, website, summary",
              "Included Services — up to 6 services with price and duration",
              "Add Staff — up to 2 professionals via Add Professional form",
              "Amenities & Facilities — checkboxes with quantity where applicable",
              "Save as Draft — creates lead and opens Field Editor",
              "Send to Salon Owner for Review — requires owner Gmail + WhatsApp; sends email + WhatsApp invite",
              "Cancel — returns to Salon Creation",
            ]}
            tips={[
              `Use a dedicated owner Gmail like ${SALON.ownerGmail} so the owner can log in cleanly.`,
              "Add at least one service (e.g. Classic Haircut LKR 750) before inviting the owner.",
            ]}
          />

          <SectionCard
            id="field-editor"
            icon={ClipboardList}
            title="Field Editor"
            path="/agent/leads"
            description={`The five-section modal where you verify and publish ${SALON.name}. Actions change based on onboarding status.`}
            features={[
              "Section 1 — Salon & Owner Details: name, category, address, WhatsApp, owner Gmail, hero image, summary",
              "Section 2 — Agent Field Data: notes, working hours (OPEN/CLOSED per day), lat/lng, Maps link",
              "Section 3 — Included Services: up to 6 with price and duration",
              "Section 4 — Add Staff: up to 2 professionals with photo and schedule",
              "Section 5 — Amenities & Facilities: AC, parking, WiFi, and more",
              "Save — stores draft without changing status",
              "Send to Salon Owner for Review — requires phone + owner Gmail",
              "Send Invitation — moves to Owner invited",
              "Resend Invitation — when owner has not yet activated",
              "Enable Booking & Send to Admin — when owner activated; enables booking and queues admin review",
            ]}
            tips={[
              "Agent notes are internal — use them for visit context (manager name, interest level, plan preference).",
              "Working hours drive which slots appear when the salon goes live.",
            ]}
            mockup={<FieldEditorMockup />}
          />

          <SectionCard
            id="territory"
            icon={Map}
            title="Territory Explorer"
            path="/agent/territory"
            description={`Map-based discovery within ${AGENT.territory}. Find unlisted businesses and report potential leads to admin.`}
            features={[
              "Filters — Business Category, Assigned Territories, Results to Show (10–250 or All)",
              "Search Businesses — runs map search within your territories",
              "Stats after search — Businesses Found, Territory Coverage, Potential Leads, Verified Listings",
              "Interactive map (~70% width) + Business Results Sidebar (~30%)",
              "Export Results — download CSV (name, category, address, phone, rating, status)",
              "Refresh Map — reload territory boundaries",
              "Fullscreen toggle — expand map for field use",
            ]}
            tips={[
              "Potential leads = businesses not yet verified on Trimma.",
              "If no territories appear, contact admin to assign your district.",
            ]}
          />

          <SectionCard
            id="approval"
            icon={ShieldCheck}
            title="Salon Approval Queue"
            path="/agent/salons/approval"
            description="Dedicated list of salons where the owner finished their profile (Owner activated) and is waiting for your review before admin verification."
            features={[
              "Search by salon name or owner email",
              "Pending counter — number of salons awaiting review",
              "Table — Salon Details, Owner Contact, Status (Pending Review), Action",
              "Review Profile — opens full approval page for that salon",
              "Empty state — All Caught Up when no salons are pending",
              "Primary approval path — Enable Booking & Send to Admin in Field Editor",
            ]}
            tips={[
              "Check owner bank details and services on the approval page before submitting to admin.",
            ]}
          />

          <SectionCard
            id="commissions"
            icon={Wallet}
            title="Commissions"
            path="/agent/commissions"
            description={
              isRegionalHead
                ? "Weekly referral ledger for your personal salons plus regional head share. Sub-agent splits are managed on My Team and reflected in team commission breakdowns."
                : "Weekly referral ledger for booking commissions and subscription conversion rewards from salons you brought to Trimma."
            }
            features={[
              "Referral Ledger badge — shows your booking % and subscription % rates",
              "Week navigator — This Week / previous weeks with date range",
              "Summary cards — Booking Commission, Subscription Commission, Total This Week, All-Time Volume",
              "Weekly Commission Grid — type, rate, customer total, your cut, item count",
              "Booking Commissions list — salon, dates, customer email, booking status, agent cut",
              "Subscription Commissions list — conversion reward per referred salon subscription",
              "Eligibility — completed/confirmed bookings with reservation fee paid",
            ]}
            tips={[
              "Commission tier is set by admin — check the rate badge at the top of the page.",
              "Use week navigation to reconcile payouts with your field activity.",
            ]}
          />

          {!isRegionalHead ? (
            <SectionCard
              id="tasks"
              icon={Target}
              title="Dynamic Work Queue"
              path="/agent/tasks"
              description="Operational command centre with prioritized work items generated from real salon and commission states."
              features={[
                "KPI row — Assigned Leads, Verified Salons, Pending Commissions, Performance Score",
                "Tabs — All Work · Leads · Salons · Commissions · Alerts",
                "Search work items by business name or status",
                "Priority badges — HIGH (red), MEDIUM (amber), LOW (emerald)",
                "Recommended action button — navigates to the right page for each item",
                "Recent Network Activity timeline",
                "Queue Health — Lead Conversion % and Pending Payouts (LKR)",
                "Refresh Sync — reload work items from server",
              ]}
              tips={[
                "HIGH priority items are time-sensitive owner follow-ups or stalled onboarding.",
              ]}
            />
          ) : null}

          <SectionCard
            id="profile"
            icon={User}
            title="My Profile"
            path="/agent/profile"
            description={`Manage your account — photo, contact details, and view assigned territories.`}
            features={[
              "Profile photo — upload and crop to 500×500; updates sidebar avatar instantly",
              "Editable — Full Name, Phone (+947 prefix, 8 digits)",
              "Locked — Email (login identity), Assigned Territories (set by admin)",
              isRegionalHead ? "Role badge — Regional Head" : "Role badge — Field Agent",
              "Save Changes — persists name and phone",
            ]}
            tips={[
              "Keep your phone current — admin and owners may contact you on this number.",
            ]}
          />

          {/* Pipeline */}
          <section id="pipeline" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Onboarding pipeline</h2>
            <p className="text-sm text-zinc-600 mb-6">
              End-to-end journey for {SALON.name} from first assignment to live marketplace listing
              and commission eligibility.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PipelineMockup />
              <div className="space-y-3 text-sm text-zinc-700">
                <p>
                  <strong className="text-zinc-900">Status badges</strong> on My Salons and Salon
                  Creation map to these stages. Key labels:
                </p>
                <ul className="space-y-1.5 text-xs">
                  {[
                    "Assigned — new lead, needs Field Editor completion",
                    "Field verified — you confirmed data on site",
                    "Owner invited — invitation sent to owner Gmail",
                    "Owner activated — owner logged in and completed profile",
                    "Live — AGENT_APPROVED; Verified — admin approved public listing",
                    "Rejected — salon declined or failed verification",
                  ].map((s) => (
                    <li key={s} className="flex items-start gap-2">
                      <ArrowRight className="w-3 h-3 text-brand shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <PortalGuideDownloads
            documentType={isRegionalHead ? "regional_head_guide" : "agent_guide"}
            title={isRegionalHead ? "Download Regional Head Guide (Word)" : "Download Agent Guide (Word)"}
            description={
              isRegionalHead
                ? "Share or save the full regional head walkthrough — role, My Team, salon onboarding, and commissions — in English, Sinhala, or Tamil."
                : "Share or save the comprehensive 30-step agent handbook — role, salon onboarding, Field Editor, commissions, and daily workflow — in English, Sinhala, or Tamil."
            }
          />

          {/* FAQ */}
          <section id="faq" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, idx) => {
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
            <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-6 sm:p-8 border border-white/10">
              <div className="relative z-10 grid sm:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-3">
                    {isRegionalHead ? "Regional head support" : "Agent support"}
                  </span>
                  <h3 className="text-xl font-bold mb-2">Need more help?</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    {isRegionalHead
                      ? "Trimma supports regional heads across Sri Lanka — team splits, territory setup, salon onboarding, and commission questions."
                      : "Trimma supports field agents across Sri Lanka — territory setup, lead assignments, owner invitations, and commission questions."}
                  </p>
                </div>
                <div className="space-y-4">
                  <a
                    href="mailto:agents@trimma.com"
                    className="flex items-center gap-3 text-sm font-semibold text-white/90 hover:text-[#F5B700] transition-colors"
                  >
                    <Mail className="w-5 h-5 text-brand" />
                    agents@trimma.com
                  </a>
                  <div className="flex items-center gap-3 text-sm font-semibold text-white/90">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    WhatsApp Agent Support Line
                  </div>
                  <Link href={path("/profile")}>
                    <Button className="w-full sm:w-auto h-10 rounded-xl bg-[#F5B700] hover:bg-[#F5B700]/90 text-black font-bold text-xs">
                      Update your profile
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
