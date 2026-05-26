"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronRight, BookOpen, Sparkles, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpCenterPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How do I customize my physical storefront A4 flyer?",
      a: "Navigate to your 'Settings' (Salon Profile) sidebar item. In the right-hand preview panel, you will find a premium dark-themed 'Store QR Flyer' section. Clicking the 'Print QR Flyer' button will dynamically compile and render a professional A4 poster that you can directly print and hang on your storefront window!"
    },
    {
      q: "How can I increase the number of staff members I can manage?",
      a: "Staff slots are directly regulated by your active subscription plan. Under the 'Subscription & Billing' dashboard, you can upgrade your plan at any time. For example, the Starter plan increases your slots to 5, Pro gives you 10, and Elite unlocks up to 30 stylist positions!"
    },
    {
      q: "What image resolutions work best for branding visuals?",
      a: "Follow these guidelines for best results: Logo square (500x500px, max 2MB), Cover banner landscape (1200x400px, max 5MB), Hero header (1920x680px, max 8MB). Upload cropped images in JPEG or PNG — Vercel optimizes delivery automatically."
    },
    {
      q: "Are client online bookings secured with notifications?",
      a: "Yes! Every single appointment completed by a client automatically triggers a real-time email confirmation. If you have synchronized your WhatsApp Business account in 'Social Media' settings, the platform will also send automated reminder notifications to maximize client retention."
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Help Center & Guides</h1>
            <p className="text-xs text-zinc-500">Find answers, learn storefront custom rules, and contact platform developers.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive FAQ Accordion */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand" />
              Frequently Asked Questions
            </h3>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-zinc-100 rounded-2xl overflow-hidden bg-zinc-50/50"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-4 flex items-center justify-between font-bold text-xs text-zinc-800 text-left hover:bg-zinc-100/50 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                    </button>
                    
                    {isOpen && (
                      <div className="p-4 pt-0 border-t border-zinc-100 text-xs text-zinc-500 leading-relaxed font-sans font-medium bg-white animate-in slide-in-from-top-1 duration-150">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Support Contact details */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden space-y-6">
            <Sparkles className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12" />
            
            <div className="relative z-10 space-y-4">
              <div>
                <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-2">
                   Contact Support
                </span>
                <h3 className="text-base font-bold">24/7 Platform Concierge</h3>
                <p className="text-white/60 text-[10px] mt-1.5 leading-relaxed">
                  Need custom features, custom domains, or API assistance? Reach out to our engineering team directly inside your admin portal.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs font-semibold text-white/80">
                  <Mail className="w-4 h-4 text-brand" /> support@trimma.com
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-white/80">
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp Live Chat
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
