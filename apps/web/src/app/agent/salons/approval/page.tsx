"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, Search, Building2, ChevronRight, Store } from "lucide-react";
import { supabase } from "@/config/supabase";

export default function AgentSalonApprovalList() {
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("salons")
      .select("id, name, city, owner_email, phone, onboarding_status, created_at, status")
      // OWNER_ACTIVATED means they finished the profile and submitted.
      .eq("onboarding_status", "OWNER_ACTIVATED")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setSalons(data);
    }
    setLoading(false);
  };

  const filtered = salons.filter(s => 
    (s.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (s.owner_email?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Salon Approval Queue</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Review and approve salons submitted by owners.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
            />
          </div>
          <div className="text-xs font-bold text-zinc-500 bg-white px-3 py-1.5 rounded-lg border border-zinc-200">
            {filtered.length} Pending
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand" />
              <p className="text-sm font-medium">Loading approval queue...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400 px-4 text-center">
              <Store className="w-12 h-12 mb-4 text-zinc-200" />
              <h3 className="text-lg font-bold text-zinc-700">All Caught Up!</h3>
              <p className="text-sm font-medium max-w-md mt-2">There are no salons pending approval at the moment.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-zinc-400">Salon Details</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-zinc-400">Owner Contact</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-zinc-400">Status</th>
                  <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-zinc-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((salon) => (
                  <tr key={salon.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-brand" />
                        </div>
                        <div>
                          <p className="font-bold text-zinc-900 group-hover:text-brand transition-colors">{salon.name}</p>
                          <p className="text-xs text-zinc-500">{salon.city || 'No city specified'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900">{salon.owner_email}</p>
                      <p className="text-xs text-zinc-500">{salon.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                        Pending Review
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/agent/salons/approval/${salon.id}`}
                        className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-white border border-zinc-200 text-xs font-bold text-zinc-700 hover:border-brand hover:text-brand transition-colors"
                      >
                        Review Profile <ChevronRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
