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
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [dbSalons, setDbSalons] = useState<any[]>([]);
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
      }
    }

    async function fetchSalons() {
      try {
        const { data, error } = await supabase
          .from("salons")
          .select("*")
          .limit(12)
          .order("created_at", { ascending: false });
        if (error) throw error;
        
        if (data && data.length > 0) {
          const mapped = data.map((s: any) => ({
            name: s.name,
            location: s.city || s.district || "Colombo",
            rating: s.rating || 4.9,
            reviews: 24,
            category: "Baber Salon", // default category filter mapping to match spelling
            image: s.cover_url || s.hero_url || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&auto=format&fit=crop",
            slug: s.slug
          }));
          setDbSalons(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch landing page salons:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
    fetchSalons();
  }, []);

  const featuredSalons = selectedCategory === "All" 
    ? dbSalons 
    : dbSalons.filter(salon => salon.category === selectedCategory);

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
             <button
                onClick={() => setSelectedCategory("All")}
                className={`snap-start shrink-0 flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border-2 transition-all w-[88px] cursor-pointer ${
                  selectedCategory === "All" ? "border-transparent bg-primary-gradient text-white shadow-md shadow-brand-pink/15" : "border-slate-100 dark:border-white/5 hover:border-brand-pink/30 text-zinc-600 dark:text-zinc-400 bg-slate-50 dark:bg-brand-dark/50"
                }`}
              >
                <div className="mb-1">
                  <Star className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-center">All</span>
              </button>
            {categories.map((category, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(category.name)}
                className={`snap-start shrink-0 flex flex-col items-center justify-center py-2 px-2.5 rounded-xl border-2 transition-all w-[88px] cursor-pointer ${
                  selectedCategory === category.name ? "border-transparent bg-primary-gradient text-white shadow-md shadow-brand-pink/15" : "border-slate-100 dark:border-white/5 hover:border-brand-pink/30 text-zinc-600 dark:text-zinc-400 bg-slate-50 dark:bg-brand-dark/50"
                }`}
              >
                <div className="mb-1">{renderIcon(category.icon)}</div>
                <span className="text-xs font-bold text-center leading-tight">{category.name}</span>
              </button>
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
                {selectedCategory === "All" ? "Featured Partners" : selectedCategory}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400">
                {selectedCategory === "All" ? "Highly rated salons ready for your booking." : `Explore top-rated ${selectedCategory.toLowerCase()}.`}
              </p>
            </div>
            <Link 
              href={selectedCategory === "All" ? "/salons" : `/category/${selectedCategory.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} 
              className="hidden md:flex items-center text-sm font-semibold text-brand-pink hover:text-brand-purple transition-colors"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink"></div>
            </div>
          ) : featuredSalons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {featuredSalons.map((salon, i) => (
                 <Link href={`/salons/${salon.slug}`} key={i} className="group flex flex-col bg-white dark:bg-brand-surface-dark rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                   <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100">
                     <img src={salon.image} alt={salon.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                   </div>
                   <div className="p-6 flex justify-between items-start">
                     <div>
                       <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-brand-pink transition-colors">{salon.name}</h3>
                       <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center mt-1 font-medium">
                         <MapPin className="w-3.5 h-3.5 mr-1 text-brand-pink" /> {salon.location}
                       </p>
                     </div>
                     <div className="flex items-center text-sm font-bold bg-slate-50 dark:bg-brand-dark px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                       <Star className="w-3.5 h-3.5 fill-current text-amber-500 mr-1" />
                       <span className="text-zinc-800 dark:text-zinc-200">{salon.rating}</span>
                     </div>
                   </div>
                 </Link>
               ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white dark:bg-brand-surface-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-brand-dark mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">No salons found</h3>
              <p className="text-slate-500 dark:text-zinc-400 max-w-md mx-auto">
                We couldn't find any {selectedCategory.toLowerCase()} in your selected area yet. 
                We're constantly expanding our partner network!
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-slate-200 rounded-xl"
                onClick={() => setSelectedCategory("All")}
              >
                View all salons
              </Button>
            </div>
          )}
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
