import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  Search, MapPin, Star, Filter, ArrowRight,
  ShieldCheck, Map as MapIcon, Grid,
  SlidersHorizontal, ChevronDown, CheckCircle2,
  Clock, Scissors
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// MOCK DATA
const mockSalons = [
  {
    id: "s1",
    name: "Crown & Comb",
    slug: "crown-comb",
    rating: 4.9,
    reviews: 234,
    location: "Colombo 07",
    category: "Barber",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=CC&backgroundColor=18181b",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&auto=format&fit=crop",
    featured: true,
    openNow: true,
    startingPrice: 1500,
    tags: ["Barber", "Beard", "Facial"],
    nextSlot: "Today 4:30 PM",
    popularService: "Premium Fade",
  },
  {
    id: "s2",
    name: "The Velvet Room",
    slug: "velvet-room",
    rating: 4.8,
    reviews: 189,
    location: "Colombo 03",
    category: "Beauty",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=VR&backgroundColor=18181b",
    image: "https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?q=80&w=2940&auto=format&fit=crop",
    featured: true,
    openNow: true,
    startingPrice: 3500,
    tags: ["Hair", "Nails", "Spa"],
    nextSlot: "Tomorrow 10:00 AM",
    popularService: "Bridal Package",
  },
  {
    id: "s3",
    name: "Glow Skin Clinic",
    slug: "glow-skin",
    rating: 4.7,
    reviews: 156,
    location: "Mount Lavinia",
    category: "Skincare",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=GS&backgroundColor=18181b",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2940&auto=format&fit=crop",
    featured: false,
    openNow: false,
    startingPrice: 4000,
    tags: ["Facial", "Laser", "Peel"],
    nextSlot: "Wed 2:00 PM",
    popularService: "Hydrafacial",
  },
  {
    id: "s4",
    name: "Gentlemen's Lounge",
    slug: "gentlemens-lounge",
    rating: 4.6,
    reviews: 92,
    location: "Kotte",
    category: "Barber",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=GL&backgroundColor=18181b",
    image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2940&auto=format&fit=crop",
    featured: false,
    openNow: true,
    startingPrice: 1200,
    tags: ["Barber", "Trim", "Color"],
    nextSlot: "Today 1:00 PM",
    popularService: "Classic Haircut",
  }
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);
  };

  const categoryName = slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Salons & Spas";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="bg-zinc-900 border-b border-zinc-200">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row min-h-[400px]">
          
          <div className="flex-1 py-16 md:py-24 flex flex-col justify-center pr-0 md:pr-12 md:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
              Best {categoryName} <br />in <span className="text-zinc-400">Sri Lanka</span>
            </h1>
            <p className="text-lg text-zinc-300 mb-8 max-w-xl">
              Discover top-rated barbers, fades, grooming lounges, and specialists. Compare styling prices and verified reviews.
            </p>
            
            <div className="flex items-center gap-4 text-sm text-zinc-400 mb-8">
               <span className="font-semibold text-white">124 Salons Available</span>
               <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
               <span>Popular: Colombo 03, Colombo 07, Kandy</span>
            </div>

            <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-md flex flex-col sm:flex-row gap-2 max-w-2xl border border-white/10 shadow-2xl">
               <div className="flex-1 flex items-center px-4 bg-zinc-800/50 rounded-xl relative group">
                 <Search className="w-5 h-5 text-zinc-400 mr-3 group-focus-within:text-white transition-colors" />
                 <input 
                   type="text" 
                   placeholder="Search salons or services..." 
                   className="w-full h-12 bg-transparent text-white placeholder:text-zinc-400 outline-none"
                 />
               </div>
               <div className="flex-1 flex items-center px-4 bg-zinc-800/50 rounded-xl relative group">
                 <MapPin className="w-5 h-5 text-zinc-400 mr-3 group-focus-within:text-white transition-colors" />
                 <select className="w-full h-12 bg-transparent text-white outline-none appearance-none cursor-pointer">
                   <option value="" className="text-zinc-900">Any Location</option>
                   <option value="colombo" className="text-zinc-900">Colombo</option>
                   <option value="kandy" className="text-zinc-900">Kandy</option>
                   <option value="galle" className="text-zinc-900">Galle</option>
                 </select>
               </div>
               <Button size="lg" className="h-12 px-8 rounded-xl bg-white text-zinc-900 hover:bg-zinc-200 font-semibold shadow-md">
                 Search
               </Button>
            </div>
          </div>
          
          {/* Right Hero Image */}
          <div className="w-full md:w-5/12 relative hidden md:block overflow-hidden md:order-2">
            <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-transparent via-zinc-900/40 to-zinc-900 z-10" />
            <img 
              src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop" 
              alt="Category Hero" 
              className="w-full h-full object-cover object-center opacity-80"
            />
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
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">AC</Button>
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Parking</Button>
            </div>

            <Button variant="outline" className="lg:hidden h-9 rounded-full border-slate-200 text-zinc-600 font-medium">
               <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </Button>

            <div className="flex items-center gap-3">
               <div className="hidden sm:flex items-center gap-2 mr-2">
                 <span className="text-sm font-medium text-zinc-500">Sort:</span>
                 <select className="h-9 bg-transparent border-none text-sm font-semibold text-zinc-900 outline-none cursor-pointer">
                    <option>Most Popular</option>
                    <option>Highest Rated</option>
                    <option>Nearest</option>
                    <option>Lowest Price</option>
                 </select>
               </div>
               
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
        
        {/* 4. FEATURED SALONS (Horizontal Scroll) */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Featured Premium Salons</h2>
          </div>
          <div className="flex overflow-x-auto gap-6 pb-6 hide-scrollbar snap-x">
             {mockSalons.filter(s => s.featured).map(salon => (
                <Link to={`/salons/${salon.slug}`} key={salon.id} className="snap-start shrink-0 w-[300px] md:w-[380px] group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col block">
                  <div className="h-48 relative overflow-hidden">
                    <img src={salon.image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className="bg-amber-500 hover:bg-amber-600 font-semibold border-none shadow-sm">
                        <Star className="w-3 h-3 mr-1 fill-white" /> Elite
                      </Badge>
                      <Badge variant="secondary" className="bg-white/90 text-zinc-900 backdrop-blur-md border-none font-medium shadow-sm">
                        Promoted
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
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Open Now
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
             ))}
          </div>
        </section>

        {/* 5. SALON GRID */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">All Salons ({mockSalons.length})</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockSalons.map(salon => (
               <div key={salon.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group relative">
                 
                 {/* Top: Image & Badges */}
                 <Link to={`/salons/${salon.slug}`} className="relative h-56 overflow-hidden block">
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
                     <Link to={`/salons/${salon.slug}`}>
                       <h3 className="font-bold text-xl text-zinc-900 leading-tight mb-1 group-hover:underline">{salon.name}</h3>
                     </Link>
                     <div className="flex items-center text-sm text-zinc-500 mb-3">
                       <MapPin className="w-3.5 h-3.5 mr-1" /> {salon.location} • {salon.category}
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                     {salon.tags.map(tag => (
                       <Badge key={tag} variant="secondary" className="bg-slate-100 text-zinc-600 hover:bg-slate-200 rounded-md font-medium px-2 shadow-none border border-slate-200/50">
                         {tag}
                       </Badge>
                     ))}
                   </div>

                   {/* Service Preview */}
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-0">
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Starts From</span>
                       <span className="font-bold text-zinc-900">{formatPrice(salon.startingPrice)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-sm text-zinc-600 truncate mr-2"><span className="text-zinc-400 mr-1">Popular:</span>{salon.popularService}</span>
                       <span className="text-xs font-medium text-emerald-600 whitespace-nowrap bg-emerald-50 px-2 py-0.5 rounded flex items-center">
                         <Clock className="w-3 h-3 mr-1" /> {salon.nextSlot}
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Bottom: CTA */}
                 <div className="p-4 pt-0 border-t border-slate-50 mt-4 flex gap-3">
                   <Link 
                     to={`/salons/${salon.slug}`}
                     className="flex-1 inline-flex items-center justify-center rounded-xl h-12 font-semibold text-zinc-700 bg-white hover:bg-slate-50 hover:text-zinc-900 border border-slate-200 transition-colors"
                   >
                     View Salon
                   </Link>
                   <Button className="flex-1 rounded-xl h-12 font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-md">
                     Book Now
                   </Button>
                 </div>
               </div>
            ))}
          </div>
        </section>

        {/* 7. TRENDING SERVICES SECTION */}
        <section className="my-24 py-16 px-8 bg-zinc-900 text-white rounded-3xl relative overflow-hidden">
           <div className="absolute inset-0 z-0 opacity-10">
              <img src="https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover" alt="bg"/>
           </div>
           <div className="relative z-10">
             <h2 className="text-3xl font-bold tracking-tight mb-8">Popular Salon Services</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {["Premium Fade", "Beard Sculpting", "Hot Towel Shave", "Hair Coloring", "Bridal Makeup", "Keratin Treatment", "Hydrafacial", "Gel Manicure"].map(s => (
                 <Link to={`/search?q=${s}`} key={s} className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between transition-colors group">
                   <span className="font-medium text-sm sm:text-base">{s}</span>
                   <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                 </Link>
               ))}
             </div>
           </div>
        </section>

        {/* 8 & 9. BEAUTY GUIDES & FAQ */}
        <section className="mb-24 grid md:grid-cols-2 gap-12">
           <div>
             <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Expert Guides</h2>
             <div className="space-y-6">
                {[
                  { title: "Best Hair Salons in Colombo for 2026", desc: "Our curated list of the top styling studios." },
                  { title: "How to Choose the Right Bridal Salon", desc: "Everything you need to know before your big day." },
                  { title: "The Ultimate Guide to Men's Grooming", desc: "Fades, beards, and essential skincare." }
                ].map((guide, i) => (
                  <Link to="/" key={i} className="group block">
                    <h3 className="font-bold text-lg text-zinc-900 group-hover:underline mb-1">{guide.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{guide.desc}</p>
                  </Link>
                ))}
             </div>
           </div>
           
           <div>
             <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Frequently Asked Questions</h2>
             <div className="space-y-4">
               {[
                 { q: "How much does a haircut cost?", a: "Prices vary by salon, but typically start from LKR 1,500 for a standard cut up to LKR 4,000 for premium services." },
                 { q: "Which salons are open late?", a: "You can use our 'Open Now' filter. Many salons in central hubs stay open until 9:00 PM." },
                 { q: "How do I book an appointment?", a: "Simply click 'Book Now' on any salon card, select your service, time, and professional, and confirm." }
               ].map((faq, i) => (
                 <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200">
                   <h4 className="font-bold text-zinc-900 mb-2">{faq.q}</h4>
                   <p className="text-zinc-500 text-sm">{faq.a}</p>
                 </div>
               ))}
             </div>
           </div>
        </section>

        {/* 10. BOTTOM CTA */}
        <section className="mb-12 bg-emerald-900 text-white rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Ready for Your Next Look?</h2>
            <p className="text-emerald-100 text-lg mb-8">Discover top salons, book instantly, and elevate your style.</p>
            <Button size="lg" className="bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl px-10 h-14 text-lg font-bold shadow-xl">
              Explore All Salons
            </Button>
          </div>
        </section>

      </div>

      {/* MOBILE STICKY BOTTOM BAR (Filters) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 pb-safe flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1 h-12 text-base font-semibold border-slate-300 text-zinc-800 rounded-xl bg-white shadow-sm"
          onClick={() => setIsFilterOpen(true)}
        >
          <SlidersHorizontal className="w-5 h-5 mr-2" /> Filters & Sort
        </Button>
        <Button 
          className="flex-1 h-12 text-base font-semibold bg-zinc-900 text-white rounded-xl shadow-md"
          onClick={() => setViewMode(viewMode === 'grid' ? 'map' : 'grid')}
        >
          {viewMode === 'grid' ? <><MapIcon className="w-5 h-5 mr-2" /> Map View</> : <><Grid className="w-5 h-5 mr-2"/> Grid View</>}
        </Button>
      </div>

      {/* Safe area padding for mobile bottom bar */}
      <div className="h-24 lg:hidden"></div>

    </div>
  );
}
