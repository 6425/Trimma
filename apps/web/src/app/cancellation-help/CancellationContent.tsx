"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CalendarDays,
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

function HeroIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="absolute inset-0 rounded-3xl bg-amber-400/20 blur-3xl scale-110 pointer-events-none" />
      <div className="relative bg-white rounded-3xl shadow-2xl border border-zinc-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-zinc-900 text-sm">Appointment Reserved</span>
          </div>
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Confirmed
          </span>
        </div>
        <div className="bg-zinc-50 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Service</span>
            <span className="font-semibold text-zinc-900">Hair Styling</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Date &amp; Time</span>
            <span className="font-semibold text-zinc-900">Sat, 14 Jun · 2:00 PM</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-500">Reservation Fee</span>
            <span className="font-semibold text-amber-600">20% of total</span>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Your slot is secured. The salon has committed staff and availability for your visit.
          </p>
        </div>
      </div>
      <div className="absolute -top-3 -right-3 bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5" />
        Fair &amp; Transparent
      </div>
    </div>
  );
}

function RescheduleIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none">
      <div className="absolute -inset-4 rounded-[2rem] bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 bg-white">
        <Image
          src="/assets/help/reschedule-appointment-card.png"
          alt="Trimma reschedule appointment form with date, time, and confirm options"
          width={900}
          height={700}
          className="w-full h-auto"
        />
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
      {/* Section 1: Hero */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,183,0,0.14)_0%,_transparent_55%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Booking Policy
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 leading-tight mb-6">
              Cancellation &amp; Reservation Policy
            </h1>
            <p className="text-lg text-zinc-500 leading-relaxed mb-8 max-w-lg">
              Transparent policies designed to protect customers, salon owners, and appointment
              availability for everyone.
            </p>
            <div className="flex flex-wrap gap-3">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm"
                >
                  <badge.icon className="w-4 h-4 text-amber-500" />
                  {badge.label}
                </div>
              ))}
            </div>
          </div>
          <HeroIllustration />
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
