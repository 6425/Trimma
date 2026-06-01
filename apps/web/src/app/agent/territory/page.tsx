"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  Map as MapIcon, 
  RefreshCw, 
  Download, 
  Maximize, 
  Search, 
  Building2, 
  MapPin, 
  TrendingUp, 
  CheckCircle2, 
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getAgentMapData, searchBusinessesInTerritories } from "../../actions/agent-territory-map";
import { MapComponent, BusinessResult, Territory } from "../../../components/territory/MapComponent";
import { BusinessResultsSidebar } from "../../../components/territory/BusinessResultsSidebar";

const CATEGORIES = [
  "All Categories",
  "Hair Salon",
  "Beauty Salon",
  "Spa",
  "Nail Salon",
  "Barber Shop",
  "Makeup Studio",
  "Wellness Center",
  "Massage Center",
  "Bridal Studio"
];

function TerritoryExplorerContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [businesses, setBusinesses] = useState<BusinessResult[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Attempt to load cached search state
      const cachedBusinesses = sessionStorage.getItem("trimma_territory_businesses");
      const cachedCategory = sessionStorage.getItem("trimma_territory_category");
      
      if (cachedBusinesses) {
        setBusinesses(JSON.parse(cachedBusinesses));
      }
      if (cachedCategory) {
        setSelectedCategory(cachedCategory);
      }

      const res = await getAgentMapData();
      if (!res.success) {
        if (res.error?.includes("Not authenticated")) {
          router.replace("/login?redirectTo=/agent/territory");
          return;
        }
        throw new Error(res.error);
      }
      setTerritories(res.territories);
    } catch (err: any) {
      toast.error(err.message || "Failed to load territories");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setTimeout(() => loadInitialData(), 0);
  }, [loadInitialData]);

  const handleSearch = async () => {
    if (territories.length === 0) {
      toast.error("No territories assigned to your account.");
      return;
    }
    
    setSearching(true);
    setSelectedBusinessId(null);
    try {
      const terrIds = territories.map(t => t.id);
      const cats = selectedCategory === "All Categories" ? [] : [selectedCategory];
      const res = await searchBusinessesInTerritories(cats, terrIds);
      
      if (!res.success) throw new Error(res.error);
      
      setBusinesses(res.businesses);
      sessionStorage.setItem("trimma_territory_businesses", JSON.stringify(res.businesses));
      sessionStorage.setItem("trimma_territory_category", selectedCategory);
      
      toast.success(`Found ${res.businesses.length} businesses matching your criteria.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to search businesses");
    } finally {
      setSearching(false);
    }
  };

  const handleExport = () => {
    if (businesses.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Category,Address,Phone,Rating,Status\n"
      + businesses.map(b => `"${b.name}","${b.category || ''}","${b.address || ''}","${b.phone || ''}",${b.rating || 0},"${b.status || ''}"`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "trimma_territory_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMaximize = () => {
    const mapContainer = document.getElementById("territory-map-container");
    if (!mapContainer) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    } else {
      mapContainer.requestFullscreen().catch(err => console.error(err));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFC107]"></div>
        <p className="text-sm text-zinc-500 font-bold">Loading your territory map...</p>
      </div>
    );
  }

  const verifiedCount = businesses.filter(b => b.is_verified).length;
  const leadsCount = businesses.filter(b => !b.is_verified || b.status === 'pending').length;

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <MapIcon className="w-8 h-8 text-[#FFC107]" />
            Agent Territory Explorer
          </h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Explore businesses within your assigned territories and discover growth opportunities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={handleSearch} variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs text-zinc-700 border-zinc-200 hover:bg-zinc-50" disabled={searching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${searching ? 'animate-spin' : ''}`} /> Refresh Map
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs text-zinc-700 border-zinc-200 hover:bg-zinc-50">
            <Download className="w-3.5 h-3.5 mr-2" /> Export Results
          </Button>
          <Button onClick={handleMaximize} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="p-5 border border-slate-200 shadow-sm rounded-2xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Business Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-3 border border-slate-200 focus:outline-none rounded-xl text-sm font-bold bg-zinc-50 text-zinc-800 focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Assigned Territories
            </label>
            <div className="h-11 px-3 border border-slate-100 bg-zinc-50 rounded-xl flex items-center text-sm font-semibold text-zinc-600 overflow-x-auto custom-scrollbar whitespace-nowrap">
              {territories.length > 0 
                ? territories.map(t => t.name).join(", ") 
                : "No territories assigned"}
            </div>
          </div>

          <Button 
            onClick={handleSearch}
            disabled={searching || territories.length === 0}
            className="w-full h-11 rounded-xl bg-[#FFC107] hover:bg-[#FFC107]/90 text-zinc-900 font-extrabold shadow-none transition-all gap-2"
          >
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search Businesses
          </Button>

        </div>
      </Card>

      {/* STATS */}
      {businesses.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Businesses Found</p>
              <p className="text-xl font-black text-zinc-900">{businesses.length.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-[#FFC107]/10 flex items-center justify-center text-[#d9a200]">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Territory Coverage</p>
              <p className="text-xl font-black text-zinc-900">{territories.length}</p>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Potential Leads</p>
              <p className="text-xl font-black text-zinc-900">{leadsCount.toLocaleString()}</p>
            </div>
          </Card>
          <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Verified Listings</p>
              <p className="text-xl font-black text-zinc-900">{verifiedCount.toLocaleString()}</p>
            </div>
          </Card>
        </div>
      )}

      {/* MAP & SIDEBAR */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
        {/* MAP */}
        <div className="flex-1 lg:w-[70%]">
          <MapComponent 
            businesses={businesses} 
            territories={territories} 
            selectedBusinessId={selectedBusinessId}
            onBusinessSelect={setSelectedBusinessId}
          />
        </div>
        
        {/* SIDEBAR */}
        <div className="w-full lg:w-[30%] h-[600px] lg:h-auto">
          <BusinessResultsSidebar 
            businesses={businesses} 
            selectedBusinessId={selectedBusinessId}
            onBusinessSelect={setSelectedBusinessId}
          />
        </div>
      </div>

    </div>
  );
}

export default function AgentTerritoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFC107]"></div>
      </div>
    }>
      <TerritoryExplorerContent />
    </Suspense>
  );
}
