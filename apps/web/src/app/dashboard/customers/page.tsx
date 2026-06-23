"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Users, Search, Plus, Filter, Mail, Star, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchSalonCustomersPage } from "@/app/actions/salon-dashboard-data";

type SalonCustomer = {
  name: string;
  email: string;
  phone: string;
  isVip: boolean;
  loyaltyTier: string | null;
  loyaltyTierLabel: string | null;
  vipMinVisits: number | null;
  bookings: number;
  spent: string;
  rating: number;
  lastVisit: string;
};

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function buildWhatsAppHref(phone: string, customerName: string): string | null {
  if (!phone || phone === "-") return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `94${digits.slice(1)}`;
  else if (!digits.startsWith("94") && digits.length === 9) digits = `94${digits}`;
  const text = encodeURIComponent(`Hi ${customerName}, `);
  return `https://wa.me/${digits}?text=${text}`;
}

function buildGmailHref(email: string, customerName: string): string | null {
  if (!email || !email.includes("@")) return null;
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: email,
    su: "Message from your salon",
    body: `Hi ${customerName},\n\n`,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState<SalonCustomer[]>([]);
  const [vipMinVisits, setVipMinVisits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    void fetchSalonCustomersPage().then((res) => {
      if (res.success && res.customers) {
        setCustomers(res.customers);
        const vipRule = res.loyaltyRules?.find((rule) => rule.tier_key === "vip" && rule.enabled);
        setVipMinVisits(vipRule?.min_visits ?? null);
      }
      setLoading(false);
    });
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <Users className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Customer Database</h1>
            <p className="text-xs text-zinc-500">
              VIP badges and loyalty tiers are assigned automatically from visit rules in CRM.
            </p>
          </div>
        </div>

        <Button
          asChild
          className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20"
        >
          <Link href="/dashboard/crm">
            <Plus className="w-3.5 h-3.5" /> Loyalty rules
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Customers</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{loading ? "..." : customers.length} Clients</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">New This Month</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">
            {loading ? "..." : customers.filter((c) => new Date(c.lastVisit).getMonth() === new Date().getMonth()).length} Clients
          </h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">VIP Clients</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">
            {loading ? "..." : customers.filter((c) => c.isVip).length} Clients
          </h3>
          <span className="text-[9px] font-semibold text-brand bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">
            {vipMinVisits != null ? `${vipMinVisits}+ visits` : "Set rules in CRM"}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Rating</span>
          <h3 className="text-xl font-black text-amber-500 mt-1 flex items-center gap-1">
            5.0 <Star className="w-5 h-5 fill-amber-500 text-amber-500 inline" />
          </h3>
        </div>
      </div>

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

        <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                <th className="px-6 py-4">Client Detail</th>
                <th className="px-6 py-4">Loyalty</th>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                    Loading clients...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No clients found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const whatsappHref = buildWhatsAppHref(c.phone, c.name);
                  const gmailHref = buildGmailHref(c.email, c.name);

                  return (
                    <tr key={c.email} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-zinc-800">{c.name}</div>
                          {c.isVip && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Crown className="w-3 h-3" /> VIP
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          {c.email} • {c.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.loyaltyTierLabel ? (
                          <span className="inline-flex items-center rounded-md bg-black text-white text-[10px] font-bold px-2.5 py-1">
                            {c.loyaltyTierLabel}
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400 font-semibold">—</span>
                        )}
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
                          {whatsappHref ? (
                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`WhatsApp ${c.name}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </a>
                          ) : (
                            <span
                              title="No phone number on file"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-200 cursor-not-allowed"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </span>
                          )}
                          {gmailHref ? (
                            <a
                              href={gmailHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Gmail ${c.name}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-brand hover:bg-amber-50 transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span
                              title="No email on file"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-200 cursor-not-allowed"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
