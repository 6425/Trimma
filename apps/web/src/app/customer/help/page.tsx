"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Heart,
  HelpCircle,
  Home,
  LifeBuoy,
  Scissors,
  User,
} from "lucide-react";
import { CUSTOMER_DASHBOARD_OPTIONS } from "@/lib/customer-help-faq";
import { CustomerHelpFaq } from "@/components/help/CustomerHelpFaq";

const ICONS: Record<string, React.ReactNode> = {
  Dashboard: <Home className="w-5 h-5" />,
  "My Bookings": <CalendarDays className="w-5 h-5" />,
  "Favorite Salons": <Heart className="w-5 h-5" />,
  "Saved Styles": <Scissors className="w-5 h-5" />,
  Profile: <User className="w-5 h-5" />,
  Support: <LifeBuoy className="w-5 h-5" />,
};

export default function CustomerDashboardHelpPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-8 h-8 text-[#ffc800]" />
          Customer Help
        </h1>
        <p className="text-sm text-zinc-500 mt-2 max-w-2xl leading-relaxed">
          Everything available in your Trimma customer account. Use the menu on the left to jump
          between these sections, or open the links below.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900">Your dashboard options</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CUSTOMER_DASHBOARD_OPTIONS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-[#ffc800]/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffc800]/15 text-zinc-900 flex items-center justify-center shrink-0">
                  {ICONS[item.title]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-zinc-900">{item.title}</h3>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-[#ffc800] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-base font-bold text-zinc-900">Full booking guide</h2>
            <p className="text-sm text-zinc-600 mt-1 leading-relaxed">
              Need step-by-step help finding a salon, paying your deposit, or understanding
              notifications? Read the public customer handbook.
            </p>
            <Link
              href="/customer-help"
              className="inline-flex items-center gap-1 mt-3 text-sm font-bold text-zinc-900 underline decoration-[#ffc800] decoration-2 underline-offset-4"
            >
              Open customer booking guide
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900">Frequently asked questions</h2>
        <CustomerHelpFaq defaultOpenIndex={0} />
      </section>
    </div>
  );
}
