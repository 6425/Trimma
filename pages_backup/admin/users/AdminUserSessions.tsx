import { useState } from "react";
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  Clock, 
  ShieldCheck, 
  MapPin, 
  X, 
  LogOut, 
  UserCircle2, 
  Search,
  Filter,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const activeSessions = [
  { id: 1, user: "Thusitha J.", role: "Admin", device: "Desktop", browser: "Chrome / macOS", location: "Colombo, LK", ip: "192.168.1.1", time: "Just now", current: true },
  { id: 2, user: "Amal Perera", role: "Salon Owner", device: "Mobile", browser: "Mobile Safari / iOS", location: "Kandy, LK", ip: "202.145.1.20", time: "12 mins ago", current: false },
  { id: 3, user: "Nuwan Abey", role: "Agent", device: "Tablet", browser: "Chrome / iPadOS", location: "Galle, LK", ip: "45.12.9.11", time: "1 hour ago", current: false },
  { id: 4, user: "Sarah Malik", role: "Salon Owner", device: "Desktop", browser: "Firefox / Windows", location: "Colombo, LK", ip: "103.24.1.22", time: "3 hours ago", current: false },
];

export default function AdminUserSessions() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Access Control & Sessions</h1>
          <p className="text-zinc-500 text-sm mt-1">Monitor active login sessions and enforce security boundaries.</p>
        </div>
        <Button className="bg-[#1A1C29] hover:bg-black text-white h-11 px-6 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2">
           <LogOut className="w-4 h-4" /> Terminate All Other Sessions
        </Button>
      </div>

      {/* Security Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard label="Current Active" value="1,204" icon={<ActivityIcon />} />
         <StatCard label="Peak Today" value="2,480" icon={<TrendingIcon />} />
         <StatCard label="Unique IPs" value="842" icon={<GlobeIcon />} />
         <StatCard label="Failed Attempts" value="12" icon={<AlertIcon />} isWarning />
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden">
         <div className="p-8 border-b border-zinc-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h3 className="text-xl font-bold text-[#1A1C29]">Real-time Session Monitor</h3>
            <div className="flex items-center gap-3">
               <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input placeholder="Search sessions..." className="pl-10 h-11 bg-zinc-50 border-none rounded-2xl" />
               </div>
               <Button variant="ghost" className="h-11 px-4 text-zinc-500 font-bold border border-zinc-100 rounded-2xl">
                  <Filter className="w-4 h-4 mr-2" /> Filters
               </Button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-zinc-50/50 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                     <th className="px-8 py-5">Verified Identity</th>
                     <th className="px-8 py-5">Device & Environment</th>
                     <th className="px-8 py-5">Precision Location</th>
                     <th className="px-8 py-5">Network IP</th>
                     <th className="px-8 py-5">Lifecycle</th>
                     <th className="px-8 py-5 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50">
                  {activeSessions.map((session) => (
                    <tr key={session.id} className={`hover:bg-zinc-50/50 transition-colors group ${session.current ? 'bg-zinc-50/30' : ''}`}>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm ring-offset-0">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user}`} />
                                <AvatarFallback>{session.user.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <div>
                                <div className="font-bold text-[#1A1C1A] text-sm flex items-center gap-1.5">
                                   {session.user}
                                   {session.current && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                                </div>
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{session.role}</div>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-zinc-100 rounded-xl text-zinc-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                                {session.device === 'Desktop' ? <Monitor className="w-4 h-4" /> : 
                                 session.device === 'Mobile' ? <Smartphone className="w-4 h-4" /> : 
                                 <Monitor className="w-4 h-4 rotate-180" />}
                             </div>
                             <div className="font-bold text-zinc-600 text-sm">{session.browser}</div>
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                             <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {session.location}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="text-[11px] font-mono font-bold text-zinc-400">{session.ip}</div>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500" />
                             <span className="text-xs font-bold text-emerald-600">{session.time}</span>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          {session.current ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 font-bold">This Device</Badge>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors">
                               Terminated Session
                            </Button>
                          )}
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <div className="bg-gradient-to-br from-[#1A1C29] to-[#2D3047] rounded-[2.5rem] p-10 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-48 h-48" />
         </div>
         <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-extrabold mb-4 leading-tight">Advanced Session Hardening</h2>
            <p className="text-white/70 text-lg font-medium leading-relaxed">Force all administrative users to re-authenticate every 24 hours and restrict logins specifically to Sri Lankan IP addresses.</p>
            <div className="flex items-center gap-6 mt-8">
               <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                     <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold">Geo-Fencing Enabled</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                     <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span className="text-sm font-bold">2FA Required</span>
               </div>
            </div>
         </div>
         <Button className="h-14 px-8 bg-white text-[#1A1C29] font-extrabold rounded-2xl hover:scale-110 transition-transform relative z-10 shadow-xl">
            Update Security Protocol
         </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isWarning }: any) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
       <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
          <h2 className="text-2xl font-bold text-[#1A1C29] mt-1">{value}</h2>
       </div>
       <div className={`p-3 rounded-xl ${isWarning ? 'bg-red-50 text-red-500' : 'bg-zinc-50 text-zinc-400'}`}>
          {icon}
       </div>
    </div>
  );
}

function ActivityIcon() { return <Monitor className="w-5 h-5" />; }
function TrendingIcon() { return <ArrowUpRight className="w-5 h-5" />; }
function GlobeIcon() { return <Globe className="w-5 h-5" />; }
function AlertIcon() { return <ShieldAlert className="w-5 h-5" />; }
