import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Globe,
  Heart,
  Mail,
  MapPin,
  Navigation2,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import {
  TRIMMA_COMPANY_OPERATOR,
  TRIMMA_LEGAL_DISCLAIMER,
  TRIMMA_OFFICE_MAP_DIRECTIONS,
  TRIMMA_REGISTERED_OFFICE,
} from "@/lib/trimma-company";

export const metadata = {
  title: "About Trimma | The Salon Engine",
  description:
    "Learn about Trimma — the beauty and wellness appointment booking and business management platform built for salons across Sri Lanka and beyond.",
};

const VALUES = [
  {
    icon: Zap,
    title: "Built for Speed",
    description: "From discovery to booking confirmation in minutes — for customers and salon teams alike.",
  },
  {
    icon: Shield,
    title: "Trust by Design",
    description: "Verified salons, secure payments, and transparent operations that protect every party.",
  },
  {
    icon: Heart,
    title: "People First",
    description: "Technology that elevates stylists, owners, and customers — never replaces the human touch.",
  },
  {
    icon: Globe,
    title: "Locally Rooted, Globally Ready",
    description: "Headquartered in Sri Lanka with a platform architecture built to scale internationally.",
  },
];

const INDUSTRIES = [
  "Barber Salons",
  "Beauty Parlours",
  "Nail Studios",
  "Bridal Studios",
  "Spas & Wellness",
  "Men's Grooming",
  "Tattoo Studios",
  "Skincare Clinics",
  "Yoga Studios",
];

export default function AboutPage() {
  return (
    <div className="bg-white text-zinc-900">
      {/* Hero */}
      <section className="page-hero-light pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            About Trimma
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-950 leading-tight mb-6 max-w-4xl mx-auto">
            The Salon Engine for Modern Beauty &amp; Wellness
          </h1>
          <p className="text-lg hero-lead leading-relaxed max-w-2xl mx-auto mb-4">
            Trimma is an AI-powered appointment booking and business management platform helping salons,
            spas, and wellness businesses attract customers, streamline operations, and grow revenue.
          </p>
          <p className="text-sm text-zinc-800 leading-relaxed max-w-2xl mx-auto mb-10">
            <strong className="text-zinc-950">Trimma</strong> is a product and brand operated by{" "}
            <strong className="text-zinc-950">{TRIMMA_COMPANY_OPERATOR}</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="hero-btn-primary px-8 py-4 rounded-2xl"
            >
              <Building2 className="w-4 h-4" />
              List Your Salon
            </Link>
            <Link
              href="/contact"
              className="hero-btn-secondary px-8 py-4 rounded-2xl"
            >
              Contact Us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-5">Our Mission</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We believe every salon deserves enterprise-grade technology without enterprise complexity.
              Trimma connects customers who want to look and feel their best with the professionals who
              make it happen — through a single, elegant platform.
            </p>
            <p className="text-zinc-600 leading-relaxed">
              From online discovery and instant booking to staff scheduling, payments, and customer
              relationship management, Trimma gives salon owners the tools to run a thriving business
              while delivering exceptional experiences.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "500+", label: "Businesses Connected" },
              { value: "10K+", label: "Appointments Managed" },
              { value: "9", label: "Provinces Covered" },
              { value: "24/7", label: "Platform Availability" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
                <div className="text-2xl font-black text-amber-500 mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4">What We Stand For</h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">
              Principles that guide every product decision we make.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-white border border-zinc-200 rounded-3xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="font-bold text-zinc-900 text-lg mb-2">{v.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-20 bg-zinc-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,222,90,0.15)_0%,_transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Built for Every Beauty &amp; Wellness Business</h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-10">
            Trimma supports a wide range of industries — from neighbourhood barbers to luxury bridal studios.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {INDUSTRIES.map((industry) => (
              <span
                key={industry}
                className="bg-white/10 border border-white/20 text-white text-sm font-semibold px-4 py-2 rounded-full"
              >
                {industry}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Company & registered office */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-2 rounded-full">
              <MapPin className="w-4 h-4" />
              Registered Office
            </div>
            <h2 className="text-3xl font-extrabold text-zinc-950">Built and operated from Sri Lanka</h2>
            <p className="text-zinc-500 leading-relaxed">
              Trimma is proudly developed in Sri Lanka, serving salons across the island and expanding to
              support beauty and wellness businesses globally.
            </p>
            <div className="bg-[#ffde5a]/10 border border-[#ffde5a]/30 rounded-2xl px-5 py-4">
              <p className="text-sm text-zinc-700 leading-relaxed">{TRIMMA_LEGAL_DISCLAIMER}</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-600">
              <Users className="w-5 h-5 text-amber-500 shrink-0" />
              <span>A growing team of engineers, designers, and regional onboarding specialists.</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="font-extrabold text-zinc-950 text-lg">Trimma</div>
                <div className="text-sm text-zinc-500">Operated by {TRIMMA_COMPANY_OPERATOR}</div>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2 border-t border-zinc-100">
              <Building2 className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-zinc-900">{TRIMMA_COMPANY_OPERATOR}</div>
                <p className="text-sm text-zinc-600 leading-relaxed mt-1">{TRIMMA_REGISTERED_OFFICE}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-6 py-3 rounded-xl transition-all text-sm"
              >
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href={TRIMMA_OFFICE_MAP_DIRECTIONS}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border-2 border-zinc-200 hover:border-zinc-300 text-zinc-900 font-bold px-6 py-3 rounded-xl transition-all text-sm"
              >
                <Navigation2 className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-zinc-950 mb-5">Ready to Join Trimma?</h2>
          <p className="text-lg text-zinc-500 mb-10 leading-relaxed">
            Whether you run a solo barbershop or a multi-location spa group, Trimma has the tools to help you grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-black font-bold px-10 py-4 rounded-2xl transition-all shadow-lg shadow-amber-100 hover:scale-[1.03]"
            >
              Become a Partner
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-zinc-200 hover:border-zinc-300 text-zinc-900 font-bold px-10 py-4 rounded-2xl transition-all hover:scale-[1.03]"
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
