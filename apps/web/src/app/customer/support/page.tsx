"use client";

import { LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { CustomerHelpFaq } from "@/components/help/CustomerHelpFaq";
import {
  TRIMMA_SUPPORT_EMAIL,
  TRIMMA_WHATSAPP_DISPLAY,
  TRIMMA_WHATSAPP_URL,
} from "@/lib/trimma-contact";

export default function CustomerSupportPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="border-b border-zinc-200 pb-6">
        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-8 h-8 text-[#ffc800]" />
          Support & Help Center
        </h1>
        <p className="text-sm text-zinc-500 mt-1">We are here to help you with your bookings and account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4 shadow-sm hover:border-[#ffc800]/50 transition-all cursor-default">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-zinc-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">Email Support</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-3">Drop us an email anytime and we will get back to you within 24 hours.</p>
            <a href={`mailto:${TRIMMA_SUPPORT_EMAIL}`} className="text-sm font-bold text-[#ffc800] hover:underline">
              {TRIMMA_SUPPORT_EMAIL}
            </a>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-6 flex items-start gap-4 shadow-sm hover:border-[#ffc800]/50 transition-all cursor-default">
          <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-zinc-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-zinc-900 text-lg">WhatsApp chat & call</h3>
            <p className="text-sm text-zinc-500 mt-1 mb-3">
              Need immediate help with a booking? Message or voice-call our team on WhatsApp — weekdays 9 AM to 6 PM.
            </p>
            <a href={TRIMMA_WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-sm font-bold text-[#ffc800] hover:underline">
              {TRIMMA_WHATSAPP_DISPLAY} · Chat or call on WhatsApp
            </a>
          </div>
        </div>
      </div>

      <section className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-zinc-900">Frequently asked questions</h2>
        <CustomerHelpFaq defaultOpenIndex={null} />
      </section>
    </div>
  );
}
