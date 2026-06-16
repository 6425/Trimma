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
  Search,
  MapPin,
  Store,
  Calendar,
  CreditCard,
  CheckCircle2,
  Star,
  Heart,
  Scissors,
  User,
  LayoutDashboard,
  Bell,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingGuideDownloads } from "./BookingGuideDownloads";

const CUSTOMER = {
  name: "Nimal Perera",
  email: "nimal@gmail.com",
  phone: "+94771234567",
};

const SALON = {
  name: "Sampath Barber Saloon",
  location: "Kadawatha, Gampaha",
  slug: "sampath-barber-saloon",
  service: "Classic Haircut",
  price: 700,
  deposit: 140,
  balance: 560,
  ref: "TRM-482916",
  stylist: "Kasun Silva",
};

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "marketplace", label: "Marketplace" },
  { id: "search", label: "Search & Filters" },
  { id: "salon-page", label: "Salon Profile" },
  { id: "booking", label: "Book Appointment" },
  { id: "checkout", label: "Checkout & Deposit" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Your Account" },
  { id: "dashboard", label: "Customer Dashboard" },
  { id: "bookings", label: "My Bookings" },
  { id: "favorites", label: "Favorite Salons" },
  { id: "styles", label: "Saved Styles" },
  { id: "profile", label: "Profile" },
  { id: "reviews", label: "Reviews" },
  { id: "journey", label: "Booking Journey" },
  { id: "faq", label: "FAQ" },
  { id: "guides", label: "Download Guides" },
  { id: "support", label: "Support" },
] as const;

const JOURNEY_STEPS = [
  { step: "1", title: "Find a salon", desc: "Browse Trimma or search by service and location." },
  { step: "2", title: "Pick service & time", desc: "Choose Classic Haircut, stylist, and an open slot." },
  { step: "3", title: "Pay 20% deposit", desc: "Secure your slot online — LKR 140 on a LKR 700 service." },
  { step: "4", title: "Salon confirms", desc: "WhatsApp + email when pending, then when confirmed." },
  { step: "5", title: "Visit & pay balance", desc: "Pay remaining LKR 560 at the salon after your service." },
  { step: "6", title: "Leave a review", desc: "Rate your visit from My Bookings once your appointment time has passed." },
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

function MarketplaceMockup() {
  return (
    <div className="rounded-xl bg-[#0B0B0B] p-4 text-white space-y-3">
      <div className="text-xs font-black">Sri Lanka&apos;s Beauty & Wellness Marketplace</div>
      <div className="bg-[#ffc800] rounded-lg p-1.5 space-y-1 border-2 border-white/20">
        <div className="bg-white rounded-md px-2 py-1.5 text-[9px] text-zinc-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Where are you?
        </div>
        <div className="bg-white rounded-md px-2 py-1.5 text-[9px] text-zinc-500 flex items-center gap-1">
          <Search className="w-3 h-3" /> Haircut, colour, spa…
        </div>
        <div className="bg-[#e6b400] text-black text-[9px] font-bold py-1.5 rounded-md text-center">
          Search
        </div>
      </div>
      <div className="flex gap-2">
        <span className="bg-[#ffc800] text-black text-[9px] font-bold px-2 py-1 rounded-md">Book Now</span>
        <span className="border border-[#ffc800]/50 bg-[#ffc800]/10 text-[#ffc800] text-[9px] font-bold px-2 py-1 rounded-md">
          List Your Business
        </span>
      </div>
    </div>
  );
}

function BookingSheetMockup() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden text-[10px]">
      <div className="px-3 py-2 bg-zinc-950 text-white font-bold">Book at {SALON.name}</div>
      <div className="p-3 space-y-2">
        {["1. Services", "2. Stylist", "3. Date & Time", "4. Your Details", "5. Summary"].map((s, i) => (
          <div
            key={s}
            className={`flex items-center justify-between py-1 border-b border-slate-100 ${
              i === 0 ? "text-brand font-bold" : "text-zinc-600"
            }`}
          >
            <span>{s}</span>
            {i === 0 && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          </div>
        ))}
        <div className="pt-1 font-bold text-zinc-900">
          {SALON.service} — LKR {SALON.price}
        </div>
        <div className="bg-[#ffc800] text-black text-center py-1.5 rounded-lg font-bold">Continue</div>
      </div>
    </div>
  );
}

