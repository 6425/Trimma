"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Rocket,
  Headphones,
  Handshake,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Phone,
  ChevronDown,
  CheckCircle2,
  Zap,
  Shield,
  Globe,
  CalendarDays,
  BookOpen,
  Send,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3,
  Star,
} from "lucide-react";
import { toast } from "sonner";

// ─── Data ──────────────────────────────────────────────────────────────────

const CONTACT_CARDS = [
  {
    icon: Rocket,
    title: "Talk to Sales",
    description: "Need a personalized walkthrough? Our sales team will show you exactly how Trimma works for your salon.",
    detail: "sales@trimma.io",
    href: "mailto:sales@trimma.io",
    badge: "Responds within 24h",
    badgeColor: "bg-amber-100 text-amber-800",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Technical issue? Our support team is dedicated to getting you back on track quickly.",
    detail: "support@trimma.io",
    href: "mailto:support@trimma.io",
    badge: "Priority support",
    badgeColor: "bg-blue-100 text-blue-800",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: MessageCircle,
    title: "Chat on WhatsApp",
    description: "Get instant answers from our team. Available seven days a week for quick questions.",
    detail: "Open WhatsApp Chat",
    href: "https://wa.me/94000000000",
    badge: "7 days a week",
    badgeColor: "bg-green-100 text-green-800",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    icon: Handshake,
    title: "Partner With Us",
    description: "Agencies, franchises, and salon groups — let's build something great together at scale.",
    detail: "partners@trimma.io",
    href: "mailto:partners@trimma.io",
    badge: "Enterprise ready",
    badgeColor: "bg-purple-100 text-purple-800",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

const BUSINESS_TYPES = [
  "Barber Salon",
  "Beauty Salon",
  "Nail Studio",
  "Bridal Studio",
  "Spa & Wellness",
  "Tattoo Studio",
  "Men's Grooming",
  "Other",
];

const FAQS = [
  {
    q: "How quickly can I onboard my salon?",
    a: "Most salons are fully set up within 24 hours. Our onboarding flow guides you step-by-step through adding your services, staff, and availability. Our team is available to assist at every stage.",
  },
  {
    q: "Does Trimma support online payments?",
    a: "Yes. Trimma supports secure online deposits and payments via multiple channels. Customers pay a small deposit at booking, with the balance collected at your salon.",
  },
  {
    q: "Can multiple staff members use Trimma?",
    a: "Absolutely. You can add unlimited staff members, assign them individual services, set their working hours, and let customers choose their preferred stylist at the time of booking.",
  },
  {
    q: "Is there a free trial available?",
    a: "Yes — we offer a generous trial period so you can explore Trimma risk-free. No credit card required to start. Visit our pricing page for current trial details.",
  },
  {
    q: "Does Trimma work on mobile devices?",
    a: "Trimma is fully mobile-optimised for both salon owners and customers. The owner dashboard, booking management, and customer booking flow are all designed for mobile-first use.",
  },
  {
    q: "Can I migrate from another booking system?",
    a: "Yes. Our team will help you migrate your existing customer data, services, and booking history. Contact us and we'll create a custom migration plan for your salon.",
  },
];

const SUPPORT_CHANNELS = [
  {
    icon: Mail,
    title: "Email Support",
    description: "24-hour response time",
    detail: "support@trimma.io",
    href: "mailto:support@trimma.io",
    accent: "border-amber-200 hover:border-amber-400",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Support",
    description: "Instant responses",
    detail: "Chat now",
    href: "https://wa.me/94000000000",
    accent: "border-green-200 hover:border-green-400",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    icon: BookOpen,
    title: "Knowledge Base",
    description: "Self-service help center",
    detail: "Browse articles",
    href: "/customer-help",
    accent: "border-blue-200 hover:border-blue-400",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: CalendarDays,
    title: "Book a Demo",
    description: "Live walkthrough",
    detail: "Schedule now",
    href: "mailto:sales@trimma.io?subject=Demo%20Request",
    accent: "border-purple-200 hover:border-purple-400",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-200">
      <button
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

// ─── Dashboard Illustration (inline SVG-based mock) ──────────────────────────

function DashboardIllustration() {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Floating glow */}
      <div className="absolute inset-0 rounded-3xl bg-amber-400/20 blur-3xl scale-110 pointer-events-none" />

      {/* Main card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 p-6 space-y-4">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-zinc-900 text-sm">Trimma Dashboard</span>
          </div>
          <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-1 rounded-full">Live</span>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Bookings", value: "284", icon: CalendarDays, color: "text-amber-500" },
            { label: "Customers", value: "1.2k", icon: Users, color: "text-blue-500" },
            { label: "Rating", value: "4.9", icon: Star, color: "text-green-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-50 rounded-2xl p-3 text-center">
              <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
              <div className="font-bold text-zinc-900 text-base">{stat.value}</div>
              <div className="text-zinc-400 text-[10px]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Booking list */}
        <div className="space-y-2">
          {[
            { name: "Nimal P.", service: "Classic Cut", time: "10:00 AM", status: "Confirmed" },
            { name: "Kasun S.", service: "Beard Trim", time: "11:30 AM", status: "Upcoming" },
            { name: "Dilshan R.", service: "Hair Color", time: "02:00 PM", status: "Confirmed" },
          ].map((b) => (
            <div key={b.name} className="flex items-center justify-between bg-zinc-50 rounded-xl px-4 py-2.5">
              <div>
                <div className="font-semibold text-zinc-900 text-xs">{b.name}</div>
                <div className="text-zinc-400 text-[10px]">{b.service} · {b.time}</div>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${b.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>

        {/* Chart bar */}
        <div className="bg-zinc-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-zinc-700">Weekly Revenue</span>
          </div>
          <div className="flex items-end gap-1.5 h-12">
            {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-amber-400 opacity-80 transition-all"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
              <span key={d} className="text-[9px] text-zinc-400 flex-1 text-center">{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating chat badge */}
      <div className="absolute -bottom-4 -right-4 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
        <MessageCircle className="w-3.5 h-3.5" />
        Support Live
      </div>

      {/* Floating analytics badge */}
      <div className="absolute -top-4 -left-4 bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5" />
        +34% this month
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    business: "",
    email: "",
    phone: "",
    type: "",
    message: "",
    agree: false,
  });
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agree) {
      toast.error("Please agree to the Privacy Policy to continue.");
      return;
    }
    setSubmitting(true);
    // Simulate async send
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitting(false);
    setForm({ name: "", business: "", email: "", phone: "", type: "", message: "", agree: false });
    toast.success("Message sent! We'll get back to you within 24 hours.");
  }

  return (
    <div className="bg-white text-zinc-900">

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        {/* Background texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,183,0,0.12)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(99,102,241,0.06)_0%,_transparent_60%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              We&apos;re here to help
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 leading-tight mb-6">
              Let&apos;s Grow Your<br />
              <span className="text-amber-500">Salon Together</span>
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-lg">
              Have questions about Trimma? Need help onboarding your salon? Our team is ready to help you streamline bookings, manage appointments, and grow your business.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <a
                href="mailto:sales@trimma.io?subject=Demo%20Request"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-8 py-4 rounded-2xl transition-all duration-200 shadow-lg shadow-amber-200 hover:shadow-amber-300 hover:scale-[1.02]"
              >
                <CalendarDays className="w-4 h-4" />
                Book a Demo
              </a>
              <a
                href="https://wa.me/94000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-zinc-200 hover:border-green-400 text-zinc-900 hover:text-green-700 font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us
              </a>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Zap, label: "Fast Response" },
                { icon: Headphones, label: "Dedicated Support" },
                { icon: Shield, label: "Secure Platform" },
                { icon: Globe, label: "Sri Lanka Based" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-zinc-600">
                  <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Dashboard illustration */}
          <div className="flex justify-center lg:justify-end">
            <DashboardIllustration />
          </div>
        </div>
      </section>

      {/* ── 2. CONTACT CARDS ────────────────────────────────────────────────── */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              How Can We Help?
            </h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Choose the best way to reach us — we respond fast through every channel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_CARDS.map((card) => (
              <a
                key={card.title}
                href={card.href}
                target={card.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-lg mb-1">{card.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{card.description}</p>
                </div>
                <div className="mt-auto">
                  <div className="text-zinc-900 font-semibold text-sm group-hover:text-amber-600 transition-colors flex items-center gap-1">
                    {card.detail}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                  <span className={`mt-2 inline-block text-xs font-medium px-2.5 py-1 rounded-full ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. CONTACT FORM ─────────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — decorative */}
          <div className="hidden lg:flex flex-col justify-center gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
                <Send className="w-4 h-4" />
                Send a message
              </div>
              <h2 className="text-4xl font-extrabold text-zinc-950 leading-tight mb-4">
                Tell Us About<br />Your Salon
              </h2>
              <p className="text-zinc-500 text-lg leading-relaxed">
                Whether you&apos;re a solo barber or a multi-location franchise, we tailor Trimma to fit your exact workflow.
              </p>
            </div>

            {/* Feature highlights */}
            {[
              { icon: CheckCircle2, text: "Free setup assistance included" },
              { icon: CheckCircle2, text: "Personalised onboarding walkthrough" },
              { icon: CheckCircle2, text: "No long-term contracts required" },
              { icon: CheckCircle2, text: "Cancel anytime, no questions asked" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-zinc-700 font-medium">{text}</span>
              </div>
            ))}

            {/* Testimonial pill */}
            <div className="bg-zinc-950 text-white rounded-2xl p-5 max-w-sm">
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                &ldquo;Trimma transformed how we manage bookings. Our no-shows dropped by 60% in the first month.&rdquo;
              </p>
              <div className="text-xs text-zinc-400 font-medium">— Kasun M., Colombo Barber Studio</div>
            </div>
          </div>

          {/* Right — Form */}
          <div className="relative">
            {/* Glassmorphism effect */}
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-amber-100/60 via-white to-purple-100/40 blur-2xl pointer-events-none" />
            <form
              onSubmit={handleSubmit}
              className="relative bg-white/80 backdrop-blur-sm border border-white/60 shadow-2xl rounded-3xl p-8 space-y-5"
            >
              <h3 className="text-2xl font-bold text-zinc-950 mb-1">Get in Touch</h3>
              <p className="text-zinc-500 text-sm mb-4">We reply within 24 hours on business days.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Full Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Kasun Perera"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Salon / Business Name *</label>
                  <input
                    name="business"
                    value={form.business}
                    onChange={handleChange}
                    required
                    placeholder="My Salon Ltd."
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+94 77 000 0000"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Business Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition appearance-none cursor-pointer"
                >
                  <option value="">Select your business type</option>
                  {BUSINESS_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Message *</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Tell us about your salon and how we can help..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name="agree"
                  checked={form.agree}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 accent-amber-400 cursor-pointer shrink-0"
                />
                <span className="text-sm text-zinc-600">
                  I agree to the{" "}
                  <Link href="/privacy-policy" className="text-amber-600 hover:underline font-medium">
                    Privacy Policy
                  </Link>{" "}
                  and consent to Trimma storing my submitted information.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 bg-amber-400 hover:bg-amber-500 disabled:bg-amber-200 text-black font-bold py-4 rounded-2xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-amber-100"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── 4. FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
              <BookOpen className="w-4 h-4" />
              Quick Help
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 text-lg">
              Can&apos;t find an answer? Reach us at{" "}
              <a href="mailto:support@trimma.io" className="text-amber-600 hover:underline font-medium">
                support@trimma.io
              </a>
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. SUPPORT CHANNELS ─────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-zinc-950 mb-3">
              Multiple Ways to Reach Us
            </h2>
            <p className="text-zinc-500">
              Pick whichever channel works best for you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SUPPORT_CHANNELS.map((ch) => (
              <a
                key={ch.title}
                href={ch.href}
                target={ch.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className={`group bg-white border-2 ${ch.accent} rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`w-11 h-11 rounded-xl ${ch.iconBg} flex items-center justify-center mb-4`}>
                  <ch.icon className={`w-5 h-5 ${ch.iconColor}`} />
                </div>
                <div className="font-bold text-zinc-900 mb-1">{ch.title}</div>
                <div className="text-zinc-500 text-sm mb-3">{ch.description}</div>
                <div className="text-sm font-semibold text-zinc-900 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                  {ch.detail}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. LOCATION ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Map placeholder */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-zinc-200 aspect-[4/3]">
              <iframe
                title="Trimma HQ"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126743.5921673895!2d79.78657!3d6.9218!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae253d10f7a7003%3A0x320b2e4d32d3838d!2sColombo%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
              {/* Overlay badge */}
              <div className="absolute top-4 left-4 bg-white shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-zinc-900">Trimma HQ · Colombo, LK</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
                  <MapPin className="w-4 h-4" />
                  Our Location
                </div>
                <h2 className="text-3xl font-extrabold text-zinc-950 mb-3">
                  Headquartered in<br />Sri Lanka
                </h2>
                <p className="text-zinc-500 leading-relaxed">
                  Trimma is built and operated from Colombo, Sri Lanka — proudly serving salons across the island and globally.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: MapPin,
                    label: "Address",
                    value: "Colombo, Sri Lanka",
                  },
                  {
                    icon: Clock,
                    label: "Business Hours",
                    value: "Monday – Friday: 9:00 AM – 6:00 PM\nSaturday: 9:00 AM – 1:00 PM",
                  },
                  {
                    icon: Mail,
                    label: "General Enquiries",
                    value: "hello@trimma.io",
                    href: "mailto:hello@trimma.io",
                  },
                  {
                    icon: Phone,
                    label: "Phone",
                    value: "+94 00 000 0000",
                    href: "tel:+9400000000",
                  },
                ].map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">{label}</div>
                      {href ? (
                        <a href={href} className="text-zinc-900 font-medium hover:text-amber-600 transition-colors text-sm whitespace-pre-line">
                          {value}
                        </a>
                      ) : (
                        <p className="text-zinc-900 font-medium text-sm whitespace-pre-line">{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,183,0,0.18)_0%,_transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(99,102,241,0.12)_0%,_transparent_55%)] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full mb-7">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Start your journey today
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            Ready to Transform<br />
            <span className="text-amber-400">Your Salon?</span>
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join the growing community of salon owners using Trimma to simplify bookings, increase revenue, and deliver exceptional customer experiences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-10 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.03] shadow-lg shadow-amber-900/30"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="mailto:sales@trimma.io?subject=Demo%20Request"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-10 py-4 rounded-2xl transition-all duration-200 hover:scale-[1.03]"
            >
              <CalendarDays className="w-4 h-4" />
              Book a Live Demo
            </a>
          </div>

          {/* Social proof row */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 text-zinc-500 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Free setup assistance</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
