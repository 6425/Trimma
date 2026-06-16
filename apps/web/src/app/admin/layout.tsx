"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Users, Scissors, Settings, Bell, Search, Menu, X, LogOut, LayoutDashboard, Store, Tag, UserPlus, DollarSign, Briefcase, MapPin, ChevronDown, Share2, Star, Bot, BarChart3, CreditCard, HelpCircle, MessageSquare, Sparkles, User, Map as MapIcon } from "lucide-react";
import { signOutTrimmaSession } from "../../config/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Logo from "../../components/Logo";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function readRoleFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const roleFromCookie = document.cookie.match(/(?:^|;\s*)user-role=([^;]+)/)?.[1];
  if (!roleFromCookie) return null;
  try {
    return decodeURIComponent(roleFromCookie);
  } catch {
    return roleFromCookie;
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigate = useRouter();
  const [role] = useState<string | null>(() => readRoleFromCookie() || "admin");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [salonName, setSalonName] = useState<string>("My Salon");
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
    void signOutTrimmaSession("/admin/login");
  };
  
  const isAd = true;

  const salonItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Bookings", href: "/dashboard/bookings", icon: <Calendar className="w-4 h-4" /> },
    { name: "Calendar", href: "/dashboard/calendar", icon: <Briefcase className="w-4 h-4" /> },
    { name: "Customers", href: "/dashboard/customers", icon: <Users className="w-4 h-4" /> },
    { name: "Staff", href: "/dashboard/staff", icon: <UserPlus className="w-4 h-4" /> },
    { name: "Services", href: "/dashboard/services", icon: <Scissors className="w-4 h-4" /> },
    { name: "Packages", href: "/dashboard/packages", icon: <Tag className="w-4 h-4" /> },
    { name: "CRM", href: "/dashboard/crm", icon: <MessageSquare className="w-4 h-4" /> },
    { name: "Marketing", href: "/dashboard/marketing", icon: <Sparkles className="w-4 h-4" /> },
    { name: "Social Media", href: "/dashboard/social", icon: <Share2 className="w-4 h-4" /> },
    { name: "Reviews", href: "/dashboard/reviews", icon: <Star className="w-4 h-4" /> },
    { name: "AI Assistant", href: "/dashboard/ai", icon: <Bot className="w-4 h-4" /> },
    { name: "Reports & Analytics", href: "/dashboard/analytics", icon: <BarChart3 className="w-4 h-4" /> },
    { name: "Finance & Commissions", href: "/dashboard/finance", icon: <DollarSign className="w-4 h-4" /> },
    { name: "Subscription & Billing", href: "/dashboard/billing", icon: <CreditCard className="w-4 h-4" /> },
    { name: "Salon Profile", href: "/dashboard/profile", icon: <Store className="w-4 h-4" /> },
    { name: "Help Center", href: "/dashboard/help", icon: <HelpCircle className="w-4 h-4" /> },
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
        { name: 'Regional Heads', href: '/admin/users/all?role=regional_head' },
        { name: 'Agents', href: '/admin/users/agents' },
        { name: 'Admins', href: '/admin/users/all?role=admin' },
      ]
    },
    { name: "Global Staff Categories", href: "/admin/staff-roles", icon: <UserPlus className="w-4 h-4" /> },
    {
      name: "Salon Mgmt",
      href: "/admin/salons",
      icon: <Store className="w-4 h-4" />,
      children: [
        { name: "All Salons", href: "/admin/salons" },
        { name: "Salon Requests", href: "/admin/salon-requests" },
      ],
    },
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
    { name: "Style Mgmt", href: "/admin/styles", icon: <Sparkles className="w-4 h-4" /> },
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
    {
      name: "Agent Mgmt",
      href: "/admin/agents",
      icon: <UserPlus className="w-4 h-4" />,
      children: [
        { name: "Agent Dashboard", href: "/admin/agents" },
        { name: "Agent Requests", href: "/admin/agents/requests" },
        { name: "Subscription Commission", href: "/admin/agents?tab=commissions" },
      ],
    },
    { name: "Payments", href: "/admin/payments", icon: <DollarSign className="w-4 h-4" /> },
    { name: "Finance & Commission", href: "/admin/finance", icon: <CreditCard className="w-4 h-4" /> },
    { name: "Branding Settings", href: "/admin/branding", icon: <Sparkles className="w-4 h-4" /> },
    { name: "Admin Profile", href: "/admin/profile", icon: <User className="w-4 h-4" /> },
    { name: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const navItems = adminItems;

  const navItemClass = (active: boolean) =>
    `trimma-admin-nav-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? "is-active font-semibold" : ""
    }`;

  const navParentTriggerClass = (active: boolean) =>
    `trimma-admin-nav-item w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? "is-active" : ""
    }`;

  const navChildClass = (active: boolean) =>
    `trimma-admin-nav-child flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
      active ? "is-active font-semibold" : ""
    }`;

  const isActive = (href: string) => {
    if (!pathname) return false;
    const [path, queryString] = href.split("?");
    const pathMatches =
      href === "/dashboard" || href === "/admin"
        ? pathname === path || pathname === `${path}/`
        : pathname === path || pathname.startsWith(`${path}/`) || pathname.startsWith(path);

    if (!queryString) {
      if (path === "/admin/agents" && searchParams.get("tab") === "commissions") {
        return false;
      }
      if (path === "/admin/agents") {
        return pathname === "/admin/agents" || pathname === "/admin/agents/";
      }
      return pathMatches;
    }

    if (!pathMatches) return false;
    const expected = new URLSearchParams(queryString);
    for (const [key, value] of expected.entries()) {
      if (searchParams.get(key) !== value) return false;
    }
    return true;
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="trimma-admin-shell min-h-screen bg-slate-50 flex flex-col lg:flex-row trimma-light-context">

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (Desktop fixed | Mobile sliding drawer) ── */}
      <aside className={`trimma-admin-sidebar fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 shadow-[4px_0_40px_rgba(0,0,0,0.6)]' : '-translate-x-full'}`}>
        
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200 shrink-0 py-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo iconSize={36} title="Trimma" tagline={isAd ? "Admin Engine" : "Workspace"} />
          </Link>
          <button
            type="button"
            className="trimma-admin-icon-btn lg:hidden w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav Items */}
        <div className="p-3 flex-1 overflow-y-auto scrollbar-none">
          <div className="trimma-admin-nav-label text-[10px] font-bold uppercase tracking-widest mb-2 px-3 pt-1">
            {isAd ? 'Administration' : 'Workspace'}
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item: any) => (
              <div key={item.name}>
                {item.children ? (
                  <Collapsible
                    key={`${item.name}-${pathname?.includes(item.href)}`}
                    defaultOpen={
                      Boolean(pathname?.includes(item.href)) ||
                      item.children.some((child: { href: string }) => {
                        const childPath = child.href.split("?")[0];
                        return pathname === childPath || pathname?.startsWith(`${childPath}/`);
                      })
                    }
                    className="space-y-0.5"
                  >
                    <CollapsibleTrigger
                      className={navParentTriggerClass(
                        Boolean(
                          pathname?.startsWith(item.href) ||
                            item.children.some((child: { href: string }) => {
                              const childPath = child.href.split("?")[0];
                              return pathname === childPath || pathname?.startsWith(`${childPath}/`);
                            })
                        )
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {item.name}
                      </div>
                      <ChevronDown className={`w-3 h-3 transition-transform ${pathname?.startsWith(item.href) ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-0.5 pl-4 ml-3 border-l border-slate-200 mt-0.5">
                      {item.children.map((child: any) => (
                        <Link key={child.name}
                          href={child.href}
                          className={navChildClass(isActive(child.href))}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Link href={item.href}
                    className={navItemClass(isActive(item.href))}
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
        <div className="p-3 border-t border-slate-200 space-y-0.5">
          <button
            type="button"
            onClick={handleLogout}
            className="trimma-admin-nav-logout trimma-admin-nav-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Header */}
        <header className="h-16 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
          
          {/* Left: Logo on mobile / Search on desktop */}
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <Logo iconSize={32} title="Trimma" />
            </div>
            <div className="relative hidden lg:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-full rounded-lg bg-slate-100 border border-slate-200 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-600 outline-none focus:border-[#f9e000]/50 focus:ring-1 focus:ring-[#f9e000]/30 transition-all"
              />
            </div>
          </div>

          {/* Right: Hamburger + Bell + Avatar */}
          <div className="flex items-center gap-2">
            {/* Dashboard navigation — mobile & tablet */}
            <button
              type="button"
              className="trimma-admin-icon-btn lg:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
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
            <button type="button" className="trimma-admin-icon-btn relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#f9e000]" />
            </button>

            <div className="w-px h-6 bg-slate-100 mx-1" />

            {/* Profile */}
            <Link
              href={role === 'admin' ? '/admin/profile' : '/dashboard/profile'}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <div className="hidden lg:block text-right">
                <div className="text-sm font-semibold text-zinc-900">{role === 'admin' ? 'Platform Admin' : salonName}</div>
                <div className="text-xs text-zinc-500">{role === 'admin' ? 'Master Access' : 'Business Plan'}</div>
              </div>
              <Avatar className="h-8 w-8 border-2 border-[#f9e000]/30">
                <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${role === 'admin' ? 'Admin' : 'Salon'}`} />
                <AvatarFallback className="bg-[#f9e000] text-black text-xs font-bold">
                  {role === 'admin' ? 'AD' : 'SA'}
                </AvatarFallback>
              </Avatar>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="trimma-admin-nav-logout trimma-admin-icon-btn hidden lg:flex w-8 h-8 items-center justify-center rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50 text-zinc-900 trimma-page-shell">
          {children}
        </main>
      </div>
    </div>
  );
}
