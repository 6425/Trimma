import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  MoreVertical,
  Loader2,
  ScanSearch,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/src/config/supabase";
import { toast } from "sonner";

const STAGES = ["new", "assigned", "contacted", "converted", "rejected"];

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select(`
          *,
          city:cities(name),
          category:categories(name),
          agent:agents(user_id)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Failed to load leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getLeadsByStage = (stage: string) => {
    return leads.filter(l => l.status === stage && 
      (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       l.phone.includes(searchTerm))
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Lead Intelligence Terminal</h1>
          <p className="text-zinc-500 text-sm mt-1">Acquire, assign and convert salon opportunities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-200 rounded-xl font-bold h-11">
             Import Bulk Leads
          </Button>
          <Button className="bg-[#1A1C29] hover:bg-zinc-800 text-white rounded-xl font-bold h-11 px-6 shadow-lg shadow-[#1A1C29]/20 flex items-center gap-2">
            <ScanSearch className="w-4 h-4" /> Discover via Maps API
          </Button>
        </div>
      </div>

      {/* Filter & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">Total Leads</p>
            <p className="text-xl font-black text-[#1A1C29]">{leads.length}</p>
          </div>
        </Card>
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">Conversion</p>
            <p className="text-xl font-black text-[#1A1C29]">
               {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0}%
            </p>
          </div>
        </Card>
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by salon name or contact number..." 
            className="w-full pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-[#D81E5B]/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* Pipeline View */}
      <div className="flex gap-6 overflow-x-auto pb-8 -mx-8 px-8 min-h-[600px]">
        {STAGES.map((stage) => {
          const stageLeads = getLeadsByStage(stage);
          return (
            <div key={stage} className="min-w-[300px] w-[300px] flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`border-none font-bold uppercase text-[10px] tracking-widest px-2 ${
                    stage === 'converted' ? 'bg-emerald-50 text-emerald-600' :
                    stage === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    stage === 'new' ? 'bg-blue-50 text-blue-600' :
                    'bg-zinc-100 text-zinc-500'
                  }`}>
                    {stage}
                  </Badge>
                  <span className="text-zinc-300 font-bold text-xs">{stageLeads.length}</span>
                </div>
                <Button variant="ghost" size="icon" className="w-6 h-6 rounded-lg text-zinc-300">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <div className="flex-1 flex flex-col gap-3">
                {loading ? (
                  <div className="p-8 flex flex-col items-center justify-center opacity-20">
                     <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  </div>
                ) : stageLeads.length === 0 ? (
                  <div className="p-8 rounded-3xl border-2 border-dashed border-zinc-50 flex items-center justify-center text-zinc-200">
                    <Target className="w-8 h-8 opacity-20" />
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <Card key={lead.id} className="p-5 border-none shadow-sm rounded-2xl bg-white hover:shadow-xl hover:shadow-[#D81E5B]/5 transition-all group relative cursor-pointer">
                       <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4 text-zinc-300" />
                       </div>
                       <div className="mb-4">
                          <h4 className="font-bold text-[#1A1C29] line-clamp-1">{lead.name}</h4>
                          <p className="text-[10px] font-bold text-zinc-400 flex items-center gap-1 mt-1">
                             <MapPin className="w-3 h-3" /> {lead.city?.name || "Global"}
                          </p>
                       </div>
                       <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                             <Phone className="w-3 h-3 text-zinc-300" /> {lead.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                             <Clock className="w-3 h-3 text-zinc-300" /> 
                             {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                       </div>
                       <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                          <div className="flex -space-x-2">
                             <div className="w-6 h-6 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                                {lead.agent ? "A" : "?"}
                             </div>
                          </div>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-zinc-300 group-hover:text-[#D81E5B] group-hover:bg-rose-50">
                             <ArrowRight className="w-4 h-4" />
                          </Button>
                       </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
