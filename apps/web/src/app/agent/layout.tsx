"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, Map, UserPlus, Building2,
  Wallet, MapPin, User, LogOut, Search,
  KanbanSquare, Menu, X, Bell, CheckCircle2, HelpCircle, CalendarDays
} from "lucide-react";
import { CUSTOMER_DASHBOARD_HREF, CUSTOMER_DASHBOARD_LABEL } from "@/lib/customer-dashboard-nav";
import { signOutTrimmaSession } from "@/config/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "../../components/Logo";
import { getAgentProfile } from "@/app/actions/agent-profile";
import { tryAgentData, fetchAgentProfileClient } from "@/lib/agent-client-data";
import { AgentPortalProvider } from "@/lib/agent-portal-provider";
import { useRouter } from "next/navigation";
import { remapAgentPortalPath } from "@/lib/agent-portal-paths";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agentName, setAgentName] = useState("Agent");
  const [agentAvatar, setAgentAvatar] = useState("");
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [isRegionalHead, setIsRegionalHead] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    if (isRegionalHead && pathname.startsWith("/agent") && pathname !== "/agent/login") {
      router.replace(remapAgentPortalPath(pathname, "/regional-head"));
    }
  }, [isRegionalHead, pathname, router]);

  useEffect(() => {
    if (pathname === "/agent/login") return;

    void (async () => {
      try {
        const result = await tryAgentData(getAgentProfile, fetchAgentProfileClient, {
          clientFirst: false,
        });
        if (result.success && result.profile) {
          setAgentName(result.profile.fullName || "Agent");
          setAgentAvatar(result.profile.avatarUrl || "");
          setIsRegionalHead(Boolean(result.profile.isRegionalHead));
        }
      } catch {
        // Layout should render even if profile hydration fails.
      }
    })();

    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ avatarUrl?: string }>;
      if (typeof customEvent.detail?.avatarUrl === "string") {
        setAgentAvatar(customEvent.detail.avatarUrl);
      }
    };
    window.addEventListener("trimma_agent_avatar_update", handleAvatarUpdate);
    return () => window.removeEventListener("trimma_agent_avatar_update", handleAvatarUpdate);
  }, [pathname]);

  const handleLogout = () => {
    void signOutTrimmaSession();
  };

  const menuSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: "/agent", icon: <Home className="w-4 h-4" /> },
        { name: "My Profile", path: "/agent/profile", icon: <User className="w-4 h-4" /> },
        { name: "Agent Help", path: "/agent/help", icon: <HelpCircle className="w-4 h-4" /> },
      ]
    },
    {
      title: "Salons",
      items: [
        { name: "My Salons", path: "/agent/salons", icon: <Building2 className="w-4 h-4" /> },
        { name: "Territory Explorer", path: "/agent/territory", icon: <MapPin className="w-4 h-4" /> },
        { name: "Add Manual Lead", path: "/agent/leads/new", icon: <UserPlus className="w-4 h-4" /> },
        { name: "Salon Creation", path: "/agent/leads", icon: <KanbanSquare className="w-4 h-4" /> },
        { name: "Salon Approval", path: "/agent/salons/approval", icon: <CheckCircle2 className="w-4 h-4" /> },
      ]
    },

    {
      title: "Performance",
      items: [{ name: "Commissions", path: "/agent/commissions", icon: <Wallet className="w-4 h-4" /> }],
    },
  ];

  if (pathname === "/agent/login") {
    return <>{children}</>;
  }

  return (
    <AgentPortalProvider>
    <div className="min-h-screen bg-[#0B0B0B] flex font-sans trimma-dark-context">

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR (Desktop fixed | Mobile sliding drawer) ── */}
      <aside className={`trimma-agent-sidebar fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-[#0B0B0B] border-r border-white/8 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.6)]' : '-translate-x-full'
      }`}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/8 shrink-0">
          <Link href="/agent" className="hover:opacity-90 transition-opacity">
            <Logo iconSize={32} variant="dark" tagline="Agent Portal" />
          </Link>
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pt-3 pb-1 shrink-0">
          <Link
            href={CUSTOMER_DASHBOARD_HREF}
            onClick={() => setMobileMenuOpen(false)}
            className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith("/customer") ? "is-active-nav font-semibold" : ""
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            {CUSTOMER_DASHBOARD_LABEL}
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-none">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="text-[10px] font-bold text-black uppercase tracking-widest px-3 mb-1.5">
                {section.title}
              </div>
              {section.items.map((item) => {
                const isActive =
                  item.path === "/agent/leads"
                    ? pathname === "/agent/leads"
                    : item.path === "/agent/salons"
                      ? pathname === "/agent/salons"
                      : pathname === item.path ||
                        (item.path !== "/agent" && pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "is-active-nav font-semibold"
                        : ""
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="trimma-agent-sidebar-footer p-3 border-t border-white/8 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <Avatar className="w-8 h-8 border border-[#ffc800]/30">
              {agentAvatar && <AvatarImage src={agentAvatar} alt={agentName} />}
              <AvatarFallback className="bg-[#ffc800]/10 text-[#ffc800] text-xs font-bold">
                {agentName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold text-white truncate">{agentName}</div>
              <div className="text-xs text-zinc-500 truncate">Sales Team</div>
            </div>
            <LogOut className="w-4 h-4 text-zinc-500 shrink-0" />
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="trimma-portal-main flex-1 lg:ml-64 min-h-screen flex flex-col bg-slate-50 text-zinc-900 trimma-light-context pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 min-w-0 overflow-x-clip">

        {/* Top Header */}
        <header className="h-16 bg-[#0B0B0B] border-b border-white/8 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
          
          {/* Left: Title on desktop / Logo badge on mobile */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:block text-sm font-bold text-white">Sales Operating System</div>
            <div className="lg:hidden">
              <Logo iconSize={28} inverse />
            </div>
          </div>

          {/* Center: Search (desktop only) */}
          <div className="hidden lg:flex items-center px-3 py-1.5 bg-white/6 rounded-lg w-64 border border-white/8 focus-within:border-[#ffc800]/50 focus-within:ring-1 focus-within:ring-[#ffc800]/30 transition-all">
            <Search className="w-4 h-4 text-white/80 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search leads, salons..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/60 w-full"
            />
          </div>

          {/* Right: Hamburger + Bell */}
          <div className="flex items-center gap-1.5">
            {/* Hamburger — mobile only, before bell */}
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/8 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/8 transition-colors">
              <Bell className="w-5 h-5" />
              {hasUnreadNotifications && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ffc800]" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="trimma-light-context p-4 sm:p-6 lg:p-8 flex-1 min-w-0 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="trimma-mobile-bottom-nav trimma-mobile-bottom-nav--dark lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B0B0B] border-t border-white/8 flex justify-around items-center px-1 sm:px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] z-30">
        {[
          { name: "Home", path: "/agent", icon: <Home className="w-5 h-5" /> },
          { name: "Salons", path: "/agent/salons", icon: <Building2 className="w-5 h-5" /> },
          { name: "Editor", path: "/agent/leads", icon: <KanbanSquare className="w-5 h-5" /> },
          { name: "Profile", path: "/agent/profile", icon: <User className="w-5 h-5" /> },
        ].map((item) => {
          const isActive = pathname === item.path || (item.path !== '/agent' && pathname.startsWith(item.path));
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                isActive ? "is-active-nav font-semibold" : ""
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
    </AgentPortalProvider>
  );
}
