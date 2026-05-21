"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Icons from "lucide-react";
import { 
  Search, MapPin, Star, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import { 
  SmartFeatures, 
  BookingJourney, 
  SalonGrowth, 
  Testimonials, 
  SuccessStories, 
  MobileAppShowcase, 
  TrustSecurity, 
  FAQAccordion, 
  PremiumCTA 
} from "../components/landing";

export default function LandingPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSearch = () => {
    router.push(`/salons?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
    return <IconComponent className="w-6 h-6" />;
  };

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");
        if (error) throw error;
        if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const featuredSalons = [
    {
      name: "TrimHub",
      location: "No: 241/1/D, Mahawela Road",
      rating: 4.8,
      reviews: 37,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
      slug: "trimhub"
    },
    {
      name: "Trimma Elite Studio",
      location: "Colombo 07",
      rating: 4.9,
      reviews: 39,
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop",
      slug: "trimma-test-salon-1779260657670"
    },
    {
      name: "Trimma Grooming Lounge",
      location: "Colombo 03",
      rating: 4.8,
      reviews: 46,
      image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&auto=format&fit=crop",
      slug: "trimma-test-salon-1779254419984"
    },
    {
      name: "Trimma Style & Co.",
      location: "Kandy",
      rating: 4.9,
      reviews: 32,
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop",
      slug: "trimma-test-salon-1779254361240"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-dark-gradient text-white pt-28 pb-36 border-b border-white/5">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2940&auto=format&fit=crop" 
            alt="Salon Background" 
            className="w-full h-full object-cover opacity-20 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
             Discover Sri Lanka's <br/>
             <span className="text-gradient bg-primary-gradient">Finest Salons.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto font-medium">
            Book appointments instantly with top-rated professionals in Colombo, Kandy, and Galle.
          </p>
          
          <div className="bg-white dark:bg-brand-surface-dark p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-slate-100 dark:border-white/5">
             <div className="flex-1 flex items-center px-4 bg-zinc-50 dark:bg-brand-dark/50 rounded-xl">
               <Search className="w-5 h-5 text-brand-pink mr-3 animate-pulse" />
               <input 
                 type="text" 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 placeholder="Haircut, color, spa..." 
                 className="w-full h-12 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
               />
             </div>
             <div className="flex-1 flex items-center px-4 bg-zinc-50 dark:bg-brand-dark/50 rounded-xl">
               <MapPin className="w-5 h-5 text-brand-pink mr-3" />
               <select 
                 value={location}
                 onChange={(e) => setLocation(e.target.value)}
                 className="w-full h-12 bg-transparent text-zinc-900 dark:text-zinc-100 dark:bg-brand-surface-dark outline-none appearance-none font-medium cursor-pointer"
               >
                 <option value="" className="dark:text-zinc-100">Any Location</option>
                 <option value="colombo" className="dark:text-zinc-100">Colombo</option>
                 <option value="kandy" className="dark:text-zinc-100">Kandy</option>
                 <option value="galle" className="dark:text-zinc-100">Galle</option>
               </select>
             </div>
             <Button onClick={handleSearch} size="lg" className="h-12 px-8 rounded-xl bg-primary-gradient hover:opacity-95 text-white font-bold border-none shadow-md shadow-brand-pink/20">
               Search
             </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white dark:bg-brand-surface-dark border-b dark:border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
             <Link
                href="/salons"
                className="snap-start shrink-0 flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border-2 transition-all w-[88px] cursor-pointer border-transparent bg-primary-gradient text-white shadow-md shadow-brand-pink/15"
              >
                <div className="mb-1">
                  <Star className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-center">All</span>
             </Link>
            {categories.map((category, i) => (
              <Link
                key={i}
                href={`/salons?category=${category.slug}`}
                className="snap-start shrink-0 flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border-2 transition-all w-[88px] cursor-pointer border-slate-100 dark:border-white/5 hover:border-brand-pink/30 text-zinc-600 dark:text-zinc-400 bg-slate-50 dark:bg-brand-dark/50"
              >
                <div className="mb-1">{renderIcon(category.icon)}</div>
                <span className="text-xs font-bold text-center leading-tight">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 bg-slate-50 dark:bg-brand-dark">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                Featured Partners
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                Highly rated salons ready for your booking.
              </p>
            </div>
            <Link 
              href="/salons" 
              className="hidden md:flex items-center text-sm font-semibold text-brand-pink hover:text-brand-purple transition-colors"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {featuredSalons.map((salon, i) => (
               <Link href={`/salons/${salon.slug}`} key={i} className="group flex flex-col bg-white dark:bg-brand-surface-dark rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                 <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                   <img src={salon.image} alt={salon.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 </div>
                 <div className="p-6 flex flex-col justify-between flex-1">
                   <div>
                     <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-pink transition-colors line-clamp-1">{salon.name}</h3>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center mt-1 font-medium line-clamp-1">
                       <MapPin className="w-3.5 h-3.5 mr-1 text-brand-pink shrink-0" /> {salon.location}
                     </p>
                   </div>
                   <div className="flex items-center justify-between mt-4">
                     <div className="flex items-center text-sm font-bold bg-slate-50 dark:bg-brand-dark px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                       <Star className="w-3.5 h-3.5 fill-current text-amber-500 mr-1" />
                       <span className="text-zinc-800 dark:text-zinc-200">{salon.rating}</span>
                     </div>
                     <span className="text-xs text-zinc-400 font-semibold">{salon.reviews} reviews</span>
                   </div>
                 </div>
               </Link>
             ))}
          </div>
        </div>
      </section>

      {/* NEW PREMIUM BODY SECTIONS */}
      <SmartFeatures />
      <BookingJourney />
      <SalonGrowth />
      <Testimonials />
      <SuccessStories />
      <MobileAppShowcase />
      <TrustSecurity />
      <FAQAccordion />
      <PremiumCTA />
    </div>
  );
}
