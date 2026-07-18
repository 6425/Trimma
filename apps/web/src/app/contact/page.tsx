"use client";

import { useState } from "react";
import Link from "next/link";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Navigation2,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Handshake,
  Inbox,
} from "lucide-react";

import {
  TRIMMA_SUPPORT_EMAIL,
  TRIMMA_WHATSAPP_DISPLAY,
  TRIMMA_WHATSAPP_URL,
} from "@/lib/trimma-contact";

import {
  TRIMMA_COMPANY_OPERATOR,
  TRIMMA_LEGAL_DISCLAIMER,
  TRIMMA_OFFICE_MAP_DIRECTIONS,
  TRIMMA_OFFICE_MAP_EMBED,
  TRIMMA_REGISTERED_OFFICE,
} from "@/lib/trimma-company";

const COMPANY_OPERATOR = TRIMMA_COMPANY_OPERATOR;
const LEGAL_DISCLAIMER = TRIMMA_LEGAL_DISCLAIMER;
const REGISTERED_OFFICE = TRIMMA_REGISTERED_OFFICE;
const OFFICE_MAP_EMBED = TRIMMA_OFFICE_MAP_EMBED;
const OFFICE_MAP_DIRECTIONS = TRIMMA_OFFICE_MAP_DIRECTIONS;

// ─── Data ────────────────────────────────────────────────────────────────────

const CONTACT_OPTIONS = [
  {
    icon: Inbox,
    title: "General Inquiries",
    description: "For general questions about Trimma and platform services.",
    action: "Email Us",
    href: "mailto:hello@trimma.io",
    iconBg: "bg-[#ffde5a]/10",
    iconColor: "text-[#ffde5a]",
  },
  {
    icon: Handshake,
    title: "Sales & Partnerships",
    description: "For salons, beauty businesses, wellness centers, and business collaborations.",
    action: "Talk to Sales",
    href: "mailto:sales@trimma.io",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "For booking assistance, account issues, and platform support.",
    action: "Get Support",
    href: `mailto:${TRIMMA_SUPPORT_EMAIL}`,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Support",
    description: "Chat with Trimma on WhatsApp for faster booking and account help.",
    action: "Chat on WhatsApp",
    href: TRIMMA_WHATSAPP_URL,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: Wrench,
    title: "Technical Support",
    description: "For platform-related technical inquiries and integration help.",
    action: "Contact Tech",
    href: "mailto:tech@trimma.io",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-600",
  },
];

const BUSINESS_TYPES = [
  "Barber Salon",
  "Beauty Parlor",
  "Bridal Studio",
  "Nail Studio",
  "Spa & Wellness Center",
  "Yoga Studio",
  "Men's Grooming",
  "Tattoo Studio",
  "Skincare Clinic",
  "Other",
];

const INQUIRY_TYPES = [
  "General Inquiry",
  "Sales Inquiry",
  "Partnership Opportunity",
  "Customer Support",
  "Technical Support",
  "Media Inquiry",
];

const FAQS = [
  {
    q: "How can I list my salon on Trimma?",
    a: "Visit our onboarding page and submit your salon details. A Trimma regional specialist will review your profile, help you set up services and staff, and activate your listing — typically within 24 hours.",
  },
  {
    q: "How do customers make appointments?",
    a: "Customers discover salons on Trimma, browse services and styles, pick a date and time slot, pay a small deposit, and receive instant confirmation via email and WhatsApp.",
  },
  {
    q: "What support channels are available?",
    a: "We offer email support (24-hour response), WhatsApp chat (7 days a week), a self-service knowledge base, and direct contact with our team for salon owners.",
  },
  {
    q: "Is Trimma available for multiple business types?",
    a: "Yes. Trimma supports barber salons, beauty parlours, nail studios, bridal studios, spas, yoga studios, men's grooming centres, tattoo studios, skincare clinics, and more.",
  },
  {
    q: "How quickly can my business get onboarded?",
    a: "Most salons are fully onboarded within 24 hours. Our team guides you through adding services, staff schedules, and profile activation step by step.",
  },
];

