"use client";

import React from "react";
import { Star, MessageSquare, Sparkles, AlertCircle, Heart, Share2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReviewsPage() {
  const reviews = [
    { client: "Amara Perera", rating: 5, date: "2 hours ago", comment: "Absolutely loved the Hydrafacial Glow treatment! The therapist was super professional and the luxury ambience made it a therapeutic escape. Definitely visiting again soon!", stylist: "Dilshan" },
    { client: "Nisansala De Silva", rating: 5, date: "Yesterday, 3:20 PM", comment: "The gel nail art extensions were perfectly done. Amazing attention to detail, highly professional tools, and beautiful color selections. Highly recommended!", stylist: "Ruvini" },
    { client: "Kasun Silva", rating: 4, date: "May 12, 2026", comment: "Got a classic hair fade. Very neat job, excellent scalp massage at the wash bowl. Booking slots online made check-in extremely smooth and quick.", stylist: "Kasun" }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Star className="w-6 h-6 text-[#D81E5B]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Reviews</h1>
            <p className="text-xs text-zinc-500">Monitor local salon ratings, feedback comments, and stylist performance reviews.</p>
          </div>
        </div>
      </div>

      {/* Ratings Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Rating Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-4xl font-black text-[#1A1C29]">4.9</h2>
              <span className="text-zinc-400 text-sm font-semibold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 text-amber-500 mt-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Star key={idx} className="w-4 h-4 fill-amber-500 text-amber-500" />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed font-sans">
            Direct customer reviews aggregated from online bookings and directory storefront page.
          </p>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Rating breakdown</span>
          
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const percentages = [92, 6, 2, 0, 0];
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-3 text-right font-bold text-zinc-600">{stars}★</span>
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${percentages[5 - stars]}%` }}
                    ></div>
                  </div>
                  <span className="w-8 text-right font-medium text-zinc-400">{percentages[5 - stars]}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Share Highlight Review */}
        <div className="bg-zinc-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <Heart className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12" />
          <div className="relative z-10">
            <span className="inline-flex bg-white/10 text-white px-3 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider mb-2">
               Directory Feature
            </span>
            <h3 className="text-sm font-bold">Showcase Highlights</h3>
            <p className="text-white/60 text-[10px] mt-1.5 leading-relaxed">
              Boost bookings! Pin your finest 5-star customer reviews directly to the top of your public storefront listing to build instant credibility.
            </p>
          </div>
          <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold h-10 rounded-xl text-xs flex items-center justify-center gap-1.5 mt-6 relative z-10">
            <Share2 className="w-3.5 h-3.5 text-[#D81E5B]" /> Pin Top Review
          </Button>
        </div>
      </div>

      {/* Customer Reviews Feed */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#D81E5B]" />
          Recent Verified Customer Reviews
        </h3>

        <div className="space-y-4">
          {reviews.map((rev, idx) => (
            <div key={idx} className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-zinc-800">{rev.client}</span>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, rIdx) => (
                        <Star key={rIdx} className={`w-3 h-3 ${rIdx < rev.rating ? "fill-amber-500" : "text-zinc-200"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Serviced by Stylist: <span className="font-bold text-zinc-600">{rev.stylist}</span></p>
                </div>
                <span className="text-[10px] text-zinc-400 font-semibold">{rev.date}</span>
              </div>

              <p className="text-xs text-zinc-600 leading-relaxed font-sans">{rev.comment}</p>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="h-8 rounded-lg border-zinc-200 text-[10px] font-bold text-zinc-600 hover:bg-zinc-50 flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> Mark as Helpful
                </Button>
                <Button className="h-8 rounded-lg bg-[#D81E5B] hover:bg-[#BF1A50] text-white text-[10px] font-bold flex items-center gap-1">
                  Reply to Feedback
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
