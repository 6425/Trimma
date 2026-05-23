"use client";

import { motion } from "motion/react";
import { Smartphone, Zap, Gift, Bell, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileAppShowcase() {
  const features = [
    { icon: <Zap className="w-5 h-5 text-amber-500" />, title: "Instant Booking", desc: "Book appointments with 3 taps." },
    { icon: <Star className="w-5 h-5 text-amber-500" />, title: "Favorites List", desc: "Keep your preferred stylists handy." },
    { icon: <Bell className="w-5 h-5 text-amber-500" />, title: "Smart Alerts", desc: "Never miss a scheduled session." },
    { icon: <Gift className="w-5 h-5 text-amber-500" />, title: "Loyalty Points", desc: "Earn rewards automatically." },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-brand-dark dark:to-brand-surface-dark relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left: Mobile Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full max-w-md mx-auto lg:mx-0 relative"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-brand-pink/20 blur-[100px] rounded-full" />
            
            {/* Phone Frame */}
            <div className="relative mx-auto w-[300px] h-[600px] bg-zinc-950 rounded-[3rem] p-3 shadow-2xl border-[4px] border-zinc-800 flex flex-col overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-950 rounded-b-xl z-20" /> {/* Notch */}
              
              <div className="flex-1 bg-slate-50 rounded-[2.5rem] overflow-hidden relative">
                {/* App Header */}
                <div className="bg-white p-6 pt-10 pb-4 shadow-sm relative z-10">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-lg">Trimma</div>
                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-zinc-600" />
                    </div>
                  </div>
                  <div className="h-10 bg-slate-100 rounded-full w-full" />
                </div>
                
                {/* App Body */}
                <div className="p-4 space-y-4 h-full bg-slate-50 relative z-0">
                  <div className="w-3/4 h-6 bg-zinc-200 rounded mb-2" />
                  
                  {/* Mock Cards */}
                  {[
                    { name: "The Crown Salon", rating: 4.9, img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200&auto=format&fit=crop", type: "Hair & Spa" },
                    { name: "Luxe Beauty Bar", rating: 4.8, img: "https://images.unsplash.com/photo-1522337360788-8b13fee7a3af?q=80&w=200&auto=format&fit=crop", type: "Nails & Face" },
                    { name: "Gentlemen's Cut", rating: 4.9, img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=200&auto=format&fit=crop", type: "Barbershop" },
                  ].map((salon, i) => (
                    <div key={i} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3 items-center">
                      <img src={salon.img} alt={salon.name} className="w-16 h-16 bg-slate-100 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 py-1">
                        <h5 className="font-bold text-zinc-900 text-sm">{salon.name}</h5>
                        <p className="text-xs text-zinc-500 font-medium mb-1">{salon.type}</p>
                        <div className="flex items-center text-[10px] font-bold text-amber-500 bg-amber-50 w-fit px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3 fill-amber-500 mr-1" /> {salon.rating}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Floating badges */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 -left-12 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-xs font-bold">Booking Confirmed</div>
                <div className="text-[10px] text-zinc-400">Tomorrow at 10:00 AM</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Content */}
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-6">
                Your Salon Marketplace in <span className="text-brand-pink">Your Pocket</span>
              </h2>
              <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8">
                Download the Trimma app to discover nearby salons, manage your bookings, and access exclusive loyalty rewards anytime, anywhere.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                {features.map((feature, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">{feature.title}</h4>
                      <p className="text-sm text-zinc-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="h-14 px-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl">
                  Download for iOS
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl border-slate-200 dark:border-white/10 font-bold hover:bg-slate-50 dark:hover:bg-brand-dark/50">
                  Download for Android
                </Button>
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Ensure CheckCircle2 is imported
import { CheckCircle2 } from "lucide-react";
