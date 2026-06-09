"use client";

import { motion } from "motion/react";
import { Search, MapPin, UserCheck, CalendarDays, CheckCircle2 } from "lucide-react";

export function BookingJourney() {
  const steps = [
    { icon: <Search className="w-6 h-6" />, title: "Search Nearby Salons", desc: "Find the best spots near you" },
    { icon: <MapPin className="w-6 h-6" />, title: "Compare Ratings & Services", desc: "Read reviews and check prices" },
    { icon: <UserCheck className="w-6 h-6" />, title: "Select Preferred Stylist", desc: "Choose your favorite professional" },
    { icon: <CalendarDays className="w-6 h-6" />, title: "Choose Time Slot", desc: "Pick a time that fits your schedule" },
    { icon: <CheckCircle2 className="w-6 h-6" />, title: "Confirm Booking Instantly", desc: "Get your digital ticket right away" },
  ];

  return (
    <section className="py-32 bg-zinc-950 text-white relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-pink/20 rounded-full blur-[100px] opacity-40 mix-blend-screen" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-purple/20 rounded-full blur-[100px] opacity-40 mix-blend-screen" />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight mb-6"
          >
            Book Your Next Appointment <span className="text-brand-pink">in Minutes</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400 font-medium"
          >
            A seamless experience from search to style. 
          </motion.p>
        </div>

        {/* Horizontal Timeline Flow */}
        <div className="relative">
          {/* Connector Line */}
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 hidden lg:block" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative group flex flex-col items-center text-center"
              >
                {/* Node */}
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white mb-6 relative z-10 shadow-xl group-hover:scale-110 group-hover:border-brand-pink/50 group-hover:bg-brand-pink/10 transition-all duration-300">
                  {step.icon}
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-brand-pink/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand text-black text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Mockup Preview (Optional visual anchor) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-24 max-w-4xl mx-auto bg-gradient-to-t from-zinc-900 to-zinc-800 rounded-[2rem] border border-white/10 p-2 shadow-2xl overflow-hidden hidden md:block relative"
        >
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay" />
          <div className="bg-zinc-950 rounded-[1.75rem] border border-white/5 overflow-hidden aspect-[21/9] flex items-center justify-center relative">
             <div className="absolute flex gap-4 animate-[slide_30s_linear_infinite] px-4">
                {/* Simple animated booking cards representation */}
                {[1, 2, 3, 4, 5].map((card) => (
                  <div key={card} className="w-64 h-40 bg-zinc-900 border border-white/10 rounded-2xl p-4 flex flex-col justify-between shrink-0">
                    <div className="flex justify-between items-start">
                       <div className="w-10 h-10 bg-zinc-800 rounded-full" />
                       <div className="w-16 h-6 bg-brand-pink/20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-3/4 h-4 bg-zinc-800 rounded" />
                      <div className="w-1/2 h-3 bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
