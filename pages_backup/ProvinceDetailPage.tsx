import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, Star, Scissors, Filter, Map, Clock, 
  ChevronRight, CalendarDays, Search, Heart, Share2, Menu, Sparkles
} from "lucide-react";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const provinceData = {
  id: "western",
  name: "Western Province",
  description: "Discover 1200+ salons, spas, barber shops, and beauty centers across Western Province. The beauty capital of Sri Lanka.",
  salonCount: 1240,
  image: "https://images.unsplash.com/photo-1574227492706-f65b24c3688a?q=80&w=2940&auto=format&fit=crop",
  districts: [
    { name: "Colombo", count: 850, top: "Barber • Spa" },
    { name: "Gampaha", count: 240, top: "Hair • Bridal" },
    { name: "Kalutara", count: 150, top: "Beauty • Nails" }
  ],
  popularCities: ["Colombo 07", "Nugegoda", "Negombo", "Gampaha", "Mount Lavinia", "Panadura"],
  trendingServices: ["Skin Fade", "Bridal Makeup", "Hot Stone Massage", "Keratin Treatment"],
  salons: [
    {
      id: "salon-1",
      name: "The Gentlemen's Lounge",
      city: "Colombo 07",
      rating: 4.8,
      reviews: 320,
      categories: ["Barber", "Beard", "Facial"],
      priceFrom: 2000,
      nextAvailable: "Today 5:00 PM",
      image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2940&auto=format&fit=crop"
    },
    {
      id: "salon-2",
      name: "Glow & Go Studio",
      city: "Nugegoda",
      rating: 4.7,
      reviews: 185,
      categories: ["Hair", "Nails", "Makeup"],
      priceFrom: 3500,
      nextAvailable: "Tomorrow 10:00 AM",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "salon-3",
      name: "Serenity Spa Retreat",
      city: "Mount Lavinia",
      rating: 4.9,
      reviews: 412,
      categories: ["Spa", "Massage", "Wellness"],
      priceFrom: 5000,
      nextAvailable: "Today 7:00 PM",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop"
    },
    {
      id: "salon-4",
      name: "Urban Cuts",
      city: "Gampaha",
      rating: 4.5,
      reviews: 98,
      categories: ["Barber", "Hair Color"],
      priceFrom: 1500,
      nextAvailable: "Today 2:30 PM",
      image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2844&auto=format&fit=crop"
    }
  ]
};

