"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Scissors, MapPin, Tag, Globe, HelpCircle, Building2, Sparkles, Heart, Droplet, Flower2, Activity, Users, PenTool, Paintbrush, LayoutGrid, CreditCard, ChevronDown, Gift } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase, signOutTrimmaSession } from "@/config/supabase";
import Logo from "./Logo";

const IconMap: Record<string, any> = {
  Scissors, Sparkles, Heart, Droplet, Flower2, Activity, Users, PenTool, Paintbrush, LayoutGrid, Tag
};

export default function GlobalHeader() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("customer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [navCategories, setNavCategories] = useState<any[]>([]);
  const pathname = usePathname();

  const isSalonsActive = pathname === "/salons" || pathname?.startsWith("/salons/");
  const isCategoryActive = pathname === "/categories" || pathname?.startsWith("/category/");
  const isDealsActive = pathname === "/deals";
  const isStylesActive = pathname === "/styles";

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMobileMenuOpen(false);
      setMobileCategoriesOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const closeSiteMenu = () => setMobileMenuOpen(false);
    window.addEventListener("trimma:close-site-menu", closeSiteMenu);
    return () => window.removeEventListener("trimma:close-site-menu", closeSiteMenu);
  }, []);

  const fetchUserRole = async (userId: string, email?: string | null) => {
    const { data: roleRow } = await supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    if (roleRow?.role) {
      setUserRole(roleRow.role);
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

    void Promise.resolve().then(() => {
      const fetchCategories = async () => {
        const cacheKey = "trimma:nav-categories";
        try {
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as { ts: number; data: Array<{ id: string; name: string; slug: string; icon: string }> };
            if (Date.now() - parsed.ts < 5 * 60 * 1000 && Array.isArray(parsed.data)) {
              setNavCategories(parsed.data);
              return;
            }
          }
        } catch {
          // ignore cache parse errors
        }

        const { data } = await supabase.from('categories').select('id, name, slug, icon').order('name');
        if (data) {
          setNavCategories(data);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
          } catch {
            // ignore quota errors
          }
        }
      };
      fetchCategories();
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
    <header className="sticky top-0 z-[60] w-full bg-white text-zinc-900 shadow-sm border-b border-zinc-200 trimma-light-context">
      <div className="w-full border-b border-zinc-100 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.05)] relative z-10 bg-white">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
            <Logo iconSize={32} />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Main nav — Categories submenus live here only */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                href="/salons"
                className={`text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                  isSalonsActive ? "text-zinc-900 bg-zinc-100" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                Salons
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setCategoriesOpen(true)}
                onMouseLeave={() => setCategoriesOpen(false)}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={categoriesOpen}
                  className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                    isCategoryActive
                      ? 'text-zinc-900 bg-zinc-100'
                      : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  Categories
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                </button>

                {categoriesOpen && navCategories.length > 0 && (
                  <div className="absolute top-full left-0 pt-1 z-50">
                    <div className="min-w-[240px] max-h-[400px] overflow-y-auto rounded-xl border border-zinc-200 bg-white py-2 shadow-lg">
                      {navCategories.map((cat) => {
                        const Icon = IconMap[cat.icon] || Tag;
                        return (
                          <Link
                            key={cat.id}
                            href={`/category/${cat.slug}`}
                            className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                          >
                            <Icon className="w-4 h-4 text-zinc-500 shrink-0" />
                            {cat.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Link href="/locations" className="text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-2 rounded-xl transition-colors">
                Locations
              </Link>
              <Link href="/pricing" className="text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-2 rounded-xl transition-colors">
                Pricing
              </Link>
              <Link
                href="/styles"
                className={`text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                  isStylesActive ? "text-zinc-900 bg-zinc-100" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                Styles
              </Link>
              <Link
                href="/deals"
                className={`text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
                  isDealsActive ? "text-zinc-900 bg-zinc-100" : "text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                Deals
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button className="flex items-center justify-center font-semibold text-zinc-700 hover:bg-zinc-100 rounded-full p-2 transition-colors" title="Language and Currency">
                <Globe className="w-5 h-5" />
              </button>
              <button className="flex items-center justify-center font-semibold text-zinc-700 hover:bg-zinc-100 rounded-full p-2 transition-colors" title="Support">
                <HelpCircle className="w-5 h-5" />
              </button>
              <Link href="/onboarding" className="text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-2 rounded-xl transition-colors hidden lg:block">
                List your salon
              </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href={getDashboardLink()}
                    className="text-xs sm:text-sm font-medium flex items-center gap-2 text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors border border-zinc-200"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { void signOutTrimmaSession(); }}
                    className="flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors p-2 rounded-lg hover:bg-zinc-100"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/login"
                    className="text-xs sm:text-sm font-normal text-zinc-600 hover:text-zinc-900 bg-transparent hover:bg-zinc-100 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-md whitespace-nowrap"
                  >
                    Sign in
                  </Link>
                </div>
              )}

              <button
                className="lg:hidden flex items-center justify-center p-2 -mr-1 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
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

      {/* Desktop category icon + name row — PC/laptop only (lg+) */}
      {navCategories.length > 0 && (
        <div className="hidden lg:block bg-white border-b border-zinc-100">
          <div className="mx-auto max-w-7xl px-4 py-2">
            <nav
              className="flex items-center gap-2 overflow-x-auto hide-scrollbar"
              aria-label="Browse by category"
            >
              {navCategories.map((cat) => {
                const Icon = IconMap[cat.icon] || Tag;
                const active = pathname === `/category/${cat.slug}`;
                return (
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full transition-colors border whitespace-nowrap shrink-0 ${
                      active
                        ? "text-zinc-900 bg-zinc-100 border-zinc-200"
                        : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-transparent hover:border-zinc-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{cat.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-100 bg-white pb-4 max-h-[70vh] overflow-y-auto">
          <nav className="px-4 pt-2 pb-4 flex flex-col gap-1" aria-label="Site navigation">
            <Link
              href="/salons"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                isSalonsActive ? "text-zinc-900 bg-zinc-100" : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              Salons
            </Link>
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
              className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors w-full"
              aria-expanded={mobileCategoriesOpen}
            >
              <span className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 shrink-0" />
                Categories
              </span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileCategoriesOpen && (
              <div className="ml-4 pl-3 border-l border-zinc-100 flex flex-col gap-0.5 mb-1">
                {navCategories.map((cat) => {
                  const Icon = IconMap[cat.icon] || Tag;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-normal text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            )}
            <Link
              href="/locations"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              Locations
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              Pricing
            </Link>
            <Link
              href="/styles"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                isStylesActive ? "text-zinc-900 bg-zinc-100" : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              Styles
            </Link>
            <Link
              href="/deals"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Gift className="w-4 h-4 shrink-0" />
              Deals
            </Link>
            <div className="h-px bg-zinc-100 my-2" />
            <Link
              href="/onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              List your salon
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
