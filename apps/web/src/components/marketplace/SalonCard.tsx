import Link from "next/link";
import { Heart, Star, MapPin, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface SalonCardInternalProps {
  key?: string;
  salon: {
    id: string;
    slug?: string;
    name: string;
    image: string;
    status: string;
    rating: number;
    reviews: number;
    city: string;
    categories: string[];
    nextAvailable: string;
    priceFrom: number;
  };
}

export function SalonCard(props: SalonCardInternalProps) {
  const { salon } = props;
  const linkTarget = `/salons/${salon.slug || salon.id}`;

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col">
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
           <h3 className="font-bold text-xl text-zinc-900 line-clamp-1 group-hover:text-brand-pink transition-colors">
             <Link href={linkTarget}>{salon.name}</Link>
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
                 href={linkTarget}
                 className="hidden sm:inline-flex items-center justify-center rounded-xl font-bold border border-slate-200 text-zinc-700 h-10 px-4 transition-colors hover:bg-slate-50"
               >
                 View
               </Link>
               <Link 
                 href={`${linkTarget}?action=book`}
                 className="inline-flex items-center justify-center rounded-xl px-5 sm:px-6 bg-primary-gradient hover:opacity-95 text-white font-bold shadow-md transition-colors h-10 border-none"
               >
                 Book
               </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