export default function ProvinceDetailPage() {
  const { id } = useParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mapView, setMapView] = useState(false);

  // In a real app, you would fetch data based on `id`
  const data = provinceData; 

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0 relative">
      
      {/* 1. PROVINCE HERO SECTION */}
      <section className="relative bg-zinc-900 text-white pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <img src={data.image} alt={data.name} className="w-full h-full object-cover mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/provinces" className="hover:text-white transition-colors">Provinces</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{data.name}</span>
          </div>
          
          <div className="max-w-3xl">
             <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">{data.name}</h1>
             <p className="text-xl md:text-2xl text-zinc-300 font-medium mb-8">
               {data.description}
             </p>
             
             <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
               <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2">
                 <Store className="w-5 h-5 text-emerald-400" />
                 {data.salonCount} Active Salons
               </div>
               <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2">
                 <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                 4.6 Avg Rating
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK FILTER BAR (Sticky) */}
      <div className={`sticky top-16 z-30 bg-white border-b border-slate-200 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2">
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <MapPin className="w-4 h-4 mr-2 text-zinc-400" /> District
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Search className="w-4 h-4 mr-2 text-zinc-400" /> City
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Scissors className="w-4 h-4 mr-2 text-zinc-400" /> Category
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Clock className="w-4 h-4 mr-2 text-zinc-400" /> Open Now
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap font-medium px-4">
               <Filter className="w-4 h-4 mr-2" /> More Filters
             </Button>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full">
            <button 
              onClick={() => setMapView(false)} 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!mapView ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              List
            </button>
            <button 
              onClick={() => setMapView(true)} 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${mapView ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <Map className="w-4 h-4" /> Map
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* 3. DISTRICT BREAKDOWN SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Explore by District</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.districts.map((dist, i) => (
              <Link key={i} to={`/district/${dist.name.toLowerCase().replace(" ", "-")}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-200 group block">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-zinc-900 group-hover:text-emerald-700 transition-colors">{dist.name}</h3>
                  <Badge variant="secondary" className="bg-slate-100 text-zinc-600 font-bold border-none">{dist.count}</Badge>
                </div>
                <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider text-[11px] mb-1">Top Hubs</div>
                <div className="text-sm text-zinc-700 font-medium">{dist.top}</div>
              </Link>
            ))}
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* MAIN LISTING COLUMN */}
          <div className="flex-1">
            
            <div className="flex justify-between items-end mb-6">
               <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Top Rated Salons</h2>
               <div className="text-sm font-medium text-zinc-500">Showing {data.salons.length} results</div>
            </div>

            {/* 5. SALON LISTING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.salons.map((salon) => (
                <div key={salon.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  <div className="relative h-48 overflow-hidden">
                    <img src={salon.image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <button className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-colors border border-white/20">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl text-zinc-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">{salon.name}</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium text-zinc-500 mb-4">
                      <div className="flex items-center text-zinc-900">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" /> {salon.rating} <span className="text-zinc-500 ml-1 font-normal">({salon.reviews})</span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1 text-zinc-400" /> {salon.city}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      {salon.categories.map(cat => (
                        <Badge key={cat} variant="secondary" className="bg-slate-100 text-zinc-600 font-medium hover:bg-slate-200 border-none shadow-none">{cat}</Badge>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4 border border-emerald-100">
                        <CalendarDays className="w-4 h-4" /> Next available: {salon.nextAvailable}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                         <div className="font-medium text-zinc-500 text-sm">
                           From <span className="text-lg font-bold text-zinc-900">LKR {salon.priceFrom}</span>
                         </div>
                         <Button className="rounded-xl px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-sm">
                           Book Now
                         </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" className="rounded-xl font-bold border-slate-200 text-zinc-700 h-12 px-8 shadow-sm">
                Load More Salons
              </Button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-80 space-y-8 shrink-0">
            
            {/* 7. POPULAR CITIES */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-zinc-900 text-lg mb-4">Popular Cities</h3>
              <div className="flex flex-wrap gap-2">
                {data.popularCities.map(city => (
                  <Button key={city} variant="outline" size="sm" className="rounded-lg bg-white border-slate-200 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shadow-sm text-zinc-600 font-medium">
                    {city}
                  </Button>
                ))}
              </div>
            </div>

            {/* 8. TRENDING SERVICES */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-bold text-zinc-900 text-lg">Trending Services</h3>
              </div>
              <ul className="space-y-3">
                {data.trendingServices.map(service => (
                  <li key={service} className="flex justify-between items-center group cursor-pointer">
                    <span className="text-zinc-600 font-medium group-hover:text-emerald-600 transition-colors">{service}</span>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 transition-colors group-hover:translate-x-1" />
                  </li>
                ))}
              </ul>
            </div>

            {/* 9. SEO CONTENT BLOCK */}
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <h3 className="font-bold text-emerald-900 mb-2">Best Salons in Western Province</h3>
              <p className="text-emerald-800 text-sm leading-relaxed mb-4">
                Whether you're looking for affordable barber shops in Colombo, luxury spa experiences, or the top bridal studios, our verified marketplace connects you with top-rated professionals.
              </p>
              <Link to="/about" className="text-emerald-700 text-sm font-bold hover:underline">Read our complete guide &rarr;</Link>
            </div>

          </div>
        </div>
      </div>
      
      {/* MOBILE BOTTOM STICKY BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex gap-2 w-full pb-safe">
        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold text-zinc-700 bg-slate-50 border-slate-200">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold text-zinc-700 bg-slate-50 border-slate-200">
          <Map className="w-4 h-4 mr-2" /> Map
        </Button>
      </div>
    </div>
  );
}

const Store = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
  </svg>
)
