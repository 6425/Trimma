"use client";

import React, { useState } from "react";
import { Users, Search, Plus, Filter, Mail, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { fetchSalonCustomersPage } from "@/app/actions/salon-dashboard-data";
import { Loader2 } from "lucide-react";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    void fetchSalonCustomersPage().then((res) => {
      if (res.success && res.customers) {
        setCustomers(res.customers);
      }
      setLoading(false);
    });
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Users className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Database</h1>
            <p className="text-xs text-zinc-500">Manage client relationships, contact notes, and booking histories.</p>
          </div>
        </div>
        
        <Button className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20">
          <Plus className="w-3.5 h-3.5" /> Add Customer
        </Button>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Customers</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{loading ? "..." : customers.length} Clients</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">New This Month</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">
            {loading ? "..." : customers.filter(c => new Date(c.lastVisit).getMonth() === new Date().getMonth()).length} Clients
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">VIP Clients</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">
            {loading ? "..." : customers.filter(c => c.bookings >= 3).length} Clients
          </h3>
          <span className="text-[9px] font-semibold text-brand bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">3+ visits</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Rating</span>
          <h3 className="text-xl font-black text-amber-500 mt-1 flex items-center gap-1">5.0 <Star className="w-5 h-5 fill-amber-500 text-amber-500 inline" /></h3>
        </div>
      </div>

      {/* Database Operations */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search clients by name, email, or phone number..." 
              className="pl-10 h-11 bg-white rounded-xl border-zinc-200"
            />
          </div>
          <Button variant="outline" className="h-11 rounded-xl font-bold text-xs flex items-center gap-1.5 border-zinc-200 text-zinc-700 bg-white">
            <Filter className="w-4 h-4" /> Filters
          </Button>
        </div>

        {/* Client Table */}
        <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                <th className="px-6 py-4">Client Detail</th>
                <th className="px-6 py-4">Total Bookings</th>
                <th className="px-6 py-4">Lifetime Value</th>
                <th className="px-6 py-4">Client Rating</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4 text-right">Connect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                    Loading clients...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No clients found.
                  </td>
                </tr>
              ) : filteredCustomers.map((c, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-800">{c.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{c.email} • {c.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-zinc-700">{c.bookings} visits</td>
                  <td className="px-6 py-4 text-sm font-black text-brand">{c.spent}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, rIdx) => (
                        <Star key={rIdx} className={`w-3 h-3 ${rIdx < c.rating ? "fill-amber-500" : "text-zinc-200"}`} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-zinc-500">{c.lastVisit}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-400 hover:text-brand"><MessageSquare className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-400 hover:text-brand"><Mail className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
