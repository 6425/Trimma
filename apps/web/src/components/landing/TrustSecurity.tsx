"use client";

import { motion } from "motion/react";
import { ShieldCheck, Lock, CreditCard, CheckCircle } from "lucide-react";

export function TrustSecurity() {
  const features = [
    { icon: <ShieldCheck className="w-8 h-8" />, title: "Verified Salons", desc: "Every partner on our platform undergoes a strict vetting process." },
    { icon: <CheckCircle className="w-8 h-8" />, title: "Real Customer Reviews", desc: "Only customers who have actually booked and visited can leave reviews." },
    { icon: <CreditCard className="w-8 h-8" />, title: "Secure Payments", desc: "Your payment data is encrypted and processed by trusted gateways." },
    { icon: <Lock className="w-8 h-8" />, title: "Privacy Protection", desc: "Your personal data and booking history are kept strictly confidential." },
  ];

  return (
    <section className="py-24 bg-zinc-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2000&auto=format&fit=crop')] opacity-[0.03] mix-blend-screen bg-cover bg-center" />
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
            Built on Trust, Security & Reliability
          </h2>
          <p className="text-lg text-zinc-400 font-medium">
            We prioritize your safety and peace of mind at every step of the booking journey.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-900/50 backdrop-blur-sm border border-white/10 p-8 rounded-3xl text-center group hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:text-brand-pink transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg mb-3">{feature.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
