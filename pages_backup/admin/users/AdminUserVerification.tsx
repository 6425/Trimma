import { useState } from "react";
import { 
  ShieldCheck, 
  FileText, 
  UserCheck, 
  Clock, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Filter,
  Search,
  Eye,
  Smartphone,
  Mail,
  Store,
  BadgeCheck,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const pendingVerifications = [
  { id: 1, name: "Luxury Curls Salon", owner: "Sarah Malik", type: "Business Registration", submittedDate: "1 hour ago", status: "Pending", priority: "High" },
  { id: 2, name: "Nuwan Abey", owner: "Nuwan Abey", type: "ID Verification", submittedDate: "3 hours ago", status: "In Review", priority: "Medium" },
  { id: 3, name: "Royal Barber Hub", owner: "Hemasiri Perera", type: "Salon Verification", submittedDate: "1 day ago", status: "Pending", priority: "Low" },
];

export default function AdminUserVerification() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Verification Center</h1>
          <p className="text-zinc-500 text-sm mt-1">Platform compliance and trust management portal.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
           <BadgeCheck className="w-5 h-5 text-emerald-500" />
           <span className="text-emerald-700 text-sm font-bold">98.4% Ecosystem Verified</span>
        </div>
      </div>

      {/* Verification Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <PipelineCard label="Identity Proofs" count={12} trend="pending" />
         <PipelineCard label="Business Entities" count={8} trend="review" />
         <PipelineCard label="Address Proofs" count={24} trend="pending" />
         <PipelineCard label="Phone/Email" count={142} trend="automated" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="xl:col-span-2 space-y-6">
           <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                 <h3 className="font-bold text-[#1A1C29]">Pending Verification Requests</h3>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-zinc-400"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                    <Button variant="ghost" size="sm" className="text-zinc-400"><Search className="w-4 h-4 mr-2" /> Search</Button>
                 </div>
              </div>
              <div className="divide-y divide-zinc-50">
                {pendingVerifications.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-zinc-50/50 transition-colors group flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 group-hover:bg-white group-hover:shadow-sm transition-all text-zinc-400 group-hover:text-[#D81E5B]">
                           {item.type.includes('Business') ? <Store className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                        <div>
                           <div className="font-bold text-[#1A1C29] text-base">{item.name}</div>
                           <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">{item.type}</span>
                              <span className="text-zinc-200">•</span>
                              <span className="text-xs text-zinc-500 font-medium italic">{item.owner}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="hidden lg:block text-right">
                           <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Submitted</div>
                           <div className="text-xs font-bold text-zinc-600 flex items-center gap-1.5 justify-end">
                              <Clock className="w-3 h-3 text-zinc-300" /> {item.submittedDate}
                           </div>
                        </div>
                        <Badge variant="outline" className={`h-7 px-3 rounded-full border-none font-bold text-[10px] shadow-none ${
                           item.priority === 'High' ? 'bg-red-50 text-red-600' : 
                           item.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                           'bg-zinc-100 text-zinc-600'
                        }`}>
                           {item.priority} Priority
                        </Badge>
                        <Button className="bg-[#1A1C29] hover:bg-black text-white h-9 px-4 rounded-lg font-bold text-xs gap-2">
                           Review <ChevronRight className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-zinc-50/50 border-t border-zinc-50 text-center">
                 <Button variant="ghost" className="text-xs font-bold text-[#D81E5B] uppercase tracking-widest px-8">All Verification History</Button>
              </div>
           </div>
        </div>

        {/* Status Breakdown & Automated Health */}
        <div className="space-y-6">
           <div className="bg-[#1A1C29] rounded-3xl p-6 text-white shadow-xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                 <ShieldCheck className="w-5 h-5 text-emerald-400" /> Compliance Status
              </h3>
              <div className="space-y-5">
                 <ComplianceRow label="KYC Completion" value={82} color="bg-emerald-400" />
                 <ComplianceRow label="Business Validation" value={64} color="bg-pink-400" />
                 <ComplianceRow label="Financial Auth" value={91} color="bg-blue-400" />
                 <ComplianceRow label="Contact Verified" value={45} color="bg-zinc-400" />
              </div>
              <div className="mt-8 pt-8 border-t border-white/5 border-dashed space-y-4">
                 <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-white/60 tracking-wider">Automated Tasks</span>
                       <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] border-none">Active</Badge>
                    </div>
                    <div className="text-sm font-medium text-white/80">3,452 Email auto-verifications processed in last 24h.</div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <h3 className="font-bold text-[#1A1C29] flex items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-amber-500" /> System Alerts
              </h3>
              <div className="space-y-1">
                 <AlertMsg msg="Mismatch in Sarah Malik's document ID vs account name." type="warning" />
                 <AlertMsg msg="Bulk salon upload detected without business licenses." type="danger" />
                 <AlertMsg msg="Compliance engine updated to Sri Lanka Central Bank v2.4 rules." type="info" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function PipelineCard({ label, count, trend }: any) {
  const colors = {
    pending: "text-amber-500 bg-amber-50",
    review: "text-blue-500 bg-blue-50",
    automated: "text-emerald-500 bg-emerald-50"
  };
  return (
    <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex flex-col items-center text-center">
       <div className={`p-2 rounded-xl mb-3 ${colors[trend as keyof typeof colors]}`}>
          {trend === 'pending' ? <Clock className="w-5 h-5" /> : 
           trend === 'review' ? <FileText className="w-5 h-5" /> : 
           <CheckCircle2 className="w-5 h-5" />}
       </div>
       <div className="text-2xl font-bold text-[#1A1C29]">{count}</div>
       <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">{label}</div>
    </div>
  );
}

function ComplianceRow({ label, value, color }: any) {
  return (
    <div className="space-y-1.5">
       <div className="flex justify-between text-xs font-bold">
          <span className="text-white/70">{label}</span>
          <span className="text-white">{value}%</span>
       </div>
       <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
       </div>
    </div>
  );
}

function AlertMsg({ msg, type }: any) {
  const icons = {
    warning: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
    danger: <XCircle className="w-3.5 h-3.5 text-red-500" />,
    info: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
  };
  return (
    <div className="flex gap-3 items-start py-2 group cursor-pointer hover:translate-x-1 transition-transform">
       <div className="mt-0.5">{icons[type as keyof typeof icons]}</div>
       <p className="text-xs text-zinc-500 font-medium leading-relaxed group-hover:text-zinc-800 transition-colors">{msg}</p>
    </div>
  );
}
