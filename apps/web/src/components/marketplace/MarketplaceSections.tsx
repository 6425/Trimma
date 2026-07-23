import Link from "next/link";
import Image from "next/image";
import { Sparkles, Star, MapPin, CheckCircle2, ArrowRight, ShieldCheck, Clock, Award, Landmark, Gift, Percent } from "lucide-react";
import * as Icons from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SalonCard } from "./SalonCard";
import { VerifiedSalonBadge, isSalonVerified } from "./VerifiedSalonBadge";

interface Salon {
  id: string;
  slug?: string;
  name: string;
  image: string;
  logo?: string;
  status: string;
  rating: number;
  reviews: number;
  city: string;
  categories: string[];
  nextAvailable: string;
  priceFrom: number;
  featured?: boolean;
  isVerified?: boolean;
}

interface MarketplaceSectionsProps {
  salons: Salon[];
  contextName?: string; // e.g. "Colombo 07", "Spa"
}

// 1. FEATURED SALONS SECTION
export function FeaturedSalonsSection({ salons, contextName }: MarketplaceSectionsProps) {
  // Filter featured salons, fallback to top-rated if none explicitly featured
  let featured = salons.filter(s => s.featured);
  if (featured.length === 0) {
    featured = [...salons]
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
      .slice(0, 4);
  }

  if (featured.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-8">
        <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5 animate-pulse inline" /> Handpicked Premium Selection
        </Badge>
        <h2 className="text-3xl font-black tracking-tight text-zinc-900 leading-tight">
          Featured Salons {contextName ? `in ${contextName}` : ""}
        </h2>
        <p className="text-zinc-500 text-sm font-medium mt-1">
          Vetted partners selected by our editors for exceptional styling, hygiene standards, and guest reviews.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {featured.map(salon => {
          const linkTarget = `/salons/${salon.slug || salon.id}`;
          const isVerified = isSalonVerified(salon.isVerified);
          
          return (
            <div 
              key={salon.id} 
              className="trimma-marketplace-card bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl sm:hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col group relative h-full"
            >
              <div className="aspect-[4/3] sm:h-52 sm:aspect-auto relative overflow-hidden bg-slate-100">
                <Image 
                  src={salon.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&auto=format&fit=crop"} 
                  alt={salon.name} 
                  fill
                  sizes="(max-width: 1024px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
                
                {!isVerified && (
                  <Badge className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 bg-[#ffde5a] hover:bg-[#ffe680] text-black border-none font-black text-[9px] sm:text-xs uppercase tracking-widest px-2 py-1 sm:px-3 sm:py-1.5 shadow-md">
                    Not Verified
                  </Badge>
                )}
                
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-2 z-20 flex-wrap max-w-[calc(100%-0.5rem)]">
                  <Badge className="bg-amber-500 font-extrabold border-none shadow-sm text-white text-[8px] sm:text-[10px] uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1">
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 fill-white" /> Featured
                  </Badge>
                  {isVerified && <VerifiedSalonBadge size="xs" />}
                  {salon.status === "Open Now" && (
                    <Badge className="bg-emerald-500 text-white font-extrabold border-none text-[10px] uppercase tracking-wider px-2.5 py-1">
                      Open Now
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-2.5 sm:p-6 flex-1 flex flex-col min-w-0">
                <div className="hidden sm:flex items-start gap-4 mb-4">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-md rounded-xl bg-white shrink-0">
                    <AvatarImage src={salon.logo || salon.image} className="object-cover" />
                    <AvatarFallback>{salon.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="font-bold text-zinc-900 text-lg group-hover:text-brand-pink transition-colors truncate">
                      <Link href={linkTarget}>{salon.name}</Link>
                    </h3>
                    {isVerified ? (
                      <div className="flex items-center text-xs font-semibold text-zinc-700 mt-0.5">
                        <VerifiedSalonBadge size="xs" className="rounded-lg" />
                      </div>
                    ) : null}
                  </div>
                </div>

                <h3 className="sm:hidden font-bold text-zinc-900 text-sm group-hover:text-brand-pink transition-colors line-clamp-2 leading-snug mb-1.5">
                  <Link href={linkTarget}>{salon.name}</Link>
                </h3>

                <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm font-medium text-zinc-500 mb-2 sm:mb-5 min-w-0">
                  <div className="flex items-center text-zinc-900 font-bold shrink-0">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 mr-0.5 sm:mr-1" /> {salon.rating} 
                    <span className="text-zinc-400 ml-0.5 sm:ml-1 font-medium hidden sm:inline">({salon.reviews} reviews)</span>
                  </div>
                  <span className="text-slate-300 shrink-0">•</span>
                  <div className="flex items-center font-semibold min-w-0 truncate">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 text-zinc-400 shrink-0" />
                    <span className="truncate">{salon.city}</span>
                  </div>
                </div>

                <div className="mt-auto pt-2 sm:pt-4 border-t border-slate-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-zinc-500 text-[11px] sm:text-xs font-medium">
                    From <span className="text-sm sm:text-base font-bold text-zinc-900 sm:block">LKR {salon.priceFrom.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Link 
                      href={linkTarget}
                      className="hidden sm:inline-flex items-center justify-center rounded-xl font-bold border border-slate-200 text-zinc-700 text-xs h-9 px-3.5 hover:bg-slate-50 transition-colors"
                    >
                      Details
                    </Link>
                    {isVerified ? (
                      <Link 
                        href={`${linkTarget}?action=book`}
                        className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-xl px-3 sm:px-4 min-h-11 sm:min-h-9 bg-primary-gradient hover:opacity-95 text-white text-xs font-black shadow-md shadow-brand-pink/15 transition-all border-none"
                      >
                        Book
                      </Link>
                    ) : (
                      <div className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-xl px-3 sm:px-4 min-h-11 sm:min-h-9 bg-slate-100 text-slate-400 text-xs font-black border-none cursor-not-allowed">
                        Book
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// 2. MOST POPULAR SALONS SECTION
export function PopularSalonsSection({ salons, contextName }: MarketplaceSectionsProps) {
  // Sort by reviews count descending to represent community popularity
  const popular = [...salons]
    .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating)
    .slice(0, 8);

  if (popular.length === 0) return null;

  return (
    <section className="mb-16">
      <div className="mb-8">
        <Badge className="bg-brand-pink/10 text-brand-pink border border-brand-pink/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-2">
          🔥 Community Favorites
        </Badge>
        <h2 className="text-3xl font-black tracking-tight text-zinc-900 leading-tight">
          Most Popular Salons {contextName ? `in ${contextName}` : ""}
        </h2>
        <p className="text-zinc-500 text-sm font-medium mt-1">
          The most booked and highly regarded grooming spots as chosen by the active Trimma community.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {popular.map(salon => (
          <SalonCard key={salon.id} salon={salon} />
        ))}
      </div>
    </section>
  );
}

// 3. DISCOUNTS AND OFFERS SECTION
export function DiscountsOffersSection() {
  const offers = [
    {
      title: "25% OFF Hydra Facial",
      salon: "Aura Premium Beauty",
      desc: "Get an premium aesthetic skin restoration and hydra treatment.",
      code: "AURA25",
      expiry: "Expires in 2 days",
      gradient: "from-amber-500 to-amber-700"
    },
    {
      title: "15% OFF Skin Fade & Sculpt",
      salon: "The Gentlemen's Lounge",
      desc: "Complete luxury beard contouring and signature skin fade haircut.",
      code: "GENTS15",
      expiry: "Expires in 5 days",
      gradient: "from-violet-600 to-indigo-700"
    },
    {
      title: "LKR 1,500 off Bridal Packages",
      salon: "Crown & Comb Studio",
      desc: "Premium dynamic bridal make-up packages and aesthetics.",
      code: "CROWNBRIDE",
      expiry: "Valid till Sunday",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      title: "30% OFF Shellac Manicure",
      salon: "Nail Alchemy Lounge",
      desc: "Get an executive gel pedicure and organic shellac manicure package.",
      code: "NAIL30",
      expiry: "Expires in 3 days",
      gradient: "from-teal-500 to-emerald-600"
    }
  ];

  return (
    <section className="mb-16">
      <div className="mb-8">
        <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-2">
          <Gift className="w-3.5 h-3.5 text-emerald-500 mr-1.5 animate-pulse inline" /> Exclusive Special Deals
        </Badge>
        <h2 className="text-3xl font-black tracking-tight text-zinc-900 leading-tight">
          Discounts & Offers
        </h2>
        <p className="text-zinc-500 text-sm font-medium mt-1">
          Unlock premium beauty and wellness experiences with direct cash-saving promotional coupons.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {offers.map((offer, i) => (
          <div 
            key={i} 
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <div className={`p-6 bg-gradient-to-br ${offer.gradient} text-white relative`}>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Percent className="w-3 h-3" /> Promo Deal
              </div>
              <h3 className="text-xl font-black mb-1">{offer.title}</h3>
              <p className="text-white/80 text-xs font-bold">{offer.salon}</p>
            </div>
            
            <div className="p-6 flex flex-col flex-1 justify-between">
              <p className="text-zinc-600 text-xs leading-relaxed mb-4 font-medium">{offer.desc}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                <div className="bg-slate-100 border border-dashed border-slate-300 px-3 py-1.5 rounded-xl font-mono text-xs font-black text-zinc-800 tracking-wider">
                  {offer.code}
                </div>
                <span className="text-[10px] font-extrabold text-brand uppercase tracking-wider">{offer.expiry}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// 4. WHY TRIMMA SECTION
export function WhyTrimmaSection() {
  const highlights = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-brand-pink" />,
      title: "100% Vetted Standards",
      desc: "Every salon is physically inspected for exceptional hygiene, staffing, and professional credentials."
    },
    {
      icon: <Clock className="w-6 h-6 text-brand-pink" />,
      title: "Real-time 24/7 Booking",
      desc: "Instantly lock dynamic time slots online. Skip phone tags and confirm bookings in under 10 seconds."
    },
    {
      icon: <Award className="w-6 h-6 text-brand-pink" />,
      title: "Top-Rated Stylists",
      desc: "Browse certified colorists, dynamic barber sculptors, and therapists vetted by actual verified clients."
    },
    {
      icon: <Landmark className="w-6 h-6 text-brand-pink" />,
      title: "Zero Booking Fees",
      desc: "Transparent price models with absolute zero hidden service surcharges or checkout commissions."
    }
  ];

  return (
    <section className="mb-16 py-12 px-6 md:px-12 bg-white rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-pink/5 via-transparent to-brand-purple/5 opacity-40" />
      
      <div className="relative z-10 text-center max-w-2xl mx-auto mb-12">
        <h2 className="mb-2">Why Book With Trimma?</h2>
        <p className="text-zinc-500 text-sm font-medium">
          Sri Lanka&apos;s leading digital directory and instant booking engine built for luxury wellness and grooming.
        </p>
      </div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {highlights.map((item, i) => (
          <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <div className="p-3 bg-brand-pink/10 rounded-2xl mb-4 shrink-0 shadow-sm">
              {item.icon}
            </div>
            <h3 className="font-extrabold text-zinc-900 text-base mb-1.5">{item.title}</h3>
            <p className="text-zinc-500 text-xs leading-relaxed font-medium">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// 5. SALON ONBOARDING CTA SECTION
export function SalonOnboardingCTA() {
  return (
    <section className="mb-8">
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_70%_120%,rgba(216,30,91,0.15),transparent_60%)]" />
        
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-brand/15 text-brand border border-brand/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-4">
            Trimma OS SaaS Multi-Tenancy
          </Badge>
          
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
            List Your Salon & Scale Bookings
          </h2>
          <p className="text-zinc-300 text-sm md:text-base leading-relaxed mb-6 font-medium">
            Coordinate calendar bookings, shifts, dynamic digital receipts, and reach thousands of local customers. Power up your wellness business with Sri Lanka&apos;s premium salon SaaS suite.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/signup?role=salon_owner"
              className="inline-flex items-center justify-center rounded-xl bg-brand hover:bg-brand-hover text-black font-extrabold text-sm h-11 px-6 shadow-lg shadow-brand-pink/20 transition-all border-none"
            >
              List Your Salon Now <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link 
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-[#ffde5a]/50 bg-[#ffde5a]/10 text-[#ffde5a] hover:bg-[#ffde5a]/20 hover:border-[#ffde5a] hover:text-[#ffe680] font-bold text-sm h-11 px-6 backdrop-blur-md transition-colors"
            >
              Explore Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
