"use client";

import React from "react";
import { Tag, Plus, CheckCircle, Percent, Scissors, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PackagesPage() {
  const packages = [
    {
      name: "Bridal Glow Premium Bundle",
      services: ["Luxury Hair Spa", "Complete Hair Makeover", "Classic Mani-Pedi", "Hydrafacial Glow Treatment"],
      price: "LKR 18,500",
      saving: "Save LKR 4,200",
      active: true
    },
    {
      name: "Men's Ultra Grooming Kit",
      services: ["Classic Haircut", "Hot Towel Beard Shave", "Charcoal Face Mask", "Head & Shoulder Massage"],
      price: "LKR 4,500",
      saving: "Save LKR 1,200",
      active: true
    },
    {
      name: "Signature Nail & Spa Deal",
      services: ["Gel Nail Extension", "Paraffin Hand Treatment", "Foot Spa Aromatherapy"],
      price: "LKR 8,000",
      saving: "Save LKR 1,800",
      active: false
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <Tag className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Service Packages & Deals</h1>
            <p className="text-xs text-zinc-500">Combine multiple catalog offerings into high-converting promotional packages.</p>
          </div>
        </div>
        
        <Button className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20">
          <Plus className="w-3.5 h-3.5" /> Create Package
        </Button>
      </div>

      {/* Package Quota Alert */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-zinc-800">Subscription Package Limit</h4>
          <p className="text-[10px] text-zinc-500 mt-1">
            Your active Free tier allows up to **6** active published service packages. Upgrade your subscription to Pro or Elite to publish unlimited promotional deals!
          </p>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, idx) => (
          <div key={idx} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between p-6 relative group">
            {pkg.active && (
              <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 font-extrabold text-[8px] tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-100">
                Active Deal
              </span>
            )}
            {!pkg.active && (
              <span className="absolute top-4 right-4 bg-zinc-100 text-zinc-400 font-extrabold text-[8px] tracking-widest uppercase px-3 py-1 rounded-full">
                Paused
              </span>
            )}

            <div className="space-y-4 pt-4">
              <h3 className="font-extrabold text-base text-[#1A1C29] tracking-tight">{pkg.name}</h3>
              
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Services Included</span>
                <ul className="space-y-1.5">
                  {pkg.services.map((srv, sIdx) => (
                    <li key={sIdx} className="flex items-center gap-2 text-xs font-medium text-zinc-600">
                      <CheckCircle className="w-3.5 h-3.5 text-brand shrink-0" />
                      {srv}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-zinc-50 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  <Percent className="w-2.5 h-2.5 inline mr-0.5" /> {pkg.saving}
                </span>
                <div className="text-xl font-black text-brand">{pkg.price}</div>
              </div>
              
              <Button variant="outline" className="rounded-xl border-zinc-200 hover:bg-zinc-50 font-bold text-xs">
                Edit Package
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
