"use client";

import React, { useState } from "react";
import { Users, Search, Plus, Filter, Mail, Phone, MessageSquare, Star, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const customers = [
    { name: "Amara Perera", email: "amara.p@gmail.com", phone: "077 123 4567", bookings: 14, spent: "LKR 28,000", rating: 5, lastVisit: "Yesterday" },
    { name: "Nisansala De Silva", email: "nisansala@gmail.com", phone: "071 890 1234", bookings: 8, spent: "LKR 16,500", rating: 5, lastVisit: "May 14, 2026" },
    { name: "Kasun Silva", email: "kasun.silva@yahoo.com", phone: "072 456 7890", bookings: 6, spent: "LKR 9,000", rating: 4, lastVisit: "May 10, 2026" },
    { name: "Suresh Fernando", email: "suresh@outlook.com", phone: "076 345 6789", bookings: 12, spent: "LKR 24,000", rating: 5, lastVisit: "May 08, 2026" },
    { name: "Ruvini Jayasekara", email: "ruvini.j@gmail.com", phone: "077 567 8901", bookings: 3, spent: "LKR 4,500", rating: 4, lastVisit: "May 02, 2026" }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Users className="w-6 h-6 text-[#D81E5B]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Database</h1>
            <p className="text-xs text-zinc-500">Manage client relationships, contact notes, and booking histories.</p>
          </div>
        </div>
        
        <Button className="h-10 rounded-xl bg-[#D81E5B] hover:bg-[#BF1A50] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#D81E5B]/20">
          <Plus className="w-3.5 h-3.5" /> Add Customer
        </Button>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Customers</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">482 Clients</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">+12% this month</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">New This Month</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">54 Clients</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">+8% retention</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">VIP Clients</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">74 Clients</h3>
          <span className="text-[9px] font-semibold text-[#D81E5B] bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">Spent &gt; LKR 15k</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Rating</span>
          <h3 className="text-xl font-black text-amber-500 mt-1 flex items-center gap-1">4.92 <Star className="w-5 h-5 fill-amber-500 text-amber-500 inline" /></h3>
          <span className="text-[9px] font-semibold text-zinc-500 mt-2 inline-block">From 184 reviews</span>
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
              {customers.map((c, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-zinc-800">{c.name}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">{c.email} • {c.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-zinc-700">{c.bookings} visits</td>
                  <td className="px-6 py-4 text-sm font-black text-[#D81E5B]">{c.spent}</td>
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
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-400 hover:text-[#D81E5B]"><MessageSquare className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg text-zinc-400 hover:text-[#D81E5B]"><Mail className="w-3.5 h-3.5" /></Button>
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
