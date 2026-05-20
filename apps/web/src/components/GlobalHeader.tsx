"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Menu, X, Scissors, MapPin, Tag } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";
import Logo from "./Logo";

export default function GlobalHeader() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("customer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    if (data?.role) setUserRole(data.role);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'salon_owner') return '/dashboard';
    if (userRole === 'agent') return '/agent';
    return '/customer';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">

        {/* LOGO */}
        <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
          <Logo showTagline={false} />
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex gap-5 text-sm font-medium text-zinc-500">
          <Link href="/salons" className="hover:text-zinc-900 transition-colors">Salons</Link>
          <Link href="/locations" className="hover:text-zinc-900 transition-colors">Location</Link>
          <Link href="/pricing" className="hover:text-zinc-900 transition-colors">Pricing</Link>
        </nav>

        {/* RIGHT: Auth Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href={getDashboardLink()}
                className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-brand-pink hover:text-brand-pink/90 bg-brand-pink/10 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="max-w-[80px] sm:max-w-none truncate">
                  {user.user_metadata?.first_name || user.email?.split('@')[0]}
                </span>
              </Link>
              <button
                onClick={() => { supabase.auth.signOut().then(() => window.location.href = '/'); }}
                className="flex items-center justify-center text-zinc-400 hover:text-red-600 transition-colors p-1.5 rounded-full hover:bg-red-50"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors px-2 sm:px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="text-xs sm:text-sm font-semibold bg-primary-gradient text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full hover:opacity-95 shadow-sm transition-all border-none whitespace-nowrap"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* MOBILE HAMBURGER */}
          <button
            className="md:hidden flex items-center justify-center p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-slate-100 transition-colors ml-0.5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white shadow-lg">
          <div className="px-4 py-3 flex flex-col gap-1">
            <Link
              href="/salons"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-slate-50 hover:text-zinc-900 transition-colors"
            >
              <Scissors className="w-4 h-4 text-brand-pink" />
              Salons
            </Link>
            <Link
              href="/locations"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-slate-50 hover:text-zinc-900 transition-colors"
            >
              <MapPin className="w-4 h-4 text-brand-pink" />
              Location
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-slate-50 hover:text-zinc-900 transition-colors"
            >
              <Tag className="w-4 h-4 text-brand-pink" />
              Pricing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
