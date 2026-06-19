/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { Search, MapPin, Star, Building2, ExternalLink, Navigation, Lock, Phone } from "lucide-react";
import { BusinessResult } from "./MapComponent";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLeadFromGooglePlaces } from "@/app/actions/agent-leads-creation";

type SidebarProps = {
  businesses: BusinessResult[];
  selectedBusinessId: string | null;
  onBusinessSelect: (id: string | null) => void;
  onBusinessRemove?: (id: string) => void;
};

// A business already exists in our system (a manual lead / salon has been created
// for it) whenever it is flagged taken, or it is NOT a fresh Google Places result.
function isBusinessTaken(biz: BusinessResult): boolean {
  return biz.is_taken === true || biz.status !== "google_lead";
}

export function BusinessResultsSidebar({ businesses, selectedBusinessId, onBusinessSelect, onBusinessRemove }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLead = async (biz: BusinessResult) => {
    if (isBusinessTaken(biz)) {
      toast.error("This salon is already taken — a lead has already been created for it.");
      return;
    }
    try {
      setCreatingId(biz.id);
      const res = await createLeadFromGooglePlaces({
        place_id: biz.id, // using id which is place_id for google leads
        name: biz.name,
        address: biz.address || "",
        category: biz.category || "General",
        rating: biz.rating || 0,
        latitude: biz.latitude,
        longitude: biz.longitude,
        logo_url: biz.logo_url,
        phone: biz.phone,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      toast.success("Lead created successfully!");
      if (onBusinessRemove) {
        onBusinessRemove(biz.id);
      }
      router.push(`/agent/leads?open=${res.salonId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create lead.");
      setCreatingId(null);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-zinc-50/50">
        <h3 className="font-extrabold text-zinc-900 text-sm mb-3 flex justify-between items-center">
          <span>Businesses Found</span>
          <Badge className="bg-zinc-900 text-white shadow-none">{filtered.length}</Badge>
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Business Name..."
            className="w-full pl-9 h-10 bg-white border border-slate-200 focus:ring-2 focus:ring-[#FFC107]/20 transition-all font-semibold rounded-xl text-xs shadow-none"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 mt-10">
            <Building2 className="w-8 h-8 mx-auto text-zinc-300 mb-3" />
            <p className="text-xs font-semibold">No businesses match your search.</p>
          </div>
        ) : (
          filtered.map((biz) => {
            const isSelected = biz.id === selectedBusinessId;
            const taken = isBusinessTaken(biz);
            return (
              <div 
                key={biz.id}
                onClick={() => onBusinessSelect(biz.id)}
                className={`
                  p-3 rounded-xl border transition-all cursor-pointer hover:border-zinc-300 group
                  ${isSelected ? 'border-zinc-900 bg-zinc-50 shadow-sm ring-1 ring-zinc-900' : taken ? 'border-slate-100 bg-zinc-50/60' : 'border-slate-100 bg-white'}
                `}
              >
                {taken && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <Badge className="px-1.5 py-0 text-[9px] font-black uppercase tracking-wide bg-rose-100 text-rose-700 hover:bg-rose-100 shadow-none border-none flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Already taken
                    </Badge>
                    {biz.assign_to && (
                      <span className="text-[9px] font-bold text-zinc-400 truncate">
                        by {biz.assign_to}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-slate-200 bg-zinc-900">
                    {biz.logo_url && !biz.logo_url.includes('maps.gstatic.com') ? (
                      <img src={biz.logo_url} alt={biz.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-extrabold truncate ${isSelected ? 'text-zinc-900' : 'text-zinc-800'}`}>
                      {biz.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="px-1.5 py-0 text-[9px] font-bold bg-[#FFC107]/10 text-[#FFC107] hover:bg-[#FFC107]/20 shadow-none border-none">
                        {biz.category || 'Beauty'}
                      </Badge>
                      <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {biz.rating || "New"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-1.5 text-zinc-500">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <p className="text-[10px] leading-relaxed line-clamp-2 font-medium">{biz.address || biz.location || "Address not provided"}</p>
                </div>
                {biz.phone && (
                  <div className="mt-2 flex items-center gap-1.5 text-zinc-600">
                    <Phone className="w-3 h-3 shrink-0" />
                    <p className="text-[10px] font-semibold">{biz.phone}</p>
                  </div>
                )}

                {isSelected && (
                  <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-[10px] font-bold rounded-lg hover:bg-zinc-100 border-slate-200 text-zinc-700">
                        <ExternalLink className="w-3 h-3 mr-1.5" /> Details
                      </Button>
                      <Button size="sm" className="flex-1 h-8 text-[10px] font-bold rounded-lg bg-slate-100 text-zinc-800 hover:bg-slate-200 shadow-none">
                        <Navigation className="w-3 h-3 mr-1.5" /> Navigate
                      </Button>
                    </div>
                    {taken ? (
                      <div className="w-full h-9 mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 text-zinc-500 text-[11px] font-black cursor-not-allowed">
                        <Lock className="w-3 h-3" />
                        {biz.assign_to ? `Already taken by ${biz.assign_to}` : "Already taken"}
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); handleCreateLead(biz); }}
                        disabled={creatingId === biz.id}
                        className="w-full h-9 text-[11px] font-black rounded-lg bg-[#FFC107] text-black hover:bg-[#FFC107]/90 shadow-none mt-1"
                      >
                        {creatingId === biz.id ? "Creating Lead..." : "+ Create Manual Lead"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
