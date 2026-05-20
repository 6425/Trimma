"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { 
  Search, MapPin, Star, Filter, ArrowRight,
  ShieldCheck, Map as MapIcon, Grid,
  SlidersHorizontal, ChevronDown, CheckCircle2,
  Clock, Scissors, Loader2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/config/supabase";

function SearchPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string | undefined;
  
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("q") || "");
  const [selectedLocation, setSelectedLocation] = useState(searchParams?.get("l") || "");
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchLiveSalons();
  }, []);

  const fetchLiveSalons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("salons")
        .select(`
          *,
          services (
            id,
            name,
            price,
            category
          )
        `)
        .or("status.eq.verified,status.eq.active,is_verified.eq.true")
        .limit(10);

      if (error) throw error;

      // Transform DB records into UI formats
      const formatted = (data || []).map((s: any) => {
        const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
        const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
        const popularService = s.services?.[0]?.name || "Premium Cut & Style";
        const tags = Array.from(new Set(s.services?.map((ser: any) => ser.category) || ["Salon", "Grooming"]));

        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          rating: s.rating || 4.9, 
          reviews: s.reviews_count || 142,
          location: `${s.city || 'Colombo'}, ${s.district || 'Western Province'}`,
          category: s.category || (tags[0] as string) || "Beauty Lounge",
          logo: s.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug}&backgroundColor=18181b`,
          image: s.cover_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80",
          featured: s.is_featured === true,
          openNow: true,
          startingPrice,
          tags: tags.slice(0, 3),
          nextSlot: "Today 4:00 PM",
          popularService,
        };
      });

      setSalons(formatted);
    } catch (err) {
      console.error("Failed to load search page salons:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);
  };

  const categoryName = slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Salons & Spas";

  // Filter salons based on user's live search query and location
  const filteredSalons = salons.filter(salon => {
    const matchesSearch = searchQuery === "" || 
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      salon.popularService.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation = selectedLocation === "" || 
      salon.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. PREMIUM FULL-WIDTH CENTERING HERO SECTION */}
      <section className="relative overflow-hidden bg-dark-gradient border-b border-white/5 py-20 md:py-28">
        {/* Grayscale Subtle Background Image overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop" 
            alt="Category Background" 
            className="w-full h-full object-cover opacity-15 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <Badge className="bg-[#D81E5B]/15 text-[#D81E5B] border border-[#D81E5B]/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#D81E5B] mr-1.5 animate-pulse inline" /> Discover Premium Grooming
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Best {categoryName} <br />
            in <span className="text-gradient bg-primary-gradient">Sri Lanka</span>
          </h1>
          
          <p className="text-base md:text-lg text-zinc-300 mb-10 max-w-xl mx-auto font-medium">
            Discover top-rated barbers, beauty salons, and luxury spa centers. Compare services, styles, and book online instantly.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-400 mb-10">
             <span className="font-extrabold text-white bg-[#D81E5B]/20 text-[#D81E5B] px-3 py-1 rounded-full">{filteredSalons.length} Salons Found</span>
             <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
             <span className="uppercase tracking-wider">Locations: Colombo, Negombo, Kandy</span>
          </div>

          {/* Centered Premium Unified Search & Location Container */}
          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-slate-100">
             <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl relative group">
               <Search className="w-5 h-5 text-brand-pink mr-3 animate-pulse" />
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Haircut, color, spa..." 
                 className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-semibold"
               />
             </div>
             
             <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl relative group">
               <MapPin className="w-5 h-5 text-brand-pink mr-3" />
               <select 
                 value={selectedLocation}
                 onChange={(e) => setSelectedLocation(e.target.value)}
                 className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold"
               >
                 <option value="" className="text-zinc-900">Any Location</option>
                 <option value="colombo" className="text-zinc-900">Colombo</option>
                 <option value="negombo" className="text-zinc-900">Negombo</option>
                 <option value="kandy" className="text-zinc-900">Kandy</option>
                 <option value="galle" className="text-zinc-900">Galle</option>
               </select>
             </div>
             
             <Button onClick={fetchLiveSalons} size="lg" className="h-12 px-8 rounded-xl bg-primary-gradient hover:opacity-95 text-white font-bold border-none shadow-md shadow-brand-pink/20">
               Search
             </Button>
          </div>
        </div>
      </section>

      {/* 2 & 3. QUICK FILTER & SORT BAR (Sticky) */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            
            <div className="hidden lg:flex items-center gap-2">
               <Button variant="outline" className="h-9 rounded-full border-slate-200 text-zinc-600 font-medium">
                 <SlidersHorizontal className="w-4 h-4 mr-2" /> All Filters
               </Button>
               <div className="h-6 w-px bg-slate-200 mx-2" />
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Any Price</Button>
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Open Now</Button>
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Highest Rated</Button>
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">AC Available</Button>
            </div>

            <Button variant="outline" className="lg:hidden h-9 rounded-full border-slate-200 text-zinc-600 font-medium">
               <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </Button>

            <div className="flex items-center gap-3">
               <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                 <button 
                   onClick={() => setViewMode('grid')}
                   className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
                 >
                   <Grid className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={() => setViewMode('map')}
                   className={`p-1.5 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
                 >
                   <MapIcon className="w-4 h-4" />
                 </button>
               </div>
            </div>

          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Loader2 className="w-10 h-10 text-zinc-900 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold text-sm">Querying active luxury salons...</p>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Scissors className="w-12 h-12 text-zinc-300 mb-4" />
            <p className="text-zinc-800 font-black text-lg">No active salons found</p>
            <p className="text-zinc-400 text-xs mt-1">Try clearing your filters or refreshing to sync with your database seeder.</p>
          </div>
        ) : (
          <>
            {/* 4. FEATURED SALONS */}
            {filteredSalons.some(s => s.featured) && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Featured Premium Partners
                  </h2>
                </div>
                <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar snap-x">
                   {filteredSalons.filter(s => s.featured).map(salon => (
                      <Link href={`/salons/${salon.slug}`} key={salon.id} className="snap-start shrink-0 w-[300px] md:w-[380px] group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col block">
                        <div className="h-48 relative overflow-hidden">
                          <img src={salon.image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute top-3 left-3 flex gap-2">
                            <Badge className="bg-amber-500 hover:bg-amber-600 font-semibold border-none shadow-sm text-white">
                              <Star className="w-3 h-3 mr-1 fill-white" /> Elite
                            </Badge>
                            <Badge variant="secondary" className="bg-white/90 text-zinc-900 backdrop-blur-md border-none font-medium shadow-sm">
                              Featured
                            </Badge>
                          </div>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-start gap-4 mb-3">
                            <Avatar className="w-12 h-12 border-2 border-white shadow-sm rounded-xl">
                              <AvatarImage src={salon.logo} className="object-cover" />
                              <AvatarFallback>{salon.name[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-zinc-900 text-lg group-hover:underline decoration-zinc-300 underline-offset-2 w-full truncate">{salon.name}</h3>
                              <div className="flex items-center text-sm font-medium text-emerald-600 mt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Open & Verified
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                   ))}
                </div>
              </section>
            )}

            {/* 5. SALON GRID */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">All Registered Salons ({filteredSalons.length})</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredSalons.map(salon => (
                   <div key={salon.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative">
                     
                     {/* Top: Image & Badges */}
                     <Link href={`/salons/${salon.slug}`} className="relative h-56 overflow-hidden block">
                       <img src={salon.image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                       <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent" />
                       
                       <div className="absolute top-3 left-3 flex gap-2">
                         {salon.featured && (
                           <Badge className="bg-zinc-900 text-white border-zinc-700 font-semibold shadow-sm">
                             Trimma Premium
                           </Badge>
                         )}
                       </div>
                       
                       {/* Avatar floating */}
                       <div className="absolute -bottom-6 right-4 z-10">
                         <Avatar className="w-16 h-16 border-4 border-white shadow-md rounded-2xl bg-white">
                            <AvatarImage src={salon.logo} className="object-cover" />
                            <AvatarFallback>{salon.name[0]}</AvatarFallback>
                         </Avatar>
                       </div>
                     </Link>

                     {/* Middle: Info */}
                     <div className="p-6 pb-4 flex-1 flex flex-col mt-2">
                       <div className="mb-1">
                         <div className="flex items-center text-sm font-semibold text-zinc-900 mb-2">
                           <Star className="w-4 h-4 mr-1 text-amber-500 fill-amber-500" />
                           {salon.rating} <span className="text-zinc-400 font-normal ml-1">({salon.reviews})</span>
                         </div>
                         <Link href={`/salons/${salon.slug}`}>
                           <h3 className="font-bold text-xl text-zinc-900 leading-tight mb-1 group-hover:underline">{salon.name}</h3>
                         </Link>
                         <div className="flex items-center text-xs text-zinc-500 mb-3 font-semibold uppercase tracking-wider">
                           <MapPin className="w-3.5 h-3.5 mr-1 text-zinc-400" /> {salon.location}
                         </div>
                       </div>

                       <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                         {salon.tags.map((tag: string) => (
                           <Badge key={tag} variant="secondary" className="bg-slate-100 text-zinc-600 hover:bg-slate-200 rounded-md font-medium px-2 shadow-none border border-slate-200/50">
                             {tag}
                           </Badge>
                         ))}
                       </div>

                       {/* Service Preview */}
                       <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-0">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Starts From</span>
                           <span className="font-black text-sm text-zinc-900">{formatPrice(salon.startingPrice)}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-zinc-600 truncate mr-2"><span className="text-zinc-400 mr-1">Popular:</span>{salon.popularService}</span>
                           <span className="text-[9px] font-bold text-emerald-600 whitespace-nowrap bg-emerald-50 px-2 py-0.5 rounded flex items-center uppercase tracking-wider">
                             <Clock className="w-3 h-3 mr-1" /> {salon.nextSlot}
                           </span>
                         </div>
                       </div>
                     </div>

                     {/* Bottom: CTA */}
                     <div className="p-4 pt-0 border-t border-slate-50 mt-4 flex gap-3">
                       <Link 
                         href={`/salons/${salon.slug}`}
                         className="flex-1 inline-flex items-center justify-center rounded-xl h-12 font-semibold text-zinc-700 bg-white hover:bg-slate-50 hover:text-zinc-900 border border-slate-200 transition-colors text-xs"
                       >
                         View Salon
                       </Link>
                       <Link
                         href={`/salons/${salon.slug}`}
                         className="flex-1 inline-flex items-center justify-center rounded-xl h-12 font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-md text-xs text-center"
                       >
                         Book Now
                       </Link>
                     </div>
                   </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* 7. TRENDING SERVICES SECTION */}
        <section className="my-24 py-16 px-8 bg-zinc-900 text-white rounded-3xl relative overflow-hidden">
           <div className="absolute inset-0 z-0 opacity-10">
              <img src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover" alt="bg"/>
           </div>
           <div className="relative z-10">
             <h2 className="text-3xl font-bold tracking-tight mb-8">Popular Salon Services</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {["Premium Fade", "Beard Sculpting", "Hot Towel Shave", "Hair Coloring", "Bridal Makeup", "Keratin Treatment", "Hydrafacial", "Gel Manicure"].map(s => (
                 <Link href={`/search?q=${s}`} key={s} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between transition-colors group">
                   <span className="font-medium text-sm sm:text-base">{s}</span>
                   <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                 </Link>
               ))}
             </div>
           </div>
        </section>

      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <Loader2 className="w-10 h-10 text-zinc-900 animate-spin" />
        <p className="text-zinc-500 font-bold text-sm">Loading Search...</p>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
