"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Scissors, Building2, Sparkles, CreditCard, Gift, Mail, Calendar } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase, signOutTrimmaSession } from "@/config/supabase";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SALON_OWNER_ONBOARDING_FLAG_KEY } from "@/lib/salon-owner-oauth-intent";

const navDesktopClass = (active: boolean) =>
  `text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
    active
      ? "text-zinc-900 bg-zinc-100 dark:bg-[#ffde5a] dark:text-black"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-[#ffde5a] dark:hover:bg-[#ffde5a] dark:hover:text-black"
  }`;

const navMobileClass = (active: boolean) =>
  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
    active
      ? "text-zinc-900 bg-zinc-100 dark:bg-[#ffde5a] dark:text-black"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-[#ffde5a] dark:hover:bg-[#ffde5a] dark:hover:text-black"
  }`;

const navActionClass =
  "text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-2 rounded-xl transition-colors dark:text-[#ffde5a] dark:hover:bg-[#ffde5a] dark:hover:text-black";

export default function GlobalHeader() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("customer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isFeaturesActive = pathname === "/features" || pathname?.startsWith("/features/");
  const isPricingActive = pathname === "/pricing" || pathname?.startsWith("/pricing/");
  const isAboutActive = pathname === "/about" || pathname?.startsWith("/about/");
  const isDealsActive = pathname === "/deals";
  const isBookingActive = pathname === "/bookings" || pathname?.startsWith("/bookings/");
  const isStylesActive = pathname === "/styles";
  const isContactActive = pathname === "/contact";

  useEffect(() => {
    try {
      sessionStorage.removeItem("trimma:nav-categories");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const closeSiteMenu = () => setMobileMenuOpen(false);
    window.addEventListener("trimma:close-site-menu", closeSiteMenu);
    return () => window.removeEventListener("trimma:close-site-menu", closeSiteMenu);
  }, []);

  const fetchUserRole = async (userId: string, email?: string | null) => {
    try {
      const sessionRes = await fetch("/api/auth/session", { credentials: "include", cache: "no-store" });
      if (sessionRes.ok) {
        const payload = (await sessionRes.json()) as { role?: string };
        if (payload.role) {
          setUserRole(payload.role);
          return;
        }
      }
    } catch {
      // Fall back to client DB reads below.
    }

    const { data: roleRows } = await supabase.from('user_roles').select('role').eq('user_id', userId);
    const tableRoles = (roleRows || []).map((row) => row.role);
    const priority = ['admin', 'regional_head', 'salon_owner', 'agent', 'customer'];
    const fromTable = priority.find((role) => tableRoles.includes(role));
    if (fromTable) {
      setUserRole(fromTable);
      return;
    }

    if (email) {
      const { data: profile } = await supabase.from('users').select('global_role').eq('email', email).maybeSingle();
      if (profile?.global_role) setUserRole(profile.global_role);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id, session.user.email);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id, session.user.email);
      } else {
        setUserRole("customer");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardLink = () => {
    if (typeof window !== "undefined") {
      const onboardingPath = localStorage.getItem(SALON_OWNER_ONBOARDING_FLAG_KEY);
      if (onboardingPath) {
        return onboardingPath.startsWith("/") ? onboardingPath : "/dashboard/profile";
      }
    }

    if (userRole === 'admin') return '/admin';
    if (userRole === 'salon_owner') return '/dashboard';
    if (userRole === 'agent') return '/agent';
    if (userRole === 'regional_head') return '/regional-head';
    return '/customer';
  };

  return (
    <header className="trimma-site-nav sticky top-0 z-[60] w-full bg-white text-zinc-900 shadow-sm border-b border-zinc-200 trimma-light-context dark:bg-[#0b0b0b] dark:text-[#ffde5a] dark:border-[#ffde5a]/15">
      <div className="w-full border-b border-zinc-100 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.05)] relative z-10 bg-white dark:bg-[#0b0b0b] dark:border-[#ffde5a]/15">
        <div className="trimma-site-nav-bar w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
            <Logo iconSize={32} />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Main navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <Link href="/features" className={navDesktopClass(isFeaturesActive)}>
                Features
              </Link>
              <Link href="/pricing" className={navDesktopClass(isPricingActive)}>
                Pricing
              </Link>
              <Link href="/about" className={navDesktopClass(isAboutActive)}>
                About
              </Link>
              <Link href="/styles" className={navDesktopClass(isStylesActive)}>
                Styles
              </Link>
              <Link href="/bookings" className={navDesktopClass(isBookingActive)}>
                Book
              </Link>
              <Link href="/deals" className={navDesktopClass(isDealsActive)}>
                Deals
              </Link>
              <Link href="/contact" className={navDesktopClass(isContactActive)}>
                Contact
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link href="/onboarding" className={`${navActionClass} hidden min-h-11 lg:inline-flex items-center`}>
                Grow My Salon
              </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <ThemeToggle className="w-9 h-9 p-0" />
              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href={getDashboardLink()}
                    className="text-xs sm:text-sm font-medium flex items-center gap-2 text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors border border-zinc-200 dark:text-black dark:bg-[#ffde5a] dark:border-[#ffde5a] dark:hover:bg-[#ffe680]"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { void signOutTrimmaSession(); }}
                    className="trimma-header-icon-btn flex items-center justify-center p-2 rounded-lg border border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:border-[#ffde5a] dark:bg-[#ffde5a] dark:text-black dark:hover:bg-[#ffe680] dark:hover:text-black"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4 shrink-0 text-current" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/login"
                    className="text-xs sm:text-sm font-normal text-zinc-600 hover:text-zinc-900 bg-transparent hover:bg-zinc-100 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-md whitespace-nowrap dark:text-[#ffde5a] dark:hover:bg-[#ffde5a] dark:hover:text-black"
                  >
                    Sign in
                  </Link>
                </div>
              )}

              <button
                className="lg:hidden flex items-center justify-center p-2 -mr-1 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0 dark:text-[#ffde5a] dark:hover:bg-[#ffde5a] dark:hover:text-black"
                onClick={() => {
                  window.dispatchEvent(new Event("trimma:close-dashboard-menu"));
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                aria-label={mobileMenuOpen ? "Close site menu" : "Open site menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-100 dark:border-[#ffde5a]/15 bg-white dark:bg-[#111111] pb-4 max-h-[70vh] overflow-y-auto">
          <nav className="px-4 pt-2 pb-4 flex flex-col gap-1" aria-label="Site navigation">
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isFeaturesActive)}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              Features
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isPricingActive)}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isAboutActive)}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              About
            </Link>
            <Link
              href="/styles"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isStylesActive)}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              Styles
            </Link>
            <Link
              href="/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isBookingActive)}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              Book
            </Link>
            <Link
              href="/deals"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isDealsActive)}
            >
              <Gift className="w-4 h-4 shrink-0" />
              Deals
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isContactActive)}
            >
              <Mail className="w-4 h-4 shrink-0" />
              Contact
            </Link>
            <div className="h-px bg-zinc-100 my-2" />
            <Link
              href="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(false)}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              Grow My Salon
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
