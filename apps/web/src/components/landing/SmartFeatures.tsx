"use client";

import { motion } from "motion/react";
import { Search, CalendarClock, Star, Heart, Award, Smartphone, TrendingUp, Users, CalendarSync, BarChart3, Target, MapPin, Building2, Workflow } from "lucide-react";

export function SmartFeatures() {
  const customerFeatures = [
    { icon: <MapPin className="w-5 h-5" />, title: "Discover nearby salons", desc: "Find the best spots in your area." },
    { icon: <Search className="w-5 h-5" />, title: "Smart search and filters", desc: "Filter by price, rating, or service." },
    { icon: <CalendarClock className="w-5 h-5" />, title: "Real-time appointment booking", desc: "No calling. Just tap and book." },
    { icon: <Star className="w-5 h-5" />, title: "Verified ratings and reviews", desc: "Read authentic customer feedback." },
    { icon: <Heart className="w-5 h-5" />, title: "Favorite salons", desc: "Save your go-to places." },
    { icon: <Award className="w-5 h-5" />, title: "Loyalty rewards and offers", desc: "Earn points with every visit." },
    { icon: <CalendarSync className="w-5 h-5" />, title: "Instant booking confirmations", desc: "Get digital tickets immediately." },
    { icon: <Smartphone className="w-5 h-5" />, title: "Mobile notifications", desc: "Never miss an appointment again." },
  ];

  const ownerFeatures = [
    { icon: <TrendingUp className="w-5 h-5" />, title: "Smart business dashboard", desc: "Monitor your salon's pulse." },
    { icon: <CalendarClock className="w-5 h-5" />, title: "Appointment automation", desc: "Reduce no-shows instantly." },
    { icon: <Users className="w-5 h-5" />, title: "Staff scheduling", desc: "Manage rosters with ease." },
    { icon: <BarChart3 className="w-5 h-5" />, title: "Revenue analytics", desc: "Track daily and monthly growth." },
    { icon: <Heart className="w-5 h-5" />, title: "CRM & customer retention", desc: "Keep clients coming back." },
    { icon: <Target className="w-5 h-5" />, title: "Marketing campaigns", desc: "Send promos directly to clients." },
    { icon: <Building2 className="w-5 h-5" />, title: "Multi-branch management", desc: "Scale across locations." },
    { icon: <Workflow className="w-5 h-5" />, title: "Performance tracking", desc: "Measure staff efficiency." },
  ];

  return (
    <section className="py-24 bg-white dark:bg-brand-surface-dark relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-pink/10 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl opacity-50" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Everything You Need in One <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-purple">Smart Platform</span>
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            Built for customers who want seamless bookings and salon owners who want powerful business growth tools.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Customer Side */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-50 dark:bg-brand-dark/50 p-8 rounded-3xl border border-slate-200 dark:border-white/5 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-pink/20 to-brand-pink/5 text-brand-pink flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              For Customers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {customerFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-brand-surface-dark border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group/card relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-pink/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 group-hover/card:text-brand-pink transition-colors mt-0.5 relative z-10">
                    {feat.icon}
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{feat.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Owner Side */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-50 dark:bg-brand-dark/50 p-8 rounded-3xl border border-slate-200 dark:border-white/5 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-purple/5 text-brand-purple flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              For Salon Owners
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ownerFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-white dark:bg-brand-surface-dark border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group/card relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  <div className="text-zinc-400 group-hover/card:text-brand-purple transition-colors mt-0.5 relative z-10">
                    {feat.icon}
                  </div>
                  <div className="relative z-10">
                    <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{feat.title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
