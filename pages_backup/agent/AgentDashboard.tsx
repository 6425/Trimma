import { 
  Users, CalendarDays, Rocket, PhoneCall,
  ArrowUpRight, Target, Plus, CheckCircle2, AlertCircle, Phone, MessageCircle, Navigation2, MapPin
} from "lucide-react";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function AgentDashboard() {
  return (
    <div className="space-y-6 lg:space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 mb-1">Agent Cockpit</h1>
          <p className="text-zinc-500 font-medium text-sm">Convert leads into active subscriptions.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none h-10 rounded-lg text-zinc-700 font-semibold border-slate-200">
            <Plus className="w-4 h-4 mr-2" /> Manual Lead
          </Button>
          <Button className="flex-1 sm:flex-none h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <PhoneCall className="w-4 h-4 mr-2" /> Start Calls
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { title: "Assigned Leads", value: "24", trend: "5 new today", icon: <Users className="w-5 h-5 text-indigo-500" /> },
          { title: "Active Evts", value: "12", trend: "In pipeline", icon: <Rocket className="w-5 h-5 text-amber-500" /> },
          { title: "Converted", value: "6", trend: "+2 this week", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
          { title: "Exp. Commission", value: "Rs 48K", trend: "Monthly target: 60K", icon: <Target className="w-5 h-5 text-sky-500" /> },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${
              i === 0 ? 'bg-indigo-500' :
              i === 1 ? 'bg-amber-500' :
              i === 2 ? 'bg-emerald-500' : 'bg-sky-500'
            }`} />
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">{kpi.icon}</div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight mb-1">{kpi.value}</div>
            <div className="text-xs lg:text-sm font-medium text-zinc-500">{kpi.title}</div>
            <div className="text-[10px] lg:text-xs text-zinc-400 font-semibold mt-2 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" /> {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* ACTION PANEL & LEADS (Left / Broader) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Actions */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
             <div className="flex items-center gap-2 mb-4">
               <AlertCircle className="w-5 h-5 text-emerald-600" />
               <h2 className="text-lg font-bold text-emerald-900">Today's Priorities</h2>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               <div className="bg-white rounded-xl p-4 border border-emerald-100/50 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                  <div>
                    <div className="font-bold text-zinc-900">Call 5 Leads</div>
                    <div className="text-xs font-medium text-zinc-500">From New Leads queue</div>
                  </div>
                  <PhoneCall className="w-5 h-5 text-emerald-500" />
               </div>
               <div className="bg-white rounded-xl p-4 border border-emerald-100/50 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-300 transition-colors">
                  <div>
                    <div className="font-bold text-zinc-900">Follow up 3 Salons</div>
                    <div className="text-xs font-medium text-zinc-500">Demo Scheduled stage</div>
                  </div>
                  <MessageCircle className="w-5 h-5 text-amber-500" />
               </div>
             </div>
          </div>

          {/* Lead List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 lg:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Hot Leads</h2>
                <p className="text-sm text-zinc-500 mt-0.5">High conversion probability</p>
              </div>
              <Link to="/agent/pipeline" className="text-sm font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                Kanban View &rarr;
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { name: "Glam Studio", loc: "Colombo 05", phone: "077 123 4567", rating: 4.8, status: "New", score: 92 },
                { name: "The Velvet Room", loc: "Colombo 03", phone: "071 987 6543", rating: 4.9, status: "Contacted", score: 88 },
                { name: "Urban Groomers", loc: "Nugegoda", phone: "070 555 1234", rating: 4.5, status: "Demo Scheduled", score: 82 },
              ].map((lead, i) => (
                <div key={i} className="p-4 lg:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-zinc-900 text-base">{lead.name}</h3>
                      <Badge variant="secondary" className={`shadow-none font-semibold text-xs ${
                        lead.status === 'New' ? 'bg-sky-50 text-sky-600 border-none' :
                        lead.status === 'Contacted' ? 'bg-amber-50 text-amber-600 border-none' :
                        'bg-indigo-50 text-indigo-600 border-none'
                      }`}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                      <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {lead.loc}</span>
                      <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> {lead.phone}</span>
                    </div>
                    {lead.score > 90 && (
                      <div className="text-xs font-semibold text-emerald-600 flex items-center">
                        <Target className="w-3.5 h-3.5 mr-1" /> Hot Lead ({lead.score}/100)
                      </div>
                    )}
                  </div>
                  
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <Button size="sm" className="flex-1 bg-zinc-900 text-white rounded-lg h-9">
                      <PhoneCall className="w-3.5 h-3.5 mr-1.5" /> Call
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-slate-200 text-green-600 font-semibold rounded-lg h-9 hover:bg-green-50">
                      <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PROSPECTING & TERRITORY (Right Column) */}
        <div className="space-y-6">
          
          <div className="bg-zinc-900 text-white rounded-2xl shadow-sm p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Map className="w-24 h-24" />
             </div>
             <div className="relative z-10">
               <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-none">Sales Territory</Badge>
               <h3 className="font-bold text-xl mb-1">Colombo Region</h3>
               <p className="text-zinc-400 text-sm mb-6">Districts: Colombo 03, 04, 05, Nugegoda</p>
               
               <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold h-11 rounded-xl">
                 <Navigation2 className="w-4 h-4 mr-2" /> Find Nearby Salons
               </Button>
             </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
             <h3 className="font-bold text-zinc-900 text-lg border-b border-slate-100 pb-3">Upcoming Tasks</h3>
             
             {[
               { task: "Call: Glam Studio", time: "10:00 AM", type: "call" },
               { task: "Follow-up: Style Lounge", time: "2:00 PM", type: "msg" },
               { task: "Visit: Elite Salon", time: "4:30 PM", type: "visit" }
             ].map((task, i) => (
               <div key={i} className="flex items-center gap-3">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                   task.type === 'call' ? 'bg-sky-100 text-sky-600' :
                   task.type === 'msg' ? 'bg-amber-100 text-amber-600' :
                   'bg-indigo-100 text-indigo-600'
                 }`}>
                   {task.type === 'call' ? <PhoneCall className="w-4 h-4" /> :
                    task.type === 'msg' ? <MessageCircle className="w-4 h-4" /> :
                    <MapPin className="w-4 h-4" />}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="font-semibold text-sm text-zinc-900 truncate">{task.task}</div>
                   <div className="text-xs text-zinc-500">{task.time}</div>
                 </div>
                 <Badge variant="outline" className="border-slate-200 text-zinc-500 hover:bg-slate-50 cursor-pointer">Done</Badge>
               </div>
             ))}
          </div>

        </div>

      </div>
    </div>
  );
}
