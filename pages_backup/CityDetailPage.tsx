import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, Star, Scissors, Filter, Map, Clock, 
  ChevronRight, CalendarDays, Search, Heart, Store,
  TrendingUp, Sparkles, Navigation2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const cityDataMap: Record<string, any> = {
  "colombo-07": {
    id: "colombo-07",
    name: "Colombo 07",
    district: "Colombo",
    province: "Western Province",
    description: "The premium hub for luxury grooming, barbers, and high-end spas in Colombo.",
    salonCount: 120,
    avgRating: 4.8,
    image: "https://images.unsplash.com/photo-1574227492706-f65b24c3688a?q=80&w=2940&auto=format&fit=crop",
    popularCategories: ["Barber", "Luxury Salon", "Spa"],
    trendingServices: [
      "Skin Fade & Beard Sculpt",
      "Premium Hydra Facial",
      "Aesthetic Coloring"
    ],
    insights: {
      avgPrice: "LKR 4,500",
      topCategory: "Barber"
    },
    salons: [
      {
        id: "salon-1",
        name: "The Gentlemen's Lounge",
        slug: "the-gentlemens-lounge-colombo-07",
        city: "Colombo 07",
        rating: 4.8,
        reviews: 320,
        categories: ["Barber", "Beard", "Facial"],
        priceFrom: 2500,
        nextAvailable: "Today 5:30 PM",
        status: "Open Now",
        image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2940&auto=format&fit=crop"
      },
      {
        id: "salon-5",
        name: "Aura Premium Beauty",
        slug: "aura-premium-beauty-colombo-07",
        city: "Colombo 07",
        rating: 4.9,
        reviews: 210,
        categories: ["Hair", "Makeup", "Bridal"],
        priceFrom: 4000,
        nextAvailable: "Tomorrow 9:00 AM",
        status: "Closed",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1000&auto=format&fit=crop"
      }
    ]
  }
};

export default function CityDetailPage() {
  const { id } = useParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mapView, setMapView] = useState(false);

  // In a real app, you would fetch data based on `id`
  const data = cityDataMap[id || "colombo-07"] || cityDataMap["colombo-07"];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0 relative">
      
      {/* 1. CITY HERO SECTION */}
      <section className="relative bg-zinc-900 text-white pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <img src={data.image} alt={data.name} className="w-full h-full object-cover mix-blend-overlay border-none focus:outline-none" />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-zinc-300 text-sm font-medium mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/district/${data.district.toLowerCase()}`} className="hover:text-white transition-colors">{data.district}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{data.name}</span>
          </div>
          
          <div className="max-w-3xl">
             <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">{data.name}</h1>
             <p className="text-xl md:text-2xl text-zinc-300 font-medium mb-8">
               {data.description}
             </p>
             
             <div className="flex flex-wrap items-center gap-4 text-sm font-semibold mb-8">
               <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2">
                 <Store className="w-5 h-5 text-emerald-400" />
                 {data.salonCount} Salons Here
               </div>
               <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2">
                 <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                 {data.avgRating} Avg Rating
               </div>
             </div>

             {/* QUICK SEARCH BAR */}
             <div className="relative max-w-xl">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-zinc-400" />
               </div>
               <input
                 type="text"
                 placeholder={`Search inside ${data.name}...`}
                 className="block w-full pl-11 pr-4 py-3.5 border-transparent rounded-2xl bg-white shadow-xl focus:border-emerald-500 focus:ring-emerald-500 text-zinc-900 outline-none font-medium"
               />
               <Button className="absolute right-1.5 top-1.5 bottom-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6">
                 Search
               </Button>
             </div>
          </div>
        </div>
      </section>

      {/* QUICK FILTER BAR (Sticky) */}
      <div className={`sticky top-16 z-30 bg-white border-b border-slate-200 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2">
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Scissors className="w-4 h-4 mr-2 text-zinc-400" /> Category
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               Price Range
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Clock className="w-4 h-4 mr-2 text-zinc-400" /> Open Now
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap font-medium px-4">
               <Filter className="w-4 h-4 mr-2" /> All Filters
             </Button>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full shrink-0">
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
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* MAIN LISTING COLUMN */}
          <div className="flex-1">
            <div className="flex justify-between items-end mb-6">
               <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Salons in {data.name}</h2>
               <div className="text-sm font-medium text-zinc-500">{data.salons.length} results</div>
            </div>

            {/* SALON LISTING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.salons.map((salon: any) => (
                <div key={salon.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col">
                  <div className="relative h-56 overflow-hidden bg-slate-100">
                    <img src={salon.image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-colors border border-white/20">
                      <Heart className="w-5 h-5" />
                    </button>
                    {salon.status === "Open Now" && (
                      <div className="absolute top-4 left-4 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm">
                        Open Now
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-bold text-xl text-zinc-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                         <Link to={`/salons/${salon.slug}`}>{salon.name}</Link>
                       </h3>
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
                      {salon.categories.map((cat: string) => (
                        <Badge key={cat} variant="secondary" className="bg-slate-100 text-zinc-600 font-medium hover:bg-slate-200 border-none shadow-none">{cat}</Badge>
                      ))}
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-4 border border-amber-100">
                        <CalendarDays className="w-4 h-4" /> Next available: {salon.nextAvailable}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                         <div className="font-medium text-zinc-500 text-sm">
                           From <span className="text-lg font-bold text-zinc-900">LKR {salon.priceFrom}</span>
                         </div>
                          <div className="flex gap-2">
                            <Link 
                              to={`/salons/${salon.slug}`}
                              className="hidden sm:inline-flex items-center justify-center rounded-xl font-bold border border-slate-200 text-zinc-700 h-10 px-4 transition-colors hover:bg-slate-50"
                            >
                              View
                            </Link>
                            <Link 
                              to={`/salons/${salon.slug}?action=book`}
                              className="inline-flex items-center justify-center rounded-xl px-5 sm:px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-bold shadow-sm transition-colors h-10"
                            >
                              Book
                            </Link>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" className="rounded-xl font-bold border-slate-200 text-zinc-700 h-12 px-8 shadow-sm">
                Load More
              </Button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-[340px] space-y-8 shrink-0">
            
            {/* TRENDING LOCALLY */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-zinc-900 text-lg">Trending in {data.name}</h3>
              </div>
              <ul className="space-y-3">
                {data.trendingServices.map((service: string) => (
                  <li key={service} className="flex justify-between items-center group cursor-pointer p-2 hover:bg-slate-50 rounded-lg -mx-2 transition-colors">
                    <span className="text-zinc-700 font-medium group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-zinc-300 group-hover:text-indigo-400" />
                       {service}
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition-colors group-hover:translate-x-1" />
                  </li>
                ))}
              </ul>
            </div>

            {/* SEO CONTENT BLOCK */}
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
              <h3 className="font-bold text-emerald-900 mb-2">Book the best in {data.name}</h3>
              <p className="text-emerald-800 text-sm leading-relaxed mb-4">
                From luxury grooming to high-end spa retreats, explore curated salons in this premium area.
              </p>
              <Link to={`/barbers/${data.id}`} className="text-emerald-700 text-sm font-bold hover:underline block mb-2">Find Barbers in {data.name} &rarr;</Link>
              <Link to={`/spa/${data.id}`} className="text-emerald-700 text-sm font-bold hover:underline block">Find Spas in {data.name} &rarr;</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