const TRUST_COMPLIANCE = [
  { icon: CreditCard, label: "Secure Online Payments", description: "Encrypted checkout and deposit handling" },
  { icon: ShieldCheck, label: "Privacy-Focused Platform", description: "Your data protected by design" },
  { icon: Headphones, label: "Customer Support Assistance", description: "Responsive help on business days" },
  { icon: Building2, label: "Trusted Sri Lankan Business", description: "Registered and operated in Sri Lanka" },
];

const BUSINESS_INFO = [
  { icon: Building2, label: "Company Name", value: COMPANY_OPERATOR },
  { icon: Sparkles, label: "Brand", value: "Trimma" },
  { icon: Globe, label: "Website", value: "https://trimma.io", href: "https://trimma.io" },
  { icon: Headphones, label: "Support Email", value: TRIMMA_SUPPORT_EMAIL, href: `mailto:${TRIMMA_SUPPORT_EMAIL}` },
  { icon: MessageCircle, label: "WhatsApp", value: TRIMMA_WHATSAPP_DISPLAY, href: TRIMMA_WHATSAPP_URL },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Monday – Friday, 9:00 AM – 6:00 PM (GMT+5:30)",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

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

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  business: "",
  type: "",
  inquiry: "",
  message: "",
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ContactPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/public/salon-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to send message.");
      }

      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white text-zinc-900">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/contact-hero.webp"
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
                <Sparkles className="w-3.5 h-3.5" />
                Contact Us
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Let&apos;s</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Connect
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Whether you&apos;re a salon owner looking to grow your business, a customer seeking support,
                or a partner interested in working with us, our team is ready to help.
              </p>
              <p className="text-sm font-medium max-w-lg leading-relaxed">
                <strong>Trimma</strong> is a product and brand operated by{" "}
                <strong>{COMPANY_OPERATOR}</strong>
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#contact-form" className="hero-btn-primary px-8 py-4 rounded-2xl">
                  <Mail className="w-4 h-4" />
                  Contact Our Team
                </a>
                <a href="#contact-form" className="hero-btn-secondary px-8 py-4 rounded-2xl">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact Options ── */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">How Can We Help?</h2>
            <p className="text-zinc-500 text-lg">Choose the channel that best fits your inquiry.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_OPTIONS.map((card) => (
              <div
                key={card.title}
                className="group bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-900 text-lg mb-2">{card.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{card.description}</p>
                </div>
                <a
                  href={card.href}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 group-hover:text-[#ffde5a] transition-colors"
                >
                  {card.action}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Form ── */}
      <section id="contact-form" className="py-24 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">Send Us a Message</h2>
            <p className="text-zinc-500 text-lg">We typically respond within one business day.</p>
          </div>

          <div className="max-w-3xl mx-auto mb-10 bg-[#ffde5a]/10/80 border border-[#ffde5a]/30/80 rounded-2xl px-6 py-5 shadow-sm">
            <p className="text-sm text-zinc-700 leading-relaxed text-center sm:text-left">{LEGAL_DISCLAIMER}</p>
          </div>

          {submitted ? (
            <div className="max-w-lg mx-auto bg-white border border-green-200 rounded-3xl p-10 text-center shadow-lg">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-950 mb-3">Message Sent!</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Thank you for reaching out. Our team will review your inquiry and get back to you within
                24 hours on business days.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-sm font-bold text-[#ffde5a] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-w-3xl mx-auto bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-8"
            >
              {/* Personal Information */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Full Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone Number</label>
                    <LkPhoneInput
                      theme="light"
                      value={form.phone}
                      onChange={(phone) => {
                        setForm((prev) => ({ ...prev, phone }));
                        if (error) setError(null);
                      }}
                      className="rounded-xl"
                      inputClassName="py-3"
                    />
                  </div>
                </div>
              </div>

              {/* Business Information */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                      Business Name <span className="text-zinc-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      name="business"
                      value={form.business}
                      onChange={handleChange}
                      placeholder="Your salon or business"
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Business Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent transition appearance-none cursor-pointer"
                    >
                      <option value="">Select business type</option>
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Inquiry Type */}
              <div>
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">
                  Inquiry Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Inquiry Type *</label>
                    <select
                      name="inquiry"
                      value={form.inquiry}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent transition appearance-none cursor-pointer"
                    >
                      <option value="">Select inquiry type</option>
                      {INQUIRY_TYPES.map((t) => (
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
                      rows={5}
                      placeholder="Tell us how we can help..."
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent transition resize-none"
                    />
                  </div>
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 bg-[#ffde5a] hover:bg-[#ffe680] disabled:bg-[#ffde5a]/30 text-black font-bold py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-[#ffde5a]/20"
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
          )}
        </div>
      </section>

      {/* ── Business Information ── */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-zinc-950 mb-3">Business Information</h2>
            <p className="text-zinc-500">Official company details and contact channels.</p>
          </div>
          <div className="max-w-2xl mx-auto bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 pb-6 mb-6 border-b border-zinc-100">
              <div className="w-12 h-12 rounded-2xl bg-[#ffde5a]/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-[#ffde5a]" />
              </div>
              <div>
                <div className="font-extrabold text-zinc-950 text-lg">Trimma</div>
                <div className="text-sm text-zinc-500">Operated by {COMPANY_OPERATOR}</div>
              </div>
            </div>
            <div className="space-y-5">
              {BUSINESS_INFO.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#ffde5a]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#ffde5a]" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">{label}</div>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-zinc-900 font-medium text-sm hover:text-[#ffde5a] transition-colors whitespace-pre-line"
                      >
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
      </section>

      {/* ── Office Location ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-zinc-950 mb-3">Registered Office</h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Our team operates from Sri Lanka, supporting salons and wellness businesses with modern
              appointment management solutions.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-zinc-200 min-h-[320px] lg:min-h-[400px]">
              <iframe
                title="Ceylon Wild Tours (Pvt) Ltd — Registered Office"
                src={OFFICE_MAP_EMBED}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#ffde5a]/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#ffde5a]" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-lg mb-1">{COMPANY_OPERATOR}</div>
                  <p className="text-zinc-600 text-sm leading-relaxed">{REGISTERED_OFFICE}</p>
                  <p className="text-zinc-400 text-xs mt-3">
                    Brand: Trimma · Registered office of the operating company.
                  </p>
                </div>
              </div>
              <a
                href={OFFICE_MAP_DIRECTIONS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#ffde5a] hover:bg-[#ffe680] text-black font-bold px-6 py-3 rounded-xl transition-all text-sm w-full sm:w-auto"
              >
                <Navigation2 className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Compliance ── */}
      <section className="py-16 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-950 mb-2">Trust &amp; Compliance</h2>
            <p className="text-zinc-500 text-sm sm:text-base">
              Transparent operations backed by a registered Sri Lankan company.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRUST_COMPLIANCE.map((item) => (
              <div
                key={item.label}
                className="bg-white border border-zinc-200 rounded-2xl px-5 py-5 flex items-start gap-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#ffde5a]/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-[#ffde5a]" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-sm leading-snug mb-1">{item.label}</div>
                  <p className="text-zinc-500 text-xs leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[#ffde5a]/10 border border-[#ffde5a]/30 text-[#8a7600] text-sm font-semibold px-4 py-2 rounded-full mb-5">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
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

      {/* ── Partner CTA ── */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,222,90,0.18)_0%,_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-6">
            Ready to Grow Your Business?
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join a growing network of beauty and wellness professionals using Trimma to attract more
            customers, streamline operations, and grow revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-[#ffde5a] hover:bg-[#ffe680] text-black font-bold px-10 py-4 rounded-2xl transition-all hover:scale-[1.03] shadow-lg shadow-[#ffde5a]/20"
            >
              <Users className="w-4 h-4" />
              Become a Partner
            </Link>
            <Link
              href="#contact-form"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-10 py-4 rounded-2xl transition-all hover:scale-[1.03]"
            >
              <Mail className="w-4 h-4" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
