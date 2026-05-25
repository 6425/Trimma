"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, CalendarDays, Heart, Sparkles, 
  Wallet, Gift, User, Settings, LifeBuoy,
  LogOut, Scissors, Menu, X, Bell
} from "lucide-react";
import { supabase } from "@/config/supabase";

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/customer", icon: <Home className="w-5 h-5" /> },
    { name: "My Bookings", path: "/customer/bookings", icon: <CalendarDays className="w-5 h-5" /> },
    { name: "Favorite Salons", path: "/customer/favorites", icon: <Heart className="w-5 h-5" /> },
    { name: "Saved Styles", path: "/customer/styles", icon: <Scissors className="w-5 h-5" /> },
    { name: "Recommendations", path: "/customer/recommendations", icon: <Sparkles className="w-5 h-5" /> },
    { name: "Rewards", path: "/customer/rewards", icon: <Gift className="w-5 h-5" /> },
    { name: "Wallet & Payments", path: "/customer/wallet", icon: <Wallet className="w-5 h-5" /> },
  ];

  const bottomNavItems = [
    { name: "Dashboard", path: "/customer", icon: <Home className="w-5 h-5" /> },
    { name: "Bookings", path: "/customer/bookings", icon: <CalendarDays className="w-5 h-5" /> },
    { name: "Explore", path: "/salons", icon: <Scissors className="w-5 h-5" /> },
    { name: "Favorites", path: "/customer/favorites", icon: <Heart className="w-5 h-5" /> },
    { name: "Profile", path: "/customer/profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex font-sans">

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR (Desktop fixed | Mobile sliding drawer) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-[#0B0B0B] border-r border-white/8 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.6)]' : '-translate-x-full'
      }`}>

        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/8 shrink-0">
          <Link href="/" className="text-xl font-black tracking-tighter text-white">
            Trimma<span className="text-[#F5B700]">.</span>
          </Link>
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scrollbar-none">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-3">Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/customer' && pathname.startsWith(item.path));
            return (
              <Link key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#F5B700] text-black font-semibold"
                    : "text-zinc-400 hover:bg-white/6 hover:text-white"
                }`}
              >
                <span className={isActive ? "text-black" : "text-zinc-500"}>{item.icon}</span>
                {item.name}
              </Link>
            );
          })}

          <div className="pt-4 pb-1">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-2">Account</div>
            {[
              { name: "Profile", path: "/customer/profile", icon: <User className="w-5 h-5" /> },
              { name: "Settings", path: "/customer/settings", icon: <Settings className="w-5 h-5" /> },
              { name: "Support", path: "/customer/support", icon: <LifeBuoy className="w-5 h-5" /> },
            ].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#F5B700] text-black font-semibold"
                      : "text-zinc-400 hover:bg-white/6 hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-black" : "text-zinc-500"}>{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 lg:pl-64 min-h-screen pb-20 lg:pb-0 flex flex-col">

        {/* Mobile Top Header */}
        <header className="h-16 bg-[#0B0B0B] border-b border-white/8 sticky top-0 z-40 flex items-center justify-between px-4 lg:hidden">
          <Link href="/" className="text-xl font-black tracking-tighter text-white">
            Trimma<span className="text-[#F5B700]">.</span>
          </Link>
          <div className="flex items-center gap-1.5">
            {/* Hamburger before bell */}
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F5B700]" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B0B0B] border-t border-white/8 flex justify-around items-center px-2 py-2 z-30">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/customer' && pathname.startsWith(item.path));
          return (
            <Link key={item.name}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                isActive ? "text-[#F5B700]" : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {item.icon}
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#F5B700]" : "text-zinc-600"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
