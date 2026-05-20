import { Link } from "react-router-dom";
import { Search, MapPin, ChevronRight, Scissors, Sparkles, Navigation2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const provinces = [
  {
    id: "western",
    name: "Western Province",
    salonCount: 1240,
    categories: ["Barber", "Spa", "Bridal", "Hair", "Nails"],
    image: "https://images.unsplash.com/photo-1574227492706-f65b24c3688a?q=80&w=2940&auto=format&fit=crop"
  },
  {
    id: "central",
    name: "Central Province",
    salonCount: 450,
    categories: ["Ayurveda", "Hair", "Spa", "Bridal"],
    image: "https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?q=80&w=2942&auto=format&fit=crop"
  },
  {
    id: "southern",
    name: "Southern Province",
    salonCount: 380,
    categories: ["Spa", "Wellness", "Barber", "Nails"],
    image: "https://images.unsplash.com/photo-1596422846543-74c6d20a7cf3?q=80&w=2940&auto=format&fit=crop"
  },
  {
    id: "north-western",
    name: "North Western Province",
    salonCount: 210,
    categories: ["Hair", "Barber", "Bridal"],
    image: "https://images.unsplash.com/photo-1625736300986-10fe6eb12ed5?q=80&w=2938&auto=format&fit=crop"
  },
  {
    id: "sabaragamuwa",
    name: "Sabaragamuwa Province",
    salonCount: 156,
    categories: ["Barber", "Hair", "Beauty"],
    image: "https://images.unsplash.com/photo-1610447387799-a1d2f7034fe9?q=80&w=2942&auto=format&fit=crop"
  },
  {
    id: "eastern",
    name: "Eastern Province",
    salonCount: 180,
    categories: ["Hair", "Nails", "Barber"],
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2836&auto=format&fit=crop"
  }
];

export default function ProvincesPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* HERO SECTION */}
      <section className="bg-zinc-900 pt-20 pb-24 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://images.unsplash.com/photo-1516975080661-418cb21dc07a?q=80&w=2940&auto=format&fit=crop" alt="Sri Lanka Map" className="w-full h-full object-cover grayscale mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Explore Salons by Province
          </h1>
          <p className="text-xl text-zinc-300 font-medium max-w-2xl mx-auto">
            Find the best salons, spas, and grooming centers near you. Book your next appointment anywhere in Sri Lanka.
          </p>
          
          <div className="max-w-xl mx-auto relative mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search provinces, cities or salons..."
              className="block w-full pl-12 pr-4 py-4 md:text-lg border-transparent rounded-2xl bg-white shadow-xl focus:border-emerald-500 focus:ring-emerald-500 text-zinc-900 outline-none"
            />
            <Button className="absolute right-2 top-2 bottom-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold flex items-center gap-2">
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* PROVINCE GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {provinces.map((province) => (
            <Link 
              key={province.id} 
              to={`/province/${province.id}`}
              className="group block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 hover:border-zinc-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img 
                  src={province.image} 
                  alt={province.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/30 to-transparent flex flex-col justify-end p-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xl font-bold tracking-tight">{province.name}</h3>
                  </div>
                  <p className="text-emerald-300 font-semibold text-sm">{province.salonCount} Salons</p>
                </div>
              </div>
              <div className="p-5 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-semibold text-zinc-500 mb-2 uppercase tracking-wider">Top Categories</div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {province.categories.map(cat => (
                      <span key={cat} className="px-2.5 py-1 bg-slate-100 text-zinc-700 rounded-lg text-xs font-medium border border-slate-200">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-zinc-900 font-semibold group-hover:text-emerald-600 transition-colors pt-4 border-t border-slate-100">
                   Explore Province <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY CHOOSE BY PROVINCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
         <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
               <Navigation2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-3">Find Salons Near You Instantly</h2>
              <p className="text-zinc-600 max-w-2xl text-lg">
                Our region-based discovery engine connects you with the finest beauty professionals in your area. No matter where you are in Sri Lanka, premium grooming and wellness experiences are just a tap away.
              </p>
            </div>
         </div>
      </section>
    </div>
  );
}
