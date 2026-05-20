"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Home, CheckSquare, Map, UserPlus, Target, 
  Wallet, MapPin, PhoneCall, User, LogOut, Search,
  KanbanSquare
} from "lucide-react";
import { supabase } from "@/config/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const menuSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/agent", icon: <Home className="w-4 h-4" /> },
      ]
    },
    {
      title: "Leads & Pipeline",
      items: [
        { name: "My Leads", path: "/agent/leads", icon: <CheckSquare className="w-4 h-4" /> },
        { name: "Pipeline Board", path: "/agent/pipeline", icon: <KanbanSquare className="w-4 h-4" /> },
      ]
    },
    {
      title: "Prospecting",
      items: [
        { name: "Discover Salons", path: "/agent/discover", icon: <Map className="w-4 h-4" /> },
        { name: "Add Manual Lead", path: "/agent/leads/new", icon: <UserPlus className="w-4 h-4" /> },
      ]
    },
    {
      title: "Performance",
      items: [
        { name: "Commissions", path: "/agent/commissions", icon: <Wallet className="w-4 h-4" /> },
        { name: "My Territory", path: "/agent/territory", icon: <MapPin className="w-4 h-4" /> },
      ]
    },
    {
      title: "Activity",
      items: [
        { name: "Tasks & Calls", path: "/agent/tasks", icon: <PhoneCall className="w-4 h-4" /> },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans text-slate-900">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-zinc-900 text-white z-50 flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800 shrink-0">
          <Link href="/agent" className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
              <span className="text-zinc-900 text-xs text-black">A</span>
            </div>
            Trimma Sales
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 hide-scrollbar">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-3 mb-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive = pathname === item.path || (item.path !== '/agent' && pathname.startsWith(item.path));
                return (
                  <Link key={item.name}
                    href={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    }`}
                  >
                    <span className={isActive ? "text-emerald-400" : "text-zinc-500"}>{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-zinc-800 shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-2 w-full rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent">
             <Avatar className="w-9 h-9 border border-zinc-700">
               <AvatarFallback className="bg-zinc-800 text-emerald-400 text-xs font-bold">AK</AvatarFallback>
             </Avatar>
             <div className="flex-1 min-w-0 text-left">
               <div className="text-sm font-bold text-white truncate">Agent Kasun</div>
               <div className="text-xs text-zinc-500 truncate">Colombo Region</div>
             </div>
             <LogOut className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col pb-20 lg:pb-0">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8">
           <div className="text-sm font-bold text-zinc-900 hidden sm:block">
             Sales Operating System
           </div>
           
           <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
              <div className="flex items-center px-3 py-1.5 bg-slate-100 rounded-full flex-1 sm:w-64 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search leads, salons..." 
                  className="bg-transparent border-none outline-none text-sm w-full"
                />
              </div>
           </div>
        </header>

        {/* Page Content */}
        <div className="p-4 lg:p-8 flex-1">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {[
          { name: "Home", path: "/agent", icon: <Home className="w-6 h-6" /> },
          { name: "Pipeline", path: "/agent/pipeline", icon: <KanbanSquare className="w-6 h-6" /> },
          { name: "Discover", path: "/agent/discover", icon: <Map className="w-6 h-6" /> },
          { name: "Tasks", path: "/agent/tasks", icon: <PhoneCall className="w-6 h-6" /> },
          { name: "Profile", path: "/agent/profile", icon: <User className="w-6 h-6" /> },
        ].map((item) => {
          const isActive = pathname === item.path || (item.path !== '/agent' && pathname.startsWith(item.path));
          return (
            <Link key={item.name}
              href={item.path}
              className={`flex flex-col items-center gap-1 p-2 ${
                isActive ? "text-emerald-600" : "text-zinc-400"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
