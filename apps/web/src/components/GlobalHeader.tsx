"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut, Menu, X, Scissors, MapPin, Tag, Globe, HelpCircle, Building2, Sparkles, Heart, Droplet, Flower2, Activity, Users, PenTool, Paintbrush, LayoutGrid, CreditCard } from "lucide-react";
import React, { useState, useEffect } from "react";
import { supabase } from "@/config/supabase";

// A simpler logo component for the dark header
const HeaderLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-[#F5B700] flex items-center justify-center">
      <Scissors className="w-5 h-5 text-black" />
    </div>
    <span className="text-xl font-bold text-black tracking-tight">Trimma.</span>
  </div>
);

const IconMap: Record<string, any> = {
  Scissors, Sparkles, Heart, Droplet, Flower2, Activity, User, Users, PenTool, Paintbrush, LayoutGrid, Tag
};

export default function GlobalHeader() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("customer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navCategories, setNavCategories] = useState<any[]>([]);
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
    
    // Fetch dynamic categories
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name, slug, icon').limit(10);
      if (data) setNavCategories(data);
    };
    fetchCategories();

    return () => subscription.unsubscribe();
  }, []);

  const getDashboardLink = () => {
    if (userRole === 'admin') return '/admin';
    if (userRole === 'salon_owner') return '/dashboard';
    if (userRole === 'agent') return '/agent';
    return '/customer';
  };

  return (
    <header className="sticky top-0 z-[60] w-full bg-white text-zinc-900 shadow-sm border-b border-zinc-200">
      {/* Top Bar */}
      <div className="w-full border-b border-zinc-100 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.05)] relative z-10 bg-white">
        <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        
        {/* LEFT: LOGO */}
        <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
          <HeaderLogo />
        </Link>

        {/* RIGHT: Secondary Nav & Auth Buttons */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden md:flex items-center gap-4">
             <Link href="/locations" className="text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-2 rounded-xl transition-colors hidden lg:block">
                Locations
             </Link>
             <Link href="/pricing" className="text-sm font-semibold text-zinc-700 hover:bg-zinc-100 px-3 py-2 rounded-xl transition-colors hidden lg:block">
                Pricing
             </Link>
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

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={getDashboardLink()}
                  className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-black bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 sm:py-2 rounded-lg transition-colors shadow-sm border border-zinc-200"
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={() => { supabase.auth.signOut().then(() => window.location.href = '/'); }}
                  className="flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors p-2 rounded-lg hover:bg-zinc-100"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="text-sm font-bold text-black bg-[#F5B700] hover:bg-[#E6AC00] transition-colors px-4 py-2 rounded-sm shadow-sm"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-bold text-black bg-zinc-100 hover:bg-zinc-200 transition-colors px-4 py-2 rounded-sm shadow-sm border border-zinc-200"
                >
                  Sign in
                </Link>
              </>
            )}

            {/* MOBILE HAMBURGER */}
            <button
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Bottom Bar: Primary Categories */}
      <div className="hidden md:flex mx-auto max-w-7xl px-4 py-2 relative z-0 bg-white">
         <nav className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
           <Link
             href="/locations"
             className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 px-4 py-2.5 rounded-full transition-colors border border-transparent hover:border-zinc-200 whitespace-nowrap"
           >
             <MapPin className="w-4 h-4" />
             <span>Locations</span>
           </Link>
           <Link
             href="/pricing"
             className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 px-4 py-2.5 rounded-full transition-colors border border-transparent hover:border-zinc-200 whitespace-nowrap"
           >
             <CreditCard className="w-4 h-4" />
             <span>Pricing</span>
           </Link>
           {navCategories.length > 0 && (
             <span className="w-px h-6 bg-zinc-200 shrink-0" aria-hidden="true" />
           )}
           {navCategories.map((cat, i) => {
             const Icon = IconMap[cat.icon] || Tag;
             return (
               <Link 
                  key={i} 
                  href={`/category/${cat.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 px-4 py-2.5 rounded-full transition-colors border border-transparent hover:border-zinc-200 whitespace-nowrap"
               >
                  <Icon className="w-4 h-4" />
                  <span>{cat.name}</span>
               </Link>
             );
           })}
         </nav>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-100 bg-white pb-4">
          <div className="px-4 pt-2 pb-4 flex flex-col gap-1">
             <div className="font-bold text-xs uppercase tracking-wider text-zinc-500 px-3 pt-3 pb-1">Explore</div>
             <Link
               href="/locations"
               onClick={() => setMobileMenuOpen(false)}
               className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
             >
               <MapPin className="w-4 h-4" />
               Locations
             </Link>
             <Link
               href="/pricing"
               onClick={() => setMobileMenuOpen(false)}
               className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
             >
               <CreditCard className="w-4 h-4" />
               Pricing
             </Link>
             <div className="h-px bg-zinc-100 my-2"></div>
             <div className="font-bold text-xs uppercase tracking-wider text-zinc-500 px-3 pt-3 pb-1">Categories</div>
             {navCategories.map((cat, i) => {
               const Icon = IconMap[cat.icon] || Tag;
               return (
                 <Link
                   key={i}
                   href={`/category/${cat.slug}`}
                   onClick={() => setMobileMenuOpen(false)}
                   className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                 >
                   <Icon className="w-4 h-4" />
                   {cat.name}
                 </Link>
               );
             })}
             <div className="h-px bg-zinc-100 my-2"></div>
             <Link
               href="/onboarding"
               onClick={() => setMobileMenuOpen(false)}
               className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
             >
               <Building2 className="w-4 h-4" />
               List your salon
             </Link>
          </div>
        </div>
      )}
    </header>
  );
}
