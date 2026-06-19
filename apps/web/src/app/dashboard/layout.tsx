"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Users, Scissors, Settings, Search, Menu, X, LogOut, LayoutDashboard, Store, Tag, UserPlus, DollarSign, Briefcase, MapPin, ChevronDown, Share2, Star, Bot, BarChart3, CreditCard, HelpCircle, MessageSquare, Sparkles, User, Map as MapIcon, CalendarDays } from "lucide-react";
import { CUSTOMER_DASHBOARD_HREF, CUSTOMER_DASHBOARD_LABEL } from "@/lib/customer-dashboard-nav";
import { signOutTrimmaSession } from "../../config/supabase";
import { readRoleFromCookie } from "@/lib/client-auth-cookie";
import { needsOwnerActivationWizard } from "@/lib/salon-onboarding";
import { fetchSalonLayoutShell } from "@/app/actions/salon-dashboard-data";
import { SalonOnboardingProgressBanner } from "../../components/dashboard/SalonOnboardingProgressBanner";
import type { SalonOnboardingSnapshot } from "@/lib/salon-onboarding-progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Logo from "../../components/Logo";
import { SalonOwnerNotificationBell } from "../../components/dashboard/SalonOwnerNotificationBell";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigate = useRouter();
  const [role] = useState<string | null>(() => readRoleFromCookie() || "salon_owner");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [salonName, setSalonName] = useState<string>("My Salon");
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [onboardingSnapshot, setOnboardingSnapshot] = useState<SalonOnboardingSnapshot | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMobileMenuOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const closeDashboardMenu = () => setMobileMenuOpen(false);
    window.addEventListener("trimma:close-dashboard-menu", closeDashboardMenu);
    return () => window.removeEventListener("trimma:close-dashboard-menu", closeDashboardMenu);
  }, []);

  useEffect(() => {
    void fetchSalonLayoutShell().then((result) => {
      if (result.success && result.salonName) {
        setSalonName(result.salonName);
        if (result.avatarUrl) setAvatarUrl(result.avatarUrl);
        if (result.onboardingStatus) setOnboardingStatus(result.onboardingStatus);
        if (result.onboardingSnapshot) setOnboardingSnapshot(result.onboardingSnapshot);
      }
    });

    const handleBrandingUpdate = (e: any) => {
      if (e.detail?.logo_image_url !== undefined) {
        setAvatarUrl(e.detail.logo_image_url);
      }
    };
    const handleSalonLogoUpdate = (e: any) => {
      setAvatarUrl(e.detail || null);
    };

    window.addEventListener("trimma_branding_update", handleBrandingUpdate);
    window.addEventListener("trimma_salon_logo_update", handleSalonLogoUpdate);

    return () => {
      window.removeEventListener("trimma_branding_update", handleBrandingUpdate);
      window.removeEventListener("trimma_salon_logo_update", handleSalonLogoUpdate);
    };
  }, []);

  const handleLogout = () => {
    void signOutTrimmaSession();
  };
  
  const isAd = pathname?.startsWith('/admin') ?? false;

  const salonItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Bookings", href: "/dashboard/bookings", icon: <Calendar className="w-4 h-4" /> },
    { name: "Calendar", href: "/dashboard/calendar", icon: <Briefcase className="w-4 h-4" /> },
    { name: "Customers", href: "/dashboard/customers", icon: <Users className="w-4 h-4" /> },
    { name: "Staff", href: "/dashboard/staff", icon: <UserPlus className="w-4 h-4" /> },
    { name: "Services", href: "/dashboard/services", icon: <Scissors className="w-4 h-4" /> },
    { name: "Packages", href: "/dashboard/packages", icon: <Tag className="w-4 h-4" /> },
    { name: "Social Media", href: "/dashboard/social", icon: <Share2 className="w-4 h-4" /> },
    { name: "Reviews", href: "/dashboard/reviews", icon: <Star className="w-4 h-4" /> },
    { name: "Reports & Analytics", href: "/dashboard/analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { name: "Finance & Commissions", href: "/dashboard/finance", icon: <DollarSign className="w-4 h-4" /> },
    { name: "Subscription & Billing", href: "/dashboard/billing", icon: <CreditCard className="w-4 h-4" /> },
    { name: "Salon Profile", href: "/dashboard/profile", icon: <Store className="w-4 h-4" /> },
  ];

  const adminItems = [
    { name: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
    { 
      name: "User Mgmt", 
      href: "/admin/users", 
      icon: <Users className="w-4 h-4" />,
      children: [
        { name: 'Analytics', href: '/admin/users/analytics' },
        { name: 'All Users', href: '/admin/users/all' },
        { name: 'Create User', href: '/admin/users/create' },
        { name: 'Roles', href: '/admin/users/roles' },
        { name: 'Customers', href: '/admin/users/all?role=customer' },
        { name: 'Salon Owners', href: '/admin/users/all?role=salon_owner' },
        { name: 'Agents', href: '/admin/users/agents' },
        { name: 'Admins', href: '/admin/users/all?role=admin' },
      ]
    },
    { name: "Global Staff Categories", href: "/admin/staff-roles", icon: <UserPlus className="w-4 h-4" /> },
    { name: "Salon Mgmt", href: "/admin/salons", icon: <Store className="w-4 h-4" /> },
    { name: "Booking Mgmt", href: "/admin/bookings", icon: <Calendar className="w-4 h-4" /> },
    { name: "Review Moderation", href: "/admin/reviews", icon: <Star className="w-4 h-4" /> },
    { 
      name: "Marketplace", 
      href: "/admin/marketplace", 
      icon: <Tag className="w-4 h-4" />,
      children: [
        { name: 'Subscription Plans', href: '/admin/subscriptions' },
      ]
    },
    { 
      name: "Service Mgmt", 
      href: "/admin/services", 
      icon: <Scissors className="w-4 h-4" />,
      children: [
        { name: 'All Services', href: '/admin/global-services' },
        { name: 'Service Categories', href: '/admin/categories' },
        { name: 'Promotion Types', href: '/admin/promotion-types' },
        { name: 'Promotion Packages', href: '/admin/promotion-packages' },
        { name: 'Amenities', href: '/admin/amenities' },
      ]
    },
    { 
      name: "Geography Mgmt", 
      href: "/admin/territories", 
      icon: <MapIcon className="w-4 h-4" />,
      children: [
        { name: 'Provinces', href: '/admin/territories/provinces' },
        { name: 'Districts', href: '/admin/territories/districts' },
        { name: 'Cities', href: '/admin/territories/cities' },
      ]
    },
    { name: "Lead Mgmt", href: "/admin/leads", icon: <MapPin className="w-4 h-4" /> },
    { name: "Agent Mgmt", href: "/admin/agents", icon: <UserPlus className="w-4 h-4" /> },
    { name: "Payments", href: "/admin/payments", icon: <DollarSign className="w-4 h-4" /> },
    { name: "Finance & Commission", href: "/admin/finance", icon: <CreditCard className="w-4 h-4" /> },
    { name: "Branding Settings", href: "/admin/branding", icon: <Sparkles className="w-4 h-4" /> },
    { name: "Help Documents", href: "/admin/help-documents", icon: <HelpCircle className="w-4 h-4" /> },
    { name: "Admin Profile", href: "/admin/profile", icon: <User className="w-4 h-4" /> },
    { name: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const navItems = isAd ? adminItems : salonItems;

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === "/dashboard" || href === "/admin") {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex flex-col lg:flex-row trimma-dark-context">

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop fixed | Mobile sliding drawer) ── */}
      <aside className={`trimma-dashboard-sidebar fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-[#0B0B0B] border-r border-white/8 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.6)]' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/8 shrink-0 py-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo variant="dark" iconSize={36} title="Trimma" tagline={isAd ? "Admin Engine" : "Workspace"} />
          </Link>
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="p-3 flex-1 overflow-y-auto scrollbar-none">
          <div className="text-[10px] font-bold text-black uppercase tracking-widest mb-2 px-3 pt-1">
            {isAd ? 'Administration' : 'Workspace'}
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item: any) => (
              <div key={item.name}>
                {item.children ? (
                  <Collapsible
                    key={`${item.name}-${pathname?.includes(item.href)}`}
                    defaultOpen={pathname?.includes(item.href)}
                    className="space-y-0.5"
                  >
                    <CollapsibleTrigger
                      className={`trimma-sidebar-nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        pathname?.startsWith(item.href)
                          ? "is-active-nav font-semibold"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {item.name}
                      </div>
                      <ChevronDown className={`w-3 h-3 transition-transform ${pathname?.startsWith(item.href) ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-0.5 pl-4 ml-3 border-l border-white/8 mt-0.5">
                      {item.children.map((child: any) => (
                        <Link key={child.name}
                          href={child.href}
                          className={`trimma-sidebar-nav-item flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                            isActive(child.href)
                              ? "is-active-nav font-semibold"
                              : ""
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Link href={item.href}
                    className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "is-active-nav font-semibold"
                        : ""
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
        
        {/* Sidebar Footer */}
        <div className="trimma-dashboard-sidebar-footer p-3 border-t border-white/8 space-y-0.5">
          <Link
            href={CUSTOMER_DASHBOARD_HREF}
            className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname.startsWith("/customer")
                ? "is-active-nav font-semibold"
                : ""
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            {CUSTOMER_DASHBOARD_LABEL}
          </Link>
          <Link href="/dashboard/settings"
            className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              pathname === "/dashboard/settings"
                ? "is-active-nav font-semibold"
                : ""
            }`}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          {!isAd && (
            <Link
              href="/dashboard/help"
              className={`trimma-sidebar-nav-item flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === "/dashboard/help"
                  ? "is-active-nav font-semibold"
                  : ""
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Salon Help
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-16 bg-[#0B0B0B] border-b border-white/8 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
          
          {/* Left: Logo on mobile / Search on desktop */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Logo inverse iconSize={32} title="Trimma" />
            </div>
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/80" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-full rounded-lg bg-white/6 border border-white/8 pl-9 pr-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-[#ffc800]/50 focus:ring-1 focus:ring-[#ffc800]/30 transition-all"
              />
            </div>
          </div>

          {/* Right: Hamburger + Bell + Avatar */}
          <div className="flex items-center gap-2">
            {/* Dashboard navigation — mobile & tablet */}
            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white hover:text-white hover:bg-white/8 transition-colors"
              onClick={() => {
                window.dispatchEvent(new Event("trimma:close-site-menu"));
                setMobileMenuOpen(true);
              }}
              aria-label="Open dashboard menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Bell */}
            <SalonOwnerNotificationBell />

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Profile */}
            <Link
              href={role === 'admin' ? '/admin/profile' : '/dashboard/profile'}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="hidden lg:block text-right">
                <div className="trimma-salon-name text-sm font-semibold text-white">{role === 'admin' ? 'Platform Admin' : salonName}</div>
                <div className="text-xs text-white/80">{role === 'admin' ? 'Master Access' : 'Business Plan'}</div>
              </div>
              <Avatar className="h-8 w-8 border-2 border-[#ffc800]/30 bg-[#ffc800]">
                <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(role === 'admin' ? 'Admin' : salonName)}`} />
                <AvatarFallback className="bg-[#ffc800] text-black text-xs font-bold">
                  {role === 'admin' ? 'AD' : 'SA'}
                </AvatarFallback>
              </Avatar>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-white/80 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Global Activation Banner */}
        {role === "salon_owner" && needsOwnerActivationWizard(onboardingStatus) && (
          <div className="bg-emerald-600 text-white px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-sm shadow-md z-30 relative">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">
                Welcome! Complete operational details, business info, and bank verification in Salon Profile.
              </span>
            </div>
            <Link href="/dashboard/profile" className="mt-2 sm:mt-0 font-bold underline hover:text-emerald-100 whitespace-nowrap">
              Go to Salon Profile &rarr;
            </Link>
          </div>
        )}

        {role === "salon_owner" && onboardingSnapshot && !onboardingSnapshot.is_verified && (
          <SalonOnboardingProgressBanner salon={onboardingSnapshot} />
        )}

        {/* Page Content */}
        <main className="trimma-portal-main flex-1 overflow-x-clip overflow-y-auto bg-slate-50 text-zinc-900 trimma-page-shell trimma-light-context min-w-0">
          <div className="trimma-light-context min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
