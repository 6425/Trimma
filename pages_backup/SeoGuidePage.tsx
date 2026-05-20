import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, Star, Scissors, Map, Clock, 
  ChevronRight, CalendarDays, Heart,
  CheckCircle2, Trophy, ArrowRight, ShieldCheck,
  TrendingUp, Award, ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function SeoGuidePage() {
  const { slug } = useParams();
  
  // Parse slug like "best-barbers-in-colombo"
  // In a real app, this would query a database for the pre-generated SEO page data
  
  const parts = slug?.split('-in-') || ["best-salons", "sri-lanka"];
  const intentPart = parts[0]; // e.g., "best-barbers", "affordable-spas"
  const locationPart = parts[1] || "sri-lanka";
  
  const intentWords = intentPart.split('-');
  const modifier = intentWords[0]; // "best", "affordable", "luxury"
  const categoryRaw = intentWords.slice(1).join(' '); // "barbers", "spas"
  
  const category = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1);
  const location = locationPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const modifierCapitalized = modifier.charAt(0).toUpperCase() + modifier.slice(1);

  const currentYear = new Date().getFullYear();

  // Mock SEO Data
  const data = {
    title: `${modifierCapitalized} ${category} in ${location} (${currentYear} Guide)`,
    h1: `${modifierCapitalized} ${category} in ${location}`,
    intro: `We evaluated and ranked the ${modifier} ${category.toLowerCase()} in ${location} based on verified ratings, customer reviews, cleanliness, and value for money. Book your next appointment instantly through Trimma.`,
    publishDate: "Oct 15, 2025",
    author: "Trimma Editorial Team",
    salons: [
      {
        id: "salon-1",
        rank: 1,
        name: "The Gentlemen's Lounge",
        slug: "the-gentlemens-lounge-colombo-07",
        city: location,
        rating: 4.9,
        reviews: 420,
        categories: ["Barber", "Luxury Grooming"],
        priceFrom: 2500,
        nextAvailable: "Today 5:30 PM",
        description: "Taking the top spot is The Gentlemen's Lounge, offering unparalleled luxury grooming. Known for their precision fades and hot towel shaves, they maintain a consistent 4.9-star rating across hundreds of reviews.",
        pros: ["Exceptional skin fades", "Complimentary beverages", "Highly experienced staff"],
        image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2940&auto=format&fit=crop"
      },
      {
        id: "salon-2",
        rank: 2,
        name: "Aura Premium Beauty",
        slug: "aura-premium-beauty",
        city: location,
        rating: 4.8,
        reviews: 315,
        categories: ["Hair", "Beauty"],
        priceFrom: 3000,
        nextAvailable: "Tomorrow 9:00 AM",
        description: "A close second, Aura provides a modern environment with expert stylists specializing in advanced coloring and aesthetic treatments. Their attention to detail stands out in the local market.",
        pros: ["Premium products used", "Modern elegant interior", "Consultation-led service"],
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop"
      },
      {
        id: "salon-3",
        rank: 3,
        name: "Elite Cuts & Grooming",
        slug: "elite-cuts-grooming",
        city: location,
        rating: 4.7,
        reviews: 180,
        categories: ["Barber", "Styling"],
        priceFrom: 1500,
        nextAvailable: "Today 3:00 PM",
        description: "If you're looking for the best value without compromising on quality, Elite Cuts delivers. They are highly praised for their efficiency and modern styling techniques.",
        pros: ["Great value for money", "Fast service", "Easy access location"],
        image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2844&auto=format&fit=crop"
      }
    ],
    pricing: {
      budget: "LKR 1,000 - 2,000",
      average: "LKR 2,500 - 4,000",
      premium: "LKR 5,000+"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 border-t border-slate-200">
      
      {/* 1. ARTICLE HEADER */}
      <section className="bg-white pt-10 pb-12 overflow-hidden border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-wrap items-center gap-2 text-zinc-500 text-sm font-medium mb-8">
            <Link to="/" className="hover:text-zinc-900 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/guides" className="hover:text-zinc-900 transition-colors">Guides</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-zinc-900 truncate">{data.title}</span>
          </div>
          
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 mb-6 font-bold shadow-none border-none px-3 py-1">
            <Trophy className="w-4 h-4 mr-1.5" /> Official Ranking
          </Badge>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 mb-6 leading-tight">
            {data.h1} <span className="text-zinc-400 font-light">({currentYear} Guide)</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-600 mb-8 leading-relaxed">
            {data.intro}
          </p>

          <div className="flex items-center gap-6 py-6 border-y border-slate-100">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                 T
               </div>
               <div>
                 <div className="text-sm font-bold text-zinc-900">{data.author}</div>
                 <div className="text-xs text-zinc-500">Updated {data.publishDate}</div>
               </div>
             </div>
             
             <div className="h-8 w-px bg-slate-200"></div>
             
             <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <ShieldCheck className="w-4 h-4" /> Data Verified
             </div>
          </div>
          
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* MAIN CONTENT */}
          <div className="flex-1 max-w-4xl">
            
            <div className="mb-12 bg-indigo-50 border border-indigo-100 rounded-3xl p-6 md:p-8">
               <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                 <ThumbsUp className="w-5 h-5" /> Why trust this guide?
               </h2>
               <p className="text-indigo-800 leading-relaxed">
                 Trimma's data engine analyzes hundreds of bookings, verified customer reviews, and cancellation metrics to determine these real-world rankings. Salons cannot pay to be placed on this list.
               </p>
            </div>

            <div className="space-y-16">
              {data.salons.map((salon) => (
                <div key={salon.id} className="scroll-mt-24" id={`rank-${salon.rank}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-md">
                      #{salon.rank}
                    </div>
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
                      <Link to={`/salons/${salon.slug}`} className="hover:text-emerald-600 transition-colors">
                        {salon.name}
                      </Link>
                    </h2>
                  </div>

                  <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row mb-6 group">
                    <div className="md:w-2/5 relative h-64 md:h-auto border-r border-slate-100">
                      <Link to={`/salons/${salon.slug}`} className="absolute inset-0">
                        <img src={salon.image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </Link>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-zinc-900 shadow-sm flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" /> {salon.rating}
                      </div>
                    </div>
                    
                    <div className="p-6 md:p-8 md:w-3/5 flex flex-col">
                       <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium mb-4">
                         <MapPin className="w-4 h-4 text-zinc-400" /> {salon.city}
                         <span className="text-slate-300">•</span>
                         <span className="text-zinc-900">{salon.reviews} verified reviews</span>
                       </div>
                       
                       <p className="text-zinc-600 leading-relaxed mb-6">
                         {salon.description}
                       </p>

                       <div className="bg-slate-50 p-4 rounded-2xl mb-6 border border-slate-100">
                         <h4 className="text-sm font-bold text-zinc-900 mb-3 uppercase tracking-wider">Highlights</h4>
                         <ul className="space-y-2">
                           {salon.pros.map(pro => (
                             <li key={pro} className="flex items-start gap-2 text-sm text-zinc-700">
                               <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                               {pro}
                             </li>
                           ))}
                         </ul>
                       </div>

                       <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-1">Starting from</div>
                            <div className="text-xl font-bold text-zinc-900">LKR {salon.priceFrom}</div>
                          </div>
                           <Link 
                             to={`/salons/${salon.slug}?action=book`}
                             className="inline-flex items-center justify-center rounded-xl px-8 h-12 bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-sm transition-colors"
                           >
                             Book Now
                           </Link>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* PRICING COMPARISON */}
            <div className="mt-20 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-2xl font-bold text-zinc-900 mb-6">Pricing Guide: {category} in {location}</h3>
              <p className="text-zinc-600 mb-8">Based on Trimma platform data, here is what you should expect to pay for standard services in this area.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Budget</div>
                  <div className="text-2xl font-black text-zinc-900">{data.pricing.budget}</div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-bl-lg">Average</div>
                  <div className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-2">Standard</div>
                  <div className="text-2xl font-black text-emerald-900">{data.pricing.average}</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                  <div className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Premium</div>
                  <div className="text-2xl font-black text-zinc-900">{data.pricing.premium}</div>
                </div>
              </div>
            </div>

          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-80 space-y-8 shrink-0 relative">
            <div className="sticky top-24 space-y-8">
              
              {/* TABLE OF CONTENTS */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-zinc-900 text-lg mb-4">In this guide</h3>
                <ul className="space-y-3">
                  {data.salons.map(salon => (
                    <li key={`toc-${salon.id}`}>
                      <a href={`#rank-${salon.rank}`} className="text-zinc-600 font-medium hover:text-emerald-600 transition-colors flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-400 w-4">{salon.rank}.</span> {salon.name}
                      </a>
                    </li>
                  ))}
                  <li className="pt-3 border-t border-slate-100">
                    <Link to={`/${categoryRaw.toLowerCase()}/${locationPart}`} className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                      Explore all in {location} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </li>
                </ul>
              </div>

              {/* LOCATION INTERNAL LINKING */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                 <h3 className="font-bold text-zinc-900 text-lg mb-4">Explore by Location</h3>
                 <div className="flex flex-col gap-2">
                   <Link to={`/district/${locationPart}`} className="text-sm font-medium bg-white border border-slate-200 text-zinc-700 px-4 py-2.5 rounded-xl hover:border-zinc-400 flex justify-between items-center group">
                     {location} District <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                   </Link>
                   <Link to={`/province/western`} className="text-sm font-medium bg-white border border-slate-200 text-zinc-700 px-4 py-2.5 rounded-xl hover:border-zinc-400 flex justify-between items-center group">
                     Western Province <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                   </Link>
                   <Link to={`/city/colombo-07`} className="text-sm font-medium bg-white border border-slate-200 text-zinc-700 px-4 py-2.5 rounded-xl hover:border-zinc-400 flex justify-between items-center group">
                     Colombo 07 <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900" />
                   </Link>
                 </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
