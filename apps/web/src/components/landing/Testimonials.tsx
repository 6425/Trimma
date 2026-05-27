"use client";

import { motion } from "motion/react";
import { Star, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Testimonials() {
  const reviews = [
    { name: "Samantha D.", initial: "S", loc: "Colombo 07", service: "Hair Coloring", rating: 5, text: "The booking process was so smooth. I found exactly what I needed and booked it instantly!" },
    { name: "Kevin P.", initial: "K", loc: "Kandy", service: "Haircut & Beard", rating: 5, text: "I love being able to see exactly when my barber is free. Saves me so much time waiting in the salon." },
    { name: "Natasha W.", initial: "N", loc: "Galle", service: "Spa Treatment", rating: 5, text: "Very premium experience. I received my confirmation instantly and the reminders were super helpful." },
    { name: "Amal J.", initial: "A", loc: "Colombo 03", service: "Skin Care", rating: 4, text: "Great app! Found a new favorite salon through the top-rated section. Will definitely use again." },
    { name: "Dilani M.", initial: "D", loc: "Mount Lavinia", service: "Bridal Makeup", rating: 5, text: "Trimma made finding a makeup artist for my wedding events completely stress-free." },
  ];

  return (
    <section className="py-24 bg-slate-50 dark:bg-brand-dark relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-4">
            Why Customers Love <span className="text-brand-pink">Trimma</span>
          </h2>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium">
            Join thousands of happy customers who trust us for their grooming and beauty needs.
          </p>
        </motion.div>

        {/* CSS Marquee / Auto-scroll container */}
        <div className="flex overflow-hidden relative w-full hide-scrollbar">
          {/* Fading edges */}
          <div className="absolute top-0 left-0 bottom-0 w-24 bg-gradient-to-r from-slate-50 dark:from-brand-dark to-transparent z-10" />
          <div className="absolute top-0 right-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 dark:from-brand-dark to-transparent z-10" />

          <div className="flex gap-6 animate-[scroll_40s_linear_infinite] px-4 w-max">
            {[...reviews, ...reviews].map((review, i) => (
              <div 
                key={i} 
                className="w-80 shrink-0 bg-white dark:bg-brand-surface-dark p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-xl transition-shadow relative group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="border border-slate-100 dark:border-zinc-800">
                      <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${review.name}`} />
                      <AvatarFallback>{review.initial}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{review.name}</div>
                      <div className="flex items-center text-[10px] text-zinc-400 font-medium mt-0.5 uppercase tracking-wider">
                        <MapPin className="w-3 h-3 mr-0.5" /> {review.loc}
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(review.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                  &ldquo;{review.text}&rdquo;
                </p>
                <div className="mt-4 inline-flex text-xs font-semibold text-brand-pink bg-brand-pink/10 px-2.5 py-1 rounded-md">
                  Booked: {review.service}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
