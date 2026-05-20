import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  MapPin, Star, Clock, CalendarDays, ArrowRight,
  Phone, MessageCircle, Navigation2, CheckCircle2,
  ShieldCheck, Wifi, Coffee, Car, CreditCard,
  Scissors, Search, Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BookingSheet } from "../components/BookingSheet";

// --- MOCK DATA ---
const salonData = {
  name: "Crown & Comb",
  slug: "crown-comb",
  verified: true,
  rating: 4.9,
  reviews: 234,
  location: "Colombo 07",
  address: "123 Independence Ave, Colombo 07, Sri Lanka",
  status: "Open Now",
  categories: ["Barber", "Hair", "Spa"],
  logo: "https://api.dicebear.com/7.x/initials/svg?seed=CC&backgroundColor=18181b",
  featuredImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&auto=format&fit=crop",
  gallery: [
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bfcfaa6362f?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=1000&auto=format&fit=crop",
  ],
  verticalGallery: [
    "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593702275687-f8b402bf1ef5?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=1000&auto=format&fit=crop"
  ],
  extendedGallery: [
    "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600948836101-f9ff510529d2?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580614488960-983de32beec0?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1633681926022-84c23e8cb2d6?q=80&w=1000&auto=format&fit=crop"
  ],
  subscriptionPlan: 'Standard', // Mock prop to represent plan
  about: "Experience the pinnacle of grooming at Crown & Comb. Our expert barbers specialize in classic cuts, modern fades, and traditional hot towel shaves. Relax and enjoy a complimentary beverage while our skilled team elevates your style in our premium Colombo studio.",
  amenities: [
    { icon: <Wifi className="w-4 h-4"/>, name: "Free WiFi" },
    { icon: <Car className="w-4 h-4"/>, name: "Free Parking" },
    { icon: <Coffee className="w-4 h-4"/>, name: "Complimentary Drinks" },
    { icon: <CreditCard className="w-4 h-4"/>, name: "Card Payments" },
    { icon: <CheckCircle2 className="w-4 h-4"/>, name: "Air Conditioned" }
  ],
  hours: [
    { day: "Monday", time: "09:00 AM - 08:00 PM" },
    { day: "Tuesday", time: "09:00 AM - 08:00 PM" },
    { day: "Wednesday", time: "09:00 AM - 08:00 PM" },
    { day: "Thursday", time: "09:00 AM - 08:00 PM" },
    { day: "Friday", time: "09:00 AM - 09:00 PM" },
    { day: "Saturday", time: "09:00 AM - 09:00 PM" },
    { day: "Sunday", time: "Closed" },
  ]
};

const serviceCategories = ["All", "Hair", "Beard", "Spa"];
const servicesData = [
  { id: "s1", name: "Premium Fade", duration: "45 min", price: "LKR 2,000", category: "Hair", description: "Modern fade with precision styling and wash.", popular: true },
  { id: "s2", name: "Classic Haircut", duration: "30 min", price: "LKR 1,500", category: "Hair", description: "Traditional scissor cut and styling.", popular: false },
  { id: "s3", name: "Beard Trim & Shape", duration: "20 min", price: "LKR 1,000", category: "Beard", description: "Beard shaping, line-up, and conditioning oil.", popular: false },
  { id: "s4", name: "Hot Towel Shave", duration: "30 min", price: "LKR 1,500", category: "Beard", description: "Classic straight razor shave with hot towel treatment.", popular: true },
  { id: "s5", name: "Scalp Massage & Spa", duration: "45 min", price: "LKR 3,500", category: "Spa", description: "Relaxing scalp massage with essential oils.", popular: false },
];

const staffData = [
  { id: "st1", name: "Nuwan Abeywickrama", role: "Senior Barber", experience: "8 yrs", rating: 4.9, completed: 1240, availableToday: true },
  { id: "st2", name: "Chamara Perera", role: "Stylist", experience: "5 yrs", rating: 4.8, completed: 850, availableToday: true },
  { id: "st3", name: "Kasun Silva", role: "Color Specialist", experience: "6 yrs", rating: 4.7, completed: 920, availableToday: false },
];

const reviewsData = [
  { id: 1, author: "Dinuka R.", rating: 5, date: "2 days ago", content: "Best fade I've ever had in Colombo. Nuwan is a master of his craft. Highly recommend!", verified: true },
  { id: 2, author: "Amal P.", rating: 5, date: "1 week ago", content: "Great ambiance and excellent service. The hot towel shave was incredibly relaxing.", verified: true },
];

