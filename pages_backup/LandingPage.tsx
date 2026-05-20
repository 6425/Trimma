import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, MapPin, Star, ArrowRight,
  Scissors, Heart, Sparkles, Paintbrush, 
  Droplet, Flower2, Activity, User, 
  Users, PenTool 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = [
    { name: "Barber Salon", icon: <Scissors className="w-6 h-6" /> },
    { name: "Bridal & Beauty", icon: <Heart className="w-6 h-6" /> },
    { name: "Beauty Parlours", icon: <Sparkles className="w-6 h-6" /> },
    { name: "Nail Studios", icon: <Paintbrush className="w-6 h-6" /> },
    { name: "Skincare Clinics", icon: <Droplet className="w-6 h-6" /> },
    { name: "Spa & Wellness", icon: <Flower2 className="w-6 h-6" /> },
    { name: "Yoga Studios", icon: <Activity className="w-6 h-6" /> },
    { name: "Men's Grooming", icon: <User className="w-6 h-6" /> },
    { name: "Kids & Family", icon: <Users className="w-6 h-6" /> },
    { name: "Tattoo Studios", icon: <PenTool className="w-6 h-6" /> },
  ];

  const allSalons = [
    { name: "Crown & Comb", location: "Colombo 07", rating: 4.9, reviews: 124, category: "Barber Salon", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&auto=format&fit=crop" },
    { name: "The Velvet Room", location: "Kandy City", rating: 4.8, reviews: 89, category: "Beauty Parlours", image: "https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?q=80&w=2940&auto=format&fit=crop" },
    { name: "Luxe Studio", location: "Galle Fort", rating: 4.9, reviews: 210, category: "Bridal & Beauty", image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=2940&auto=format&fit=crop" },
    { name: "Glow & Go Skin", location: "Colombo 03", rating: 4.7, reviews: 56, category: "Skincare Clinics", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2940&auto=format&fit=crop" },
    { name: "Zen Harmony Spa", location: "Negombo", rating: 4.9, reviews: 312, category: "Spa & Wellness", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop" },
    { name: "Ink & Art Tattoo", location: "Mount Lavinia", rating: 4.6, reviews: 89, category: "Tattoo Studios", image: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=2940&auto=format&fit=crop" },
  ];

  const featuredSalons = selectedCategory === "All" 
    ? allSalons 
    : allSalons.filter(salon => salon.category === selectedCategory);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-900 text-white pt-24 pb-32">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2940&auto=format&fit=crop" 
            alt="Salon Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
             Discover Sri Lanka's <br/><span className="text-zinc-400">Finest Salons.</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-10 max-w-2xl mx-auto">
            Book appointments instantly with top-rated professionals in Colombo, Kandy, and Galle.
          </p>
          
          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto">
             <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl">
               <Search className="w-5 h-5 text-zinc-400 mr-3" />
               <input 
                 type="text" 
                 placeholder="Haircut, color, spa..." 
                 className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none"
               />
             </div>
             <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl">
               <MapPin className="w-5 h-5 text-zinc-400 mr-3" />
               <select className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none">
                 <option value="">Any Location</option>
                 <option value="colombo">Colombo</option>
                 <option value="kandy">Kandy</option>
                 <option value="galle">Galle</option>
               </select>
             </div>
             <Button size="lg" className="h-12 px-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium">
               Search
             </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
             <button
                onClick={() => setSelectedCategory("All")}
                className={`snap-start shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all w-28 ${
                  selectedCategory === "All" ? "border-zinc-900 bg-zinc-900 text-white" : "border-slate-100 hover:border-slate-200 text-zinc-600 bg-slate-50"
                }`}
              >
                <div className="mb-3">
                  <Star className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-center">All</span>
              </button>
            {categories.map((category, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(category.name)}
                className={`snap-start shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all w-28 ${
                  selectedCategory === category.name ? "border-zinc-900 bg-zinc-900 text-white" : "border-slate-100 hover:border-slate-200 text-zinc-600 bg-slate-50"
                }`}
              >
                <div className="mb-3">{category.icon}</div>
                <span className="text-xs font-medium text-center leading-tight">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-24 bg-zinc-50">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
                {selectedCategory === "All" ? "Featured Partners" : selectedCategory}
              </h2>
              <p className="text-zinc-500">
                {selectedCategory === "All" ? "Highly rated salons ready for your booking." : `Explore top-rated ${selectedCategory.toLowerCase()}.`}
              </p>
            </div>
            <Link 
              to={selectedCategory === "All" ? "/search" : `/category/${selectedCategory.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`} 
              className="hidden md:flex items-center text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          {featuredSalons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {featuredSalons.map((salon, i) => (
                 <Link to={`/salons/demo-${i}`} key={i} className="group flex flex-col">
                   <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-4 bg-zinc-100">
                     <img src={salon.image} alt={salon.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                   </div>
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-lg font-bold text-zinc-900 group-hover:underline">{salon.name}</h3>
                       <p className="text-sm text-zinc-500 flex items-center mt-1">
                         <MapPin className="w-3 h-3 mr-1" /> {salon.location}
                       </p>
                     </div>
                     <div className="flex items-center text-sm font-medium bg-zinc-100 px-2 py-1 rounded-md">
                       <Star className="w-3.5 h-3.5 fill-current text-amber-500 mr-1" />
                       {salon.rating}
                     </div>
                   </div>
                 </Link>
               ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">No salons found</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                We couldn't find any {selectedCategory.toLowerCase()} in your selected area yet. 
                We're constantly expanding our partner network!
              </p>
              <Button 
                variant="outline" 
                className="mt-6 border-slate-200"
                onClick={() => setSelectedCategory("All")}
              >
                View all salons
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Partner CTA */}
      <section className="py-24 bg-zinc-50 border-t">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-6">Own a salon?</h2>
          <p className="text-lg text-zinc-500 mb-8 max-w-2xl mx-auto">
            Join the Trimma ecosystem. Manage bookings, staff, and subscriptions all in one modern platform designed for growth.
          </p>
          <Link to="/onboarding">
            <Button size="lg" className="rounded-full px-8 bg-zinc-900 text-white hover:bg-zinc-800">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
