"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Home, CalendarDays, Heart, 
  User, LifeBuoy, HelpCircle,
  LogOut, Scissors, Menu, X, Bell
} from "lucide-react";
import { signOutTrimmaSession } from "@/config/supabase";
import Logo from "../../components/Logo";

export default function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  const handleLogout = () => {
    void signOutTrimmaSession();
  };

  const navItems = [
    { name: "Dashboard", path: "/customer", icon: <Home className="w-5 h-5" /> },
    { name: "My Bookings", path: "/customer/bookings", icon: <CalendarDays className="w-5 h-5" /> },
    { name: "Favorite Salons", path: "/customer/favorites", icon: <Heart className="w-5 h-5" /> },
    { name: "Saved Styles", path: "/customer/styles", icon: <Scissors className="w-5 h-5" /> },
  ];

  const bottomNavItems = [
    { name: "Dashboard", path: "/customer", icon: <Home className="w-5 h-5" /> },
    { name: "Bookings", path: "/customer/bookings", icon: <CalendarDays className="w-5 h-5" /> },
    { name: "Explore", path: "/", icon: <Scissors className="w-5 h-5" /> },
    { name: "Favorites", path: "/customer/favorites", icon: <Heart className="w-5 h-5" /> },
    { name: "Profile", path: "/customer/profile", icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans trimma-light-context">

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR (Desktop in-flow | Mobile sliding drawer) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-zinc-50 border-r border-black/10 flex flex-col transition-transform duration-300 lg:relative lg:inset-auto lg:translate-x-0 lg:sticky lg:top-0 lg:self-start lg:min-h-[calc(100dvh-8rem)] lg:max-h-[calc(100dvh-8rem)] ${
        mobileMenuOpen ? 'translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.1)]' : '-translate-x-full lg:translate-x-0'
      }`}>

        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-black/10 shrink-0">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo iconSize={32} />
          </Link>
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-black hover:bg-black/5 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="trimma-dashboard-sidebar-nav flex-1 overflow-y-auto pt-4 pb-4 px-3 space-y-0.5 scrollbar-none lg:pt-6">
          <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-3 mb-3 pt-1">Menu</div>
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/customer' && item.path !== '/' && pathname.startsWith(item.path));
            return (
              <Link key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#F5B700] text-black font-semibold"
                    : "text-zinc-500 hover:bg-black/5 hover:text-black"
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
              { name: "Customer Help", path: "/customer-help", icon: <HelpCircle className="w-5 h-5" /> },
              { name: "Support", path: "/customer/support", icon: <LifeBuoy className="w-5 h-5" /> },
            ].map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#F5B700] text-black font-semibold"
                      : "text-zinc-500 hover:bg-black/5 hover:text-black"
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
        <div className="p-3 border-t border-black/10">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 min-h-screen pb-20 lg:pb-0 flex flex-col min-w-0">

        {/* Mobile Top Header */}
        <header className="h-16 bg-zinc-50 border-b border-black/10 sticky top-0 z-40 flex items-center justify-between px-4 lg:hidden">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo iconSize={32} />
          </Link>
          <div className="flex items-center gap-1.5">
            {/* Hamburger before bell */}
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-black hover:bg-black/5 transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Bell */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-zinc-500 hover:text-black hover:bg-black/5 transition-colors">
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
      <nav className="trimma-mobile-bottom-nav trimma-mobile-bottom-nav--light lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-50 border-t border-black/10 flex justify-around items-center px-2 py-2 z-30">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/customer' && item.path !== '/' && pathname.startsWith(item.path));
          return (
            <Link key={item.name}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                isActive ? "is-active-nav text-[#F5B700]" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {item.icon}
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#F5B700]" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