export default function SalonPage() {
  const { slug } = useParams();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [initialBookingService, setInitialBookingService] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredServices = selectedCategory === "All" 
    ? servicesData 
    : servicesData.filter(s => s.category === selectedCategory);

  const handleBookService = (serviceName?: string) => {
    setInitialBookingService(serviceName);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      
      {/* 1. HERO DESKTOP MOSAIC GALLERY (Hidden on mobile) */}
      <div className="hidden md:flex h-[400px] w-full bg-zinc-900 border-b border-zinc-200">
        <div className="w-2/3 relative">
          <img src={salonData.featuredImage} alt="Featured" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent" />
        </div>
        <div className="w-1/3 flex flex-col">
          <img src={salonData.gallery[0]} alt="Gallery 1" className="h-1/2 w-full object-cover border-l border-b border-zinc-800" />
          <img src={salonData.gallery[1]} alt="Gallery 2" className="h-1/2 w-full object-cover border-l border-zinc-800" />
        </div>
      </div>
      
      {/* 1. HERO MOBILE IMAGE */}
      <div className="md:hidden h-64 w-full relative">
        <img src={salonData.featuredImage} alt="Featured" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent" />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative">
        {/* Header Information Box (Pulled up over the image on mobile, sits nicely on desktop) */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 -mt-20 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex gap-4 md:gap-6 items-start md:items-center">
            <Avatar className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white shadow-md rounded-2xl">
              <AvatarImage src={salonData.logo} className="object-cover" />
              <AvatarFallback>CC</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
                  {salonData.name}
                </h1>
                {salonData.verified && (
                  <ShieldCheck className="w-5 h-5 text-blue-500" fill="currentColor" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-600 mb-3">
                <div className="flex items-center text-zinc-900 font-semibold bg-zinc-100 px-2 py-0.5 rounded-md">
                  <Star className="w-4 h-4 mr-1 fill-amber-500 text-amber-500" />
                  {salonData.rating} <span className="font-normal text-zinc-500 ml-1">({salonData.reviews})</span>
                </div>
                <div className="flex items-center hover:text-emerald-600 transition-colors cursor-pointer">
                  <MapPin className="w-4 h-4 mr-1 text-emerald-500" />
                  <Link to={`/city/${salonData.location.toLowerCase().replace(' ', '-')}`}>{salonData.location}</Link>
                </div>
                <div className="flex items-center text-emerald-600 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  {salonData.status}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {salonData.categories.map(c => (
                  <Link to={`/explore/${c.toLowerCase()}/${salonData.location.toLowerCase().replace(' ', '-')}`} key={c}>
                    <Badge variant="secondary" className="bg-slate-100 text-zinc-600 hover:bg-emerald-50 hover:text-emerald-700 cursor-pointer">{c}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col lg:flex-row gap-3">
            <Button size="lg" className="flex-1 md:flex-none hidden md:flex rounded-xl bg-zinc-900 text-white shadow-md hover:bg-zinc-800" onClick={() => handleBookService()}>
              Book Now
            </Button>
            <Button size="lg" variant="outline" className="flex-1 md:flex-none rounded-xl gap-2 font-medium">
              <Phone className="w-4 h-4" /> Call
            </Button>
            <Button size="lg" variant="outline" className="flex-1 md:flex-none rounded-xl gap-2 font-medium border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </Button>
            <Button size="lg" variant="outline" className="flex-1 md:flex-none rounded-xl gap-2 font-medium hidden md:flex">
              <Navigation2 className="w-4 h-4" /> Directions
            </Button>
          </div>
        </div>

        {/* MAIN LAYOUT: Left Content + Right Booking Widget */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-10">
          
          <div className="flex-1 min-w-0 space-y-12">
            
            {/* 4. SERVICES SECTION */}
            <section id="services">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Services</h2>
              
              {/* Category Filters */}
              <div className="flex overflow-x-auto gap-2 pb-4 hide-scrollbar snap-x mb-2">
                {serviceCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`snap-start shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat 
                        ? 'bg-zinc-900 text-white shadow-md' 
                        : 'bg-white border border-slate-200 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100">
                  {filteredServices.map((service) => (
                    <div key={service.id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-zinc-900 text-lg">{service.name}</h3>
                          {service.popular && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none shrink-0 font-medium">
                              <Flame className="w-3 h-3 mr-1" /> Popular
                            </Badge>
                          )}
                        </div>
                        <p className="text-zinc-500 text-sm mb-2 max-w-md">{service.description}</p>
                        <div className="flex items-center gap-3 text-sm font-medium text-zinc-500">
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1"/> {service.duration}</span>
                          <span className="text-slate-300">•</span>
                          <span>{service.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                        <div className="font-bold text-lg text-zinc-900">{service.price}</div>
                        <Button className="rounded-full shadow-sm px-6" onClick={() => handleBookService(service.name)}>
                          Book
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredServices.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                      No services found in this category.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 5. VERTICAL FEATURED GALLERY */}
            <section id="featured-gallery" className="pt-2 pb-2">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Featured Work</h2>
                  <p className="text-zinc-500">Inspiring looks created by our professionals.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {salonData.verticalGallery.map((img, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden aspect-[3/4] border border-slate-200 shadow-sm relative group cursor-pointer">
                    <img src={img} alt={`Featured ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                ))}
              </div>
            </section>

            {/* 6. STAFF SECTION */}
            <section id="staff">
               <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Professionals</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {staffData.map(st => (
                   <div key={st.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm hover:shadow-md transition-shadow">
                     <Avatar className="w-16 h-16 border border-slate-100">
                       <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${st.name}`} />
                       <AvatarFallback>{st.name[0]}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1">
                       <div className="flex justify-between items-start mb-1">
                         <h3 className="font-bold text-zinc-900">{st.name}</h3>
                         <div className="flex items-center text-sm font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-md">
                           <Star className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500" />
                           {st.rating}
                         </div>
                       </div>
                       <p className="text-sm text-zinc-500 font-medium mb-2">{st.role} • {st.experience}</p>
                       <div className="flex flex-wrap items-center gap-2 text-xs">
                         <Badge variant="outline" className="text-zinc-600 border-slate-200">{st.completed}+ jobs</Badge>
                         {st.availableToday ? (
                           <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-medium">Available today</Badge>
                         ) : (
                           <Badge variant="secondary" className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none font-medium">Available tmrw</Badge>
                         )}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </section>

            {/* 8. REVIEWS SECTION */}
            <section id="reviews">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Reviews</h2>
                   <div className="flex items-center">
                     <Star className="w-5 h-5 fill-amber-500 text-amber-500 mr-1" />
                     <span className="font-bold text-zinc-900 mr-1 text-lg">{salonData.rating}</span>
                     <span className="text-zinc-500">Based on {salonData.reviews} verified bookings</span>
                   </div>
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {reviewsData.map(r => (
                   <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                     <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-700 text-xs">
                           {r.author[0]}
                         </div>
                         <div>
                           <div className="font-semibold text-sm text-zinc-900 flex items-center gap-1">
                             {r.author} {r.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                           </div>
                           <div className="text-xs text-zinc-500">{r.date}</div>
                         </div>
                       </div>
                       <div className="flex">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`} />
                         ))}
                       </div>
                     </div>
                     <p className="text-zinc-600 text-sm leading-relaxed">{r.content}</p>
                   </div>
                 ))}
               </div>
               <Button variant="outline" className="w-full mt-4 rounded-xl border-slate-200 text-zinc-700 font-medium">Read all {salonData.reviews} reviews</Button>
            </section>

            {/* 9 & 10. ABOUT & AMENITIES */}
            <section id="about" className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-4">About {salonData.name}</h2>
                  <p className="text-zinc-600 leading-relaxed text-sm md:text-base">{salonData.about}</p>
               </div>
               <div>
                  <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {salonData.amenities.map((am, i) => (
                      <div key={i} className="flex items-center gap-2 text-zinc-600 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-zinc-700 shrink-0">
                          {am.icon}
                        </div>
                        {am.name}
                      </div>
                    ))}
                  </div>
               </div>
            </section>

            {/* 7 & 11. LOCATION & HOURS */}
            <section id="location" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col md:flex-row">
               <div className="p-6 md:p-8 flex-1 border-b md:border-b-0 md:border-r border-slate-100">
                 <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Location</h2>
                 <p className="text-zinc-600 mb-4">{salonData.address}</p>
                 <Button variant="outline" className="rounded-xl w-full sm:w-auto font-medium gap-2">
                   <Navigation2 className="w-4 h-4" /> Get Directions
                 </Button>
               </div>
               <div className="p-6 md:p-8 w-full md:w-80 bg-slate-50">
                 <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-4">Working Hours</h2>
                 <div className="space-y-2 text-sm">
                   {salonData.hours.map((h, i) => (
                     <div key={i} className={`flex justify-between ${h.day === 'Today' || i === new Date().getDay() - 1 ? 'font-bold text-zinc-900' : 'text-zinc-600'}`}>
                       <span>{h.day}</span>
                       <span>{h.time}</span>
                     </div>
                   ))}
                 </div>
               </div>
            </section>

            {/* 12. EXTENDED GALLERY PORTFOLIO */}
            <section id="extended-gallery" className="pt-4">
               <div className="flex justify-between items-end mb-6">
                 <div>
                   <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">Portfolio Gallery</h2>
                   <p className="text-zinc-500">More of our work and salon ambience.</p>
                 </div>
                 {salonData.subscriptionPlan !== 'Pro' && (
                   <Badge variant="secondary" className="bg-amber-50 text-amber-600 border border-amber-200 shrink-0 mb-4 h-fit">
                     <Star className="w-3.5 h-3.5 mr-1.5 fill-amber-500 text-amber-500" /> Pro Feature
                   </Badge>
                 )}
               </div>
               
               {salonData.subscriptionPlan === 'Pro' ? (
                 <div className="flex overflow-x-auto gap-4 pb-4 hide-scrollbar snap-x">
                   {salonData.extendedGallery.map((img, i) => (
                     <div key={i} className="snap-start shrink-0 w-[280px] md:w-[350px] aspect-[4/3] rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                       <img src={img} alt={`Portfolio ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-zinc-50">
                   <div className="flex overflow-x-hidden gap-4 p-4 opacity-40 blur-[2px] pointer-events-none select-none">
                     {salonData.extendedGallery.slice(0, 3).map((img, i) => (
                       <div key={i} className="shrink-0 w-[280px] md:w-[350px] aspect-[4/3] rounded-2xl overflow-hidden">
                         <img src={img} alt={`Portfolio ${i}`} className="w-full h-full object-cover" />
                       </div>
                     ))}
                   </div>
                   <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
                     <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mb-4">
                       <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
                     </div>
                     <h3 className="text-lg font-bold text-zinc-900 mb-2">Extended Gallery is a Pro Feature</h3>
                     <p className="text-zinc-600 max-w-sm mx-auto mb-6 text-sm">
                       Upgrade this salon to a Pro subscription to showcase more photos to your customers and boost bookings.
                     </p>
                   </div>
                 </div>
               )}
            </section>

          </div>

          {/* 2. RIGHT SIDEBAR - QUICK BOOKING BAR (Desktop Sticky) */}
          <div className="hidden lg:block w-[380px] shrink-0">
            <div className="sticky top-24 space-y-6 h-[calc(100vh-8rem)] overflow-y-auto hide-scrollbar pb-6 rounded-2xl">
               <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                 <div className="flex items-center justify-between mb-6">
                   <div>
                     <h3 className="text-xl font-bold text-zinc-900">Book Appointment</h3>
                     <div className="text-sm font-medium text-emerald-600 mt-1 flex items-center">
                       <CheckCircle2 className="w-4 h-4 mr-1" /> Highly Responsive
                     </div>
                   </div>
                 </div>
                 
                 <div className="space-y-4 mb-6">
                   <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-zinc-400" />
                      <div>
                        <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-0.5">Next Available</div>
                        <div className="text-sm font-bold text-zinc-900">Today at 02:00 PM</div>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100">
                      <Flame className="w-4 h-4 fill-current" />
                      Booked 32 times this week
                   </div>
                 </div>

                 <Button 
                   className="w-full h-14 text-lg font-semibold bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl shadow-md transition-transform active:scale-[0.98]"
                   onClick={() => handleBookService()}
                 >
                   Start Booking
                 </Button>
                 
                 <p className="text-center text-xs text-zinc-500 mt-4">
                   No payment required to hold slot
                 </p>
               </div>
               
               {/* Vertical Gallery (Available for all salons) */}
               <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                 <h4 className="font-bold text-zinc-900 mb-4 text-lg">Featured Work</h4>
                 <div className="space-y-4">
                   {salonData.verticalGallery.map((img, i) => (
                     <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] border border-slate-100 shadow-sm relative group cursor-pointer">
                       <img src={img} alt={`Featured ${i}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 lg:hidden flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 pb-safe">
        <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl shrink-0 border-slate-200 text-zinc-700">
          <Phone className="w-5 h-5" />
        </Button>
        <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl shrink-0 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10">
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button 
          className="flex-1 h-12 text-base font-semibold bg-zinc-900 text-white rounded-xl shadow-md"
          onClick={() => handleBookService()}
        >
          Book Now
        </Button>
      </div>

      <BookingSheet 
        isOpen={isBookingOpen} 
        onOpenChange={setIsBookingOpen} 
        initialServiceName={initialBookingService} 
      />
      
      {/* Safe area padding for mobile bottom bar */}
      <div className="h-20 lg:hidden"></div>
    </div>
  );
}
