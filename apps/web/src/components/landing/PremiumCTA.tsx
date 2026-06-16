"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Scissors } from "lucide-react";

export function PremiumCTA() {
  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden flex items-center justify-center">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1593702275687-f8b402bf1ef5?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center mix-blend-overlay" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-brand-pink/30 to-brand-purple/30 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

      {/* Floating Particles (CSS Animation simulated) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite]"
            style={{
              top: `${(i * 17) % 100}%`,
              left: `${(i * 31) % 100}%`,
              animationDelay: `${(i * 0.7) % 4}s`,
              animationDuration: `${((i * 1.3) % 3) + 2}s`,
              opacity: ((i * 11) % 50) / 100 + 0.1
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl">
            <Scissors className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Join Sri Lanka’s Modern <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pink to-brand-purple">Salon Booking Revolution</span>
          </h2>
          
          <p className="text-xl text-zinc-300 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Whether you’re booking your next appointment or growing your salon business, Trimma gives you everything in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 px-8 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 hover:scale-105 transition-all shadow-xl font-bold text-base">
                Book Appointment
              </Button>
            </Link>
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full h-14 px-8 rounded-xl border-[#ffc800]/50 bg-[#ffc800]/10 text-[#ffc800] hover:bg-[#ffc800]/20 hover:border-[#ffc800] hover:text-[#ffd633] hover:scale-105 transition-all font-bold text-base gap-2 backdrop-blur-sm">
                Register Your Salon <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
