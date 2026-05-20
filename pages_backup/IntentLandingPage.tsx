import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, Star, Scissors, Filter, Map, Clock, 
  ChevronRight, CalendarDays, Search, Heart,
  TrendingUp, Sparkles, Navigation2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function IntentLandingPage() {
  const { category, location } = useParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mapView, setMapView] = useState(false);
  
  // Format the params for display
  const formattedCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Services";
  const formattedLocation = location ? location.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Area";

  // Mock data based on route
  const data = {
    title: `Best ${formattedCategory} in ${formattedLocation}`,
    description: `Discover top-rated ${formattedCategory.toLowerCase()} and wellness services in ${formattedLocation}. Connect with expert professionals and book your appointment instantly.`,
    salonCount: 86,
    avgRating: 4.8,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&auto=format&fit=crop",
    trendingServices: [
      `${formattedCategory} Consultation`,
      "Signature Treatment",
      "Express Service",
      "Premium Package"
    ],
    salons: [
      {
        id: "salon-1",
        name: "The Gentlemen's Lounge",
        slug: "the-gentlemens-lounge-colombo-07",
        city: formattedLocation,
        rating: 4.8,
        reviews: 320,
        categories: [formattedCategory, "Luxury", "Grooming"],
        priceFrom: 2000,
        nextAvailable: "Today 5:30 PM",
        status: "Open Now",
        image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2940&auto=format&fit=crop"
      },
      {
        id: "salon-2",
        name: "Luxe Wellness Spa",
        slug: "luxe-wellness-spa-colombo",
        city: formattedLocation,
        rating: 4.9,
        reviews: 415,
        categories: [formattedCategory, "Massage"],
        priceFrom: 6500,
        nextAvailable: "Today 6:00 PM",
        status: "Open Now",
        image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop"
      },
      {
        id: "salon-3",
        name: "Crown & Comb Studio",
        slug: "crown-comb-studio",
        city: formattedLocation,
        rating: 4.7,
        reviews: 210,
        categories: [formattedCategory, "Coloring"],
        priceFrom: 3000,
        nextAvailable: "Tomorrow 10:00 AM",
        status: "Closed",
        image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1000&auto=format&fit=crop"
      }
    ]
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0 relative">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-zinc-900 text-white pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <img src={data.image} alt={data.title} className="w-full h-full object-cover mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-zinc-300 text-sm font-medium mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to={`/category/${category}`} className="hover:text-white transition-colors">{formattedCategory}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{formattedLocation}</span>
          </div>
          
          <div className="max-w-3xl">
             <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">{data.title}</h1>
             <p className="text-xl md:text-2xl text-zinc-300 font-medium mb-8">
               {data.description}
             </p>
             
             <div className="flex flex-wrap items-center gap-4 text-sm font-semibold mb-8">
               <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                 {data.salonCount} Verified Options
               </div>
               <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-2">
                 <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                 {data.avgRating} Avg Rating
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
               <MapPin className="w-4 h-4 mr-2 text-zinc-400" /> Location
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               Price Range
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Star className="w-4 h-4 mr-2 text-amber-400 mr-1" /> 4+ Rating
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
               <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Featured {formattedCategory} in {formattedLocation}</h2>
               <div className="text-sm font-medium text-zinc-500">Showing {data.salons.length} results</div>
            </div>

            {/* LISTING GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.salons.map((salon) => (
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
                      {salon.categories.map(cat => (
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
                Load More Results
              </Button>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="w-full lg:w-[340px] space-y-8 shrink-0">
            
            {/* TRENDING */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-zinc-900 text-lg">Trending locally</h3>
              </div>
              <ul className="space-y-3">
                {data.trendingServices.map(service => (
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
              <h3 className="font-bold text-emerald-900 mb-2">Find {formattedCategory} in {formattedLocation}</h3>
              <p className="text-emerald-800 text-sm leading-relaxed mb-4">
                Booking your next appointment has never been easier. Explore top-rated venues, browse reliable reviews, and compare prices for the perfect {formattedCategory.toLowerCase()} experience.
              </p>
              <Link to={`/district/${location?.toLowerCase()}`} className="text-emerald-700 text-sm font-bold hover:underline">Explore all of {formattedLocation} &rarr;</Link>
            </div>

            {/* INTERNAL LINKS (SEO Mesh Network) */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
               <h3 className="font-bold text-zinc-900 text-lg mb-4">Similar Searches</h3>
               <div className="flex flex-wrap gap-2">
                 <Link to={`/hair/${location}`} className="text-xs font-medium bg-white border border-slate-200 text-zinc-600 px-3 py-1.5 rounded-lg hover:border-emerald-500 hover:text-emerald-600">Hair Salons in {formattedLocation}</Link>
                 <Link to={`/spa/${location}`} className="text-xs font-medium bg-white border border-slate-200 text-zinc-600 px-3 py-1.5 rounded-lg hover:border-emerald-500 hover:text-emerald-600">Spas in {formattedLocation}</Link>
                 <Link to={`/category/${category}`} className="text-xs font-medium bg-white border border-slate-200 text-zinc-600 px-3 py-1.5 rounded-lg hover:border-emerald-500 hover:text-emerald-600">All {formattedCategory} venues</Link>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
