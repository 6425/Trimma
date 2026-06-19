"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Scissors, MapPin, Tag, Building2, Sparkles, Heart, Droplet, Flower2, Activity, Users, PenTool, Paintbrush, LayoutGrid, CreditCard, ChevronDown, Gift, Mail } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase, signOutTrimmaSession } from "@/config/supabase";
import type { PublicCategory } from "@/lib/public-categories";
import Logo from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SALON_OWNER_ONBOARDING_FLAG_KEY } from "@/lib/salon-owner-oauth-intent";

const IconMap: Record<string, any> = {
  Scissors, Sparkles, Heart, Droplet, Flower2, Activity, Users, PenTool, Paintbrush, LayoutGrid, Tag
};

const PROVINCES = [
  { name: "Western Province", districts: ["Colombo", "Gampaha", "Kalutara"] },
  { name: "Central Province", districts: ["Kandy", "Matale", "Nuwara Eliya"] },
  { name: "Southern Province", districts: ["Galle", "Matara", "Hambantota"] },
  { name: "Northern Province", districts: ["Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu"] },
  { name: "Eastern Province", districts: ["Trincomalee", "Batticaloa", "Ampara"] },
  { name: "North Western Province", districts: ["Kurunegala", "Puttalam"] },
  { name: "North Central Province", districts: ["Anuradhapura", "Polonnaruwa"] },
  { name: "Uva Province", districts: ["Badulla", "Moneragala"] },
  { name: "Sabaragamuwa Province", districts: ["Ratnapura", "Kegalle"] },
];

const navDesktopClass = (active: boolean) =>
  `text-sm font-semibold px-3 py-2 rounded-xl transition-colors ${
    active
      ? "text-zinc-900 bg-zinc-100 dark:bg-[#ffc800] dark:text-black"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-[#ffc800] dark:hover:bg-[#ffc800] dark:hover:text-black"
  }`;

const navMobileClass = (active: boolean) =>
  `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
    active
      ? "text-zinc-900 bg-zinc-100 dark:bg-[#ffc800] dark:text-black"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-[#ffc800] dark:hover:bg-[#ffc800] dark:hover:text-black"
  }`;

const navCategoryPillClass = (active: boolean) =>
  `flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-full transition-colors border whitespace-nowrap shrink-0 ${
    active
      ? "text-zinc-900 bg-zinc-100 border-zinc-200 dark:bg-[#ffc800] dark:text-black dark:border-[#ffc800]"
      : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 border-transparent hover:border-zinc-200 dark:text-[#ffc800] dark:hover:bg-[#ffc800] dark:hover:text-black dark:hover:border-[#ffc800]"
  }`;

const navActionClass =
  "text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-2 rounded-xl transition-colors dark:text-[#ffc800] dark:hover:bg-[#ffc800] dark:hover:text-black";

