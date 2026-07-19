"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Handshake,
  Headphones,
  Home,
  Info,
  Shield,
  Sparkles,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

const TRUST_BADGES = [
  { label: "Secure Reservations", icon: Shield },
  { label: "Transparent Policies", icon: ClipboardList },
  { label: "Fair for Customers & Salons", icon: Handshake },
];

const RESERVATION_FEE_CARDS = [
  {
    icon: Wallet,
    title: "20% Reservation Fee",
    description:
      "When an appointment is booked through Trimma, only a reservation fee equivalent to 20% of the total booking value is collected.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    icon: CalendarClock,
    title: "Secures Your Slot",
    description:
      "This reservation fee helps secure your appointment slot and confirms your commitment to the booking.",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    icon: Users,
    title: "Salon Commitment",
    description:
      "Once a time slot is reserved, the salon commits its staff, resources, and availability for that appointment.",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    icon: Clock,
    title: "Opportunity Cost",
    description:
      "Reserved slots may prevent the salon from accepting other customers during the same time period, creating an opportunity cost for both the salon and the platform.",
    iconBg: "bg-zinc-100",
    iconColor: "text-zinc-600",
  },
];

const CANCELLATION_STEPS = [
  {
    title: "Salon-Managed Cancellations",
    description:
      "Appointment cancellations can only be processed by the salon owner or salon management.",
  },
  {
    title: "No-Show Handling",
    description:
      "If a customer does not attend the scheduled appointment, the salon owner is responsible for marking the appointment as cancelled or recording it as a no-show.",
  },
  {
    title: "Accurate Records",
    description:
      "This process ensures appointment records remain accurate and reflects actual service delivery.",
  },
  {
    title: "Reservation Fee Purpose",
    description:
      "Reservation fees are used to secure booking slots and compensate for the opportunity cost associated with reserved appointment availability.",
  },
];

const CUSTOMER_RESPONSIBILITIES = [
  "Arrive on time for scheduled appointments.",
  "Communicate directly with the salon if plans change.",
  "Provide accurate contact information.",
  "Respect salon booking commitments.",
];

const SALON_RESPONSIBILITIES = [
  "Manage appointment attendance records.",
  "Update appointment status accurately.",
  "Handle cancellations and no-shows responsibly.",
  "Communicate schedule changes directly with customers.",
];

const FAQS = [
  {
    q: "Does Trimma collect the full appointment amount?",
    a: "No. Trimma only collects a reservation fee equal to 20% of the total booking value.",
  },
  {
    q: "Who can cancel an appointment?",
    a: "Appointment cancellations are managed by the salon owner or salon management team.",
  },
  {
    q: "What happens if I do not attend my appointment?",
    a: "The salon owner may record the appointment as a no-show or cancellation based on the actual appointment outcome.",
  },
  {
    q: "Can I reschedule my appointment?",
    a: "Yes. Customers and salons can coordinate rescheduling arrangements directly.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-200">
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

function RescheduleIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none">
      <div className="absolute -inset-4 rounded-[2rem] bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 space-y-6">
        <div>
          <h3 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
            Reschedule Appointment
          </h3>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium leading-relaxed">
            Updating schedule for booking reference{" "}
            <span className="font-bold text-zinc-800">TRM-840539</span>.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              New Appointment Date
            </label>
            <div className="flex items-center justify-between h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm text-zinc-900 font-medium">
              <span>06/13/2026</span>
              <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              New Appointment Time
            </label>
            <div className="flex items-center justify-between h-11 px-4 border border-slate-200 rounded-xl bg-white text-sm text-zinc-900 font-medium">
              <span>12:30 PM</span>
              <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="h-10 px-4 rounded-xl border border-slate-200 text-zinc-700 text-xs font-bold bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            className="h-10 px-5 rounded-xl bg-zinc-900 text-white text-xs font-bold shadow-sm ring-1 ring-amber-400/80"
          >
            Confirm Reschedule
          </button>
        </div>
      </div>
      <p className="mt-4 text-center text-xs font-semibold text-zinc-500">
        Salon owners can reschedule appointments directly — customers receive updated details
        automatically.
      </p>
    </div>
  );
}

