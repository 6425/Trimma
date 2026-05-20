import { Outlet } from "react-router-dom";
import { 
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function AdminUserManagement() {
  const [isAiOpen, setIsAiOpen] = useState(true);

  return (
    <div className="flex h-[calc(100vh-140px)] -m-4 sm:-m-6 lg:-m-8 bg-zinc-50 overflow-hidden relative">
      {/* Main Module Content */}
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
           <Outlet />
        </div>
      </main>

      {/* AI Insights Right Panel */}
      <aside className={`bg-white border-l border-zinc-100 transition-all duration-300 flex flex-col hidden xl:flex ${isAiOpen ? 'w-80' : 'w-0'}`}>
         {isAiOpen && (
           <div className="h-full flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b border-zinc-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Sparkles className="w-5 h-5 text-[#D81E5B]" />
                   <h3 className="font-bold text-[#1A1C29]">AI Co-Pilot</h3>
                </div>
                <button onClick={() => setIsAiOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                   <ChevronRight className="w-5 h-5" />
                </button>
             </div>
             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                   <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Platform Pulse</div>
                   <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                      <p className="text-sm font-bold text-zinc-900 mb-1">High Velocity Signups</p>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">Western Province is seeing a 2x increase in salon owner signups today.</p>
                      <div className="mt-3 flex items-center gap-2">
                         <Badge className="bg-[#D81E5B] text-white border-none text-[9px] px-2 py-0">Action Recommended</Badge>
                      </div>
                   </div>
                   <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100">
                      <p className="text-sm font-bold text-zinc-900 mb-1">Risk Alert</p>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">Possible sybil attack detected. 12 accounts created from same subnet.</p>
                      <div className="mt-3 flex items-center gap-2">
                         <Badge className="bg-amber-500 text-white border-none text-[9px] px-2 py-0">Under Review</Badge>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-50">
                   <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Recommended Actions</div>
                   <button className="w-full flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl hover:shadow-md transition-all group">
                      <span className="text-xs font-bold text-zinc-700 group-hover:text-[#D81E5B]">Verify Sarah's Salon</span>
                      <ChevronRight className="w-4 h-4 text-zinc-300" />
                   </button>
                   <button className="w-full flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl hover:shadow-md transition-all group">
                      <span className="text-xs font-bold text-zinc-700 group-hover:text-[#D81E5B]">Audit Agent Nuwan</span>
                      <ChevronRight className="w-4 h-4 text-zinc-300" />
                   </button>
                </div>

                <div className="mt-auto pt-8">
                   <div className="bg-gradient-to-br from-[#4A154B] to-[#1A1C1A] text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                      <Sparkles className="absolute top-[-20%] right-[-20%] w-32 h-32 opacity-10" />
                      <p className="text-[10px] font-bold opacity-50 uppercase mb-2">Trimma IQ</p>
                      <p className="text-sm font-bold mb-4 leading-tight">"Platform health is optimal. Processing 1.2k events/sec."</p>
                      <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                         <div className="h-full bg-pink-500 w-3/4 animate-pulse" />
                      </div>
                   </div>
                </div>
             </div>
           </div>
         )}
      </aside>
      
      {!isAiOpen && (
        <button 
          onClick={() => setIsAiOpen(true)}
          className="absolute right-4 bottom-4 bg-[#D81E5B] text-white p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform hidden xl:flex"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
