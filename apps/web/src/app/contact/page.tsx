"use client";

import { useState } from "react";
import Link from "next/link";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Headphones,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Navigation2,
  Phone,
  Send,
  Sparkles,
  Star,
  Users,
  Wrench,
  Handshake,
  Inbox,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const CONTACT_OPTIONS = [
  {
    icon: Inbox,
    title: "General Inquiries",
    description: "For general questions about Trimma and platform services.",
    action: "Email Us",
    href: "mailto:hello@trimma.io",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
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
    href: "mailto:support@trimma.io",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
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

const TRUST_STATS = [
  { value: "500+", label: "Businesses Connected", icon: Building2 },
  { value: "10K+", label: "Appointments Managed", icon: CalendarDays },
  { value: "98%", label: "Customer Satisfaction", icon: Star },
  { value: "24/7", label: "Support Availability", icon: Headphones },
];

const BUSINESS_INFO = [
  { icon: Building2, label: "Company Name", value: "Trimma (Pvt) Ltd" },
  { icon: Mail, label: "Business Email", value: "hello@trimma.io", href: "mailto:hello@trimma.io" },
  { icon: Headphones, label: "Support Email", value: "support@trimma.io", href: "mailto:support@trimma.io" },
  { icon: Phone, label: "Phone", value: "+94 00 000 0000", href: "tel:+94000000000" },
  {
    icon: Clock,
    label: "Business Hours",
    value: "Mon–Fri: 9:00 AM – 6:00 PM\nSat: 9:00 AM – 1:00 PM",
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

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 rounded-3xl bg-amber-400/20 blur-3xl scale-110 pointer-events-none" />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-zinc-900 text-sm">Trimma Support</span>
          </div>
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Online
          </span>
        </div>
        <div className="space-y-3">
          {[
            { from: "support", text: "Hi! How can we help your salon today?", time: "10:02 AM" },
            { from: "user", text: "I'd like to get in touch about listing my salon.", time: "10:03 AM" },
            { from: "support", text: "Absolutely! Let me connect you with our onboarding team.", time: "10:03 AM" },
          ].map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.from === "user"
                    ? "bg-amber-400 text-black font-medium"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {msg.text}
                <div className={`text-[9px] mt-1 ${msg.from === "user" ? "text-black/50" : "text-zinc-400"}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-4 py-2.5">
          <div className="flex-1 text-xs text-zinc-400">Type a message...</div>
          <div className="w-7 h-7 rounded-lg bg-amber-400 flex items-center justify-center">
            <Send className="w-3.5 h-3.5 text-black" />
          </div>
        </div>
      </div>
      <div className="absolute -top-3 -right-3 bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        Avg. reply &lt; 2h
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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSubmitting(false);
    setSubmitted(true);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="bg-white text-zinc-900">
      {/* ── Hero ── */}
      <section className="page-hero-light pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 hero-badge text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Contact Us
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 leading-tight mb-6">
              Let&apos;s Connect
            </h1>
            <p className="text-lg hero-lead leading-relaxed mb-8 max-w-lg">
              Whether you&apos;re a salon owner looking to grow your business, a customer seeking support,
              or a partner interested in working with us, our team is ready to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#contact-form"
                className="hero-btn-primary px-8 py-4 rounded-2xl"
              >
                <Mail className="w-4 h-4" />
                Contact Our Team
              </a>
              <a
                href="#contact-form"
                className="hero-btn-secondary px-8 py-4 rounded-2xl"
              >
                <Mail className="w-4 h-4" />
                Contact Us
              </a>
            </div>
          </div>
          <HeroIllustration />
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
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-zinc-900 group-hover:text-amber-600 transition-colors"
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
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">Send Us a Message</h2>
            <p className="text-zinc-500 text-lg">We typically respond within one business day.</p>
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
                className="text-sm font-bold text-amber-600 hover:underline"
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
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
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
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone Number</label>
                    <LkPhoneInput
                      theme="light"
                      value={form.phone}
                      onChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
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
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Business Type</label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition appearance-none cursor-pointer"
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
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition appearance-none cursor-pointer"
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
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2.5 bg-amber-400 hover:bg-amber-500 disabled:bg-amber-200 text-black font-bold py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-amber-100"
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
            <div className="space-y-5">
              {BUSINESS_INFO.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-0.5">{label}</div>
                    {href ? (
                      <a href={href} className="text-zinc-900 font-medium text-sm hover:text-amber-600 transition-colors whitespace-pre-line">
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
            <h2 className="text-3xl font-extrabold text-zinc-950 mb-3">Visit Our Office</h2>
            <p className="text-zinc-500">Colombo, Sri Lanka</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-zinc-200 aspect-[4/3]">
              <iframe
                title="Trimma Office"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126743.5921673895!2d79.78657!3d6.9218!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae253d10f7a7003%3A0x320b2e4d32d3838d!2sColombo%2C%20Sri%20Lanka!5e0!3m2!1sen!2slk!4v1700000000000!5m2!1sen!2slk"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen
              />
            </div>
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900 text-lg mb-1">Trimma (Pvt) Ltd</div>
                  <p className="text-zinc-500 text-sm">Colombo, Sri Lanka</p>
                  <p className="text-zinc-400 text-xs mt-1">Serving salons across Sri Lanka and globally.</p>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Colombo,Sri+Lanka"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-6 py-3 rounded-xl transition-all text-sm"
              >
                <Navigation2 className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
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

      {/* ── Trust & Support Stats ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {TRUST_STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-zinc-950 mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner CTA ── */}
      <section className="py-24 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(245,183,0,0.18)_0%,_transparent_55%)] pointer-events-none" />
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
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-10 py-4 rounded-2xl transition-all hover:scale-[1.03] shadow-lg shadow-amber-900/30"
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
