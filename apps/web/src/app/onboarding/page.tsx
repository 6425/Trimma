import { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { getPublicSubscriptionPlans } from "../actions/subscription-plans";
import { PricingContent } from "../pricing/PricingContent";
import { FindBookGlowCta } from "../../components/marketplace/FindBookGlowCta";
import OnboardingOwnerSignup from "./OnboardingOwnerSignup";
import { OnboardingHeroCta } from "./OnboardingHeroCta";

export const metadata: Metadata = {
  title: "List Your Salon | Trimma",
  description: "Join Sri Lanka's next-generation salon discovery and booking platform.",
};

export default async function OnboardingPage() {
  const result = await getPublicSubscriptionPlans();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/onboarding-hero.webp"
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
                Salon Onboarding
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Grow Your Salon</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  with Trimma
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Sign in with Google to open your salon owner dashboard, complete your profile, and submit for booking approval.
                Trimma assigns a field agent in your area to review your submission before you go live.
              </p>

              <ol className="text-sm max-w-lg text-left space-y-2 list-decimal list-inside font-medium">
                <li>Google sign-in → your salon draft is created</li>
                <li>Complete profile in the owner dashboard</li>
                <li>Submit for booking approval</li>
                <li>Your Trimma agent reviews → admin verifies → live on Trimma</li>
              </ol>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col sm:flex-row gap-4">
                <OnboardingHeroCta />
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium">
                <span className="flex items-center gap-2">✓ No setup fees</span>
                <span className="flex items-center gap-2">✓ No technical knowledge required</span>
                <span className="flex items-center gap-2">✓ Personal assistance from Trimma</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join Trimma Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1C29]">Why Join Trimma?</h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">Discover the benefits of listing your salon on the fastest-growing booking platform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Get More Customers", desc: "Increase your salon visibility and attract new customers actively searching for beauty services." },
              { title: "Online Booking", desc: "Manage appointments efficiently and reduce booking errors with a centralized platform." },
              { title: "Salon Profile", desc: "Showcase your services, pricing, staff, photos, and business information professionally." },
              { title: "Customer Reviews", desc: "Build credibility through verified customer reviews and ratings." },
              { title: "Staff Management", desc: "Manage staff availability and optimize appointment scheduling." },
              { title: "Marketing & Promos", desc: "Promote special offers, discounts, and seasonal campaigns." },
              { title: "Business Insights", desc: "Track bookings, customer trends, and performance metrics." },
              { title: "Dedicated Support", desc: "Get help from your Trimma agent after you submit your salon profile from the owner dashboard." }
            ].map((feature, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:border-brand-pink/30 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center text-brand-pink font-black text-xl mb-4 group-hover:scale-110 transition-transform">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Service Areas Section */}
      <section className="py-24 px-4 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1C29] mb-4">Currently Onboarding Salons In</h2>
          <p className="text-zinc-500 mb-12">We are rolling out our managed onboarding process district by district.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {["Colombo", "Gampaha", "Kandy", "Anuradhapura"].map((district) => (
              <div key={district} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <span className="font-bold text-lg text-zinc-900 mb-1">{district}</span>
                <span className="text-xs font-semibold text-brand-pink px-2 py-1 bg-brand-pink/10 rounded-full">Supported</span>
              </div>
            ))}
          </div>

          <div className="bg-[#ffde5a]/10 border border-[#ffde5a]/30 text-[#8a7600] p-4 rounded-xl text-sm max-w-3xl mx-auto">
            <strong>Notice:</strong> We are currently providing dedicated onboarding support in the above districts to ensure a high-quality experience. Additional districts will be added soon.
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white border-b border-slate-200">
        <PricingContent
          initialPlans={result.plans}
          loadError={result.success ? null : result.error}
          showFindBookGlowCta={false}
        />
      </section>

      {/* Why We Use Regional Onboarding Agents */}
      <section className="py-24 px-4 bg-[#0B0B0B] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">Verified Salon Listings</h2>
          <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
            Every salon on Trimma completes a guided onboarding flow: you build your profile in the owner dashboard,
            your regional agent verifies the details, and Trimma admin gives final approval before bookings open.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            <ul className="space-y-4 text-zinc-400">
              <li className="flex items-center gap-3"><span className="text-[#ffde5a] text-xl font-bold">✓</span> Verify business authenticity</li>
              <li className="flex items-center gap-3"><span className="text-[#ffde5a] text-xl font-bold">✓</span> Ensure accurate service information</li>
              <li className="flex items-center gap-3"><span className="text-[#ffde5a] text-xl font-bold">✓</span> Maintain updated pricing</li>
            </ul>
            <ul className="space-y-4 text-zinc-400">
              <li className="flex items-center gap-3"><span className="text-[#ffde5a] text-xl font-bold">✓</span> Improve customer trust</li>
              <li className="flex items-center gap-3"><span className="text-[#ffde5a] text-xl font-bold">✓</span> Provide personalized support</li>
              <li className="flex items-center gap-3"><span className="text-[#ffde5a] text-xl font-bold">✓</span> Add online visibility to your salon</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Salon Lead Submission Form */}
      <section id="salon-owner-signup" className="py-24 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-zinc-900 mb-2">Start Salon Owner Onboarding</h2>
              <p className="text-zinc-500">
                Sign in with Google, complete your salon profile in the owner dashboard, and submit for agent review and booking approval.
              </p>
            </div>
            
            <OnboardingOwnerSignup />
          </div>
        </div>
      </section>

      <FindBookGlowCta />
    </div>
  );
}
