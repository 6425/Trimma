"use client";

import { CheckCircle2 } from "lucide-react";

export function TrustBadges() {
  const badges = [
    { title: "Instant Confirmation", desc: "Book in seconds. No waiting for the salon to call you back." },
    { title: "Verified Reviews", desc: "Read real experiences from actual clients. No fake reviews." },
    { title: "Flexible Rescheduling", desc: "Plans change? Reschedule your appointment easily through the app." },
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          {badges.map((badge, i) => (
            <div key={i} className="flex gap-3 flex-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-zinc-900 mb-1">{badge.title}</h4>
                <p className="text-sm text-zinc-500">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
