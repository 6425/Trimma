"use client";

import { useState } from "react";
import Link from "next/link";
import { VerifiedSalonBadge } from "../../components/marketplace/VerifiedSalonBadge";
import {
  TRIMMA_SUPPORT_EMAIL,
  TRIMMA_WHATSAPP_DISPLAY,
  TRIMMA_WHATSAPP_URL,
} from "@/lib/trimma-contact";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Ban,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  CreditCard,
  Eye,
  FileWarning,
  Fingerprint,
  Headphones,
  Lock,
  Mail,
  MessageCircle,
  MapPin,
  MessageSquareWarning,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

const TRUST_PILLARS = [
  {
    icon: Shield,
    title: "Secure Reservations",
    description: "Reservation fees lock your slot and confirm commitment from both parties.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: BadgeCheck,
    title: "Verified Salon Partners",
    description: "Salons pass onboarding and profile review before accepting online bookings.",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    icon: CreditCard,
    title: "Safe Payments",
    description: "Payments are processed through secure, industry-standard payment providers.",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Lock,
    title: "Privacy Protection",
    description: "Your personal data is handled with care and protected by platform policies.",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Scale,
    title: "Fair Dispute Resolution",
    description: "Transparent processes help resolve booking and service concerns fairly.",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-600",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    description: "Our team is available to help with booking, payment, and safety questions.",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
];

const SAFETY_GUIDELINES = [
  {
    phase: "Before Booking",
    icon: BookOpen,
    tips: [
      "Review salon profiles, services, pricing, and verified badges.",
      "Check location, availability, and cancellation policies.",
      "Use accurate contact details so confirmations reach you.",
    ],
  },
  {
    phase: "During Your Appointment",
    icon: CalendarCheck,
    tips: [
      "Arrive on time and bring any reference images or notes you need.",
      "Confirm the service scope and price with the salon before treatment begins.",
      "Speak up immediately if you feel uncomfortable or unsafe.",
    ],
  },
  {
    phase: "After Your Visit",
    icon: MessageSquareWarning,
    tips: [
      "Leave honest feedback to help other customers make informed choices.",
      "Report safety concerns or service issues through Trimma support.",
      "Keep booking confirmations for your records.",
    ],
  },
];

const VERIFICATION_STANDARDS = [
  {
    icon: UserCheck,
    title: "Business Identity",
    description: "Salon name, location, and owner contact details are collected during onboarding.",
  },
  {
    icon: MapPin,
    title: "Location Accuracy",
    description: "Address and service area information is reviewed for listing consistency.",
  },
  {
    icon: Eye,
    title: "Profile Review",
    description: "Services, imagery, and pricing are checked before salons go live on Trimma.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Badge",
    description: "Trusted salons may receive a Verified badge after platform and agent review.",
  },
];

const PAYMENT_STEPS = [
  {
    step: 1,
    title: "Book & Reserve",
    description: "Customer pays a 30% reservation fee to secure the appointment slot.",
  },
  {
    step: 2,
    title: "Secure Processing",
    description: "Payments are handled through encrypted, PCI-compliant payment flows.",
  },
  {
    step: 3,
    title: "Salon Confirmation",
    description: "The salon reviews and confirms the booking before service delivery.",
  },
  {
    step: 4,
    title: "Balance at Salon",
    description: "Remaining service balance is paid directly at the salon after your visit.",
  },
];

const PRIVACY_POINTS = [
  {
    icon: Lock,
    title: "Data Encryption",
    description: "Sensitive data is transmitted over secure connections and stored with access controls.",
  },
  {
    icon: Fingerprint,
    title: "Secure Payments",
    description: "Card and payment details are processed by trusted payment partners — not stored casually.",
  },
  {
    icon: Shield,
    title: "Privacy Commitments",
    description: "We collect only what is needed to operate bookings and improve the platform experience.",
  },
];

const ACCEPTABLE_BEHAVIOR = [
  "Treat salon staff and other customers with respect.",
  "Provide accurate booking and contact information.",
  "Arrive on time or communicate changes promptly with the salon.",
  "Use Trimma messaging and booking tools in good faith.",
];

const PROHIBITED_ACTIVITIES = [
  "Harassment, discrimination, or abusive conduct.",
  "Fraudulent bookings, fake reviews, or impersonation.",
  "Posting misleading salon or service information.",
  "Attempting to bypass platform payment or safety systems.",
];

const ENFORCEMENT_ACTIONS = [
  "Warning and account review",
  "Temporary booking restrictions",
  "Salon listing suspension",
  "Permanent account removal for serious violations",
];

const REPORT_CATEGORIES = [
  {
    icon: AlertTriangle,
    title: "Unsafe Salon Conditions",
    description: "Hygiene, safety equipment, or physical environment concerns.",
  },
  {
    icon: FileWarning,
    title: "Booking Fraud",
    description: "Suspicious bookings, impersonation, or misleading appointment activity.",
  },
  {
    icon: Wallet,
    title: "Payment Issues",
    description: "Unauthorized charges, reservation fee disputes, or payment errors.",
  },
  {
    icon: Ban,
    title: "Harassment",
    description: "Abusive messages, discrimination, or threatening behavior.",
  },
  {
    icon: Users,
    title: "Fake Listings",
    description: "Salon profiles that appear fraudulent or materially inaccurate.",
  },
  {
    icon: ShieldAlert,
    title: "Account Security",
    description: "Unauthorized access, credential compromise, or suspicious login activity.",
  },
];

const FAQS = [
  {
    q: "How does Trimma verify salons?",
    a: "Salons complete onboarding with business details, services, and location information. Profiles are reviewed before going live, and verified salons may receive a Verified badge after additional review.",
  },
  {
    q: "Is my payment information safe?",
    a: "Yes. Trimma uses secure, industry-standard payment processing. Sensitive payment data is handled by trusted payment providers with encryption and compliance controls.",
  },
  {
    q: "What should I do if I feel unsafe at a salon?",
    a: "Leave the situation if you can do so safely, then report the concern to Trimma support. For urgent emergencies, contact local emergency services immediately.",
  },
  {
    q: "How are reservation fees protected?",
    a: "Reservation fees secure your booking slot. Cancellation and refund handling follows Trimma policies and salon-managed appointment outcomes. See our Cancellation options page for details.",
  },
  {
    q: "Can I report a salon anonymously?",
    a: "You can contact support with as much detail as you are comfortable sharing. Providing booking references helps us investigate faster.",
  },
  {
    q: "What happens after I submit a safety report?",
    a: "Our support team reviews the report, may contact involved parties, and takes appropriate action — from guidance to account or listing enforcement.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-zinc-300">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-zinc-50 transition-colors"
        aria-expanded={open}
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

export function SafetyContent() {
  return (
    <div className="bg-white text-zinc-900">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/safety-trust-hero.webp"
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
                <Shield className="w-3.5 h-3.5" />
                Safety &amp; Trust
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Safety &amp; Trust</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Center
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Trimma is committed to protecting customers and salon partners. This center explains
                how we verify listings, secure payments, handle privacy, and resolve concerns with
                transparency and care.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#report-safety" className="hero-btn-primary px-8 py-4 rounded-2xl">
                  <ShieldAlert className="w-4 h-4" />
                  Report an Issue
                </a>
                <Link href="/contact" className="hero-btn-secondary px-8 py-4 rounded-2xl">
                  <Headphones className="w-4 h-4" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Trust Pillars */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Built on Trust
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Every booking on Trimma is supported by policies and protections designed for fairness
              and peace of mind.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TRUST_PILLARS.map((pillar) => (
              <div
                key={pillar.title}
                className="group bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${pillar.iconBg} flex items-center justify-center mb-4`}
                >
                  <pillar.icon className={`w-6 h-6 ${pillar.iconColor}`} />
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">{pillar.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Customer Safety Guidelines */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Customer Safety Guidelines
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Simple steps to help you book confidently and enjoy a safe salon experience.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SAFETY_GUIDELINES.map((guide) => (
              <div
                key={guide.phase}
                className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-5">
                  <guide.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950 mb-4">{guide.phase}</h3>
                <ul className="space-y-3">
                  {guide.tips.map((tip) => (
                    <li key={tip} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Salon Verification */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-5">
              Salon Verification Standards
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-6">
              Trimma reviews salon information before partners accept online bookings. Verified
              salons display a trust badge so customers can book with greater confidence.
            </p>
            <div className="space-y-4">
              {VERIFICATION_STANDARDS.map((item) => (
                <div key={item.title} className="flex gap-4 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 mb-1">{item.title}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-wrap gap-3 mb-6">
              <VerifiedSalonBadge size="sm" className="rounded-full" />
              <span className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" />
                Profile Reviewed
              </span>
              <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5" />
                Location Listed
              </span>
            </div>
            <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-6 space-y-3">
              <p className="text-sm font-bold text-zinc-900">Sampath Barber Saloon</p>
              <p className="text-xs text-zinc-500">Colombo · Barber Salon</p>
              <div className="flex items-center gap-2 pt-2">
                <VerifiedSalonBadge size="xs" />
              </div>
            </div>
            <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
              Look for the Verified badge on salon listings when booking through Trimma.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Reservation & Payment Protection */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Reservation &amp; Payment Protection
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Clear steps from reservation to service — with protections at every stage.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              {PAYMENT_STEPS.map((item, index) => (
                <div key={item.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-black font-bold text-sm shrink-0">
                      {item.step}
                    </div>
                    {index < PAYMENT_STEPS.length - 1 && (
                      <div className="w-0.5 flex-1 bg-zinc-200 my-2 min-h-[24px]" />
                    )}
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex-1 mb-2">
                    <h3 className="font-bold text-zinc-900 mb-1.5">{item.title}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 shadow-sm space-y-4">
              <h3 className="font-bold text-zinc-900 text-lg">Cancellation &amp; Refund Protections</h3>
              <p className="text-zinc-700 text-sm leading-relaxed">
                Reservation fees secure booking availability. Cancellations and no-shows are managed
                by salon partners in line with Trimma policies. The online reservation deposit is
                non-refundable unless otherwise stated by the salon or applicable law.
              </p>
              <Link
                href="/cancellation-help"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-800 hover:text-amber-900 transition-colors"
              >
                View Cancellation &amp; Reservation Policy
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Privacy & Data Security */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Privacy &amp; Data Security
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Your trust depends on how we protect your information — here is our commitment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {PRIVACY_POINTS.map((point) => (
              <div
                key={point.title}
                className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                  <point.icon className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">{point.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{point.description}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/privacy-policy"
              className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-900 font-bold px-6 py-3 rounded-xl text-sm transition-all hover:shadow-sm"
            >
              Privacy Policy
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/terms"
              className="inline-flex items-center gap-2 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-900 font-bold px-6 py-3 rounded-xl text-sm transition-all hover:shadow-sm"
            >
              Terms &amp; Conditions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Community Standards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Community Standards
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Trimma is a shared marketplace. Everyone is expected to participate responsibly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-emerald-700 mb-4">Acceptable Behavior</h3>
              <ul className="space-y-3">
                {ACCEPTABLE_BEHAVIOR.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-rose-100 rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-rose-700 mb-4">Prohibited Activities</h3>
              <ul className="space-y-3">
                {PROHIBITED_ACTIVITIES.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                    <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-zinc-900 mb-4">Enforcement Actions</h3>
              <ul className="space-y-3">
                {ENFORCEMENT_ACTIONS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-zinc-600 leading-relaxed">
                    <Scale className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Report a Safety Concern */}
      <section id="report-safety" className="py-20 bg-zinc-50 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Report a Safety Concern
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Select the category that best matches your concern. Our team will review and respond as
              quickly as possible.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {REPORT_CATEGORIES.map((category) => (
              <a
                key={category.title}
                href="mailto:support@trimma.io?subject=Safety%20Report"
                className="group bg-white border border-zinc-200 hover:border-amber-300 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-2xl bg-rose-50 group-hover:bg-amber-50 flex items-center justify-center mb-4 transition-colors">
                  <category.icon className="w-6 h-6 text-rose-600 group-hover:text-amber-600 transition-colors" />
                </div>
                <h3 className="font-bold text-zinc-900 mb-2">{category.title}</h3>
                <p className="text-zinc-600 text-sm leading-relaxed">{category.description}</p>
              </a>
            ))}
          </div>
          <div className="bg-zinc-950 rounded-3xl p-8 sm:p-12 text-center">
            <Headphones className="w-10 h-10 text-amber-400 mx-auto mb-4" />
            <h3 className="text-2xl font-extrabold text-white mb-3">Need Immediate Assistance?</h3>
            <p className="text-zinc-400 max-w-xl mx-auto mb-6 text-sm leading-relaxed">
              Email our support team with your booking reference, salon name, and a description of
              the issue. We take every safety report seriously.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`mailto:${TRIMMA_SUPPORT_EMAIL}?subject=Safety%20Report`}
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-8 py-4 rounded-2xl transition-all"
              >
                <Mail className="w-4 h-4" />
                {TRIMMA_SUPPORT_EMAIL}
              </a>
              <a
                href={TRIMMA_WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-8 py-4 rounded-2xl transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp {TRIMMA_WHATSAPP_DISPLAY}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all"
              >
                Contact Support
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 text-lg">
              Answers to common safety, trust, and protection questions.
            </p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* 10. Emergency Notice */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-rose-900 mb-3">
                Emergency Notice
              </h2>
              <p className="text-rose-800 leading-relaxed mb-2">
                If you are in immediate danger or need urgent medical assistance, contact your local
                emergency services right away. Do not wait for Trimma support to respond.
              </p>
              <p className="text-rose-700 text-sm leading-relaxed">
                In Sri Lanka, dial <strong>119</strong> for police emergencies or{" "}
                <strong>1990</strong> for ambulance services. Trimma support handles platform-related
                safety reports — not life-threatening emergencies.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