function CustomerSidebarMockup() {
  const items = [
    { label: "Dashboard", active: true },
    { label: "My Bookings", active: false },
    { label: "Favorite Salons", active: false },
    { label: "Saved Styles", active: false },
    { label: "Profile", active: false },
    { label: "Customer Help", active: false },
    { label: "Support", active: false },
  ];
  return (
    <div className="rounded-xl bg-zinc-50 border border-slate-200 p-3 w-full max-w-[200px] shrink-0">
      <div className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2 px-1">Menu</div>
      {items.map((item) => (
        <div
          key={item.label}
          className={`px-2 py-1.5 rounded-lg text-[10px] font-semibold mb-0.5 ${
            item.active ? "bg-[#ffc800] text-black" : "text-zinc-600"
          }`}
        >
          {item.label}
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
  publicOnly,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  path?: string;
  description: string;
  features: string[];
  tips?: string[];
  mockup?: React.ReactNode;
  publicOnly?: boolean;
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
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">{title}</h2>
              {publicOnly && (
                <Badge className="bg-brand/10 text-brand border-none text-[9px] font-bold uppercase">
                  No login required
                </Badge>
              )}
              {path && (
                <Link
                  href={path}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-brand hover:underline"
                >
                  Open page <ExternalLink className="w-3 h-3" />
                </Link>
              )}
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

const FAQS = [
  {
    q: "Do I need an account to browse salons?",
    a: "No. Anyone can visit Trimma, search salons, view profiles, and read this help guide without signing in. You can complete a booking as a guest by entering your details in the booking sheet. Sign in with Google at /login when you want to manage bookings, save favorites, or leave reviews in your dashboard.",
  },
  {
    q: "How much do I pay online vs at the salon?",
    a: `For a LKR ${SALON.price} service like ${SALON.service}, you typically pay a 20% reservation deposit online (LKR ${SALON.deposit}) to lock your slot. The remaining balance (LKR ${SALON.balance}) is paid at the salon after your service.`,
  },
  {
    q: "When will I receive booking confirmations?",
    a: "After checkout you receive a pending notification by email and WhatsApp (if your number is on file). Once the salon confirms, you get a second confirmation message with your appointment details.",
  },
  {
    q: "Can I cancel or reschedule a booking?",
    a: "Contact the salon directly for urgent changes. Cancellation policies vary by salon. See our Cancellation options page at /cancellation-help for general Trimma guidance.",
  },
  {
    q: "When can I leave a review?",
    a: "Reviews unlock once your confirmed appointment time has passed. Go to My Bookings → Ready to review tab to rate the salon and stylist. You can edit your review anytime.",
  },
  {
    q: "How do Favorite Salons work?",
    a: "Tap the heart on any salon listing or profile while signed in. Your saved salons appear under Favorite Salons in your customer dashboard for quick rebooking.",
  },
];

export function CustomerHelpGuide() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeNav, setActiveNav] = useState<string>("overview");

  const scrollTo = (id: string) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 pb-16 space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-primary-gradient text-zinc-900 p-6 sm:p-10 border border-brand/20">
        <Sparkles className="absolute -right-8 -top-8 w-40 h-40 text-black/10" />
        <div className="relative z-10 max-w-2xl">
          <span className="hero-badge hero-eyebrow px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Customer Handbook
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
            Trimma Booking Guide
          </h1>
          <p className="text-sm text-zinc-800 leading-relaxed mb-4">
            Everything you need to find, book, and enjoy beauty & wellness services in Sri Lanka.
            Examples use <strong className="text-zinc-950">{CUSTOMER.name}</strong> booking{" "}
            <strong className="text-zinc-950">{SALON.service}</strong> at{" "}
            <strong className="text-zinc-950">{SALON.name}</strong> ({SALON.location}).
            This guide is <strong className="text-zinc-950">public</strong> — no login required to read it.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/">
              <Button variant="hero" className="h-9 rounded-xl hero-btn-compact text-xs font-bold">
                Find a salon
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="h-9 rounded-xl hero-btn-secondary text-xs font-bold px-4">
                Sign up with Google
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8 items-start">
        <nav className="lg:sticky lg:top-24 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm max-h-[70vh] overflow-y-auto">
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
          <section id="overview" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Getting started</h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Trimma connects you with verified salons, barbers, spas, and wellness studios across
              Sri Lanka. Search by location and service, book in a few taps, pay a small deposit
              online, and enjoy your appointment — then leave an honest review to help others.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "Discover", desc: "Home, search, locations, categories, deals" },
                { step: "2", title: "Book", desc: "Service, stylist, time, 20% deposit checkout" },
                { step: "3", title: "Manage", desc: "Dashboard, bookings, favorites, reviews" },
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

          <SectionCard
            id="marketplace"
            icon={Store}
            title="Marketplace"
            path="/"
            publicOnly
            description="The Trimma home page and salon listings — open to everyone. Start here to explore what's available near you."
            features={[
              "Hero search widget — location, service query, and optional date",
              "Book Now — jump into salon discovery",
              "Browse by category — hair, nails, spa, barber, wellness",
              "Locations hub — provinces, districts, and cities",
              "Deals page — promotional packages from partner salons",
              "Verified badge — salons reviewed and approved by Trimma",
              "Ratings — real review averages; unrated salons show as New",
            ]}
            tips={[
              "Use Locations if you know your area but not a specific salon name.",
              "Verified salons have completed Trimma onboarding and identity checks.",
            ]}
            mockup={<MarketplaceMockup />}
          />

          <SectionCard
            id="search"
            icon={Search}
            title="Search & Filters"
            path="/search"
            publicOnly
            description="Search salons by service and location. Province location pages add district, city, category, and open-now filters plus map and list views."
            features={[
              "Search page — filter by service name, popular service, or category tags",
              "Location dropdown — narrow results to Colombo, Gampaha, Kandy, and more",
              "Location pages — district, city, category, and open-now filter chips",
              "Map and list toggle — switch views on province location pages",
              "Salon cards — photo, rating, location, category tags, verified badge",
            ]}
            tips={[
              `Searching near ${SALON.location} surfaces local options like ${SALON.name}.`,
            ]}
          />

          <SectionCard
            id="salon-page"
            icon={MapPin}
            title="Salon Profile"
            path={`/salons/${SALON.slug}`}
            publicOnly
            description={`Each salon has a public profile — services, team, gallery, reviews, hours, and a Book button. Example: ${SALON.name}.`}
            features={[
              "Cover image, logo, address, and contact shortcuts",
              "Service menu — name, duration, price; add to booking cart",
              "Staff profiles — stylists with ratings and specialties",
              "Gallery and amenities (AC, parking, WiFi, etc.)",
              "Reviews from verified completed bookings only",
              "Favorite heart — save salon when signed in",
              "Share and directions links",
            ]}
            tips={[
              "Check working hours before picking a time slot — they drive availability.",
            ]}
          />

          <SectionCard
            id="booking"
            icon={Calendar}
            title="Book Appointment"
            publicOnly
            description={`The booking sheet walks you through five steps to reserve ${SALON.service} with ${SALON.stylist} at ${SALON.name}.`}
            features={[
              "Step 1 — Select one or more services from the menu",
              "Step 2 — Choose your preferred stylist (or Any Available)",
              "Step 3 — Pick date and time from real-time available slots",
              "Step 4 — Phone lookup to autofill, then full name, email, phone, and optional notes",
              "Step 5 — Review summary, deposit breakdown, policy acknowledgements, then payment",
              "Only open time slots are shown — already-booked times aren't selectable",
              "Booking reference assigned after successful deposit (e.g. TRM-482916)",
            ]}
            tips={[
              "If a slot disappears at checkout, refresh and choose the next open time.",
              "Multi-service bookings use combined duration for slot length.",
              "Use the same email for booking and Google sign-in so appointments appear in My Bookings.",
            ]}
            mockup={<BookingSheetMockup />}
          />

          <SectionCard
            id="checkout"
            icon={CreditCard}
            title="Checkout & Deposit"
            path="/checkout/booking"
            description={`Secure payment for the 20% reservation deposit. For ${CUSTOMER.name}'s LKR ${SALON.price} haircut, the online deposit is LKR ${SALON.deposit}.`}
            features={[
              "Order summary — services, stylist, date/time, salon name",
              "Deposit line — 20% of total service price",
              "Balance due at salon — remaining 80% shown clearly",
              "Card payment via secure Stripe checkout",
              "Success page — booking reference and sign-in prompt for My Bookings",
              "Receipt email sent to your inbox",
            ]}
            tips={[
              "Keep your booking reference (TRM-…) for salon check-in.",
            ]}
          />

          <SectionCard
            id="notifications"
            icon={Bell}
            title="Notifications"
            publicOnly
            description="Stay informed from booking through your visit."
            features={[
              "Email confirmation — immediately after successful deposit payment",
              "WhatsApp pending message — booking awaiting salon approval",
              "WhatsApp confirmed message — when salon accepts your slot",
              "Reminder messages — before your appointment (when salon enables WhatsApp)",
              "Review invitation — after service completion",
            ]}
            tips={[
              "Add your Sri Lankan mobile number in booking Step 4 for WhatsApp updates.",
            ]}
          />

          <section id="account" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">Your account</h2>
            <p className="text-sm text-zinc-600 mb-6">
              Sign in with Google to manage bookings, save favorites, and leave reviews — free for customers.
              New customers sign up at <Link href="/signup" className="text-brand font-bold hover:underline">/signup</Link>;
              returning users log in at <Link href="/login" className="text-brand font-bold hover:underline">/login</Link>.
              You can book as a guest without an account; use the same Google email later to see your appointments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <CustomerSidebarMockup />
              <ul className="flex-1 grid sm:grid-cols-2 gap-2 text-sm text-zinc-700">
                {[
                  "Light sidebar — Dashboard, Bookings, Favorites, Styles",
                  "Account section — Profile, Customer Help, and Support links",
                  "Mobile bottom nav — Dashboard, Bookings, Explore, Favorites, Profile",
                  "Notification bell — booking updates",
                  "Logout — ends session securely",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <SectionCard
            id="dashboard"
            icon={LayoutDashboard}
            title="Customer Dashboard"
            path="/customer"
            description={`${CUSTOMER.name}'s home after signing in — upcoming appointments, stats, and quick links.`}
            features={[
              "Welcome header with profile avatar",
              "Booking stats — total, upcoming, completed",
              "Upcoming appointments list with salon, service, date, deposit/balance",
              "Payment success toast after checkout redirect",
              "WhatsApp receipt dispatch on successful payment",
              "Quick link to explore more salons",
            ]}
          />

          <SectionCard
            id="bookings"
            icon={Calendar}
            title="My Bookings"
            path="/customer/bookings"
            description="Full history and review management for every appointment."
            features={[
              "Tabs — All · Ready to review · My reviews",
              "Each card — salon, service, stylist, date/time, status badge",
              "Status labels — Pending, Confirmed, Completed, Cancelled",
              "Deposit paid and balance due amounts",
              "Leave review button — opens after your confirmed appointment time passes",
              "Deep link — /customer/bookings?review={id} from email",
            ]}
            tips={[
              "Reviews unlock once your confirmed visit time has passed — salon completion is not required first.",
            ]}
          />

          <SectionCard
            id="favorites"
            icon={Heart}
            title="Favorite Salons"
            path="/customer/favorites"
            description="Salons you've saved with the heart icon — quick access for rebooking."
            features={[
              "Grid of saved salons with photo, rating, location",
              "Remove from favorites anytime",
              "Book Again — opens salon profile",
              "Empty state — explore marketplace to find salons",
            ]}
          />

          <SectionCard
            id="styles"
            icon={Scissors}
            title="Saved Styles"
            path="/customer/styles"
            description="Inspiration board for haircut and style references you save from the Styles gallery."
            features={[
              "Browse community and salon style posts on /styles",
              "Save styles to your personal collection",
              "Show your stylist reference photos at appointment time",
              "Remove saved styles from your dashboard",
            ]}
          />

          <SectionCard
            id="profile"
            icon={User}
            title="Profile"
            path="/customer/profile"
            description={`Update ${CUSTOMER.name}'s contact details used for bookings and notifications.`}
            features={[
              "Edit first name, last name, phone (+947 format)",
              "Email — login identity (read-only)",
              "Save Changes — updates profile for future bookings",
              "Account security note — verified Trimma customer account",
            ]}
          />

          <SectionCard
            id="reviews"
            icon={Star}
            title="Reviews"
            description="Help the community by rating salons and stylists after real visits."
            features={[
              "Star rating (1–5) with optional written comment (20+ characters)",
              "Staff-specific rating when a stylist was assigned",
              "One review per booking appointment — prevents fake ratings",
              "Reviews appear on salon marketplace profile after submission",
              "Legacy ratings without bookings are not shown publicly",
            ]}
            tips={[
              "Honest reviews help salons like Sampath Barber Saloon grow on Trimma.",
            ]}
          />

          <section id="journey" className="scroll-mt-24 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">End-to-end booking journey</h2>
            <p className="text-sm text-zinc-600 mb-6">
              Follow this path from first search to post-visit review — using {SALON.name} as the
              example salon.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {JOURNEY_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                >
                  <span className="text-[10px] font-black text-brand bg-brand/10 w-6 h-6 rounded-full inline-flex items-center justify-center mb-2">
                    {s.step}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900">{s.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="faq" className="scroll-mt-24 space-y-4">
            <h2 className="text-xl font-bold text-zinc-900">Frequently asked questions</h2>
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

          <BookingGuideDownloads />

          <section id="support" className="scroll-mt-24">
            <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-6 sm:p-8 border border-white/10">
              <div className="relative z-10 grid sm:grid-cols-2 gap-6 items-center">
                <div>
                  <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-3">
                    Customer support
                  </span>
                  <h3 className="text-xl font-bold mb-2">Need more help?</h3>
                  <p className="text-white/60 text-sm leading-relaxed">
                    Our team supports customers across Sri Lanka — booking issues, payments,
                    cancellations, and account questions.
                  </p>
                </div>
                <div className="space-y-4">
                  <a
                    href="mailto:support@trimma.io"
                    className="flex items-center gap-3 text-sm font-semibold text-white/90 hover:text-[#ffc800] transition-colors"
                  >
                    <Mail className="w-5 h-5 text-brand" />
                    support@trimma.io
                  </a>
                  <div className="flex items-center gap-3 text-sm font-semibold text-white/90">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                    WhatsApp Customer Support
                  </div>
                  <Link href="/customer/support">
                    <Button className="w-full sm:w-auto h-10 rounded-xl bg-[#ffc800] hover:bg-[#ffc800]/90 text-black font-bold text-xs">
                      Open support centre
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
