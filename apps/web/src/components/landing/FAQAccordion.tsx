"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: "How do I book an appointment?", a: "Simply search for a salon, select your desired service and professional, pick a time slot, and confirm your booking instantly. You'll receive a digital ticket right away." },
    { q: "How do payments work?", a: "Online bookings collect a 30% reservation deposit securely at checkout (10% Trimma platform + 20% salon upfront). The remaining 70% is paid at the salon after your service." },
    { q: "Can I cancel or reschedule my booking?", a: "Rescheduling may be available from your booking details where the salon allows it. Cancellations are handled by the salon — contact them directly if you need to change plans. The 30% online reservation deposit is non-refundable and no refunds are processed through Trimma." },
    { q: "How do I register my salon on Trimma?", a: "Click the 'Register Your Salon' button, fill in your business details, and our onboarding team will verify your account. Once verified, you can set up your services and staff." },
    { q: "Does Trimma support multi-branch salons?", a: "Absolutely. Our platform is built to scale. You can manage multiple locations, staff rosters, and view consolidated analytics from a single owner dashboard." },
  ];

  return (
    <section className="py-24 bg-white dark:bg-brand-surface-dark relative">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            Everything you need to know about Trimma and how it works.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="bg-slate-50 dark:bg-brand-dark/50 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left cursor-pointer focus:outline-none"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-bold text-zinc-900 dark:text-zinc-100 pr-4">{faq.q}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-zinc-400 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`} 
                />
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 pt-0 text-zinc-500 dark:text-zinc-400 leading-relaxed text-sm">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
