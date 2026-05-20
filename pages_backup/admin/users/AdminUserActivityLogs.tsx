import { useState } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ShieldAlert, 
  UserCircle2, 
  Monitor, 
  Globe, 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Terminal,
  Calendar,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const logs = [
  { id: 1, admin: "Thusitha J.", action: "Role Modified", target: "Nuwan A.", details: "Changed role from 'Agent' to 'Regional Admin'", time: "Today, 10:24 AM", ip: "192.168.1.1", severity: "Medium" },
  { id: 2, admin: "System", action: "Account Suspended", target: "Manager 404", details: "Auto-suspended due to 15+ failed login attempts", time: "Today, 09:12 AM", ip: "103.24.1.22", severity: "High" },
  { id: 3, admin: "Kasun P.", action: "Settings Updated", target: "Platform", details: "Changed 'Western Province' lead extraction density", time: "Yesterday, 11:45 PM", ip: "45.12.9.1", severity: "Low" },
  { id: 4, admin: "Thusitha J.", action: "Bulk Export", target: "Customer Emails", details: "Exported 5,000 records for marketing audit", time: "Yesterday, 04:30 PM", ip: "192.168.1.1", severity: "Medium" },
  { id: 5, admin: "System", action: "API Key Rotated", target: "Maps API", details: "Automatic monthly security rotation", time: "May 14, 2026", ip: "Internal", severity: "Low" },
];

export default function AdminUserActivityLogs() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Audit & Traceability</h1>
          <p className="text-zinc-500 text-sm mt-1">Complete historical record of all administrative and sensitive actions.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="h-10 rounded-xl border-zinc-200">
              <Download className="w-4 h-4 mr-2" /> Export Logs
           </Button>
           <Button variant="outline" className="h-10 w-10 flex items-center justify-center rounded-xl border-zinc-200 p-0 text-zinc-400">
              <RefreshCw className="w-4 h-4" />
           </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
         <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
               <Input placeholder="Search by admin or action..." className="pl-10 h-11 bg-zinc-50 border-none rounded-2xl" />
            </div>
            <div className="relative w-full sm:w-48">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
               <Input placeholder="All Time" className="pl-10 h-11 bg-zinc-50 border-none rounded-2xl cursor-pointer" readOnly />
            </div>
            <Button variant="ghost" className="h-11 px-6 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-50">
               <Filter className="w-4 h-4 mr-2" /> More Filters
            </Button>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
               {[1, 2, 3].map(i => (
                 <Avatar key={i} className="h-8 w-8 ring-2 ring-white ring-offset-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin${i}`} />
                 </Avatar>
               ))}
            </div>
            <span className="text-xs font-bold text-zinc-400">Tracked Admins</span>
         </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-zinc-50/50 text-[11px] font-bold text-zinc-400 uppercase tracking-[0.15em]">
                     <th className="px-8 py-5">Initiator</th>
                     <th className="px-8 py-5">Operational Action</th>
                     <th className="px-8 py-5">Target Entity</th>
                     <th className="px-8 py-5 flex items-center gap-2">Data Context <Terminal className="w-3 h-3 text-zinc-300" /></th>
                     <th className="px-8 py-5">Metadata (IP/Time)</th>
                     <th className="px-8 py-5 text-right">Risk</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-50/30 transition-colors group">
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] ${
                               log.admin === 'System' ? 'bg-[#1A1C29] text-white' : 'bg-white border border-zinc-100 text-zinc-500 shadow-sm'
                             }`}>
                                {log.admin === 'System' ? <Monitor className="w-4 h-4" /> : log.admin.charAt(0)}
                             </div>
                             <div className="font-bold text-[#1A1C29] text-sm">{log.admin}</div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className={`p-1.5 rounded-lg ${
                               log.action.includes('Suspended') ? 'bg-red-50 text-red-500' : 
                               log.action.includes('Role') ? 'bg-blue-50 text-blue-500' :
                               'bg-zinc-100 text-zinc-400'
                             }`}>
                                {log.action.includes('Suspended') ? <ShieldAlert className="w-3.5 h-3.5" /> : 
                                 log.action.includes('Role') ? <UserCheck className="w-3.5 h-3.5" /> :
                                 <Activity className="w-3.5 h-3.5" />}
                             </div>
                             <span className="font-bold text-zinc-700 text-sm">{log.action}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <Badge variant="outline" className="bg-white border-zinc-100 text-zinc-500 font-bold px-2 py-0.5 rounded-lg text-[10px] shadow-none">
                             {log.target}
                          </Badge>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                             <p className="text-sm font-medium text-zinc-500 italic max-w-xs truncate">"{log.details}"</p>
                             <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-300 uppercase italic"><Globe className="w-2.5 h-2.5" /> Sri Lanka</div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-300 uppercase italic"><Monitor className="w-2.5 h-2.5" /> Chrome/macOS</div>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="space-y-1">
                             <div className="text-[11px] font-bold text-[#1A1C29]">{log.time}</div>
                             <div className="text-[10px] font-mono text-zinc-400">{log.ip}</div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <Badge className={`rounded-xl border-none font-bold text-[10px] shadow-none uppercase tracking-tighter ${
                             log.severity === 'High' ? 'bg-red-500 text-white' : 
                             log.severity === 'Medium' ? 'bg-amber-100 text-amber-700' :
                             'bg-zinc-100 text-zinc-400'
                          }`}>
                             {log.severity}
                          </Badge>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>

         {/* Footer Pagination */}
         <div className="px-8 py-5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Page 1 of 42</div>
            <div className="flex items-center gap-2">
               <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-zinc-100 bg-white shadow-sm hover:translate-x-[-1px] transition-transform">
                  <ChevronLeft className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-zinc-100 bg-white shadow-sm hover:translate-x-[1px] transition-transform">
                  <ChevronRight className="w-4 h-4" />
               </Button>
            </div>
         </div>
      </div>

      {/* Operational Efficiency Tip */}
      <div className="bg-gradient-to-r from-[#D81E5B]/10 to-[#4A154B]/10 rounded-2xl p-6 border border-white flex items-center gap-6">
         <div className="p-3 bg-[#D81E5B] text-white rounded-2xl shadow-lg shadow-[#D81E5B]/20">
            <AlertTriangle className="w-6 h-6" />
         </div>
         <div>
            <h4 className="font-bold text-[#1A1C29]">Operational Anomaly Detected</h4>
            <p className="text-sm text-zinc-500 font-medium">3 administrative sessions are active from different IP ranges within Western Province. Verify if this matches current on-field agent activity.</p>
         </div>
         <Button className="ml-auto bg-[#1A1C29] text-white rounded-xl h-11 px-6 font-bold hover:scale-105 transition-transform">Verify Sessions</Button>
      </div>
    </div>
  );
}
