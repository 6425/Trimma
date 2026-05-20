"use client";

import React, { useState, useEffect } from "react";
import { 
  Store, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  MoreVertical, 
  ChevronRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Salons() {
  const navigate = useRouter();
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("salons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setSalons(data || []);
    } catch (error: any) {
      toast.error("Failed to load salons: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.city?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Active Salons</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage partner establishments and their platform status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-200 rounded-xl font-bold h-11">
            Export Directory
          </Button>
          <Button className="bg-[#D81E5B] hover:bg-[#BF1A50] text-white rounded-xl font-bold h-11 px-6 shadow-lg shadow-[#D81E5B]/20">
            Verify New Salon
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or location..." 
            className="pl-10 h-11 bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100 transition-all rounded-xl" 
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-9 px-4 rounded-full border-zinc-200 bg-white text-zinc-600 font-bold cursor-pointer hover:bg-zinc-50">All Salons</Badge>
          <Badge variant="outline" className="h-9 px-4 rounded-full border-zinc-240 bg-white text-zinc-400 font-bold cursor-pointer hover:bg-zinc-50">Pending Approval</Badge>
        </div>
      </div>

      {/* Salons Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                <th className="px-8 py-5">Salon Profile</th>
                <th className="px-8 py-5">Core Category</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5">Platform Rating</th>
                <th className="px-8 py-5">Operational Status</th>
                <th className="px-8 py-5 text-right">Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#D81E5B] mx-auto mb-4" />
                    <p className="text-zinc-400 font-medium font-sans">Accessing salon global directory...</p>
                  </td>
                </tr>
              ) : filteredSalons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center text-zinc-400">
                    <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium font-sans">No matching salons found in current viewport.</p>
                  </td>
                </tr>
              ) : (
                filteredSalons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#D81E5B] flex items-center justify-center text-white font-bold text-lg shadow-inner">
                          {salon.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#1A1C29] group-hover:text-[#D81E5B] transition-colors truncate max-w-[200px]">
                            {salon.name}
                          </div>
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Partner
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge variant="outline" className="bg-zinc-50 border-none text-zinc-600 font-bold px-3 py-1 text-[10px]">
                        {salon.category?.name || "General"}
                      </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                        <MapPin className="w-4 h-4 text-zinc-300" /> {salon.city || "Multiple"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-black text-zinc-800">{salon.rating || "4.5"}</span>
                        <span className="text-[10px] font-medium text-zinc-400">(240 rev)</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${salon.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                        <span className="text-sm font-bold text-zinc-700 capitalize">{salon.status || "Active"}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-[#D81E5B] hover:bg-zinc-100 rounded-xl">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-zinc-300 hover:text-[#D81E5B] hover:bg-zinc-100 rounded-xl">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Intelligence Dashboard Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-[#1A1C29] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <Zap className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                  <h3 className="text-xl font-black mb-1">Fleet Analytics Mode</h3>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Global Insights v.4.2</p>
               </div>
               <Badge className="bg-white/10 text-white border-none">Enterprise Level</Badge>
            </div>
            <div className="grid grid-cols-3 gap-8 relative z-10">
               <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Avg Occupancy</p>
                  <p className="text-2xl font-black text-rose-500">78%</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">New Salons (30d)</p>
                  <p className="text-2xl font-black text-emerald-500">+12</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">SaaS Revenue</p>
                  <p className="text-2xl font-black text-blue-500">LKR 452K</p>
               </div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-rose-50 to-white rounded-3xl p-8 border border-rose-100 flex flex-col justify-center text-center">
            <Store className="w-12 h-12 text-[#D81E5B] mx-auto mb-4 opacity-40 capitalize" />
            <p className="text-sm font-bold text-zinc-900 mb-2">Platform Scale</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Your salon fleet has grown by 12% this quarter. Consider optimizing city-level categories for better discovery.</p>
         </div>
      </div>
    </div>
  );
}
