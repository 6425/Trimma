"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Wallet,
  Users,
  User,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { signOutTrimmaSession } from "@/config/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Logo from "../../components/Logo";
import { getAgentProfile } from "@/app/actions/agent-profile";
import { tryAgentData, fetchAgentProfileClient } from "@/lib/agent-client-data";

export default function RegionalHeadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [agentName, setAgentName] = useState("Regional Head");
  const [agentAvatar, setAgentAvatar] = useState("");

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
  }, []);

  const navItems = [
    { name: "Agent Dashboard", path: "/agent", icon: <Home className="w-4 h-4" /> },
    { name: "Commissions", path: "/regional-head/commissions", icon: <Wallet className="w-4 h-4" /> },
    { name: "My Team", path: "/regional-head/team", icon: <Users className="w-4 h-4" /> },
    { name: "My Profile", path: "/agent/profile", icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex font-sans trimma-dark-context">
      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      <aside
        className={`trimma-agent-sidebar fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-[#0B0B0B] border-r border-white/8 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.6)]" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/8 shrink-0">
          <Link href="/regional-head/commissions" className="hover:opacity-90 transition-opacity">
            <Logo iconSize={32} inverse tagline="Regional Head" />
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

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          <Link
            href="/agent"
            className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Agent OS
          </Link>
          {navItems.map((item) => {
            const isActive =
              pathname === item.path || (item.path !== "/agent" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? "is-active-nav bg-[#F5B700] text-black font-semibold" : ""
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="trimma-agent-sidebar-footer p-3 border-t border-white/8 shrink-0">
          <button
            type="button"
            onClick={() => void signOutTrimmaSession()}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <Avatar className="w-8 h-8 border border-[#F5B700]/30">
              {agentAvatar ? <AvatarImage src={agentAvatar} alt={agentName} /> : null}
              <AvatarFallback className="bg-[#F5B700]/10 text-[#F5B700] text-xs font-bold">
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

      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col bg-slate-50 text-zinc-900 pb-20 lg:pb-0">
        <header className="h-16 bg-[#0B0B0B] border-b border-white/8 sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
          <div className="text-sm font-bold text-white">Regional Head Commissions</div>
          <button
            type="button"
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/8 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <div className="p-4 sm:p-6 lg:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
