"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CUSTOMER_HELP_FAQS } from "@/lib/customer-help-faq";

export function CustomerHelpFaq({ defaultOpenIndex = 0 }: { defaultOpenIndex?: number | null }) {
  const [openFaq, setOpenFaq] = useState<number | null>(defaultOpenIndex);

  return (
    <div className="space-y-3">
      {CUSTOMER_HELP_FAQS.map((faq, idx) => {
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
            {isOpen ? (
              <div className="px-4 pb-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 bg-white">
                {faq.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
