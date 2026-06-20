"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  UserPlus,
  Building2,
  Wallet,
  MapPin,
  User,
  LogOut,
  Search,
  Users,
  KanbanSquare,
  Menu,
  X,
  Bell,
  CheckCircle2,
  HelpCircle,
  CalendarDays,
} from "lucide-react";
import { CUSTOMER_DASHBOARD_HREF, CUSTOMER_DASHBOARD_LABEL } from "@/lib/customer-dashboard-nav";
import { signOutTrimmaSession } from "@/config/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "../../components/Logo";
import { getAgentProfile } from "@/app/actions/agent-profile";
import { tryAgentData, fetchAgentProfileClient } from "@/lib/agent-client-data";
import { AgentPortalProvider } from "@/lib/agent-portal-provider";
import { REGIONAL_HEAD_PORTAL_BASE } from "@/lib/agent-portal-paths";

const BASE = REGIONAL_HEAD_PORTAL_BASE;

export default function RegionalHeadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agentName, setAgentName] = useState("Regional Head");
  const [agentAvatar, setAgentAvatar] = useState("");
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => setMobileMenuOpen(false));
  }, [pathname]);

  useEffect(() => {
    void (async () => {
      try {
        const result = await tryAgentData(getAgentProfile, fetchAgentProfileClient, {
          clientFirst: false,
        });
        if (result.success && result.profile) {
          setAgentName(result.profile.fullName || "Regional Head");
          setAgentAvatar(result.profile.avatarUrl || "");
        }
      } catch {
        // Layout renders even if profile hydration fails.
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
  }, []);

  const menuSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", path: BASE, icon: <Home className="w-4 h-4" /> },
        { name: "My Profile", path: `${BASE}/profile`, icon: <User className="w-4 h-4" /> },
        { name: "Regional Head Help", path: `${BASE}/help`, icon: <HelpCircle className="w-4 h-4" /> },
      ],
    },
    {
      title: "Salons",
      items: [
        { name: "My Salons", path: `${BASE}/salons`, icon: <Building2 className="w-4 h-4" /> },
        { name: "Territory Explorer", path: `${BASE}/territory`, icon: <MapPin className="w-4 h-4" /> },
        { name: "Add Manual Lead", path: `${BASE}/leads/new`, icon: <UserPlus className="w-4 h-4" /> },
        { name: "Salon Creation", path: `${BASE}/leads`, icon: <KanbanSquare className="w-4 h-4" /> },
        { name: "Salon Approval", path: `${BASE}/salons/approval`, icon: <CheckCircle2 className="w-4 h-4" /> },
      ],
    },
    {
      title: "Performance",
      items: [
        { name: "Commissions", path: `${BASE}/commissions`, icon: <Wallet className="w-4 h-4" /> },
        { name: "My Team", path: `${BASE}/team`, icon: <Users className="w-4 h-4" /> },
      ],
    },
  ];

  const isNavActive = (path: string) => {
    if (path === `${BASE}/leads`) return pathname === `${BASE}/leads`;
    if (path === `${BASE}/salons`) return pathname === `${BASE}/salons`;
    return pathname === path || (path !== BASE && pathname.startsWith(path));
  };

  return (
    <AgentPortalProvider>
      <div className="min-h-screen bg-white flex font-sans">
        {mobileMenuOpen ? (
          <div
            className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        ) : null}

        <aside
          className={`trimma-agent-sidebar trimma-portal-sidebar fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-[#0B0B0B] border-r border-white/8 flex flex-col h-dvh overflow-hidden transition-transform duration-300 lg:translate-x-0 ${
            mobileMenuOpen ? "translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.6)]" : "-translate-x-full"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b border-white/8 shrink-0">
            <Link href={BASE} className="hover:opacity-90 transition-opacity">
              <Logo iconSize={32} variant="dark" tagline="Regional Head" />
            </Link>
            <button
              type="button"
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

          <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 scrollbar-none">
            {menuSections.map((section) => (
              <div key={section.title} className="space-y-0.5">
                <div className="text-[10px] font-bold text-black uppercase tracking-widest px-3 mb-1.5">
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const isActive = isNavActive(item.path);
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive ? "is-active-nav font-semibold" : ""
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

          <div className="trimma-agent-sidebar-footer p-3 border-t border-white/8 shrink-0">
            <button
              type="button"
              onClick={() => void signOutTrimmaSession()}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <Avatar className="w-8 h-8 border border-[#ffc800]/30">
                {agentAvatar ? <AvatarImage src={agentAvatar} alt={agentName} /> : null}
                <AvatarFallback className="bg-[#ffc800]/10 text-[#ffc800] text-xs font-bold">
                  {agentName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-white truncate">{agentName}</div>
                <div className="text-xs text-zinc-500 truncate">Regional Head</div>
              </div>
              <LogOut className="w-4 h-4 text-zinc-500 shrink-0" />
            </button>
          </div>
        </aside>

        <div className="trimma-portal-body flex-1 lg:ml-64 min-h-screen flex flex-col bg-white text-zinc-900 trimma-light-context pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0 min-w-0 overflow-x-clip">
          <header className="trimma-portal-topbar trimma-dashboard-topbar h-16 bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6 trimma-light-context">
            <div className="flex items-center gap-3">
              <div className="hidden lg:block text-sm font-bold text-zinc-900">Regional Head Portal</div>
              <div className="lg:hidden">
                <Logo iconSize={28} title="Trimma" />
              </div>
            </div>

            <div className="hidden lg:flex items-center px-3 py-1.5 bg-slate-50 rounded-lg w-64 border border-slate-200 focus-within:border-[#ffc800]/50 focus-within:ring-1 focus-within:ring-[#ffc800]/30 transition-all">
              <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search leads, salons..."
                className="bg-transparent border-none outline-none text-sm text-zinc-900 placeholder:text-zinc-400 w-full"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-slate-100 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-700 hover:text-zinc-900 hover:bg-slate-100 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {hasUnreadNotifications ? (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#ffc800]" />
                ) : null}
              </button>
            </div>
          </header>

          <main className="trimma-portal-main flex-1 overflow-x-clip bg-white text-zinc-900 trimma-light-context min-w-0 w-full">
            <div className="trimma-portal-content p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">{children}</div>
          </main>
        </div>

        <nav className="trimma-mobile-bottom-nav trimma-mobile-bottom-nav--dark lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B0B0B] border-t border-white/8 flex justify-around items-center px-1 sm:px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] z-30">
          {[
            { name: "Home", path: BASE, icon: <Home className="w-5 h-5" /> },
            { name: "Salons", path: `${BASE}/salons`, icon: <Building2 className="w-5 h-5" /> },
            { name: "Editor", path: `${BASE}/leads`, icon: <KanbanSquare className="w-5 h-5" /> },
            { name: "Team", path: `${BASE}/team`, icon: <Users className="w-5 h-5" /> },
            { name: "Profile", path: `${BASE}/profile`, icon: <User className="w-5 h-5" /> },
          ].map((item) => {
            const isActive = isNavActive(item.path);
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                  isActive ? "is-active-nav font-semibold" : ""
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-semibold">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </AgentPortalProvider>
  );
}