export default function GlobalHeader({ navCategories }: { navCategories: PublicCategory[] }) {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("customer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileLocationsOpen, setMobileLocationsOpen] = useState(false);
  const [mobileActiveProvince, setMobileActiveProvince] = useState<string | null>(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const pathname = usePathname();

  const isFeaturesActive = pathname === "/features" || pathname?.startsWith("/features/");
  const isCategoryActive = pathname === "/categories" || pathname?.startsWith("/category/");
  const isDealsActive = pathname === "/deals";
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
      setMobileCategoriesOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const closeSiteMenu = () => setMobileMenuOpen(false);
    window.addEventListener("trimma:close-site-menu", closeSiteMenu);
    return () => window.removeEventListener("trimma:close-site-menu", closeSiteMenu);
  }, []);

  const fetchUserRole = async (userId: string, email?: string | null) => {
    const cookieRole = (() => {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(/(?:^|;\s*)user-role=([^;]+)/)?.[1];
      if (!match) return null;
      try {
        return decodeURIComponent(match);
      } catch {
        return match;
      }
    })();

    if (cookieRole) {
      setUserRole(cookieRole);
    }

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
    <header className="sticky top-0 z-[60] w-full bg-white text-zinc-900 shadow-sm border-b border-zinc-200 trimma-light-context dark:bg-[#0b0b0b] dark:text-[#ffc800] dark:border-[#ffc800]/15">
      <div className="w-full border-b border-zinc-100 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.05)] relative z-10 bg-white dark:bg-[#0b0b0b] dark:border-[#ffc800]/15">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
            <Logo iconSize={32} />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Main nav — Categories submenus live here only */}
            <div className="hidden lg:flex items-center gap-1">
              <Link href="/features" className={navDesktopClass(isFeaturesActive)}>
                Features
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
                  className={`flex items-center gap-1.5 ${navDesktopClass(isCategoryActive)}`}
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

              <div
                className="relative"
                onMouseEnter={() => setLocationsOpen(true)}
                onMouseLeave={() => {
                  setLocationsOpen(false);
                  setActiveProvince(null);
                }}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={locationsOpen}
                  className={`flex items-center gap-1.5 ${navDesktopClass(locationsOpen || false)}`}
                >
                  Locations
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${locationsOpen ? 'rotate-180' : ''}`} />
                </button>

                {locationsOpen && (
                  <div className="absolute top-full left-0 pt-1 z-50">
                    <div className="flex bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden max-h-[400px]">
                      {/* Provinces Column */}
                      <div className="w-[200px] overflow-y-auto bg-zinc-50/50 py-2 border-r border-zinc-100">
                        {PROVINCES.map((prov) => (
                          <div
                            key={prov.name}
                            onMouseEnter={() => setActiveProvince(prov.name)}
                            className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                              activeProvince === prov.name 
                                ? 'bg-white text-[#ffc800] font-bold shadow-[inset_2px_0_0_#ffc800]' 
                                : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/60'
                            }`}
                          >
                            <span className="truncate">{prov.name.replace(" Province", "")}</span>
                            {activeProvince === prov.name && <span className="text-[#ffc800] text-[10px] shrink-0">▶</span>}
                          </div>
                        ))}
                      </div>

                      {/* Districts Flyout */}
                      <div className="w-[180px] overflow-y-auto py-2 bg-white">
                        {activeProvince ? (
                          PROVINCES.find((p) => p.name === activeProvince)?.districts.map((dist) => (
                            <Link
                              key={dist}
                              href={`/?l=${encodeURIComponent(dist)}`}
                              className="block px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-[#ffc800] transition-colors"
                            >
                              {dist}
                            </Link>
                          ))
                        ) : (
                          <div className="px-5 py-6 text-xs font-medium text-zinc-400 italic text-center leading-relaxed">
                            Hover a province to view districts.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/styles" className={navDesktopClass(isStylesActive)}>
                Styles
              </Link>
              <Link href="/deals" className={navDesktopClass(isDealsActive)}>
                Deals
              </Link>
              <Link href="/contact" className={navDesktopClass(isContactActive)}>
                Contact
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link href="/onboarding" className={`${navActionClass} hidden lg:block`}>
                List your salon
              </Link>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <ThemeToggle className="w-9 h-9 p-0" />
              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href={getDashboardLink()}
                    className="text-xs sm:text-sm font-medium flex items-center gap-2 text-zinc-800 bg-zinc-100 hover:bg-zinc-200 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors border border-zinc-200 dark:text-black dark:bg-[#ffc800] dark:border-[#ffc800] dark:hover:bg-[#ffd633]"
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { void signOutTrimmaSession(); }}
                    className="trimma-header-icon-btn flex items-center justify-center p-2 rounded-lg border border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors dark:border-[#ffc800] dark:bg-[#ffc800] dark:text-black dark:hover:bg-[#ffd633] dark:hover:text-black"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4 shrink-0 text-current" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Link
                    href="/login"
                    className="text-xs sm:text-sm font-normal text-zinc-600 hover:text-zinc-900 bg-transparent hover:bg-zinc-100 transition-colors px-2 sm:px-3 py-1.5 sm:py-2 rounded-md whitespace-nowrap dark:text-[#ffc800] dark:hover:bg-[#ffc800] dark:hover:text-black"
                  >
                    Sign in
                  </Link>
                </div>
              )}

              <button
                className="lg:hidden flex items-center justify-center p-2 -mr-1 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0 dark:text-[#ffc800] dark:hover:bg-[#ffc800] dark:hover:text-black"
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
            <div className="hidden lg:block bg-white dark:bg-[#0b0b0b] border-b border-zinc-100 dark:border-[#ffc800]/15">
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
                    className={navCategoryPillClass(active)}
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
        <div className="lg:hidden border-t border-zinc-100 dark:border-[#ffc800]/15 bg-white dark:bg-[#111111] pb-4 max-h-[70vh] overflow-y-auto">
          <nav className="px-4 pt-2 pb-4 flex flex-col gap-1" aria-label="Site navigation">
            <Link
              href="/features"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isFeaturesActive)}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              Features
            </Link>
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
              className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors w-full ${navActionClass}`}
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
            <button
              type="button"
              onClick={() => setMobileLocationsOpen(!mobileLocationsOpen)}
              className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-colors w-full ${navActionClass}`}
              aria-expanded={mobileLocationsOpen}
            >
              <span className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" />
                Locations
              </span>
              <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${mobileLocationsOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileLocationsOpen && (
              <div className="ml-4 pl-3 border-l border-zinc-100 flex flex-col gap-1 mb-1">
                {PROVINCES.map((prov) => (
                  <div key={prov.name} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => setMobileActiveProvince(mobileActiveProvince === prov.name ? null : prov.name)}
                      className="flex items-center justify-between py-2 pr-3 text-sm font-medium text-zinc-700 hover:text-zinc-900"
                    >
                      {prov.name}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileActiveProvince === prov.name ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileActiveProvince === prov.name && (
                      <div className="pl-3 border-l border-zinc-100 flex flex-col gap-0.5 mt-1 mb-2">
                        {prov.districts.map((dist) => (
                          <Link
                            key={dist}
                            href={`/?l=${encodeURIComponent(dist)}`}
                            onClick={() => setMobileMenuOpen(false)}
                            className="py-1.5 text-sm font-normal text-zinc-500 hover:text-zinc-900"
                          >
                            {dist}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/styles"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(isStylesActive)}
            >
              <Scissors className="w-4 h-4 shrink-0" />
              Styles
            </Link>
            <Link
              href="/deals"
              onClick={() => setMobileMenuOpen(false)}
              className={navMobileClass(false)}
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
              List your salon
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
