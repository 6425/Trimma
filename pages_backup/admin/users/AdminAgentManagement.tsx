import { useState, useEffect } from "react";
import { 
  Trophy, 
  Target, 
  MapPin, 
  TrendingUp, 
  Zap, 
  Users, 
  Store, 
  ChevronRight,
  Search,
  Filter,
  BarChart3,
  Lock,
  Loader2,
  Mail,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/src/config/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function AdminAgentManagement() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("agents")
        .select(`*, profiles:user_id(full_name, email, avatar_url)`)
        .order("performance_score", { ascending: false });
      
      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (agentId: string, email: string) => {
    if (!email) return toast.error("No email associated with this agent");
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Password reset email sent to " + email);
    } catch (error: any) {
      toast.error("Failed to initiate reset: " + error.message);
    }
  };

  const filteredAgents = agents.filter(a => 
    (a.profiles?.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (a.territory?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Agent Performance</h1>
          <p className="text-zinc-500 text-sm mt-1">Monitor conversion rates, territory coverage and commission payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => navigate("/admin/users/create?role=agent")}
            className="bg-[#D81E5B] text-white hover:bg-[#BF1A50] font-bold rounded-xl flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Add New Agent
          </Button>
          <Button variant="outline" className="border-zinc-200 rounded-xl font-bold">Territory Map</Button>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {loading ? (
           Array(3).fill(0).map((_, i) => (
             <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-3xl" />
           ))
         ) : agents.length === 0 ? (
           <div className="col-span-3 py-12 text-center text-zinc-400 bg-white rounded-3xl border border-dashed border-zinc-200">
             No agents found. Add your first field agent.
           </div>
         ) : (
           agents.slice(0, 3).map((agent, index) => (
             <div key={agent.id} className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm relative overflow-hidden group border border-transparent hover:border-rose-100 transition-all">
                {index === 0 && (
                  <div className="absolute top-0 right-0 p-4">
                    <Trophy className="w-8 h-8 text-amber-400 opacity-20 group-hover:scale-125 transition-transform" />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-4">
                   <Avatar className="h-14 w-14 ring-4 ring-zinc-50 translate-z-0">
                      <AvatarImage src={agent.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.profiles?.full_name || agent.id}`} />
                      <AvatarFallback>{(agent.profiles?.full_name || "A")[0]}</AvatarFallback>
                   </Avatar>
                   <div>
                      <h3 className="font-bold text-[#1A1C29] truncate max-w-[150px]">{agent.profiles?.full_name || "New Agent"}</h3>
                      <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{agent.territory || "Unassigned"}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Performs Score</span>
                      <span className="text-xl font-black text-[#D81E5B]">{agent.performance_score || 0}%</span>
                   </div>
                   <Progress value={agent.performance_score || 0} className="h-2 bg-zinc-100" />
                   <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-zinc-50 rounded-xl p-3">
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Territory</p>
                         <p className="font-bold text-zinc-900 truncate">{agent.territory || "N/A"}</p>
                      </div>
                      <div className="bg-zinc-50 rounded-xl p-3">
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Status</p>
                         <p className="font-bold text-emerald-600">Active</p>
                      </div>
                   </div>
                </div>
             </div>
           ))
         )}
      </div>

      {/* Agents List Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden mt-8">
         <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
            <h3 className="font-bold text-[#1A1C29]">Full Field Force Discovery</h3>
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search agents..." 
                    className="pl-10 h-10 border-zinc-100 bg-zinc-50 rounded-xl" 
                  />
               </div>
               <Button variant="ghost" size="icon" className="text-zinc-400"><Filter className="w-5 h-5" /></Button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                     <th className="px-8 py-5">Agent Identity</th>
                     <th className="px-8 py-5">Core Territory</th>
                     <th className="px-8 py-5">Performance Ratio</th>
                     <th className="px-8 py-5">Contact</th>
                     <th className="px-8 py-5">Status</th>
                     <th className="px-8 py-5">Security</th>
                     <th className="px-8 py-5 text-right">Terminal</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-zinc-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        Scanning agent directory...
                      </td>
                    </tr>
                  ) : filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-zinc-400">
                        No agents matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((agent: any) => (
                      <tr key={agent.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                 <AvatarImage src={agent.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.profiles?.full_name || agent.id}`} />
                                 <AvatarFallback>{(agent.profiles?.full_name || "A")[0]}</AvatarFallback>
                              </Avatar>
                              <div className="font-bold text-[#1A1C29]">{agent.profiles?.full_name || "New Agent"}</div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-sm text-zinc-600 font-medium">
                              <MapPin className="w-4 h-4 text-zinc-300" /> {agent.territory || "Unassigned"}
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 w-24 bg-zinc-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#D81E5B]" style={{ width: `${agent.performance_score || 0}%` }} />
                              </div>
                              <span className="text-xs font-bold text-zinc-900">{agent.performance_score || 0}%</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-2 text-zinc-500">
                              <Mail className="w-4 h-4 text-zinc-300" />
                              <span className="text-xs font-medium truncate max-w-[120px]">{agent.profiles?.email || "N/A"}</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 font-bold text-[10px]">Active Field</Badge>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5">
                                 <Lock className="w-3 h-3 text-zinc-400" />
                                 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">Admin Managed</span>
                              </div>
                              <span className="text-[9px] text-zinc-400 font-medium italic">Verified Identity</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="flex items-center justify-end gap-2 text-zinc-400">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="font-bold text-zinc-400 hover:text-[#D81E5B] hover:bg-zinc-100 h-8 px-3 rounded-lg"
                               onClick={() => handleResetPassword(agent.id, agent.profiles?.email)}
                             >
                               Reset Password
                             </Button>
                             <Button variant="ghost" size="sm" className="font-bold text-[#D81E5B] hover:bg-rose-50 h-8 px-3 rounded-lg">Details</Button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
