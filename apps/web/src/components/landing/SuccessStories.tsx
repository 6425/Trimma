"use client";

import { motion } from "motion/react";
import { ArrowUpRight, TrendingUp } from "lucide-react";

export function SuccessStories() {
  const stories = [
    {
      name: "The Barber Lounge",
      logo: "BL",
      color: "from-blue-600 to-indigo-600",
      stats: [
        { label: "Revenue Growth", value: "+45%", type: "increase" },
        { label: "No-Shows", value: "-60%", type: "decrease" },
      ]
    },
    {
      name: "Glow & Glamour Spa",
      logo: "GG",
      color: "from-rose-500 to-pink-600",
      stats: [
        { label: "Online Bookings", value: "85%", type: "metric" },
        { label: "Time Saved/Wk", value: "20hrs", type: "metric" },
      ]
    },
    {
      name: "Cut Creators",
      logo: "CC",
      color: "from-emerald-500 to-teal-600",
      stats: [
        { label: "New Clients", value: "+120", type: "increase" },
        { label: "Staff Efficiency", value: "+30%", type: "increase" },
      ]
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-brand-surface-dark border-b border-slate-100 dark:border-white/5 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Trusted by Modern Salons
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            See how forward-thinking salon owners are transforming their businesses with Trimma.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {stories.map((story, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group bg-slate-50 dark:bg-brand-dark/50 rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${story.color} flex items-center justify-center text-white font-black text-xl shadow-lg`}>
                    {story.logo}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{story.name}</h3>
                    <div className="text-xs font-semibold text-zinc-400">Verified Partner</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {story.stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-brand-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">{stat.label}</div>
                      <div className="flex items-end gap-2">
                        <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stat.value}</div>
                        {stat.type === 'increase' && <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />}
                        {stat.type === 'decrease' && <ArrowUpRight className="w-4 h-4 text-emerald-500 mb-1 rotate-90" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
