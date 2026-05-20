import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Users, 
  Scissors, 
  Settings, 
  Bell, 
  Search,
  Menu,
  LogOut,
  LayoutDashboard,
  Store,
  Tag,
  Map as MapIcon,
  UserPlus,
  DollarSign,
  Briefcase,
  MapPin,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  History,
  UserMinus,
  Key,
  ShieldAlert,
  Lock
} from "lucide-react";
import { supabase } from "../config/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();
        if (data) setRole(data.role);
      }
    };
    fetchRole();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  
  const isAd = location.pathname.startsWith('/admin');

  const salonItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: "Bookings", href: "/dashboard/bookings", icon: <Calendar className="w-4 h-4" /> },
    { name: "Services", href: "/dashboard/services", icon: <Scissors className="w-4 h-4" /> },
    { name: "Staff", href: "/dashboard/staff", icon: <Users className="w-4 h-4" /> },
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
        { name: 'Customers', href: '/admin/users/customers' },
        { name: 'Salon Owners', href: '/admin/users/owners' },
        { name: 'Salon Staff', href: '/admin/users/staff' },
        { name: 'Verification', href: '/admin/users/verification' },
        { name: 'Activity Logs', href: '/admin/users/logs' },
        { name: 'Suspended', href: '/admin/users/suspended' },
        { name: 'Sessions', href: '/admin/users/sessions' },
        { name: 'Agents', href: '/admin/users/agents' },
        { name: 'Admins', href: '/admin/users/admins' },
      ]
    },
    { name: "Salon Mgmt", href: "/admin/salons", icon: <Store className="w-4 h-4" /> },
    { 
      name: "Marketplace", 
      href: "/admin/marketplace", 
      icon: <Tag className="w-4 h-4" />,
      children: [
        { name: 'Service Categories', href: '/admin/categories' },
        { name: 'Subscription Plans', href: '/admin/subscriptions' },
      ]
    },
    { name: "Service Mgmt", href: "/admin/services-mgmt", icon: <Scissors className="w-4 h-4" /> },
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
    { name: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
  ];

  const navItems = isAd ? adminItems : salonItems;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === "/admin") {
      return location.pathname === href || location.pathname === `${href}/`;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="bg-zinc-900 text-white p-1.5 rounded-lg">
              <Scissors className="w-4 h-4" />
            </div>
            {isAd ? 'Trimma Admin' : 'Trimma Workspace'}
          </Link>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
            {isAd ? 'Administration' : 'Overview'}
          </div>
          <nav className="space-y-1">
            {navItems.map((item: any) => (
              <div key={item.name}>
                {item.children ? (
                  <Collapsible key={`${item.name}-${location.pathname.includes(item.href)}`} defaultOpen={location.pathname.includes(item.href)} className="space-y-1">
                    <CollapsibleTrigger
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname.startsWith(item.href)
                          ? "bg-zinc-100 text-[#1A1C29]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {item.name}
                      </div>
                      <ChevronDown className={`w-3 h-3 transition-transform ${location.pathname.startsWith(item.href) ? '' : '-rotate-90'}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 pl-7 relative border-l border-zinc-100 ml-4.5 mt-1">
                      {item.children.map((child: any) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                            isActive(child.href)
                              ? "text-[#D81E5B] bg-[#D81E5B]/5"
                              : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-zinc-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
        
        <div className="p-4 border-t border-slate-100 space-y-1">
          <Link
            to="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              location.pathname === "/dashboard/settings"
                ? "bg-zinc-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            {role === 'admin' ? 'Global Settings' : 'Settings'}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="md:hidden">
             <Button variant="ghost" size="icon">
               <Menu className="w-5 h-5" />
             </Button>
          </div>
          <div className="flex-1 flex items-center justify-between md:justify-end gap-4">
            <div className="relative max-w-md hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search..."
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative text-slate-500">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
              </Button>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-slate-900">{role === 'admin' ? 'Platform Admin' : 'My Salon'}</div>
                  <div className="text-xs text-slate-500">{role === 'admin' ? 'Master Access' : 'Business Plan'}</div>
                </div>
                <Avatar className="h-8 w-8 border border-slate-200">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role === 'admin' ? 'Admin' : 'Salon'}`} />
                  <AvatarFallback>{role === 'admin' ? 'AD' : 'SA'}</AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" className="text-slate-500" onClick={handleLogout}>
                   <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
