"use client";

import { motion } from "motion/react";
import { TrendingUp, Users, Calendar, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SalonGrowth() {
  const benefits = [
    "Reduce missed appointments with automated reminders",
    "Increase repeat customers through smart CRM",
    "Manage staff schedules and commissions efficiently",
    "Track revenue in real-time with advanced analytics",
    "Scale multiple branches from a single dashboard"
  ];

  return (
    <section className="py-24 bg-white dark:bg-brand-surface-dark overflow-hidden relative border-b border-slate-100 dark:border-white/5">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          {/* Left: Content */}
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
                Grow Your Salon Business with <span className="text-brand-purple">Smart Automation</span>
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8">
                Stop managing chaos. Trimma gives you the tools to automate operations, retain clients, and track performance so you can focus on what you do best—delivering great styles.
              </p>

              <div className="space-y-4 mb-8">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-6 pt-4">
                <div className="space-y-1">
                  <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">15+</div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hours Saved/Wk</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">40%</div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Fewer No-Shows</div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black text-zinc-900 dark:text-zinc-100">2x</div>
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Faster Bookings</div>
                </div>
              </div>

              <div className="mt-10">
                <Link href="/onboarding">
                  <Button size="lg" className="rounded-xl px-8 bg-brand-purple hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20 font-bold h-14 text-base">
                    Register Your Salon
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right: Dashboard Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full relative"
          >
            <div className="absolute inset-0 bg-brand-purple/5 blur-3xl rounded-full" />
            <div className="relative bg-zinc-900 rounded-3xl p-2 shadow-2xl border border-white/10 rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-zinc-950 rounded-[1.25rem] border border-white/5 overflow-hidden">
                {/* Mock Header */}
                <div className="h-12 border-b border-white/5 flex items-center px-4 gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-6 w-48 bg-zinc-800 rounded-md mx-auto" />
                </div>
                
                {/* Mock Body */}
                <div className="p-6 space-y-6">
                  {/* Top Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <div className="text-xl font-bold text-white">Rs. 450K</div>
                      <div className="text-[10px] text-zinc-500">Revenue (Monthly)</div>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2">
                      <Calendar className="w-5 h-5 text-brand-pink" />
                      <div className="text-xl font-bold text-white">128</div>
                      <div className="text-[10px] text-zinc-500">Total Bookings</div>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-xl border border-white/5 space-y-2">
                      <Users className="w-5 h-5 text-brand-purple" />
                      <div className="text-xl font-bold text-white">45</div>
                      <div className="text-[10px] text-zinc-500">New Clients</div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  <div className="bg-zinc-900 h-40 rounded-xl border border-white/5 p-4 flex items-end gap-2">
                    {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                      <div key={i} className="w-full bg-gradient-to-t from-brand-purple/20 to-brand-purple/60 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  
                  {/* Bottom List */}
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-zinc-900 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-zinc-800" />
                           <div>
                             <div className="w-24 h-3 bg-zinc-700 rounded mb-1" />
                             <div className="w-16 h-2 bg-zinc-800 rounded" />
                           </div>
                        </div>
                        <div className="w-12 h-4 bg-emerald-500/20 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
