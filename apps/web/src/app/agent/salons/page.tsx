"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  UserPlus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchAgentSalonsList } from "@/app/actions/agent-lead-editor-data";
import { tryAgentData, fetchAgentSalonsListClient } from "@/lib/agent-client-data";
import { useAgentPortal } from "@/lib/agent-portal-provider";
import {
  getAgentSalonStatusClass,
  getAgentSalonStatusLabel,
  isAgentSalonActive,
  isAgentSalonLive,
} from "@/lib/agent-salons";
import { useRouter } from "next/navigation";

type SubscriptionPlanInfo = {
  name?: string | null;
  monthly_price?: number | null;
  intro_monthly_price?: number | null;
};

type AgentSalon = {
  id: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  phone?: string | null;
  category?: string | null;
  owner_gmail?: string | null;
  onboarding_status?: string | null;
  booking_enabled?: boolean | null;
  created_at?: string | null;
  subscription_plan_id?: string | null;
  subscription_plans?: SubscriptionPlanInfo | SubscriptionPlanInfo[] | null;
  subscription_charge?: number | null;
  subscription_currency?: string | null;
  subscription_billing_cycle?: string | null;
  subscription_plan_name?: string | null;
};

const lkr = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

function getSubscriptionPlan(salon: AgentSalon): SubscriptionPlanInfo | null {
  const plan = salon.subscription_plans;
  if (!plan) return null;
  return Array.isArray(plan) ? plan[0] ?? null : plan;
}

function getCycleSuffix(cycle?: string | null): string {
  if (!cycle) return "";
  return cycle.toLowerCase().startsWith("ann") ? "/yr" : "/mo";
}

type FilterTab = "all" | "active" | "needs_action" | "live";

export default function AgentSalons() {
  const router = useRouter();
  const { path } = useAgentPortal();
  const [salons, setSalons] = useState<AgentSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [agentEmail, setAgentEmail] = useState("");

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const res = await tryAgentData(fetchAgentSalonsList, fetchAgentSalonsListClient);
      if (!res.success) {
        toast.error(res.error || "Please log in as an agent.");
        return;
      }
      setAgentEmail(res.agentEmail);
      setSalons(res.salons);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load salons.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchSalons());
  }, []);

  const tabCounts = useMemo(
    () => ({
      all: salons.length,
      active: salons.filter((s) => isAgentSalonActive(s.onboarding_status)).length,
      needs_action: salons.filter((s) =>
        ["ASSIGNED_TO_AGENT", "AGENT_VERIFIED", "OWNER_INVITED"].includes(s.onboarding_status || "")
      ).length,
      live: salons.filter((s) => isAgentSalonLive(s.onboarding_status)).length,
    }),
    [salons]
  );

  const filteredSalons = useMemo(() => {
    return salons.filter((salon) => {
      const status = salon.onboarding_status || "ASSIGNED_TO_AGENT";
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "active" && isAgentSalonActive(status)) ||
        (activeTab === "needs_action" &&
          ["ASSIGNED_TO_AGENT", "AGENT_VERIFIED", "OWNER_INVITED"].includes(status)) ||
        (activeTab === "live" && isAgentSalonLive(status));

      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        (salon.name || "").toLowerCase().includes(query) ||
        (salon.phone || "").includes(query) ||
        (salon.address || "").toLowerCase().includes(query) ||
        (salon.owner_gmail || "").toLowerCase().includes(query) ||
        (salon.category || "").toLowerCase().includes(query);

      return matchesTab && matchesSearch;
    });
  }, [salons, activeTab, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">My Salons</h1>
          <p className="text-zinc-500 text-sm mt-1">
            All salons assigned to you
            {agentEmail ? ` (${agentEmail})` : ""}. Manage them in the Field Editor.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href={path("/leads/new")} className={buttonVariants({ className: "rounded-xl bg-[#ffde5a] hover:bg-[#E6E43A] text-black font-bold w-full sm:w-auto justify-center" })}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Salon
          </Link>
          <Link href={path("/leads")} className={buttonVariants({ variant: "outline", className: "rounded-xl border-zinc-200 w-full sm:w-auto justify-center" })}>
            Open Field Editor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total assigned", value: tabCounts.all },
          { label: "In progress", value: tabCounts.active },
          { label: "Needs action", value: tabCounts.needs_action },
          { label: "Live / verified", value: tabCounts.live },
        ].map((item) => (
          <Card key={item.label} className="p-4 border-none shadow-sm rounded-2xl bg-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{item.label}</p>
            <p className="text-2xl font-black text-[#1A1C29] mt-1">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["active", "In progress"],
                ["needs_action", "Needs action"],
                ["live", "Live"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  activeTab === key
                    ? "bg-[#ffde5a] text-black shadow-sm"
                    : "bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {label} ({tabCounts[key]})
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, Gmail..."
              className="w-full h-10 pl-10 pr-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a]/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin mr-3" />
            <span className="text-sm font-medium">Loading your assigned salons...</span>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="text-center py-20 px-6">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-600">No salons assigned yet</p>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Salons appear here when an admin assigns them to you in Admin → Leads, or when you add a manual lead.
            </p>
            <Link href={path("/leads/new")} className={buttonVariants({ className: "mt-4 rounded-xl" })}>
              Add your first salon
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/80 text-left">
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Salon</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Contact</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Owner Gmail</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">Subscription</th>
                  <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSalons.map((salon) => (
                  <tr key={salon.id} className="border-b border-zinc-50 hover:bg-zinc-50/60">
                    <td className="px-5 py-4 align-top">
                      <div className="font-bold text-zinc-900">{salon.name}</div>
                      <div className="text-xs text-zinc-500 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{salon.address || "No address"}</span>
                      </div>
                      {salon.category && (
                        <div className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase tracking-wide">
                          {salon.category}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getAgentSalonStatusClass(salon.onboarding_status)}`}
                      >
                        {getAgentSalonStatusLabel(salon.onboarding_status)}
                      </span>
                      {salon.booking_enabled && (
                        <div className="text-[10px] font-semibold text-emerald-600 mt-2">Bookings on</div>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-zinc-600">
                      {salon.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {salon.phone}
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-zinc-600">
                      {salon.owner_gmail ? (
                        <div className="flex items-center gap-1.5 break-all">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          {salon.owner_gmail}
                        </div>
                      ) : (
                        <span className="text-zinc-400">Not set</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top">
                      {(() => {
                        const charge = salon.subscription_charge;
                        if (charge == null) {
                          return (
                            <span className="text-xs text-zinc-400 font-semibold italic">
                              Not charged yet
                            </span>
                          );
                        }
                        const planName =
                          salon.subscription_plan_name || getSubscriptionPlan(salon)?.name;
                        return (
                          <div>
                            <div className="font-bold text-emerald-600">
                              {`${lkr.format(charge)}${getCycleSuffix(salon.subscription_billing_cycle)}`}
                            </div>
                            {planName && (
                              <div className="text-[10px] font-semibold text-zinc-400 mt-0.5 uppercase tracking-wide">
                                {planName}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <Link href={`${path("/leads")}?open=${salon.id}`} className={buttonVariants({ size: "sm", className: "rounded-lg h-8 text-xs font-bold" })}>
                          Manage
                        </Link>
                        {salon.slug && isAgentSalonLive(salon.onboarding_status) && (
                          <Link href={`/salons/${salon.slug}`} target="_blank" className={buttonVariants({ size: "sm", variant: "outline", className: "rounded-lg h-8 text-xs" })}>
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
