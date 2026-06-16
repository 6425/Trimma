import { Metadata } from "next";
import { getPublicSubscriptionPlans } from "../actions/subscription-plans";
import { PricingContent } from "../pricing/PricingContent";
import OnboardingClient from "./OnboardingClient";

export const metadata: Metadata = {
  title: "List Your Salon | Trimma",
  description: "Join Sri Lanka's next-generation salon discovery and booking platform.",
};

export default async function OnboardingPage() {
  const result = await getPublicSubscriptionPlans();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Section */}
      <section className="page-hero-shell py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-900 tracking-tight mb-6">
            Grow Your Salon with Trimma
          </h1>
          <p className="text-xl text-zinc-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join Sri Lanka&apos;s next-generation salon discovery and booking platform.
            <br className="hidden md:block" />
            Our regional onboarding specialists work directly with salon owners to ensure every salon profile is complete, accurate, and optimized for customer bookings.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="#onboarding-form"
              className="hero-btn-primary px-8 py-4 rounded-xl text-lg w-full sm:w-auto"
            >
              Start Your Onboarding
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-medium text-zinc-600">
            <span className="flex items-center gap-2">✓ No setup fees</span>
            <span className="flex items-center gap-2">✓ No technical knowledge required</span>
            <span className="flex items-center gap-2">✓ Personal assistance from Trimma</span>
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
              { title: "Dedicated Support", desc: "Receive onboarding assistance and ongoing support from Trimma regional agents." }
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

          <div className="bg-[#ffc800]/10 border border-[#ffc800]/30 text-[#8a7600] p-4 rounded-xl text-sm max-w-3xl mx-auto">
            <strong>Notice:</strong> We are currently providing dedicated onboarding support only in the above districts to ensure a high-quality experience. Additional districts will be added soon. You may still apply, and you will be added to our waiting list.
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white border-b border-slate-200">
        <PricingContent
          initialPlans={result.plans}
          loadError={result.success ? null : result.error}
        />
      </section>

      {/* Why We Use Regional Onboarding Agents */}
      <section className="py-24 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6">Quality-Verified Salon Information</h2>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            Unlike open self-registration platforms, Trimma uses trained regional onboarding specialists to work directly with salon owners.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-center gap-3"><span className="text-brand-pink text-xl">✓</span> Verify business authenticity</li>
              <li className="flex items-center gap-3"><span className="text-brand-pink text-xl">✓</span> Ensure accurate service information</li>
              <li className="flex items-center gap-3"><span className="text-brand-pink text-xl">✓</span> Maintain updated pricing</li>
            </ul>
            <ul className="space-y-4 text-slate-300">
              <li className="flex items-center gap-3"><span className="text-brand-pink text-xl">✓</span> Improve customer trust</li>
              <li className="flex items-center gap-3"><span className="text-brand-pink text-xl">✓</span> Provide personalized support</li>
              <li className="flex items-center gap-3"><span className="text-brand-pink text-xl">✓</span> Add online visibility to your salon</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Salon Lead Submission Form */}
      <section id="onboarding-form" className="py-24 px-4 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-extrabold text-zinc-900 mb-2">Request Salon Onboarding</h2>
              <p className="text-zinc-500">Submit your salon information below and a regional Trimma specialist will contact you shortly.</p>
            </div>
            
            <OnboardingClient />
          </div>
        </div>
      </section>
    </div>
  );
}
