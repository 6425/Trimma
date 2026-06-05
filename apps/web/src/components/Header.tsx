"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase, signOutTrimmaSession } from "@/config/supabase";
import Logo from "./Logo";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [userRole, setUserRole] = useState<string>("customer");

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    if (data?.role) setUserRole(data.role);
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'salon_owner') return '/dashboard';
    if (userRole === 'agent') return '/agent';
    return '/customer';
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* LOGO */}
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo showTagline={true} inverse={!isScrolled} />
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/locations" className={`text-sm font-bold transition-colors ${isScrolled ? 'text-zinc-600 hover:text-brand-pink' : 'text-white/80 hover:text-white'}`}>Locations</Link>
            <Link href="/categories" className={`text-sm font-bold transition-colors ${isScrolled ? 'text-zinc-600 hover:text-brand-pink' : 'text-white/80 hover:text-white'}`}>Services</Link>
            <Link href="/dashboard" className={`text-sm font-bold transition-colors ${isScrolled ? 'text-zinc-600 hover:text-brand-pink' : 'text-white/80 hover:text-white'}`}>For Partners</Link>
          </nav>

          {/* ACTIONS */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                <Link href={getDashboardLink()} className={`text-sm font-bold flex items-center gap-2 ${isScrolled ? 'text-brand-purple hover:text-brand-pink' : 'text-white hover:text-brand-pink'}`}>
                  <User className="w-4 h-4" />
                  {user.user_metadata?.first_name || user.email?.split('@')[0]}
                </Link>
                <div className={`h-4 w-px ${isScrolled ? 'bg-zinc-300' : 'bg-white/30'}`}></div>
                <button 
                  onClick={() => { void signOutTrimmaSession(); }} 
                  className={`text-sm font-medium flex items-center gap-1 ${isScrolled ? 'text-zinc-500 hover:text-red-500' : 'text-white/70 hover:text-red-300'}`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Exit
                </button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className={`font-bold ${isScrolled ? 'text-zinc-700 hover:text-brand-pink' : 'text-white hover:text-white hover:bg-white/10'}`}>
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className={`w-6 h-6 ${isScrolled ? 'text-zinc-900' : 'text-white'}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isScrolled ? 'text-zinc-900' : 'text-white'}`} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 p-4 flex flex-col gap-4">
          <Link href="/locations" className="p-3 font-bold text-zinc-900 hover:bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Locations</Link>
          <Link href="/categories" className="p-3 font-bold text-zinc-900 hover:bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(false)}>Services</Link>
          <Link href="/dashboard" className="p-3 font-bold text-zinc-900 hover:bg-slate-50 rounded-xl" onClick={() => setMobileMenuOpen(false)}>For Partners</Link>
          <hr className="border-slate-100" />
          {user ? (
            <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="bg-brand-pink/10 text-brand-pink p-2 rounded-full">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-zinc-900">{user.user_metadata?.first_name || user.email?.split('@')[0]}</div>
                  <div className="text-xs text-zinc-500">{user.email}</div>
                </div>
              </div>
              <Link href={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full justify-center h-10 rounded-lg font-bold bg-primary-gradient text-white border-none">My Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={() => { setMobileMenuOpen(false); void signOutTrimmaSession(); }} className="w-full justify-center h-10 rounded-lg font-medium text-red-500 hover:text-red-600 hover:bg-red-50">Sign Out</Button>
            </div>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-center h-12 rounded-xl font-bold">Sign In</Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