export function CancellationContent() {
  return (
    <div className="bg-white text-zinc-900">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/cancellation-help-hero.webp"
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
                Booking Policy
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Cancellation &amp; Reservation</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Policy
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Transparent policies designed to protect customers, salon owners, and appointment
                availability for everyone.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-wrap gap-3">
                {TRUST_BADGES.map((badge) => (
                  <div
                    key={badge.label}
                    className="inline-flex items-center gap-2 bg-white/90 border border-zinc-200 rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm"
                  >
                    <badge.icon className="w-4 h-4 text-amber-500" />
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why Reservation Fee */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Why is a Reservation Fee Required?
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              The reservation fee helps reduce missed appointments and ensures a better booking
              experience for everyone.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {RESERVATION_FEE_CARDS.map((card) => (
              <div
                key={card.title}
                className="group bg-white border border-zinc-200 hover:border-zinc-300 rounded-3xl p-6 flex gap-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0`}
                >
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 mb-2">{card.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Cancellation Policy */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Cancellation Policy
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Clear processes that keep appointment records accurate and fair for all parties.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div className="space-y-4">
              {CANCELLATION_STEPS.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-black font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    {index < CANCELLATION_STEPS.length - 1 && (
                      <div className="w-0.5 flex-1 bg-zinc-200 my-2 min-h-[24px]" />
                    )}
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm flex-1 mb-2">
                    <h3 className="font-bold text-zinc-900 mb-1.5">{step.title}</h3>
                    <p className="text-zinc-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative lg:sticky lg:top-24">
              <div className="absolute -inset-4 rounded-[2rem] bg-amber-400/10 blur-3xl pointer-events-none" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 bg-white">
                <Image
                  src="/assets/help/booking-cancellation-actions.png"
                  alt="Trimma salon dashboard showing booking details with No Show and Cancel Booking quick actions"
                  width={1400}
                  height={1050}
                  className="w-full h-auto"
                  priority={false}
                />
              </div>
              <p className="mt-4 text-center text-xs font-semibold text-zinc-500">
                Salon owners mark no-shows and cancellations from the booking dashboard — customers are notified
                automatically.
              </p>
            </div>
          </div>
          <div className="mt-10 mx-auto bg-amber-50 border border-amber-200 rounded-3xl p-8 shadow-sm max-w-3xl text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shrink-0">
                <Info className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 mb-3">Important Note</h3>
                <p className="text-zinc-700 leading-relaxed max-w-2xl mx-auto">
                  Trimma acts as a booking platform connecting customers and salons. Appointment
                  attendance and service fulfillment are managed directly by the salon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Rescheduling */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-5">
              Rescheduling Made Simple
            </h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              In many cases, customers and salon owners already have an existing relationship and
              communicate directly.
            </p>
            <p className="text-zinc-600 leading-relaxed mb-4">
              If an appointment needs to be rescheduled, the customer and salon owner may arrange a
              mutually convenient time directly without requiring Trimma&apos;s involvement.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              Trimma supports flexibility while allowing salons and customers to manage scheduling
              arrangements efficiently.
            </p>
          </div>
          <RescheduleIllustration />
        </div>
      </section>

      {/* Section 5: Responsibilities */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Shared Responsibilities
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              A fair booking experience depends on clear expectations from both customers and salons.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950">Customer Responsibilities</h3>
              </div>
              <ul className="space-y-4">
                {CUSTOMER_RESPONSIBILITIES.map((item) => (
                  <li key={item} className="flex gap-3 text-zinc-600 text-sm leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-zinc-950">Salon Responsibilities</h3>
              </div>
              <ul className="space-y-4">
                {SALON_RESPONSIBILITIES.map((item) => (
                  <li key={item} className="flex gap-3 text-zinc-600 text-sm leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: FAQ */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-500 text-lg">
              Quick answers to common questions about reservations and cancellations.
            </p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Support */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <div className="bg-white border border-zinc-200 rounded-3xl p-10 sm:p-14 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
              <Headphones className="w-7 h-7 text-amber-600" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">
              Need Assistance?
            </h2>
            <p className="text-zinc-500 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              If you have questions regarding reservations, appointment status, or booking policies,
              our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-amber-200 hover:scale-[1.02]"
              >
                <Headphones className="w-4 h-4" />
                Contact Support
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-zinc-200 hover:border-zinc-300 text-zinc-900 font-bold px-8 py-4 rounded-2xl transition-all hover:scale-[1.02]"
              >
                <Home className="w-4 h-4" />
                Back to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
