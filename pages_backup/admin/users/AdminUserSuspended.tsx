import { useState } from "react";
import { 
  UserMinus, 
  Search, 
  ShieldAlert, 
  FileText, 
  Mail, 
  Clock, 
  RefreshCcw, 
  Trash2, 
  AlertTriangle,
  History,
  MoreVertical,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const suspendedUsers = [
  { id: 1, name: "Style Hub Admin", email: "support@stylehub.lk", reason: "Fraudulent Transaction Flags", date: "2 days ago", risk: 85, status: "Reviewing Appeal" },
  { id: 2, name: "Kamal Gunaratne", email: "kamal.g@gmail.com", reason: "Violation of Terms (Scraping)", date: "1 week ago", risk: 92, status: "Permanent Ban Candidate" },
  { id: 3, name: "Express Groom", owner: "Dinesh Perera", email: "dinesh@express.lk", reason: "Multiple Customer Complaints", date: "3 days ago", risk: 64, status: "Suspended" },
];

export default function AdminUserSuspended() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <div className="flex items-center gap-3">
             <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                <UserMinus className="w-6 h-6" />
             </div>
             <div>
               <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Suspended Accounts</h1>
               <p className="text-zinc-500 text-sm mt-1">Review and manage restricted access and policy violations.</p>
             </div>
           </div>
        </div>
        <div className="bg-amber-50 px-4 py-2 rounded-xl flex items-center gap-3 border border-amber-100">
           <AlertTriangle className="w-5 h-5 text-amber-500" />
           <div className="text-xs font-bold text-amber-800">12 Critical Violations Detected This Week</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input placeholder="Search suspended users..." className="pl-12 h-14 bg-white border-zinc-100 shadow-sm rounded-2xl font-medium focus:ring-2 focus:ring-red-100 transition-all" />
           </div>

           <div className="space-y-4">
              {suspendedUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-[1.5rem] border border-zinc-100 p-6 shadow-sm hover:shadow-md hover:border-red-100 transition-all group overflow-hidden relative">
                   {user.risk > 80 && (
                     <div className="absolute top-0 right-0 p-3">
                        <Badge className="bg-red-500 text-white border-none text-[10px] uppercase font-bold tracking-widest">High Risk</Badge>
                     </div>
                   )}
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                         <Avatar className="h-14 w-14 ring-4 ring-zinc-50 shadow-sm">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                         </Avatar>
                         <div>
                            <h3 className="font-bold text-[#1A1C29] text-xl group-hover:text-red-600 transition-colors">{user.name}</h3>
                            <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mt-0.5">
                               <Mail className="w-3.5 h-3.5" /> {user.email}
                            </div>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                         <Button variant="outline" className="h-11 px-5 rounded-xl border-zinc-100 font-bold text-zinc-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100">
                            <RefreshCcw className="w-4 h-4 mr-2" /> Reactivate
                         </Button>
                         <Button className="h-11 w-11 p-0 rounded-xl bg-zinc-50 hover:bg-red-50 text-zinc-400 hover:text-red-500 border border-transparent transition-all">
                            <MoreVertical className="w-5 h-5" />
                         </Button>
                      </div>
                   </div>

                   <div className="mt-6 pt-6 border-t border-zinc-50 grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Suspension Reason</p>
                         <p className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-red-400" /> {user.reason}
                         </p>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Date & Duration</p>
                         <p className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-300" /> {user.date}
                         </p>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Risk Score</p>
                         <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                               <div className={`h-full rounded-full ${user.risk > 80 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${user.risk}%` }} />
                            </div>
                            <span className="text-sm font-bold text-[#1A1C29]">{user.risk}</span>
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="space-y-6">
           <div className="bg-[#1A1C29] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 opacity-10">
                 <ShieldAlert className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                 <h3 className="text-xl font-bold mb-2">Policy Enforcement</h3>
                 <p className="text-white/60 text-sm font-medium leading-relaxed mb-6">Automated rules correctly identified 84% of these violations before human review.</p>
                 
                 <div className="space-y-5 mb-8">
                    <PolicyStat label="Fraud Prevention" value={92} />
                    <PolicyStat label="Scraping Detection" value={78} />
                    <PolicyStat label="Duplicate IP Matching" value={45} />
                 </div>

                 <Button className="w-full h-14 bg-white text-[#1A1C29] font-bold rounded-2xl hover:scale-[1.02] transition-transform">
                    Configure Safety Engine
                 </Button>
              </div>
           </div>

           <div className="bg-white rounded-[2rem] p-6 border border-zinc-100 shadow-sm">
              <h3 className="font-bold text-[#1A1C29] mb-4 flex items-center gap-2">
                 <History className="w-5 h-5 text-zinc-400" /> Recent Appeals
              </h3>
              <div className="space-y-4">
                 <AppealRow user="Express Groom" msg="We didn't know multiple accounts were not allowed..." status="Under Review" />
                 <AppealRow user="Style Hub" msg="The payment failure was due to bank maintenance..." status="Urgent" />
                 <AppealRow user="User 2821" msg="Appeal rejected. Policy violation confirmed." status="Closed" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function PolicyStat({ label, value }: any) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-white/50">
          <span>{label}</span>
          <span className="text-white">{value}%</span>
       </div>
       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-red-400 rounded-full" style={{ width: `${value}%` }} />
       </div>
    </div>
  );
}

function AppealRow({ user, msg, status }: any) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 group cursor-pointer hover:bg-white hover:shadow-md hover:border-zinc-200 transition-all">
       <div className="flex justify-between items-center mb-1.5">
          <span className="font-bold text-sm text-[#1A1C29]">{user}</span>
          <Badge className={`text-[9px] font-bold uppercase border-none tracking-tighter ${
             status === 'Urgent' ? 'bg-red-50 text-red-500' : 
             status === 'Under Review' ? 'bg-blue-50 text-blue-500' :
             'bg-zinc-200 text-zinc-500'
          }`}>{status}</Badge>
       </div>
       <p className="text-xs text-zinc-400 font-medium line-clamp-1 italic group-hover:text-zinc-600 transition-colors">"{msg}"</p>
    </div>
  );
}
