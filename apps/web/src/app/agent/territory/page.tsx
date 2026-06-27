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
  Filter,
  ListOrdered
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { exportDiscoveryLeadsToExcel, mapTerritoryBusinessToDiscoveryExport } from "@/lib/export-discovery-leads";
import { getAgentMapData, searchBusinessesInTerritories } from "../../actions/agent-territory-map";
import {
  tryAgentData,
  getAgentMapDataClient,
  searchBusinessesInTerritoriesClient,
} from "@/lib/agent-client-data";
import { MapComponent, BusinessResult, Territory } from "../../../components/territory/MapComponent";
import { BusinessResultsSidebar } from "../../../components/territory/BusinessResultsSidebar";
import { useAgentPortal } from "@/lib/agent-portal-provider";

function TerritoryExplorerContent() {
  const router = useRouter();
  const { path } = useAgentPortal();
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [businesses, setBusinesses] = useState<BusinessResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string>("all");
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businessNameSearch, setBusinessNameSearch] = useState("");
  const [resultLimit, setResultLimit] = useState<number>(12);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Attempt to load cached search state
      const cachedBusinesses = sessionStorage.getItem("trimma_territory_businesses");
      const cachedCategory = sessionStorage.getItem("trimma_territory_category");
      const cachedTerritory = sessionStorage.getItem("trimma_territory_id");
      const cachedLimit = sessionStorage.getItem("trimma_territory_limit");
      const cachedBusinessName = sessionStorage.getItem("trimma_territory_business_name");
      
      if (cachedBusinesses) {
        setBusinesses(JSON.parse(cachedBusinesses));
      }
      if (cachedCategory) {
        setSelectedCategory(cachedCategory);
      }
      if (cachedTerritory) {
        setSelectedTerritoryId(cachedTerritory);
      }
      if (cachedLimit) {
        const parsed = Number(cachedLimit) || 12;
        setResultLimit(parsed >= 1 && parsed <= 12 ? parsed : 12);
      }
      if (cachedBusinessName) {
        setBusinessNameSearch(cachedBusinessName);
      }

      const res = await tryAgentData(getAgentMapData, getAgentMapDataClient, {
        clientFirst: false,
      });
      if (res.success) {
        setTerritories(
          (res.territories || []).map((t) => ({
            id: t.id,
            name: t.name,
            type: t.type || "assigned",
          }))
        );
        setCategories([...new Set((res.categories || []).filter(Boolean))]);
      } else {
        if (res.error?.includes("Not authenticated")) {
          router.replace(`/agent/login?redirectTo=${path("/territory")}`);
          return;
        }
        const msg = res.error || "Failed to load territories";
        if (/agent not found/i.test(msg)) {
          throw new Error(
            "Could not load your agent profile. Try signing out and back in, or ask admin to confirm your agents row and territory assignments."
          );
        }
        throw new Error(msg);
      }
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
    setSearching(true);
    setSelectedBusinessId(null);
    try {
      const terrIds = selectedTerritoryId === "all" ? territories.map(t => t.id) : [selectedTerritoryId];
      const nameQuery = businessNameSearch.trim();
      const catsToSearch =
        nameQuery
          ? selectedCategory !== "all"
            ? [selectedCategory]
            : []
          : selectedCategory !== "all"
            ? [selectedCategory]
            : categories;
      const res = await tryAgentData(
        () => searchBusinessesInTerritories(catsToSearch, terrIds, resultLimit, businessNameSearch),
        () => searchBusinessesInTerritoriesClient(catsToSearch, terrIds, resultLimit, businessNameSearch),
        { clientFirst: false }
      );
      
      if (!res.success) throw new Error(res.error);
      
      setBusinesses(res.businesses);
      sessionStorage.setItem("trimma_territory_businesses", JSON.stringify(res.businesses));
      sessionStorage.setItem("trimma_territory_category", selectedCategory);
      sessionStorage.setItem("trimma_territory_id", selectedTerritoryId);
      sessionStorage.setItem("trimma_territory_limit", String(resultLimit));
      sessionStorage.setItem("trimma_territory_business_name", businessNameSearch);
      
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

    exportDiscoveryLeadsToExcel({
      rows: businesses.map((business) => mapTerritoryBusinessToDiscoveryExport(business)),
      sheetTitle: "Territory Explorer Results",
      fileName: "trimma-territory-discovery.xlsx",
    });
    toast.success(`Exported ${businesses.length} businesses to Excel.`);
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

  const displayedTerritories = React.useMemo(() => {
    return selectedTerritoryId === "all" 
      ? territories 
      : territories.filter(t => t.id === selectedTerritoryId);
  }, [territories, selectedTerritoryId]);

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
    <div className="max-w-[1400px] mx-auto space-y-6 animate-in fade-in duration-500 min-w-0">
      
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
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button onClick={handleSearch} variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs text-zinc-700 border-zinc-200 hover:bg-zinc-50" disabled={searching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${searching ? 'animate-spin' : ''}`} /> Refresh Map
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs text-zinc-700 border-zinc-200 hover:bg-zinc-50">
            <Download className="w-3.5 h-3.5 mr-2" /> Export Excel
          </Button>
          <Button onClick={handleMaximize} variant="outline" size="icon" className="h-9 w-9 rounded-xl border-zinc-200 hover:bg-zinc-50 text-zinc-700">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* FILTER PANEL */}
      <Card className="p-5 border border-slate-200 shadow-sm rounded-2xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Business Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-3 border border-slate-200 focus:outline-none rounded-xl text-sm font-bold bg-zinc-50 text-zinc-800 focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
            >
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Assigned Territories
            </label>
            <select
              value={selectedTerritoryId}
              onChange={(e) => setSelectedTerritoryId(e.target.value)}
              className="w-full h-11 px-3 border border-slate-200 focus:outline-none rounded-xl text-sm font-bold bg-zinc-50 text-zinc-800 focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
              disabled={territories.length === 0}
            >
              <option value="all">All Assigned Territories</option>
              {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Business Name
            </label>
            <input
              type="text"
              value={businessNameSearch}
              onChange={(e) => setBusinessNameSearch(e.target.value)}
              placeholder="Search a specific business…"
              className="w-full h-11 px-3 border border-slate-200 focus:outline-none rounded-xl text-sm font-bold bg-zinc-50 text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5" /> Results to Show
            </label>
            <select
              value={resultLimit}
              onChange={(e) => setResultLimit(Number(e.target.value))}
              className="w-full h-11 px-3 border border-slate-200 focus:outline-none rounded-xl text-sm font-bold bg-zinc-50 text-zinc-800 focus:ring-2 focus:ring-[#FFC107]/20 transition-all"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "result" : "results"}
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={handleSearch}
            disabled={searching || territories.length === 0}
            className="w-full h-11 rounded-xl bg-[#FFC107] hover:bg-[#FFC107]/90 text-zinc-900 font-extrabold shadow-none transition-all gap-2 xl:col-span-2"
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
      <div className="flex flex-col lg:flex-row gap-6 min-h-[400px] lg:min-h-[600px]">
        {/* MAP */}
        <div className="flex-1 lg:w-[70%]">
          <MapComponent 
            businesses={businesses} 
            territories={displayedTerritories} 
            selectedBusinessId={selectedBusinessId}
            onBusinessSelect={setSelectedBusinessId}
          />
        </div>
        
        {/* SIDEBAR */}
        <div className="w-full lg:w-[30%] h-[400px] lg:h-auto overflow-y-auto">
          <BusinessResultsSidebar 
            businesses={businesses} 
            selectedBusinessId={selectedBusinessId}
            onBusinessSelect={setSelectedBusinessId}
            onBusinessRemove={(id) => setBusinesses(prev => prev.filter(b => b.id !== id))}
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
